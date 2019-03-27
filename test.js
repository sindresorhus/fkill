/* eslint-disable ava/no-identical-title */
import childProcess from 'child_process';
import path from 'path';
import test from 'ava';
import noopProcess from 'noop-process';
import processExists from 'process-exists';
import delay from 'delay';
import getPort from 'get-port';
import fkill from '.';

async function noopProcessKilled(t, pid) {
	// Ensure the noop process has time to exit
	await delay(100);
	t.false(await processExists(pid));
}

test('pid', async t => {
	const pid = await noopProcess();
	await fkill(pid, {force: true});
	await noopProcessKilled(t, pid);
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

		await noopProcessKilled(t, pid);
	});

	test('ignore case', async t => {
		const pid = await noopProcess({title: 'Capitalized'});
		await fkill('capitalized', {ignoreCase: true});

		await noopProcessKilled(t, pid);
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

	await delay(noopProcessKilled(t, pid));
	t.true(await processExists(pid));
	Object.defineProperty(process, 'pid', {value: originalFkillPid});
});

test('ignore ignore-case for pid', async t => {
	const pid = await noopProcess();
	await fkill(pid, {force: true, ignoreCase: true});

	await noopProcessKilled(t, pid);
});

test('kill from port', async t => {
	const port = await getPort();
	const {pid} = childProcess.spawn('node', ['fixture.js', port]);
	await fkill(pid, {force: true});
	await noopProcessKilled(t, pid);
	t.is(await getPort({port}), port);
});

test('error when process is not found', async t => {
	await t.throwsAsync(fkill(['notFoundProcess']), /Killing process notFoundProcess failed: Process doesn't exist/);
});

function testKillDescendant(t, name = '') {
	const fixture = path.resolve('fixtures', 'descendant');
	const cp = childProcess.spawn('node', [fixture, name]);

	cp.stdout.setEncoding('utf8');
	cp.stdout.on('data', async chunk => {
		const descendantPid = parseInt(chunk, 10);
		t.is(typeof descendantPid, 'number');

		const opts = {
			tree: true,
			force: process.platform === 'win32'
		};

		if (name) {
			await fkill(name, opts);
		} else {
			await fkill(cp.pid, opts);
		}

		// Ensure all the processes has time to exit
		await delay(400);

		t.false(await processExists(cp.pid));
		t.false(await processExists(descendantPid));
		t.end();
	});
}

// eslint-disable-next-line ava/test-ended
test.cb('kill all descendants tree by pid', testKillDescendant);

if (process.platform !== 'win32') {
	// eslint-disable-next-line ava/test-ended
	test.cb('kill all descendants tree by name', testKillDescendant, 'fkill-descen');
}
