'use strict';

const clean = (value, fallback) => String(value || fallback).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 120) || fallback;
const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// New email categories get their own template and source adapter. Clients cannot
// select a template, supply arbitrary HTML, or submit a recipient to the outbox.
const templates = Object.freeze({
  'campaign-invitation': ({ campaignName, recipient }, config) => {
    const name = clean(campaignName, 'a D&D campaign');
    const text = `You have been invited to join "${name}" on CampaignAtlas.\n\nOpen ${config.siteUrl}\nSign in or create an account using ${recipient}, then review the invitation on your dashboard. Joining remains your choice; opening this email does not accept the invitation.\n\nIf you did not expect this invitation, you can ignore this email. No campaign updates or marketing emails are enabled by this invitation.`;
    const html = `<main><h1>You are invited to CampaignAtlas</h1><p>You have been invited to join <strong>${escape(name)}</strong>.</p><p><a href="${escape(config.siteUrl)}">Open CampaignAtlas</a></p><p>Sign in or create an account using <strong>${escape(recipient)}</strong>, then review the invitation on your dashboard.</p><p>Joining remains your choice; opening this email does not accept the invitation.</p><p>If you did not expect this invitation, you can ignore this email. No campaign updates or marketing emails are enabled by this invitation.</p></main>`;
    return { subject: `Invitation to ${name} — CampaignAtlas`, text, html };
  }
});

function message(type, context, config) {
  if (!Object.hasOwn(templates, type)) throw Error('Unsupported email category.');
  return { from: config.from, to: [context.recipient], ...templates[type](context, config), ...(config.replyTo ? { reply_to: config.replyTo } : {}) };
}

module.exports = { message };
