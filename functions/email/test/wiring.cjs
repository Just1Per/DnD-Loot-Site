'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Deployable email codebase exposes only the two retryable document-create triggers and keeps the secret server-side', async () => {
  const functions = require('../index.js');
  assert.deepEqual(Object.keys(functions).sort(), ['deliverAccountEmail', 'queueCampaignInvitationEmail']);
  const queue = functions.queueCampaignInvitationEmail.__endpoint;
  const worker = functions.deliverAccountEmail.__endpoint;
  for (const endpoint of [queue, worker]) {
    assert.equal(endpoint.platform, 'gcfv2');
    assert.equal(endpoint.eventTrigger.eventType, 'google.cloud.firestore.document.v1.created');
    assert.equal(endpoint.eventTrigger.retry, true);
    assert.equal(endpoint.minInstances, 0); assert.equal(endpoint.maxInstances, 2);
    assert.equal(endpoint.concurrency, 1);
  }
  assert.equal(queue.eventTrigger.eventFilterPathPatterns.document, 'campaignInvites/{inviteId}');
  assert.equal(worker.eventTrigger.eventFilterPathPatterns.document, 'emailDeliveries/{deliveryId}');
  assert.deepEqual(worker.secretEnvironmentVariables, [{ key: 'RESEND_API_KEY' }]);
  assert.equal(queue.secretEnvironmentVariables, undefined);
  if (!process.env.EMAIL_DELIVERY_ENABLED) await functions.queueCampaignInvitationEmail.run({ params: { inviteId: 'disabled-test-without-network' } });
  const root = path.resolve(__dirname, '../../..');
  const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  assert.equal(firebase.functions[0].source, 'functions/email');
  assert.equal(firebase.functions[0].codebase, 'email');
  assert.equal(firebase.functions[0].runtime, 'nodejs22');
  assert.ok(firebase.hosting.ignore.includes('functions/**'));
  const deployWorkflow = fs.readFileSync(path.join(root, '.github/workflows/firebase-hosting-merge.yml'), 'utf8');
  assert.doesNotMatch(deployWorkflow, /firebase deploy.*functions/);
});
