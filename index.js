'use strict';
const arrify = require('arrify');
const taskkill = require('taskkill');
const execa = require('execa');
const AggregateError = require('aggregate-error');
const pidFromPort = require('pid-from-port');
const processExists = require('process-exists');

function winKill(input, opts) {
	return taskkill(input, {
		force: opts.force,
		tree: typeof opts.tree === 'undefined' ? true : opts.tree
	});
}

function macOSKill(input, opts) {
	const killByName = typeof input === 'string';
	const cmd = killByName ? 'pkill' : 'kill';
	const args = [input];

	if (opts.force) {
		args.unshift('-9');
	}

	if (killByName && opts.ignoreCase) {
		args.unshift('-i');
	}

	return execa(cmd, args);
}

function defaultKill(input, opts) {
	const killByName = typeof input === 'string';
	const cmd = killByName ? 'killall' : 'kill';
	const args = [input];

	if (opts.force) {
		args.unshift('-9');
	}

	if (killByName && opts.ignoreCase) {
		args.unshift('-I');
	}

	return execa(cmd, args);
}

function parseInput(input) {
	if (typeof input === 'string' && input[0] === ':') {
		return pidFromPort(parseInt(input.slice(1), 10));
	}

	return Promise.resolve(input);
}

module.exports = (input, opts) => {
	opts = opts || {};
	const errors = [];

	let fn;
	if (process.platform === 'darwin') {
		fn = macOSKill;
	} else if (process.platform === 'win32') {
		fn = winKill;
	} else {
		fn = defaultKill;
	}

	input = arrify(input);

	return processExists.all(input)
		.then(exists => Promise.all(input.map(input => parseInput(input)
			.then(input => input !== process.pid && fn(input, opts).catch(err => {
				if (!exists.get(input)) {
					errors.push(`Killing process ${input} failed: Process doesn't exist`);
					return;
				}

				errors.push(`Killing process ${input} failed: ${err.message.replace(/.*\n/, '').replace(/kill: \d+: /, '').trim()}`);
			}))
	))).then(() => {
		if (errors.length > 0) {
			throw new AggregateError(errors);
		}
	});
};
