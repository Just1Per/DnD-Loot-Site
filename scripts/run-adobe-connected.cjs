'use strict';
// One suite list for local execution and isolated CI shards. Never invokes a shell.
const fs = require('node:fs');
const path = require('node:path');
const P = require('./browser-suite-plan.cjs');
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

function select(rows, shard, seconds = P.weights('adobe')) { return P.select(rows, shard, seconds); }

function options(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list' && !out.list) out.list = true;
    else if (args[i] === '--report' && !out.report && args[i + 1]) out.report = args[++i];
    else if (args[i] === '--shard' && !out.shard && args[i + 1]) out.shard = args[++i];
    else throw Error('Supported options: --list, --shard INDEX/TOTAL, --report FILE.');
  }
  return out;
}

function run(args) {
  const opts = options(args), rows = select(suites(), opts.shard);
  if (opts.list) {
    console.log(JSON.stringify(rows, null, 2));
    return 0;
  }
  return P.run(rows, opts, {group:'Adobe', cwd:tests, command:file=>[process.execPath,path.join(tests,file)]});
}

if (require.main === module) {
  try { process.exitCode = run(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {suites, select, options, run};
