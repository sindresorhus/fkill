import process from 'node:process';

process.on('SIGTERM', () => {});
setInterval(() => {}, 10_000);
