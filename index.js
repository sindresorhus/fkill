'use strict';
const arrify = require('arrify');
const taskkill = require('taskkill');
const tasklist = require('tasklist');
const execa = require('execa');
const AggregateError = require('aggregate-error');

function winKillProcess(input, opts) {
	return taskkill(input, {
		force: opts.force
	});
}

function winKill(input, opts) {
	const killByName = typeof input === 'string';
	if (killByName && opts.ignoreCase) {
		return tasklist()
			.then(tasks => tasks.filter(task => task.imageName.toLowerCase() === input.toLowerCase()))
			.then(names => Promise.all(names.map(name => winKillProcess(name, opts))));
	}

	return winKillProcess(input, opts);
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

	// Don't kill ourselves
	input = arrify(input).filter(x => x !== process.pid);

	return Promise.all(input.map(input => {
		return fn(input, opts).catch(err => {
			errors.push(`Killing process ${input} failed: ${err.message.replace(/.*\n/, '').replace(/kill: \d+: /, '').trim()}`);
		});
	})).then(() => {
		if (errors.length > 0) {
			throw new AggregateError(errors);
		}
	});
};
