'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const roles = ['core', 'browser', 'emulator', 'hosting'];

function profiles(names) {
  const selected = names.flatMap(name => name.split(','));
  if (!selected.length || new Set(selected).size !== selected.length || selected.some(name => !roles.includes(name))) {
    throw Error('Select unique profiles: core, browser, emulator, hosting.');
  }
  return selected;
}
const folder = role => path.join(root, 'tests/dependencies', role);

function environment(selected, base = process.env) {
  const env = {...base};
  for (const key of Object.keys(env)) {
    if (['PATH', 'NODE_PATH'].includes(key.toUpperCase())) delete env[key];
  }
  return {
    ...env,
    NODE_PATH: selected.map(role => path.join(folder(role), 'node_modules')).join(path.delimiter),
    PATH: [...selected.map(role => path.join(folder(role), 'node_modules/.bin')), base.PATH || base.Path || ''].join(path.delimiter)
  };
}

function npmCLI() {
  const bin = path.dirname(process.execPath);
  const candidates = [
    process.env.npm_execpath,
    path.join(bin, 'node_modules/npm/bin/npm-cli.js'),
    path.resolve(bin, '../lib/node_modules/npm/bin/npm-cli.js'),
    path.resolve(bin, '../share/nodejs/npm/bin/npm-cli.js')
  ];
  for (const file of candidates) if (file && fs.existsSync(file)) return file;
  throw Error('Run this command through npm: npm --prefix tests run with -- PROFILES COMMAND.');
}

function checked(command, args, options = {}) {
  const result = spawnSync(command, args, {stdio: 'inherit', ...options});
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = Error('Command failed: ' + (result.signal || result.status));
    error.exitCode = result.status || 1;
    throw error;
  }
}

function configure(selected) {
  if (!process.env.GITHUB_ENV) return;
  fs.appendFileSync(process.env.GITHUB_ENV, 'NODE_PATH=' + environment(selected).NODE_PATH + '\n');
  fs.appendFileSync(process.env.GITHUB_PATH, selected.map(role => path.join(folder(role), 'node_modules/.bin')).join('\n') + '\n');
}

function command(selected, args) {
  if (!args.length) throw Error('Provide a command after the profiles.');
  const [name, ...rest] = args;
  const options = {env: environment(selected), cwd: root};
  if (name === 'npm') return checked(process.execPath, [npmCLI(), ...rest], options);
  if (name === 'node') return checked(process.execPath, rest, options);
  if (name === 'playwright') {
    if (!selected.includes('browser')) throw Error('Playwright requires browser profile.');
    return checked(process.execPath, [path.join(folder('browser'), 'node_modules/playwright/cli.js'), ...rest], options);
  }
  throw Error('Supported commands: node, npm, playwright.');
}

function main(args) {
  const [mode, ...rest] = args;
  if (mode === 'install') {
    const selected = profiles(rest);
    for (const role of selected) {
      checked(process.execPath, [npmCLI(), 'ci', '--prefix', folder(role), '--no-audit', '--no-fund'], {cwd: folder(role)});
    }
    configure(selected);
    return;
  }
  if (mode === 'run') {
    const selected = profiles([rest.shift() || '']);
    if (rest[0] === '--') rest.shift();
    for (const role of selected) {
      if (!fs.existsSync(path.join(folder(role), 'node_modules'))) {
        throw Error('Missing ' + role + ' dependencies. Run: node scripts/test-profiles.cjs install ' + selected.join(' '));
      }
    }
    return command(selected, rest);
  }
  throw Error('Usage: test-profiles.cjs install PROFILE... | run core,browser -- npm --prefix tests test');
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = error.exitCode || 1; }
}
module.exports = {roles, profiles, environment, folder, main};
