// Retire only this repository's generated previews after their PR has closed.
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const REPOSITORY = 'Just1Per/DnD-Loot-Site';
const PROJECT = 'dnd-loot-site';

function previewPullNumber(name) {
  const match = new RegExp(`^projects/[^/]+/sites/${PROJECT}/channels/pr([1-9][0-9]*)-[a-z0-9-]+$`).exec(name);
  return match ? Number(match[1]) : null;
}

function canRemove(pull, number) {
  return pull.number === number && pull.state === 'closed' &&
    pull.base?.repo?.full_name === REPOSITORY &&
    pull.head?.repo?.full_name === REPOSITORY;
}

async function cleanup() {
  if (!process.env.GH_TOKEN || !process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Preview cleanup requires GitHub and Firebase credentials.');
  }
  const directory = mkdtempSync(join(tmpdir(), 'firebase-preview-'));
  try {
    const credentials = join(directory, 'credentials.json');
    writeFileSync(credentials, process.env.FIREBASE_SERVICE_ACCOUNT, { mode: 0o600 });
    const env = { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: credentials };
    delete env.FIREBASE_SERVICE_ACCOUNT;
    const firebase = (...args) => execFileSync('firebase', [
      ...args, '--project', PROJECT, '--site', PROJECT, '--non-interactive', '--json',
    ], { env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const result = JSON.parse(firebase('hosting:channel:list'));
    if (result.status !== 'success' || !Array.isArray(result.result?.channels)) {
      throw new Error('Firebase returned an unexpected channel list; no previews deleted.');
    }
    const pulls = new Map();
    for (const channel of result.result.channels) {
      const number = previewPullNumber(channel.name);
      if (number === null) continue;
      if (!pulls.has(number)) {
        const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/pulls/${number}`, {
          headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
        });
        if (!response.ok) throw new Error(`Cannot verify PR #${number}: GitHub HTTP ${response.status}`);
        pulls.set(number, await response.json());
      }
      if (!canRemove(pulls.get(number), number)) continue;
      const id = channel.name.split('/').pop();
      console.log(`Removing ${id}: PR #${number} is closed.`);
      firebase('hosting:channel:delete', id, '--force');
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

module.exports = { previewPullNumber, canRemove, cleanup };
if (require.main === module) cleanup().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
