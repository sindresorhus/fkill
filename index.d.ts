export interface Options {
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
}

/**
Fabulously kill processes. Cross-platform.

@param input - One or more process IDs/names/ports to kill. To kill a port, prefix it with a colon. For example: `:8080`.

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
