'use strict';
const arrify = require('arrify');
const taskkill = require('taskkill');
const execa = require('execa');
const AggregateError = require('aggregate-error');

function win(input, opts) {
	return taskkill(input, {
		force: opts.force,
		tree: typeof opts.tree === 'undefined' ? true : opts.tree
	});
}

function def(input, opts) {
	const cmd = typeof input === 'string' ? 'killall' : 'kill';
	const args = [input];

	if (opts.force) {
		args.unshift('-9');
	}

	return execa(cmd, args);
}

module.exports = (input, opts) => {
	opts = opts || {};

	const fn = process.platform === 'win32' ? win : def;
	const errors = [];

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
