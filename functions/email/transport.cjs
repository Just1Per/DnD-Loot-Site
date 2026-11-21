'use strict';

class DeliveryError extends Error {
  constructor(code, retryable, uncertain = false, retryAfterMs = 0) {
    super(code);
    this.code = code;
    this.retryable = retryable;
    this.uncertain = uncertain;
    this.retryAfterMs = retryAfterMs;
  }
}

function resendTransport({ apiKey, fetcher = fetch }) {
  return async (payload, key) => {
    const secret = apiKey();
    if (!secret || /[\r\n]/.test(secret)) throw new DeliveryError('provider_not_configured', false);
    let response;
    try {
      response = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15000)
      });
    } catch {
      throw new DeliveryError('provider_network_error', true, true);
    }
    if (!response.ok) {
      const retryable = [408, 429].includes(response.status) || response.status >= 500;
      // Never persist/log provider response bodies: they can contain addresses.
      const seconds = Number(response.headers?.get('retry-after'));
      const retryAfterMs = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60 * 60 * 1000) : 0;
      throw new DeliveryError(`provider_http_${response.status}`, retryable, response.status === 408 || response.status >= 500 || response.status === 409, retryAfterMs);
    }
    try {
      const data = await response.json();
      if (typeof data.id !== 'string' || !data.id || data.id.length > 200) throw Error('Invalid response');
      return data.id;
    } catch {
      throw new DeliveryError('provider_invalid_response', true, true);
    }
  };
}

module.exports = { DeliveryError, resendTransport };
