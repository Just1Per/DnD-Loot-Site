const assert = require('node:assert/strict');
const { test } = require('node:test');
const { previewPullNumber, canRemove, cleanup } = require('../scripts/cleanup-preview-channels.cjs');
const channel = id => `projects/345641251366/sites/dnd-loot-site/channels/${id}`;
const repo = { full_name: 'Just1Per/DnD-Loot-Site' };
const closed = { number: 56, state: 'closed', base: { repo }, head: { repo } };

test('recognizes generated PR channel names, including truncated branch names', () => {
  assert.equal(previewPullNumber(channel('pr57-fix-overview-combat-')), 57);
});
test('preserves live, custom, other-site, and malformed channels', () => {
  for (const name of ['live', 'staging', 'pr0-test', 'pr57', 'pr57-test/extra']) {
    assert.equal(previewPullNumber(channel(name)), null);
  }
  assert.equal(previewPullNumber('projects/123/sites/other/channels/pr56-test'), null);
});
test('deletes only verified closed PRs belonging to this repository', () => {
  assert.equal(canRemove(closed, 56), true);
  assert.equal(canRemove({ ...closed, state: 'open' }, 56), false);
  assert.equal(canRemove(closed, 57), false);
  assert.equal(canRemove({ ...closed, head: { repo: { full_name: 'someone/fork' } } }, 56), false);
  assert.equal(canRemove({ ...closed, base: undefined }, 56), false);
  assert.equal(canRemove({ ...closed, head: undefined }, 56), false);
});

test('cleanup lists channels, verifies PR state, and deletes only the closed preview', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const directory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'preview-test-'));
  const log = path.join(directory, 'calls.jsonl');
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  try {
    fs.writeFileSync(path.join(directory, 'firebase'), `#!${process.execPath}
const fs = require('node:fs');
fs.appendFileSync(process.env.TEST_CALLS, JSON.stringify({ args: process.argv.slice(2), credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS }) + '\\n');
console.log(JSON.stringify({ status: 'success', result: { channels: ${JSON.stringify(['live', 'custom', 'pr56-old', 'pr57-open'].map(id => ({ name: channel(id) })))} } }));
`, { mode: 0o700 });
    process.env.PATH = `${directory}:${process.env.PATH}`;
    process.env.GH_TOKEN = 'test-token';
    process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
    process.env.TEST_CALLS = log;
    const requested = [];
    global.fetch = async url => {
      requested.push(url);
      const number = Number(url.split('/').pop());
      return { ok: true, json: async () => ({ ...closed, number, state: number === 56 ? 'closed' : 'open' }) };
    };
    await cleanup();
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].args[0], 'hosting:channel:list');
    assert.deepEqual(calls[1].args.slice(0, 3), ['hosting:channel:delete', 'pr56-old', '--force']);
    assert.equal(requested.length, 2);
    assert.equal(fs.existsSync(calls[0].credentials), false);
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
