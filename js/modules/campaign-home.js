"use strict";

// Member-facing campaign introduction. DM secrets belong in the private workspace.
var CampaignHome = (() => {
  const {runTransaction} = window.__DND_VAULT_DEPS__;
  const limits = {tagline:160, introduction:6000, expectations:4000, imageUrl:2000, imageAlt:240, imageCredit:240};
  let session = null;
  const text = value => typeof value === 'string' ? value.trim() : '';
  function imageUrl(value) {
    if (!text(value)) return '';
    try {
      const url = new URL(text(value));
      return url.protocol === 'https:' && !url.username && !url.password && /^[A-Za-z0-9.-]+$/.test(url.hostname) && url.href.length <= limits.imageUrl ? url.href : '';
    } catch { return ''; }
  }
  function normalize(data = {}) {
    const result = {};
    for (const [key, max] of Object.entries(limits)) result[key] = text(data?.[key]).slice(0, max);
    result.imageUrl = imageUrl(result.imageUrl);
    result.revision = Number.isSafeInteger(data?.revision) && data.revision > 0 ? data.revision : 0;
    return result;
  }
  function contents(data, campaign) {
    const introduction = data.introduction || text(campaign.description);
    return `<article class="campaign-book" aria-label="Campaign introduction">
      <div class="campaign-book-opening${data.imageUrl ? ' campaign-book-opening--illustrated' : ''}"><div class="campaign-book-copy">
      <div class="campaign-book-title"><p class="campaign-book-eyebrow">Your campaign</p><h2>${escapeHtml(campaign.name || 'An unwritten adventure')}</h2>${data.tagline ? `<p class="campaign-book-tagline">${escapeHtml(data.tagline)}</p>` : ''}<div class="campaign-book-rule" aria-hidden="true"></div></div>
      <div class="campaign-book-chapters"><section><h3>The adventure begins</h3><p class="campaign-book-prose">${escapeHtml(introduction || 'Your story begins here. Your DM can add an introduction to welcome the party to this campaign.')}</p></section>
      ${data.expectations ? `<section><h3>Campaign information &amp; table rules</h3><p class="campaign-book-prose">${escapeHtml(data.expectations)}</p></section>` : ''}</div></div>
      ${data.imageUrl ? `<figure class="campaign-book-cover"><img src="${escapeHtml(data.imageUrl)}" alt="${escapeHtml(data.imageAlt)}" referrerpolicy="no-referrer">${data.imageCredit ? `<figcaption>${escapeHtml(data.imageCredit)}</figcaption>` : ''}</figure>` : ''}</div>
    </article>`;
  }
  function bindImages(root) {
    root.querySelectorAll('.campaign-book-cover img').forEach(img => {
      const failed = () => { img.closest('figure').hidden = true; img.closest('.campaign-book-opening').classList.remove('campaign-book-opening--illustrated'); };
      img.addEventListener('error', failed, {once:true});
      if (img.complete && !img.naturalWidth) failed();
    });
  }
  function render() {
    const root = document.getElementById('tab-campaign-home');
    if (!root) return;
    root.replaceChildren();
    if (!activeCampaign || !auth.currentUser) return;
    root.innerHTML = `<div class="campaign-home-shell">
      <div class="campaign-home-toolbar"><p>A place for your party’s story.</p>${canManageCampaign() ? '<button type="button" class="btn-primary" data-edit-campaign-home>Edit front page</button>' : ''}</div>
      ${contents(normalize(activeCampaign.frontPage), activeCampaign)}
      <nav class="campaign-home-links" aria-label="Campaign shortcuts"><button type="button" class="btn-primary" data-home-tab="library">Explore the item library</button>${canUseCharacters() ? '<button type="button" class="vault-secondary-btn" data-home-tab="player">My characters</button>' : ''}${canManageCampaign() ? '<button type="button" class="vault-secondary-btn" data-home-tab="dm">Prepare the campaign</button>' : ''}</nav>
      <p id="campaignHomeStatus" role="status" aria-live="polite"></p></div>`;
    root.querySelector('[data-edit-campaign-home]')?.addEventListener('click', edit);
    root.querySelectorAll('[data-home-tab]').forEach(button => button.addEventListener('click', () => showTab(button.dataset.homeTab)));
    bindImages(root);
  }
  function clear(force = false) {
    if (!force && session?.busy) return false;
    if (!force && session?.dirty && !confirm('Discard unsaved front-page changes?')) return false;
    const dialog = document.getElementById('campaignHomeEditor');
    if (dialog?.open) dialog.close();
    dialog?.remove();
    session = null;
    if (force) document.getElementById('tab-campaign-home')?.replaceChildren();
    return true;
  }
  function beforeNavigate(tab) { return tab === 'campaign-home' || clear(); }
  function edit() {
    if (!activeCampaign || !canManageCampaign() || session) return;
    const data = normalize(activeCampaign.frontPage);
    session = {id:activeCampaign.id, uid:auth.currentUser.uid, revision:data.revision, dirty:false, busy:false};
    const dialog = document.createElement('dialog');
    dialog.id = 'campaignHomeEditor'; dialog.className = 'campaign-home-editor';
    dialog.setAttribute('aria-labelledby', 'campaignHomeEditorTitle');
    const fields = [
      ['tagline','A line to set the scene','text','A tale of…'],
      ['introduction','Campaign introduction','textarea','Welcome the party to your world.'],
      ['expectations','Important campaign information & table rules','textarea','Tone, play style, session plans and any table agreements.'],
      ['imageUrl','Campaign map or intro image URL (HTTPS)','url','https://…'],
      ['imageAlt','Cover image description','text','Describe the artwork for readers who cannot see it.'],
      ['imageCredit','Artwork credit','text','Artist or source']
    ];
    dialog.innerHTML = `<form><h2 id="campaignHomeEditorTitle">Shape your campaign’s front page</h2><p>Everything here is visible to campaign members. Keep secrets in your DM workspace.</p>
      ${fields.map(([key,label,type,placeholder]) => `<label><span>${label}</span>${type === 'textarea' ? `<textarea name="${key}" rows="5" maxlength="${limits[key]}" placeholder="${placeholder}">${escapeHtml(data[key])}</textarea>` : `<input name="${key}" type="${type}" maxlength="${limits[key]}" placeholder="${placeholder}" value="${escapeHtml(data[key])}">`}</label>`).join('')}
      <p class="campaign-home-hint">Use a publicly accessible image you have permission to share. Add a description when using a cover image.</p>
      <p data-home-editor-status role="status" aria-live="polite"></p><div class="campaign-home-editor-actions"><button type="submit" class="btn-primary">Save front page</button><button type="button" class="vault-secondary-btn" data-home-preview>Preview</button><button type="button" class="cancel-button" data-home-cancel>Cancel</button></div>
      <div data-home-preview-surface hidden></div></form>`;
    document.body.appendChild(dialog);
    const form = dialog.querySelector('form');
    form.addEventListener('input', () => {
      if (!session) return;
      session.dirty = true;
      form.elements.imageUrl.setCustomValidity('');
      form.elements.imageAlt.setCustomValidity('');
      form.elements.imageAlt.required = !!form.elements.imageUrl.value.trim();
      dialog.querySelector('[data-home-preview-surface]').hidden = true;
    });
    form.elements.imageAlt.required = !!data.imageUrl;
    form.addEventListener('submit', save);
    dialog.querySelector('[data-home-cancel]').addEventListener('click', () => clear());
    dialog.addEventListener('cancel', event => {event.preventDefault();clear();});
    dialog.querySelector('[data-home-preview]').addEventListener('click', () => {
      const surface = dialog.querySelector('[data-home-preview-surface]');
      surface.innerHTML = contents(readForm(form), activeCampaign);
      surface.hidden = false; bindImages(surface);
      surface.scrollIntoView({block:'nearest'});
    });
    dialog.showModal();
  }
  function readForm(form) {
    return normalize(Object.fromEntries(Object.keys(limits).map(key => [key, form.elements[key].value])));
  }
  async function save(event) {
    event.preventDefault();
    const current = session, form = event.currentTarget;
    if (!current || current.busy || current.id !== activeCampaign?.id || current.uid !== auth.currentUser?.uid || !canManageCampaign()) return;
    const data = readForm(form);
    if (form.elements.imageUrl.value.trim() && !data.imageUrl) {
      form.elements.imageUrl.setCustomValidity('Use an HTTPS image URL without a username or password.');
      form.reportValidity(); return;
    }
    if (data.imageUrl && !data.imageAlt) {
      form.elements.imageAlt.setCustomValidity('Describe the cover image for readers who cannot see it.');
      form.reportValidity(); return;
    }
    if (!form.reportValidity()) return;
    const status = form.querySelector('[data-home-editor-status]');
    current.busy = true; status.textContent = 'Saving your campaign front page…';
    // Lock the captured draft until the transaction finishes.
    for (const control of form.elements) control.disabled = true;
    try {
      data.revision = current.revision + 1;
      const campaignRef = doc(db, 'campaigns', current.id);
      await runTransaction(db, async transaction => {
        if (session !== current || activeCampaign?.id !== current.id || auth.currentUser?.uid !== current.uid || !canManageCampaign()) throw Error('Campaign access changed. Reopen the campaign before saving.');
        const snapshot = await transaction.get(campaignRef);
        if (session !== current || activeCampaign?.id !== current.id || auth.currentUser?.uid !== current.uid || !canManageCampaign()) throw Error('Campaign access changed. Reopen the campaign before saving.');
        if (!snapshot.exists()) throw Error('This campaign no longer exists.');
        if (normalize(snapshot.data().frontPage).revision !== current.revision) throw Error('Another DM updated this front page. Copy your draft, cancel, and reopen the campaign to load their changes.');
        transaction.update(campaignRef, {frontPage:data, updatedAt:Date.now()});
      });
      if (session !== current || activeCampaign?.id !== current.id || auth.currentUser?.uid !== current.uid) return;
      activeCampaign = {...activeCampaign, frontPage:data};
      const campaign = campaigns.find(row => row.id === current.id);
      if (campaign) campaign.frontPage = data;
      clear(true); render();
      document.getElementById('campaignHomeStatus').textContent = 'Your campaign front page is saved.';
      document.querySelector('[data-edit-campaign-home]')?.focus();
    } catch (error) {
      if (session === current) status.textContent = `Could not save: ${error.message}`;
    } finally {
      current.busy = false;
      if (session === current) for (const control of form.elements) control.disabled = false;
    }
  }
  return {render, edit, clear, beforeNavigate};
})();
