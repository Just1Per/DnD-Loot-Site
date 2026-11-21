'use strict';

const { createHash, randomUUID } = require('node:crypto');
const { configuration, emailAddress } = require('./config.cjs');
const { message } = require('./templates.cjs');
const { DeliveryError } = require('./transport.cjs');
const HOUR = 60 * 60 * 1000, DAY = 24 * HOUR, LEASE = 2 * 60 * 1000, MAX_ATTEMPTS = 5;
const hash = value => createHash('sha256').update(value).digest('hex');
const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 1500 && !value.includes('/');
const deliveryId = inviteId => 'invitation_' + hash(inviteId);
const identity = invite => JSON.stringify([invite.campaignId, invite.createdBy, invite.emailLower, invite.email, invite.targetUid || '', invite.role]);

function createEmailService({ db, auth, send, config, now = Date.now }) {
  const ref = (collection, id) => db.collection(collection).doc(id);

  async function invitation(inviteId) {
    if (!validId(inviteId)) return null;
    const snapshot = await ref('campaignInvites', inviteId).get();
    if (!snapshot.exists) return null;
    const value = snapshot.data(), createdAt = snapshot.createTime.toMillis();
    if (value.status !== 'pending' || !validId(value.campaignId) || !validId(value.createdBy) || !['player', 'dm'].includes(value.role) || now() - createdAt >= DAY || createdAt > now()) return null;
    const campaignRef = ref('campaigns', value.campaignId);
    const [campaign, member] = await Promise.all([campaignRef.get(), campaignRef.collection('members').doc(value.createdBy).get()]);
    if (!campaign.exists || Object.hasOwn(campaign.data(), 'deletedAt')) return null;
    if (campaign.data().ownerId !== value.createdBy && !(member.data()?.status === 'active' && member.data()?.role === 'dm')) return null;
    let recipient;
    if (value.targetUid) {
      if (!validId(value.targetUid)) return null;
      let account;
      try { account = await auth.getUser(value.targetUid); }
      catch (error) { if (error.code === 'auth/user-not-found') return null; throw Error('Invitation recipient lookup temporarily unavailable.'); }
      if (account.disabled) return null;
      recipient = emailAddress(account.email);
      // A mixed invitation must not send to a mailbox other than its UID owner.
      if (value.emailLower && recipient !== emailAddress(value.emailLower)) return null;
    } else {
      recipient = emailAddress(value.emailLower);
      if (!recipient || recipient !== emailAddress(value.email)) return null;
    }
    if (!recipient) return null;
    return { ...value, recipient, campaignName: campaign.data().name, sourceIdentity: identity(value), sourceCreatedAt: createdAt };
  }

  async function queueInvitation(inviteId) {
    const settings = configuration(config());
    if (!settings.enabled) return 'disabled';
    const source = await invitation(inviteId);
    if (!source) return 'ineligible';
    const jobRef = ref('emailDeliveries', deliveryId(inviteId));
    const time = now(), day = new Date(time).toISOString().slice(0, 10);
    const buckets = [
      { id: day + '_all', limit: settings.dailyLimit },
      { id: day + '_actor_' + hash(source.createdBy), limit: Math.min(20, settings.dailyLimit) },
      { id: day + '_recipient_' + hash(source.recipient), limit: 5 }
    ];
    return db.runTransaction(async tx => {
      const existing = await tx.get(jobRef);
      if (existing.exists) return 'duplicate';
      const current = await tx.get(ref('campaignInvites', inviteId));
      if (!current.exists || current.data().status !== 'pending' || identity(current.data()) !== source.sourceIdentity || current.createTime.toMillis() !== source.sourceCreatedAt) return 'ineligible';
      const counts = await Promise.all(buckets.map(bucket => tx.get(ref('emailRateLimits', bucket.id))));
      const limited = buckets.some((bucket, index) => (counts[index].data()?.count || 0) >= bucket.limit);
      const job = {
        schemaVersion: 1, type: 'campaign-invitation', inviteId,
        campaignId: source.campaignId, actorId: source.createdBy,
        sourceIdentity: source.sourceIdentity, sourceCreatedAt: source.sourceCreatedAt,
        createdAt: time, updatedAt: time, attempts: 0,
        expiresAt: new Date(time + 30 * DAY),
        status: limited ? 'suppressed' : 'queued'
      };
      if (limited) job.reason = 'daily_limit';
      else {
        job.message = message(job.type, source, settings);
        for (let index = 0; index < buckets.length; index++) tx.set(ref('emailRateLimits', buckets[index].id), { count: (counts[index].data()?.count || 0) + 1, expiresAt: new Date(time + 7 * DAY) });
      }
      tx.create(jobRef, job);
      return job.status;
    });
  }

  async function deliver(jobId) {
    const settings = configuration(config()), jobRef = ref('emailDeliveries', jobId), token = randomUUID();
    const claim = await db.runTransaction(async tx => {
      const snapshot = await tx.get(jobRef);
      if (!snapshot.exists || !['queued', 'sending'].includes(snapshot.data().status)) return null;
      const job = snapshot.data(), time = now();
      const suppress = reason => { tx.update(jobRef, { status: 'suppressed', reason, updatedAt: time, leaseUntil: 0 }); return null; };
      if (!settings.enabled) return suppress('delivery_disabled');
      if (job.type !== 'campaign-invitation' || job.schemaVersion !== 1 || !validId(job.inviteId) || jobId !== deliveryId(job.inviteId)) return suppress('invalid_job');
      if (job.leaseUntil > time || job.retryAt > time) throw Error('Email delivery is already being processed or waiting for retry.');
      // Resend retains idempotency keys for 24h. Never blindly retry an ambiguous
      // send beyond 23h, even when the Firestore trigger itself retries for days.
      if ((job.firstAttemptAt !== undefined && time - job.firstAttemptAt >= 23 * HOUR) || job.attempts >= MAX_ATTEMPTS) {
        tx.update(jobRef, { status: 'needs-review', reason: 'retry_window_exhausted', updatedAt: time, leaseUntil: 0 });
        return null;
      }
      if (time - job.sourceCreatedAt >= DAY) return suppress('invitation_too_old');
      const next = { ...job, attempts: job.attempts + 1, firstAttemptAt: job.firstAttemptAt ?? time, leaseUntil: time + LEASE, leaseToken: token, status: 'sending', updatedAt: time };
      tx.update(jobRef, { attempts: next.attempts, firstAttemptAt: next.firstAttemptAt, leaseUntil: next.leaseUntil, leaseToken: token, status: 'sending', updatedAt: time });
      return next;
    });
    if (!claim) return 'ignored';
    async function finish(fields) {
      await db.runTransaction(async tx => {
        const current = await tx.get(jobRef);
        if (current.data()?.leaseToken !== token || current.data()?.status !== 'sending') throw Error('Email delivery lease changed; retry later.');
        tx.update(jobRef, { ...fields, updatedAt: now(), leaseUntil: 0 });
      });
    }
    let providerAccepted = false;
    try {
      const source = await invitation(claim.inviteId);
      if (!source || source.sourceIdentity !== claim.sourceIdentity || source.sourceCreatedAt !== claim.sourceCreatedAt || source.recipient !== claim.message?.to?.[0]) {
        await finish({ status: 'suppressed', reason: 'invitation_changed' });
        return 'suppressed';
      }
      const providerId = await send(claim.message, 'campaignatlas-email-v1-' + jobId);
      providerAccepted = true;
      await finish({ status: 'sent', providerId, sentAt: now() });
      return 'sent';
    } catch (error) {
      // If saving the receipt fails, retain the lease. A retry uses the same
      // provider key and frozen payload rather than generating another email.
      if (providerAccepted) throw Error('Email receipt could not be saved; retry safely.');
      const deliveryError = error instanceof DeliveryError ? error : new DeliveryError('source_temporarily_unavailable', true);
      const uncertain = claim.uncertain === true || deliveryError.uncertain;
      const retry = deliveryError.retryable && claim.attempts < MAX_ATTEMPTS;
      const retryAt = retry ? now() + Math.max(deliveryError.retryAfterMs, 30000 * 2 ** (claim.attempts - 1)) : 0;
      await finish({ status: retry ? 'queued' : uncertain ? 'needs-review' : 'failed', reason: deliveryError.code, uncertain, retryAt });
      if (retry) throw Error('Email delivery temporarily unavailable; retry safely.');
      return uncertain ? 'needs-review' : 'failed';
    }
  }

  return { queueInvitation, deliver };
}

module.exports = { createEmailService, deliveryId, DAY, HOUR };
