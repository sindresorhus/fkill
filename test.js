/* eslint-disable ava/no-identical-title */
import childProcess from 'child_process';
import test from 'ava';
import noopProcess from 'noop-process';
import processExists from 'process-exists';
import getPort from 'get-port';
import fkill from '.';

test('pid', async t => {
	const pid = await noopProcess();
	await fkill(pid, {force: true});
	t.false(await processExists(pid));
});

if (process.platform === 'win32') {
	test.serial('title', async t => {
		const title = 'notepad.exe';
		const {pid} = childProcess.spawn(title);

		await fkill(title, {force: true});

		t.false(await processExists(pid));
	});

	test.serial('win default ignore case', async t => {
		const title = 'notepad.exe';
		const {pid} = childProcess.spawn(title);

		await fkill('NOTEPAD.EXE', {force: true});

		t.false(await processExists(pid));
	});
} else {
	test('title', async t => {
		const title = 'fkill-test';
		const pid = await noopProcess({title});

		await fkill(title);

		t.false(await processExists(pid));
	});

	test('ignore case', async t => {
		const pid = await noopProcess({title: 'Capitalized'});
		await fkill('capitalized', {ignoreCase: true});

		t.false(await processExists(pid));
	});
}

test('fail', async t => {
	const error = await t.throwsAsync(fkill(['123456', '654321']));
	t.regex(error.message, /123456/);
	t.regex(error.message, /654321/);
});

test.serial('don\'t kill self', async t => {
	const originalFkillPid = process.pid;
	const pid = await noopProcess();
	Object.defineProperty(process, 'pid', {value: pid});

	await fkill(process.pid);

	t.true(await processExists(pid));
	Object.defineProperty(process, 'pid', {value: originalFkillPid});
});

test.serial('don\'t kill `fkill` when killing `node`', async t => {
	const originalFkillPid = process.pid;
	await fkill('node');

	t.true(await processExists(originalFkillPid));
});

test('ignore ignore-case for pid', async t => {
	const pid = await noopProcess();
	await fkill(pid, {force: true, ignoreCase: true});

	t.false(await processExists(pid));
});

test('kill from port', async t => {
	const port = await getPort();
	const {pid} = childProcess.spawn(process.execPath, ['fixture.js', port]);
	await fkill(pid, {force: true});
	t.false(await processExists(pid));
	t.is(await getPort({port}), port);
});

test('error when process is not found', async t => {
	await t.throwsAsync(
		fkill(['notFoundProcess']),
		{message: /Killing process notFoundProcess failed: Process doesn't exist/}
	);
});

test('suppress errors when silent', async t => {
	await t.notThrowsAsync(fkill(['123456', '654321'], {silent: true}));
	await t.notThrowsAsync(fkill(['notFoundProcess'], {silent: true}));
});
