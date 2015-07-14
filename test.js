'use strict';
var childProcess = require('child_process');
var test = require('ava');
var noopProcess = require('noop-process');
var processExists = require('process-exists');
var fkill = require('./');

test('pid', function (t) {
	t.plan(4);

	noopProcess(function (err, pid) {
		t.assert(!err, err);

		fkill(pid, function (err) {
			t.assert(!err, err);

			processExists(pid, function (err, exists) {
				t.assert(!err, err);
				t.assert(!exists);
			});
		});
	});
});

if (process.platform === 'win32') {
	test('title', function (t) {
		t.plan(3);

		var title = 'notepad.exe';
		var pid = childProcess.spawn(title).pid;

		fkill(title, function (err) {
			t.assert(!err, err);

			processExists(pid, function (err, exists) {
				t.assert(!err, err);
				t.assert(!exists);
			});
		});
	});

	return;
}

test('title', function (t) {
	t.plan(4);

	var title = 'fkill-test';

	noopProcess({title: title}, function (err, pid) {
		t.assert(!err, err);

		fkill(title, function (err) {
			t.assert(!err, err);

			processExists(pid, function (err, exists) {
				t.assert(!err, err);
				t.assert(!exists);
			});
		});
	});
});

test('fail', function (t) {
	t.plan(3);

	fkill(['123456', '654321'], function (err) {
		t.assert(err);
		t.assert(/123456: no process found/.test(err.message));
		t.assert(/654321: no process found/.test(err.message));
	});
});
