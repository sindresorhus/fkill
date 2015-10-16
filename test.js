'use strict';
var childProcess = require('child_process');
var test = require('ava');
var noopProcess = require('noop-process');
var processExists = require('process-exists');
var fkill = require('./');

test('pid', function (t) {
	t.plan(3);

	noopProcess(function (err, pid) {
		t.assert(!err, err);

		fkill(pid, {force: true}).then(function () {
			processExists(pid, function (err, exists) {
				t.assert(!err, err);
				t.assert(!exists);
			});
		});
	});
});

if (process.platform === 'win32') {
	test('title', function (t) {
		t.plan(2);

		var title = 'notepad.exe';
		var pid = childProcess.spawn(title).pid;

		fkill(title).then(function () {
			processExists(pid, function (err, exists) {
				t.assert(!err, err);
				t.assert(!exists);
			});
		});
	});

	return;
}

test('title', function (t) {
	t.plan(3);

	var title = 'fkill-test';

	noopProcess({title: title}, function (err, pid) {
		t.assert(!err, err);

		fkill(title).then(function () {
			processExists(pid, function (err, exists) {
				t.assert(!err, err);
				t.assert(!exists);
			});
		});
	});
});

test('fail', function (t) {
	t.plan(2);

	fkill(['123456', '654321']).catch(function (err) {
		t.assert(/123456/.test(err.message));
		t.assert(/654321/.test(err.message));
	});
});
