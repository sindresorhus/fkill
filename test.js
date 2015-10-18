import childProcess from 'child_process';
import test from 'ava';
import noopProcess from 'noop-process';
import processExists from 'process-exists';
import fn from './';

test('pid', async t => {
	const pid = await noopProcess();
	await fn(pid, {force: true});
	t.false(await processExists(pid));
});

if (process.platform === 'win32') {
	test('title', async t => {
		const title = 'notepad.exe';
		const pid = childProcess.spawn(title).pid;

		await fn(title);

		t.false(await processExists(pid));
	});
} else {
	test('title', async t => {
		const title = 'fkill-test';
		const pid = await noopProcess({title: title});

		await fn(title);

		t.false(await processExists(pid));
	});

	test('fail', async t => {
		try {
			await fn(['123456', '654321']);
			t.fail();
		} catch (err) {
			t.regexTest(/123456/, err.message);
			t.regexTest(/654321/, err.message);
		}
	});
}
