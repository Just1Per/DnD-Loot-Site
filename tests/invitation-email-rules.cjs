'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const client = require('firebase/firestore');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const backend = createRequire(resolve(__dirname, '../functions/email/package.json'));
const { initializeApp, deleteApp } = backend('firebase-admin/app');
const { getFirestore } = backend('firebase-admin/firestore');
const { createEmailService, deliveryId } = require('../functions/email/service.cjs');

(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error('This test requires the Firestore emulator.');
  const projectId = 'demo-vault-test';
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') } });
  const app = initializeApp({ projectId }, 'invitation-email-rules');
  try {
    await env.clearFirestore();
    const db = getFirestore(app);
    await db.doc('campaigns/a').set({ ownerId: 'dm', name: 'Email test campaign' });
    await db.doc('users/admin').set({ role: ['admin'] });
    const contexts = Object.fromEntries(['dm', 'player', 'other', 'admin'].map(uid => [uid, env.authenticatedContext(uid, { email: uid + '@example.test' })]));
    contexts.anonymous = env.unauthenticatedContext();
    const ref = (uid, path) => client.doc(contexts[uid].firestore(), path);
    const source = { campaignId: 'a', campaignName: 'Email test campaign', name: 'Player', email: 'player@example.test', emailLower: 'player@example.test', role: 'player', status: 'pending', createdBy: 'dm', createdAt: Date.now() };
    await assertSucceeds(client.setDoc(ref('dm', 'campaignInvites/one'), source));
    const requests = [], service = createEmailService({
      db, auth: { getUser: async () => ({ email: 'player@example.test' }) },
      config: () => ({ enabled: true, from: 'CampaignAtlas <invites@example.test>', siteUrl: 'https://example.test', dailyLimit: 50 }),
      send: async (payload, key) => { requests.push({ payload, key }); return 'synthetic-provider-id'; }
    });
    assert.deepEqual((await Promise.all([service.queueInvitation('one'), service.queueInvitation('one')])).sort(), ['duplicate', 'queued']);
    const jobPath = 'emailDeliveries/' + deliveryId('one');
    assert.equal((await db.doc(jobPath).get()).data().status, 'queued');
    const quota = (await db.collection('emailRateLimits').get()).docs[0].ref.path;
    for (const uid of Object.keys(contexts)) {
      for (const path of [jobPath, quota]) {
        await assertFails(client.getDoc(ref(uid, path)));
        await assertFails(client.setDoc(ref(uid, path), { recipient: 'attacker@example.test', status: 'queued' }));
        await assertFails(client.deleteDoc(ref(uid, path)));
      }
      await assertFails(client.getDocs(client.collection(contexts[uid].firestore(), 'emailDeliveries')));
      await assertFails(client.setDoc(ref(uid, 'emailDeliveries/forged'), { type: 'campaign-invitation', to: ['victim@example.test'], html: 'Forged mail' }));
    }
    console.log('PASS Players, DMs, unrelated admins and anonymous clients cannot read or forge jobs, quotas or email payloads');
    assert.equal(await service.deliver(deliveryId('one')), 'sent');
    assert.equal(await service.deliver(deliveryId('one')), 'ignored');
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].payload.to, ['player@example.test']);
    assert.equal((await db.doc('campaignInvites/one').get()).data().status, 'pending');
    console.log('PASS Real Admin SDK transactions queue once, deliver once and leave campaign membership/invitation untouched');
    await assertSucceeds(client.setDoc(ref('dm', 'campaignInvites/two'), source));
    await service.queueInvitation('two');
    await assertSucceeds(client.updateDoc(ref('player', 'campaignInvites/two'), { status: 'declined', declinedBy: 'player', declinedAt: Date.now() }));
    assert.equal(await service.deliver(deliveryId('two')), 'suppressed');
    assert.equal(requests.length, 1);
    await assertFails(client.setDoc(ref('other', 'campaignInvites/forged'), { ...source, createdBy: 'other' }));
    console.log('PASS Existing invitation decline and DM authority rules still apply before queued email delivery');
  } finally {
    await deleteApp(app);
    await env.cleanup();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
