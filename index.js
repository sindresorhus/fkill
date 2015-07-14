'use strict';
var childProcess = require('child_process');
var eachAsync = require('each-async');
var arrify = require('arrify');
var taskkill = require('taskkill');

function win(input, cb) {
	taskkill(input, {
		force: true,
		// don't kill ourselves
		filter: 'PID ne ' + process.pid
	}, cb);
}

function def(input, cb) {
	var cmd = typeof input === 'string' ? 'killall' : 'kill';

	childProcess.execFile(cmd, ['-9', input], function (err) {
		cb(err);
	});
}

module.exports = function (input, cb) {
	var fn = process.platform === 'win32' ? win : def;
	var errors = [];

	cb = cb || function () {};

	// don't kill ourselves
	input = arrify(input).filter(function (el) {
		return el !== process.pid;
	});

	eachAsync(input, function (input, i, done) {
		fn(input, function (err) {
			if (err) {
				errors.push(err.message);
			}

			done();
		});
	}, function () {
		if (errors.length > 0) {
			cb(new Error(errors.join('\n')));
			return;
		}

		cb();
	});
};
