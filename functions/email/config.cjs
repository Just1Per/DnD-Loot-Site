'use strict';

function emailAddress(value) {
  if (typeof value !== 'string' || value.length > 254 || value !== value.trim()) return null;
  const parts = value.split('@');
  if (parts.length !== 2 || parts[0].length > 64 || !parts[0] || parts[0].startsWith('.') || parts[0].endsWith('.') || parts[0].includes('..')) return null;
  if (!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(parts[0])) return null;
  if (!/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(parts[1])) return null;
  return value.toLowerCase();
}

function configuration(raw = {}) {
  if (raw.enabled !== true) return { enabled: false };
  const from = String(raw.from || '');
  const mailbox = from.match(/^(?:[^<>\r\n]{1,60} <([^<>]+)>|([^<>\r\n]+))$/);
  if (!mailbox || !emailAddress(mailbox[1] || mailbox[2])) throw Error('EMAIL_FROM must be a single verified sender address.');
  const replyTo = raw.replyTo || '';
  if (replyTo && !emailAddress(replyTo)) throw Error('EMAIL_REPLY_TO must be a single email address.');
  let site;
  try { site = new URL(raw.siteUrl); } catch { throw Error('EMAIL_SITE_URL must be an HTTPS website origin.'); }
  if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) throw Error('EMAIL_SITE_URL must be an HTTPS website origin.');
  const dailyLimit = raw.dailyLimit ?? 50;
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) throw Error('EMAIL_DAILY_LIMIT must be between 1 and 1000.');
  return { enabled: true, from, replyTo, siteUrl: site.origin + '/', dailyLimit };
}

module.exports = { configuration, emailAddress };
