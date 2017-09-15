/* eslint-disable ava/no-identical-title */
import childProcess from 'child_process';
import test from 'ava';
import noopProcess from 'noop-process';
import processExists from 'process-exists';
import delay from 'delay';
import m from '.';

// Ensure the noop process has time to exit
const noopProcessExitDelay = 10;

test('pid', async t => {
	const pid = await noopProcess();
	await m(pid, {force: true});
	await delay(noopProcessExitDelay);
	t.false(await processExists(pid));
});

if (process.platform === 'win32') {
	test('title', async t => {
		const title = 'notepad.exe';
		const pid = childProcess.spawn(title).pid;

		await m(title, {force: true});

		t.false(await processExists(pid));
	});
} else {
	test('title', async t => {
		const title = 'fkill-test';
		const pid = await noopProcess({title});

		await m(title);

		await delay(noopProcessExitDelay);
		t.false(await processExists(pid));
	});
}

test('fail', async t => {
	try {
		await m(['123456', '654321']);
		t.fail();
	} catch (err) {
		t.regex(err.message, /123456/);
		t.regex(err.message, /654321/);
	}
});

test.serial('don\'t kill self', async t => {
	const originalFkillPid = process.pid;
	const pid = await noopProcess();
	Object.defineProperty(process, 'pid', {value: pid});

	await m(process.pid);

	await delay(noopProcessExitDelay);
	t.true(await processExists(pid));
	Object.defineProperty(process, 'pid', {value: originalFkillPid});
});
