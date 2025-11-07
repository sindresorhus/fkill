import process from 'node:process';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import noopProcess from 'noop-process';
import {processExists} from 'process-exists';
import delay from 'delay';
import getPort from 'get-port';
import {execa} from 'execa';
import fkill from './index.js';

async function noopProcessKilled(pid) {
	// Ensure the noop process has time to exit.
	await delay(100);
	assert.strictEqual(await processExists(pid), false);
}

async function waitForReady(pid) {
	const readyFile = path.join(os.tmpdir(), `fkill-ready-${pid}`);
	const timeout = 2000;
	const start = Date.now();
	while (!fs.existsSync(readyFile)) {
		if (Date.now() - start > timeout) {
			throw new Error(`Process ${pid} did not become ready within ${timeout}ms`);
		}

		await delay(10); // eslint-disable-line no-await-in-loop
	}
}

test('pid', async () => {
	const pid = await noopProcess();
	await fkill(pid, {force: true});
	await noopProcessKilled(pid);
});

if (process.platform === 'win32') {
	test('title - windows', async () => {
		const title = 'notepad.exe';
		const {pid} = childProcess.spawn(title);

		await fkill(title, {force: true});

		assert.strictEqual(await processExists(pid), false);
	});

	test('default ignore case - windows', async () => {
		const title = 'notepad.exe';
		const {pid} = childProcess.spawn(title);

		await fkill('NOTEPAD.EXE', {force: true});

		assert.strictEqual(await processExists(pid), false);
	});
} else {
	test('title', async () => {
		const title = 'fkill-test';
		const pid = await noopProcess({title});

		await fkill(title);

		await noopProcessKilled(pid);
	});

	test('ignore case', async () => {
		const pid = await noopProcess({title: 'Capitalized'});
		await fkill('capitalized', {ignoreCase: true});

		await noopProcessKilled(pid);
	});

	test('exact match', async () => {
		const title = 'foo-bar';
		const pid = await noopProcess({title});

		try {
			await fkill('foo');
			assert.fail('Expected error to be thrown');
		} catch (error) {
			assert.ok(error instanceof AggregateError);
			assert.match(error.errors.join(' '), /Process doesn't exist/);
		}

		assert.strictEqual(await processExists(pid), true);

		// Cleanup
		await fkill(title);
	});

	test('force', async () => {
		const pid = await noopProcess({title: 'force'});
		await fkill('force', {force: true});

		await noopProcessKilled(pid);
	});

	test('ignore case + force', async () => {
		const pid = await noopProcess({title: 'IgnoreCaseForce'});
		await fkill('ignorecaseforce', {ignoreCase: true, force: true});

		await noopProcessKilled(pid);
	});
}

test('fail', async () => {
	try {
		await fkill(['123456', '654321']);
		assert.fail('Expected error to be thrown');
	} catch (error) {
		assert.ok(error instanceof AggregateError);
		const errorString = error.errors.join(' ');
		assert.match(errorString, /123456/);
		assert.match(errorString, /654321/);
	}
});

test('don\'t kill self', async () => {
	const originalFkillPid = process.pid;
	const pid = await noopProcess();
	Object.defineProperty(process, 'pid', {value: pid});

	await fkill(process.pid);

	await delay(100);
	assert.strictEqual(await processExists(pid), true);
	Object.defineProperty(process, 'pid', {value: originalFkillPid});
});

test('don\'t kill `fkill` when killing `node` or `node.exe`', async () => {
	const result = await execa('node', ['./fixture2.js'], {detached: true});
	assert.strictEqual(result.exitCode, 0);
});

test('ignore ignore-case for pid', async () => {
	const pid = await noopProcess();
	await fkill(pid, {force: true, ignoreCase: true});
	await noopProcessKilled(pid);
});

test('kill from port', async () => {
	const port = await getPort();
	const {pid} = childProcess.spawn(process.execPath, ['fixture.js', port]);
	await fkill(pid, {force: true});
	await noopProcessKilled(pid);
});

// Issue #65: Verify error reporting for port syntax. These tests don't cover the full bug scenario
// (port with process but kill fails) due to portToPid test unreliability, but the fix is sound.
test('error when port is not in use', async () => {
	const port = await getPort();
	try {
		await fkill([`:${port}`]);
		assert.fail('Expected error to be thrown');
	} catch (error) {
		assert.ok(error instanceof AggregateError);
		assert.match(error.errors.join(' '), /Process doesn't exist/);
	}
});

test('error when port is not in use (force: true)', async () => {
	const port = await getPort();
	try {
		await fkill([`:${port}`], {force: true});
		assert.fail('Expected error to be thrown');
	} catch (error) {
		assert.ok(error instanceof AggregateError);
		assert.match(error.errors.join(' '), /Process doesn't exist/);
	}
});

test('error when process is not found', async () => {
	try {
		await fkill(['notFoundProcess']);
		assert.fail('Expected error to be thrown');
	} catch (error) {
		assert.ok(error instanceof AggregateError);
		assert.match(error.errors.join(' '), /Killing process notFoundProcess failed: Process doesn't exist/);
	}
});

test('error when process is not found (force: true)', async () => {
	try {
		await fkill(['notFoundProcess'], {force: true});
		assert.fail('Expected error to be thrown');
	} catch (error) {
		assert.ok(error instanceof AggregateError);
		assert.match(error.errors.join(' '), /Killing process notFoundProcess failed: Process doesn't exist/);
	}
});

test('suppress errors when silent', async () => {
	await assert.doesNotReject(fkill(['123456', '654321'], {silent: true}));
	await assert.doesNotReject(fkill(['notFoundProcess'], {silent: true}));
});

test('force works properly for process ignoring SIGTERM', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	await fkill(pid, {});
	await delay(100);
	assert.strictEqual(await processExists(pid), true);
	await fkill(pid, {force: true});
	await noopProcessKilled(pid);
});

test('forceAfterTimeout works properly for process ignoring SIGTERM', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	const promise = fkill(pid, {forceAfterTimeout: 200});
	assert.strictEqual(await processExists(pid), true);
	await delay(50);
	assert.strictEqual(await processExists(pid), true);
	await promise;
	await noopProcessKilled(pid);
});

test('waitForExit with fast-exiting process', async () => {
	const pid = await noopProcess();
	await fkill(pid, {force: true, waitForExit: 2000});
	assert.strictEqual(await processExists(pid), false);
});

test('waitForExit with slow-exiting process', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	await fkill(pid, {force: true, waitForExit: 1000});
	assert.strictEqual(await processExists(pid), false);
});

test('waitForExit timeout expires throws error', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	try {
		await fkill(pid, {waitForExit: 100});
		assert.fail('Expected error to be thrown');
	} catch (error) {
		assert.ok(error instanceof AggregateError);
		assert.match(error.errors.join(' '), new RegExp(`Process ${pid} did not exit within 100ms`));
	}

	// Cleanup
	await fkill(pid, {force: true});
});

test('waitForExit with silent does not throw on timeout', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	await assert.doesNotReject(fkill(pid, {waitForExit: 100, silent: true}));
	// Cleanup
	await fkill(pid, {force: true, silent: true});
});

test('waitForExit: 0 does not wait', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	await fkill(pid, {waitForExit: 0});
	// Process may still be alive since we're not waiting
	// Cleanup
	await fkill(pid, {force: true});
});

test('waitForExit combined with forceAfterTimeout', async () => {
	const child = childProcess.spawn(process.execPath, ['fixture-ignore-sigterm.js']);
	const {pid} = child;
	await waitForReady(pid);
	await fkill(pid, {forceAfterTimeout: 200, waitForExit: 1000});
	assert.strictEqual(await processExists(pid), false);
});
