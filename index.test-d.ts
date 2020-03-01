import {expectType} from 'tsd';
import fkill = require('.');

expectType<Promise<void>>(fkill(1337));
expectType<Promise<void>>(fkill('Safari'));
expectType<Promise<void>>(fkill([1337, 'Safari', ':8080']));
expectType<Promise<void>>(fkill(1337, {force: true}));
expectType<Promise<void>>(fkill(1337, {tree: false}));
expectType<Promise<void>>(fkill(1337, {ignoreCase: true}));
expectType<Promise<void>>(fkill(1337, {forceAfterTimeout: 10000}));
