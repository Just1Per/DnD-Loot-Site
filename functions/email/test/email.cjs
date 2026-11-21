'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configuration, emailAddress } = require('../config.cjs');
const { message } = require('../templates.cjs');
const { createEmailService, deliveryId, DAY, HOUR } = require('../service.cjs');
const { resendTransport, DeliveryError } = require('../transport.cjs');
const settings = () => ({ enabled: true, from: 'CampaignAtlas <invites@example.test>', siteUrl: 'https://campaign.example.test', dailyLimit: 50 });

function fixture() {
  let clock = Date.UTC(2026, 10, 21, 10), serial = Promise.resolve();
  const docs = new Map(), created = new Map(), sent = [], accepted = new Map(), raw = settings();
  const put = (path, data) => { docs.set(path, structuredClone(data)); if (!created.has(path)) created.set(path, clock - 1000); };
  put('campaigns/a', { ownerId: 'dm', name: 'Freddy’s campaign' });
  const invite = (id = 'one', changes = {}) => put('campaignInvites/' + id, { name: 'Player', email: 'Player@Example.test', emailLower: 'player@example.test', campaignId: 'a', campaignName: 'Untrusted stale name', role: 'player', status: 'pending', createdBy: 'dm', createdAt: clock, ...changes });
  invite();
  const snapshot = path => ({ exists: docs.has(path), data: () => structuredClone(docs.get(path)), createTime: { toMillis: () => created.get(path) } });
  const reference = path => ({ path, get: async () => snapshot(path), collection: name => collection(path + '/' + name) });
  const collection = path => ({ doc: id => reference(path + '/' + id) });
  const db = { collection, runTransaction(work) {
    const run = serial.then(async () => {
      const writes = [];
      const tx = {
        get: async r => { assert.equal(writes.length, 0, 'Firestore reads must precede writes'); return snapshot(r.path); },
        create: (r, value) => { assert.ok(!docs.has(r.path)); writes.push([r.path, value]); },
        set: (r, value) => writes.push([r.path, value]),
        update: (r, value) => writes.push([r.path, { ...docs.get(r.path), ...value }])
      };
      const result = await work(tx);
      if (f.failReceipt && writes.some(([, value]) => value.status === 'sent')) throw Error('Synthetic receipt failure');
      for (const [path, value] of writes) put(path, value);
      return result;
    });
    serial = run.catch(() => {});
    return run;
  } };
  const auth = { async getUser(uid) { if (uid === 'missing') throw Object.assign(Error('Missing account'), { code: 'auth/user-not-found' }); return { email: 'registered@example.test', disabled: uid === 'disabled' }; } };
  const f = { docs, invite, raw, sent, accepted, db, auth, put, now: () => clock, advance: amount => { clock += amount; }, job: (id = 'one') => docs.get('emailDeliveries/' + deliveryId(id)) };
  f.send = async (payload, key) => {
    sent.push({ payload: structuredClone(payload), key });
    if (f.sendOverride) return f.sendOverride(payload, key);
    if (accepted.has(key)) assert.deepEqual(accepted.get(key).payload, payload, 'Retries freeze the complete provider payload');
    else accepted.set(key, { payload: structuredClone(payload), id: 'email-' + accepted.size });
    return accepted.get(key).id;
  };
  f.service = createEmailService({ db, auth, send: f.send, config: () => raw, now: f.now });
  return f;
}

test('Disabled-by-default configuration cannot queue or send; enabled configuration validates sender and canonical URL', async () => {
  const f = fixture(); f.raw.enabled = false;
  assert.equal(await f.service.queueInvitation('one'), 'disabled');
  assert.equal([...f.docs.keys()].filter(key => /emailDeliveries|emailRateLimits/.test(key)).length, 0);
  assert.deepEqual(configuration(), { enabled: false });
  assert.deepEqual(configuration({ enabled: 'true' }), { enabled: false });
  for (const overrides of [{ from: 'Name\r\nBcc: victim@example.test' }, { replyTo: 'a@example.test,b@example.test' }, { siteUrl: 'http://evil.example.test' }, { siteUrl: 'https://user:pass@example.test/' }, { siteUrl: 'https://example.test/?next=evil' }, { siteUrl: 'https://example.test/path' }, { dailyLimit: 0 }, { dailyLimit: 1001 }]) assert.throws(() => configuration({ ...settings(), ...overrides }));
  for (const address of ['a\nb@example.test', 'a@example.test,other@example.test', 'Name <a@example.test>', 'a@-invalid.test', '.a@example.test', 'a..b@example.test']) assert.equal(emailAddress(address), null);
});

test('Invitation jobs use authoritative campaign/recipient sources and safe text/HTML; UID invitations use Firebase Auth', async () => {
  const f = fixture();
  f.docs.get('campaigns/a').name = '<script>alert("x")</script>\r\nCampaign';
  assert.equal(await f.service.queueInvitation('one'), 'queued');
  assert.deepEqual(f.job().message.to, ['player@example.test']);
  assert.ok(!f.job().message.html.includes('<script>'));
  assert.ok(f.job().message.html.includes('&lt;script&gt;'));
  assert.doesNotMatch(f.job().message.subject, /[\r\n]/);
  assert.match(f.job().message.text, /Sign in or create an account using player@example.test/);
  assert.ok(!JSON.stringify(f.job()).includes('Untrusted stale name'));
  assert.equal(f.job().message.from, f.raw.from);
  assert.equal(f.job().expiresAt.getTime(), f.now() + 30 * DAY);
  f.invite('uid', { email: '', emailLower: '', targetUid: 'registered' });
  await f.service.queueInvitation('uid');
  assert.deepEqual(f.job('uid').message.to, ['registered@example.test']);
  assert.equal(await f.service.deliver(deliveryId('uid')), 'sent');
  assert.throws(() => message('dm-notes', {}, configuration(settings())), /Unsupported/);
});

test('Duplicate creation/delivery and overlapping event retries produce one delivery and one quota reservation', async () => {
  const f = fixture();
  assert.deepEqual((await Promise.all([f.service.queueInvitation('one'), f.service.queueInvitation('one')])).sort(), ['duplicate', 'queued']);
  assert.equal([...f.docs].find(([key]) => key.endsWith('_all'))[1].count, 1);
  let release, started;
  const entered = new Promise(resolve => { started = resolve; });
  f.sendOverride = () => { started(); return new Promise(resolve => { release = resolve; }); };
  const first = f.service.deliver(deliveryId('one'));
  await entered;
  await assert.rejects(f.service.deliver(deliveryId('one')), /already being processed/);
  release('provider-id');
  assert.equal(await first, 'sent');
  assert.equal(await f.service.deliver(deliveryId('one')), 'ignored');
  assert.equal(f.sent.length, 1);
  assert.equal(f.job().providerId, 'provider-id');
});

test('Cancelled/declined invitations, campaign deletion, lost DM authority and changed recipients stop queued delivery', async () => {
  const mutations = [
    f => { f.docs.get('campaignInvites/one').status = 'canceled'; },
    f => { f.docs.get('campaignInvites/one').status = 'declined'; },
    f => { f.docs.delete('campaignInvites/one'); },
    f => { f.docs.get('campaigns/a').deletedAt = f.now(); },
    f => { f.docs.get('campaigns/a').ownerId = 'other'; },
    f => { f.docs.get('campaignInvites/one').email = f.docs.get('campaignInvites/one').emailLower = 'changed@example.test'; },
    f => { f.docs.get('campaignInvites/one').role = 'dm'; }
  ];
  for (const mutate of mutations) {
    const f = fixture(); await f.service.queueInvitation('one'); mutate(f);
    assert.equal(await f.service.deliver(deliveryId('one')), 'suppressed');
    assert.equal(f.sent.length, 0);
  }
  const f = fixture(); f.docs.get('campaigns/a').ownerId = 'other'; f.put('campaigns/a/members/dm', { status: 'active', role: 'dm' });
  await f.service.queueInvitation('one'); f.docs.get('campaigns/a/members/dm').status = 'inactive';
  assert.equal(await f.service.deliver(deliveryId('one')), 'suppressed');
});

test('Missing/disabled UID recipients, mixed identities, malformed mailboxes and old source documents never queue', async () => {
  for (const changes of [{ targetUid: 'missing' }, { targetUid: 'disabled' }, { targetUid: 'registered' }, { email: 'a@example.test\r\nBcc:x@example.test', emailLower: 'a@example.test\r\nbcc:x@example.test' }, { status: 'accepted' }]) {
    const f = fixture(); f.invite('one', changes);
    assert.equal(await f.service.queueInvitation('one'), 'ineligible');
  }
  const f = fixture(); f.advance(DAY); f.docs.get('campaignInvites/one').createdAt = f.now();
  assert.equal(await f.service.queueInvitation('one'), 'ineligible', 'Client-created timestamps cannot refresh a historical invitation');
});

test('Uncertain provider retries reuse one idempotency key and frozen payload, with a bounded backoff', async () => {
  const f = fixture(); await f.service.queueInvitation('one');
  let requests = 0;
  f.sendOverride = (payload, key) => {
    if (!f.accepted.has(key)) f.accepted.set(key, { payload: structuredClone(payload), id: 'accepted-before-timeout' });
    assert.deepEqual(f.accepted.get(key).payload, payload);
    if (++requests === 1) throw new DeliveryError('provider_network_error', true, true);
    return f.accepted.get(key).id;
  };
  await assert.rejects(f.service.deliver(deliveryId('one')), /retry safely/);
  assert.equal(f.job().status, 'queued');
  await assert.rejects(f.service.deliver(deliveryId('one')), /waiting for retry/);
  assert.equal(f.job().attempts, 1);
  f.docs.get('campaigns/a').name = 'Changed campaign name'; f.raw.from = 'Other <other@example.test>';
  f.advance(31000);
  assert.equal(await f.service.deliver(deliveryId('one')), 'sent');
  assert.equal(f.accepted.size, 1);
  assert.equal(f.sent[0].key, f.sent[1].key);
  assert.deepEqual(f.sent[0].payload, f.sent[1].payload);
});

test('A lost Firestore receipt retries safely after lease expiry; concurrent final attempts cannot steal an active lease', async () => {
  const f = fixture(); await f.service.queueInvitation('one'); f.failReceipt = true;
  await assert.rejects(f.service.deliver(deliveryId('one')), /receipt could not be saved/);
  assert.equal(f.job().status, 'sending');
  assert.equal(f.accepted.size, 1);
  f.failReceipt = false; f.advance(121000);
  assert.equal(await f.service.deliver(deliveryId('one')), 'sent');
  assert.equal(f.accepted.size, 1);
  const g = fixture(); await g.service.queueInvitation('one'); g.job().attempts = 4;
  let release, started; const entered = new Promise(resolve => { started = resolve; });
  g.sendOverride = () => { started(); return new Promise(resolve => { release = resolve; }); };
  const last = g.service.deliver(deliveryId('one')); await entered;
  await assert.rejects(g.service.deliver(deliveryId('one')), /already being processed/);
  assert.equal(g.job().status, 'sending'); release('last-attempt'); assert.equal(await last, 'sent');
});

test('Provider Retry-After delays subsequent requests without consuming extra attempts; unsupported job categories never send', async () => {
  const f = fixture(); await f.service.queueInvitation('one');
  f.sendOverride = () => { throw new DeliveryError('provider_http_429', true, false, 60000); };
  await assert.rejects(f.service.deliver(deliveryId('one')), /retry safely/);
  f.advance(31000);
  await assert.rejects(f.service.deliver(deliveryId('one')), /waiting for retry/);
  assert.equal(f.job().attempts, 1); assert.equal(f.sent.length, 1);
  f.advance(30000); f.sendOverride = null;
  assert.equal(await f.service.deliver(deliveryId('one')), 'sent');
  const g = fixture(); await g.service.queueInvitation('one'); g.job().type = 'dm-notes';
  assert.equal(await g.service.deliver(deliveryId('one')), 'ignored');
  assert.equal(g.job().reason, 'invalid_job'); assert.equal(g.sent.length, 0);
});

test('Permanent failures stop, repeated ambiguous failures require review, and the provider key is never reused after 23h', async () => {
  const f = fixture(); await f.service.queueInvitation('one');
  f.sendOverride = () => { throw new DeliveryError('provider_http_400', false); };
  assert.equal(await f.service.deliver(deliveryId('one')), 'failed');
  assert.equal(await f.service.deliver(deliveryId('one')), 'ignored');
  const g = fixture(); await g.service.queueInvitation('one');
  g.sendOverride = () => { throw new DeliveryError('provider_network_error', true, true); };
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (attempt < 5) await assert.rejects(g.service.deliver(deliveryId('one')));
    else assert.equal(await g.service.deliver(deliveryId('one')), 'needs-review');
    g.advance(20 * 60 * 1000);
  }
  assert.equal(g.sent.length, 5);
  const h = fixture(); await h.service.queueInvitation('one'); h.failReceipt = true;
  await assert.rejects(h.service.deliver(deliveryId('one'))); h.advance(23 * HOUR); h.failReceipt = false;
  assert.equal(await h.service.deliver(deliveryId('one')), 'ignored');
  assert.equal(h.job().status, 'needs-review');
  assert.equal(h.sent.length, 1);
});

test('Disabled delivery suppresses an existing queued job and leaves the website invitation pending', async () => {
  const f = fixture(); await f.service.queueInvitation('one'); f.raw.enabled = false;
  assert.equal(await f.service.deliver(deliveryId('one')), 'ignored');
  assert.equal(f.job().reason, 'delivery_disabled');
  assert.equal(f.docs.get('campaignInvites/one').status, 'pending');
  assert.equal(f.sent.length, 0);
});

test('Atomic daily quotas cap the project, sender and recipient without duplicate reservations', async () => {
  const f = fixture(); f.raw.dailyLimit = 2;
  for (const id of ['one', 'two', 'three']) f.invite(id);
  const results = await Promise.all(['one', 'two', 'three'].map(id => f.service.queueInvitation(id)));
  assert.deepEqual(results, ['queued', 'queued', 'suppressed']);
  assert.equal(f.job('three').reason, 'daily_limit');
  assert.equal(f.job('three').message, undefined);
  const g = fixture();
  for (let i = 0; i < 6; i++) { g.invite('invite' + i); await g.service.queueInvitation('invite' + i); }
  assert.equal(g.job('invite5').status, 'suppressed');
  const h = fixture();
  for (let i = 0; i < 21; i++) { h.invite('invite' + i, { email: `p${i}@example.test`, emailLower: `p${i}@example.test` }); await h.service.queueInvitation('invite' + i); }
  assert.equal(h.job('invite19').status, 'queued');
  assert.equal(h.job('invite20').status, 'suppressed');
});

test('Resend transport uses a server secret, timeout and stable key; transient errors and Retry-After are bounded and redacted', async () => {
  let request;
  const payload = { from: 'a@example.test', to: ['p@example.test'], subject: 'Invitation', text: 'Safe text' };
  const send = resendTransport({ apiKey: () => 'server-secret', fetcher: async (url, options) => { request = { url, ...options }; return { ok: true, json: async () => ({ id: 'mail-id' }) }; } });
  assert.equal(await send(payload, 'same-key'), 'mail-id');
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.headers.Authorization, 'Bearer server-secret');
  assert.equal(request.headers['Idempotency-Key'], 'same-key');
  assert.deepEqual(JSON.parse(request.body), payload); assert.ok(request.signal instanceof AbortSignal);
  for (const [status, retryable, uncertain] of [[400, false, false], [401, false, false], [409, false, true], [429, true, false], [503, true, true]]) {
    const failing = resendTransport({ apiKey: () => 'secret', fetcher: async () => ({ ok: false, status, headers: { get: () => '60' } }) });
    await assert.rejects(failing(payload, 'key'), error => error.retryable === retryable && error.uncertain === uncertain && error.retryAfterMs === 60000 && !error.message.includes('secret'));
  }
  await assert.rejects(resendTransport({ apiKey: () => '', fetcher: () => assert.fail('Must not send') })(payload, 'key'), /provider_not_configured/);
  await assert.rejects(resendTransport({ apiKey: () => 'secret', fetcher: async () => { throw Error('Private provider response with p@example.test'); } })(payload, 'key'), error => error.code === 'provider_network_error' && !error.message.includes('@'));
  await assert.rejects(resendTransport({ apiKey: () => 'secret', fetcher: async () => ({ ok: true, json: async () => ({}) }) })(payload, 'key'), /provider_invalid_response/);
});
