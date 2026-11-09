'use strict';
// One suite list for local execution and isolated CI shards. Never invokes a shell.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const tests = path.resolve(__dirname, '../tests');

function suites() {
  const rows = JSON.parse(fs.readFileSync(path.join(tests, 'adobe-connected-suites.json'), 'utf8')).suites;
  if (!Array.isArray(rows) || !rows.length || new Set(rows).size !== rows.length) {
    throw Error('Adobe suite manifest must be nonempty and unique.');
  }
  for (const file of rows) {
    if (typeof file !== 'string' || !/^[-a-z0-9]+-browser\.cjs$/.test(file) || !fs.statSync(path.join(tests, file)).isFile()) {
      throw Error('Invalid Adobe browser suite: ' + file);
    }
  }
  return rows;
}

function select(rows, shard) {
  if (!shard) return rows;
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(shard);
  if (!match) throw Error('Use --shard INDEX/TOTAL (for example 1/3).');
  const index = Number(match[1]), total = Number(match[2]);
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(total) || index > total || total > rows.length) {
    throw Error('Shard must select a nonempty part of the suite manifest.');
  }
  return rows.filter((_, i) => i % total === index - 1);
}

function options(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list' && !out.list) out.list = true;
    else if (args[i] === '--shard' && !out.shard && args[i + 1]) out.shard = args[++i];
    else throw Error('Supported options: --list, --shard INDEX/TOTAL.');
  }
  return out;
}

function run(args) {
  const opts = options(args), rows = select(suites(), opts.shard);
  if (opts.list) {
    console.log(JSON.stringify(rows, null, 2));
    return 0;
  }
  const start = Date.now();
  console.log('Adobe browser suites: ' + rows.length + (opts.shard ? ' · shard ' + opts.shard : ''));
  for (const file of rows) {
    const before = Date.now();
    console.log('\nRUN ' + file);
    const result = spawnSync(process.execPath, [path.join(tests, file)], {
      cwd: tests, env: process.env, stdio: 'inherit'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      console.error('FAIL ' + file + ' · ' + (result.signal || 'exit ' + result.status));
      return result.status || 1;
    }
    console.log('DONE ' + file + ' · ' + ((Date.now() - before) / 1000).toFixed(1) + 's');
  }
  console.log('PASS ' + rows.length + ' suites · ' + ((Date.now() - start) / 1000).toFixed(1) + 's');
  return 0;
}

if (require.main === module) {
  try { process.exitCode = run(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {suites, select, options, run};
