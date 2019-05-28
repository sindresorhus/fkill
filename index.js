'use strict';

const arrify = require('arrify');
const taskkill = require('taskkill');
const execa = require('execa');
const AggregateError = require('aggregate-error');
const pidFromPort = require('pid-from-port');
const processExists = require('process-exists');

const execaWithNotInstalledError = async (cmd, args) => {
	try {
		return await execa(cmd, args);
	} catch (error) {
		if (error.code === 'ENOENT') {
			const newError = new Error(`'${cmd}' doesn't seem to be installed and is required by fkill`);
			newError.sourceError = error;
			throw newError;
		}

		throw error;
	}
};

const winKill = (input, options) => {
	return taskkill(input, {
		force: options.force,
		tree: typeof options.tree === 'undefined' ? true : options.tree
	});
};

const macOSKill = (input, options) => {
	const killByName = typeof input === 'string';
	const cmd = killByName ? 'pkill' : 'kill';
	const args = [input];

	if (options.force) {
		args.unshift('-9');
	}

	if (killByName && options.ignoreCase) {
		args.unshift('-i');
	}

	return execaWithNotInstalledError(cmd, args);
};

const defaultKill = (input, options) => {
	const killByName = typeof input === 'string';
	const cmd = killByName ? 'killall' : 'kill';
	const args = [input];

	if (options.force) {
		args.unshift('-9');
	}

	if (killByName && options.ignoreCase) {
		args.unshift('-I');
	}

	return execaWithNotInstalledError(cmd, args);
};

const kill = (() => {
	if (process.platform === 'darwin') {
		return macOSKill;
	}

	if (process.platform === 'win32') {
		return winKill;
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
