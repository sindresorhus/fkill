<h1 align="center">
	<br>
	<img width="360" src="https://rawgit.com/sindresorhus/fkill/master/media/logo.svg" alt="fkill">
	<br>
	<br>
	<br>
</h1>

> Fabulously kill processes. Cross-platform.

[![Build Status](https://travis-ci.org/sindresorhus/fkill.svg?branch=master)](https://travis-ci.org/sindresorhus/fkill) [![Build status](https://ci.appveyor.com/api/projects/status/a8aqswbd578qj09i/branch/master?svg=true)](https://ci.appveyor.com/project/sindresorhus/fkill/branch/master)

Works on OS X, Linux, Windows.


## Install

```
$ npm install --save fkill
```


## Usage

```js
const fkill = require('fkill');

fkill(1337).then(() => {
	console.log('Killed process');
});

fkill('Safari');

fkill([1337, 'Safari']);
```


## API

### fkill(input, [options])

Returns a promise.

#### input

*Required*  
Type: `number`, `string`, (`array` of `number` and `string`)

One or more process IDs/names to kill.

#### options

##### force

Type: `boolean`  
Default: `false`

Force kill the process.


## Related

- [fkill-cli](https://github.com/sindresorhus/fkill-cli) - CLI for this module


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
