'use strict';
var childProcess = require('child_process');
var eachAsync = require('each-async');
var arrify = require('arrify');
var taskkill = require('taskkill');

function win(input, i, cb) {
	taskkill(input, {
		force: true,
		// don't kill ourselves
		filter: 'PID ne ' + process.pid
	}, function (err) {
		if (err) {
			cb(err);
			return;
		}

		cb();
	});
}

function def(input, i, cb) {
	var cmd = typeof input === 'string' ? 'killall' : 'kill';

	childProcess.execFile(cmd, ['-9', input], function (err) {
		cb(err);
	});
}

module.exports = function (input, cb) {
	var fn = process.platform === 'win32' ? win : def;

	cb = cb || function () {};

	// don't kill ourselves
	input = arrify(input).filter(function (el) {
		return el !== process.pid;
	});

	eachAsync(input, fn, cb);
};
