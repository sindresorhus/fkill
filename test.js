/* eslint-disable ava/no-identical-title */
import childProcess from 'child_process';
import test from 'ava';
import noopProcess from 'noop-process';
import processExists from 'process-exists';
import delay from 'delay';
import m from './';

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

		await m(title);

		t.false(await processExists(pid));
	});

	test('ignore case', async t => {
		const title = 'Capitalized.exe';
		const pid = childProcess.spawn(title).pid;

		await m('capitalized.exe', {ignoreCase: true});

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

	test('fail', async t => {
		try {
			await m(['123456', '654321']);
			t.fail();
		} catch (err) {
			t.regex(err.message, /123456/);
			t.regex(err.message, /654321/);
		}
	});

	test('ignore case', async t => {
		const pid = await noopProcess({
			title: 'Capitalized'
		});

		await m('capitalized', {ignoreCase: true});

		t.false(await processExists(pid));
	});
}

test('ignore ignore-case for pid', async t => {
	const pid = await noopProcess();
	await m(pid, {force: true, ignoreCase: true});

	t.false(await processExists(pid));
});
