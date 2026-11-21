'use strict';

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineBoolean, defineInt, defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { createEmailService } = require('./service.cjs');
const { resendTransport } = require('./transport.cjs');

initializeApp();
const enabled = defineBoolean('EMAIL_DELIVERY_ENABLED', { default: false });
const from = defineString('EMAIL_FROM', { default: '' });
const replyTo = defineString('EMAIL_REPLY_TO', { default: '' });
const siteUrl = defineString('EMAIL_SITE_URL', { default: 'https://dnd-loot-site.web.app' });
const dailyLimit = defineInt('EMAIL_DAILY_LIMIT', { default: 50 });
const key = defineSecret('RESEND_API_KEY');
const options = { region: 'europe-west1', memory: '256MiB', cpu: 'gcf_gen1', concurrency: 1, minInstances: 0, maxInstances: 2, timeoutSeconds: 60, retry: true };
const service = createEmailService({
  db: getFirestore(), auth: getAuth(),
  config: () => ({ enabled: enabled.value(), from: from.value(), replyTo: replyTo.value(), siteUrl: siteUrl.value(), dailyLimit: dailyLimit.value() }),
  send: resendTransport({ apiKey: () => key.value() })
});

exports.queueCampaignInvitationEmail = onDocumentCreated({ ...options, document: 'campaignInvites/{inviteId}' }, async event => {
  try {
    const status = await service.queueInvitation(event.params.inviteId);
    logger.info('Invitation email queue result', { inviteId: event.params.inviteId, status });
  } catch {
    // Do not log event payloads, recipients, provider replies or credentials.
    logger.error('Invitation email queue unavailable', { inviteId: event.params.inviteId });
    throw Error('Invitation email queue unavailable; check email configuration and retry.');
  }
});

exports.deliverAccountEmail = onDocumentCreated({ ...options, document: 'emailDeliveries/{deliveryId}', secrets: [key] }, async event => {
  try {
    const status = await service.deliver(event.params.deliveryId);
    logger.info('Email delivery result', { deliveryId: event.params.deliveryId, status });
  } catch {
    logger.error('Email delivery awaiting retry', { deliveryId: event.params.deliveryId });
    throw Error('Email delivery awaiting retry; see the server-only delivery record.');
  }
});
