declare namespace fkill {
	interface Options {
		/**
		Force kill the process.

		@default false
		*/
		readonly force?: boolean;

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
		Perform a rigorous check that the process is no longer visible to the system before returning.

		@default true
		*/
		readonly verify?: boolean;

		/**
		Number of seconds to spend verifying the process is no longer visible before returning anyway.

		@default 2
		*/
		readonly verifyTimeout?: number;
	}
}

/**
Fabulously kill processes. Cross-platform.

@param input - One or more process IDs/names/ports to kill. To kill a port, prefix it with a colon. For example: `:8080`.

@example
```
import fkill = require('fkill');

(async () => {
	await fkill(1337);
	console.log('Killed process');
})();

fkill('Safari');
fkill(':8080');

fkill([1337, 'Safari', ':8080']);
```
*/
declare function fkill(
	input: number | string | ReadonlyArray<string | number>,
	options?: fkill.Options
): Promise<void>

export = fkill;
