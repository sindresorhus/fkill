'use strict';
var arrify = require('arrify');
var taskkill = require('taskkill');
var Promise = require('pinkie-promise');
var execa = require('execa');

function win(input, opts) {
	return taskkill(input, {
		force: opts.force,
		// don't kill ourselves
		filter: 'PID ne ' + process.pid
	});
}

function def(input, opts) {
	var cmd = typeof input === 'string' ? 'killall' : 'kill';
	var args = [input];

	if (opts.force) {
		args.unshift('-9');
	}

	return execa(cmd, args);
}

module.exports = function (input, opts) {
	opts = opts || {};

	var fn = process.platform === 'win32' ? win : def;
	var errors = [];

	// don't kill ourselves
	input = arrify(input).filter(function (el) {
		return el !== process.pid;
	});

	return Promise.all(input.map(function (input) {
		return fn(input, opts).catch(function (err) {
			errors.push('Killing process ' + input + ' failed: ' +
				err.message.replace(/.*\n/, '').replace(/kill: \d+: /, '').trim());
		});
	})).then(function () {
		if (errors.length > 0) {
			throw new Error(errors.join('\n'));
		}
	});
};
