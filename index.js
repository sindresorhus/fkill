'use strict';
const arrify = require('arrify');
const taskkill = require('taskkill');
const execa = require('execa');
const AggregateError = require('aggregate-error');
const pidFromPort = require('pid-from-port');
const processExists = require('process-exists');

const missingBinaryError = async (command, arguments_) => {
	try {
		return await execa(command, arguments_);
	} catch (error) {
		if (error.code === 'ENOENT') {
			const newError = new Error(`\`${command}\` doesn't seem to be installed and is required by fkill`);
			newError.sourceError = error;
			throw newError;
		}

		throw error;
	}
};

const windowsKill = (input, options) => {
	return taskkill(input, {
		force: options.force,
		tree: typeof options.tree === 'undefined' ? true : options.tree
	});
};

const macosKill = (input, options) => {
	const killByName = typeof input === 'string';
	const command = killByName ? 'pkill' : 'kill';
	const arguments_ = [input];

	if (options.force) {
		arguments_.unshift('-9');
	}

	if (killByName && options.ignoreCase) {
		arguments_.unshift('-i');
	}

	return missingBinaryError(command, arguments_);
};

const defaultKill = (input, options) => {
	const killByName = typeof input === 'string';
	const command = killByName ? 'killall' : 'kill';
	const arguments_ = [input];

	if (options.force) {
		arguments_.unshift('-9');
	}

	if (killByName && options.ignoreCase) {
		arguments_.unshift('-I');
	}

	return missingBinaryError(command, arguments_);
};

const kill = (() => {
	if (process.platform === 'darwin') {
		return macosKill;
	}

	if (process.platform === 'win32') {
		return windowsKill;
	}

	return defaultKill;
})();

const parseInput = async input => {
	if (typeof input === 'string' && input[0] === ':') {
		return pidFromPort(parseInt(input.slice(1), 10));
	}

	return input;
};

const fkill = async (inputs, options = {}) => {
	inputs = arrify(inputs);

	const exists = await processExists.all(inputs);

	const errors = [];

	const handleKill = async input => {
		try {
			input = await parseInput(input);

			if (input === process.pid) {
				return;
			}

			await kill(input, options);
		} catch (error) {
			if (!exists.get(input)) {
				errors.push(`Killing process ${input} failed: Process doesn't exist`);
				return;
			}

			errors.push(`Killing process ${input} failed: ${error.message.replace(/.*\n/, '').replace(/kill: \d+: /, '').trim()}`);
		}
	};

	await Promise.all(
		inputs.map(input => handleKill(input))
	);

	if (errors.length > 0 && !options.silent) {
		throw new AggregateError(errors);
	}
};

module.exports = fkill;
// TODO: remove this in the next major version
module.exports.default = fkill;
