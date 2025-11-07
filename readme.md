<h1 align="center">
	<br>
	<img width="360" src="media/logo.svg" alt="fkill">
	<br>
	<br>
	<br>
</h1>

> Fabulously kill processes. Cross-platform.

Works on macOS (10.13 or later), Linux, Windows.

## Install

```sh
npm install fkill
```

## Usage

```js
import fkill from 'fkill';

await fkill(1337);
console.log('Killed process');

fkill('Safari');
fkill(':8080');

fkill([1337, 'Safari', ':8080']);
```

## API

### fkill(input, options?)

Returns a promise that resolves when the processes are killed.

#### input

Type: `number | string | Array<number | string>`

One or more process IDs/names/ports to kill.

To kill a port, prefix it with a colon. For example: `:8080`.

On Windows, process extensions are optional. For example, both `fkill('notepad')` and `fkill('notepad.exe')` work.

#### options

Type: `object`

##### force

Type: `boolean`\
Default: `false`

Force kill the processes.

##### forceAfterTimeout

Type: `number`\
Default: `undefined`

Force kill processes that did not exit within the given number of milliseconds.

##### tree

Type: `boolean`\
Default: `true`

Kill all child processes along with the parent process. *(Windows only)*

##### ignoreCase

Type: `boolean`\
Default: `false`

Ignore capitalization when killing a process.

Note that the case is always ignored on Windows.

##### silent

Type: `boolean`\
Default: `false`

Suppress all error messages. For example: `Process doesn't exist`.

##### waitForExit

Type: `number`\
Default: `undefined`

Wait for processes to exit before returning.

Specifies the maximum time to wait in milliseconds. If processes haven't exited by then, an error is thrown (unless `silent: true`).

```js
// Wait up to 2 seconds for Chrome to exit
await fkill('chrome', {waitForExit: 2000});

// Wait up to 5 seconds for database to shutdown gracefully
await fkill(dbPid, {waitForExit: 5000});
```

## Related

- [fkill-cli](https://github.com/sindresorhus/fkill-cli) - CLI for this module
- [alfred-fkill](https://github.com/SamVerschueren/alfred-fkill) - Alfred workflow for this module
