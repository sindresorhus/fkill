export type Options = {
	/**
	Force kill the processes.

	@default false
	*/
	readonly force?: boolean;

	/**
	Force kill processes that did not exit within the given number of milliseconds.

	@default undefined
	*/
	readonly forceAfterTimeout?: number;

	/**
	Kill all child processes along with the parent process. _(Windows only)_

	@default true
	*/
	readonly tree?: boolean;

	/**
	Ignore capitalization when killing a process.

	Note that the case is always ignored on Windows.

	@default false
	*/
	readonly ignoreCase?: boolean;

	/**
	Suppress all error messages. For example: `Process doesn't exist`.

	@default false
	*/
	readonly silent?: boolean;

	/**
	Wait for processes to exit before returning.

	Specifies the maximum time to wait in milliseconds. If processes haven't exited by then, an error is thrown (unless `silent: true`).

	@default undefined

	@example
	```
	import fkill from 'fkill';

	// Wait up to 2 seconds for Chrome to exit
	await fkill('chrome', {waitForExit: 2000});

	// Wait up to 5 seconds for database to shutdown gracefully
	await fkill(dbPid, {waitForExit: 5000});
	```
	*/
	readonly waitForExit?: number;
};

/**
Fabulously kill processes. Cross-platform.

@param input - One or more process IDs/names/ports to kill. To kill a port, prefix it with a colon. For example: `:8080`.

On Windows, process extensions are optional. For example, both `fkill('notepad')` and `fkill('notepad.exe')` work.

@example
```
import fkill from 'fkill';

await fkill(1337);
console.log('Killed process');

fkill('Safari');
fkill(':8080');

fkill([1337, 'Safari', ':8080']);
```
*/
export default function fkill(
	input: number | string | ReadonlyArray<string | number>,
	options?: Options
): Promise<void>;
