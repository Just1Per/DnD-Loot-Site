'use strict';

// Page adapters for the existing item form and campaign creation workflow.
// Keep field IDs and child nodes intact so mechanics, help and form bindings survive.
var PageEditors = (() => {
  const ids = new Set(['itemModal', 'campaignModal']);
  let active = null, setup = null, leave = null, entering = false, generation = 0, itemOpener = null, listening = false;

  const actor = () => auth.currentUser?.uid;
  const surface = id => document.getElementById(id);
  const saveButton = id => document.getElementById(id === 'itemModal' ? 'saveItemModal' : 'saveCampaignModal');
  const current = s => !!s && s.uid === actor() && s.generation === generation &&
    (s.id === 'campaignModal' ? isDM() : (s.scope === 'root' ? isAdmin() : activeCampaign?.id === s.campaignId && canManageCampaign()));
  const busy = s => s.saving || (!s.saved && saveButton(s.id)?.disabled);
  const draft = id => JSON.stringify([...surface(id).querySelectorAll('input,select,textarea')].map((field, index) => [
    field.id || field.name || index, field.type,
    field.type === 'file' ? [...(field.files || [])].map(file => [file.name, file.size, file.lastModified]) :
      ['checkbox', 'radio'].includes(field.type) ? field.checked : field.value
  ]));
  const dirty = s => !s.saved && (s.id === 'campaignModal' && s.rootCreated && !s.indexCreated || draft(s.id) !== s.baseline);

  function status(id, message = '', error = false) {
    const node = surface(id)?.querySelector('[data-page-editor-status]');
    if (!node) return;
    node.textContent = message;
    node.classList.toggle('is-error', error);
    node.setAttribute('role', error ? 'alert' : 'status');
  }

  function setSaving(s, value) {
    if(!s)return;
    s.saving=value;
    if(active===s){surface(s.id).querySelector('.modal-body').inert=value;surface(s.id).setAttribute('aria-busy',String(value));}
  }

  function convert(id) {
    const old = surface(id);
    if (!old || old.tagName === 'SECTION') return old;
    if (old.open) old.close();
    const page = document.createElement('section');
    for (const attribute of old.attributes) {
      if (!['role', 'aria-modal', 'open', 'style', 'class'].includes(attribute.name)) page.setAttribute(attribute.name, attribute.value);
    }
    page.className = 'page-editor-surface ' + (id === 'itemModal' ? 'page-item-editor' : 'page-campaign-setup');
    page.hidden = true;
    while (old.firstChild) page.append(old.firstChild);
    old.replaceWith(page);
    const heading = page.querySelector('h2');
    heading.tabIndex = -1;
    const back = page.querySelector('.modal-close');
    back.classList.replace('modal-close', 'page-editor-back');
    back.textContent = id === 'itemModal' ? '← Back to Library' : '← Back to campaigns';
    back.setAttribute('aria-label', back.textContent.replace('← ', ''));
    const feedback = document.createElement('p');
    feedback.id = id === 'itemModal' ? 'itemEditorPageStatus' : 'campaignSetupStatus';
    feedback.className = 'page-editor-status';
    feedback.dataset.pageEditorStatus = '';
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    page.querySelector('.modal-header').after(feedback);
    return page;
  }

  function ensure() {
    const item = convert('itemModal'), campaign = convert('campaignModal');
    if (item && !item.parentElement?.matches('#tab-library,#itemEditorScreen')) document.getElementById('tab-library').append(item);
    if (!document.getElementById('itemEditorScreen')) {
      const host = document.createElement('section');
      host.id = 'itemEditorScreen'; host.className = 'page-editor-screen'; host.hidden = true;
      document.getElementById('siteMain').append(host);
    }
    if (!listening) {
      listening = true;
      // Item card actions disable themselves before opening; capture their focus target first.
      document.addEventListener('click', event => {
        const trigger = event.target.closest?.('.item-card .edit-button,.item-card .clone-button,#addItemBtn,#createRootItem,[data-root-id]');
        if (trigger) itemOpener = trigger;
      }, true);
    }
  }

  function hide() {
    for (const id of ids) { const page = surface(id); if (page) { page.hidden = true; page.style.display = 'none'; } }
    const host = document.getElementById('itemEditorScreen'); if (host) host.hidden = true;
    document.getElementById('tab-library')?.classList.remove('page-editor-open');
  }

  function cancelLeave(restoreFocus = true) {
    const previous = leave; leave = null;
    if (!previous) return;
    if (previous.dialog.open) previous.dialog.close();
    previous.dialog.remove();
    if (restoreFocus && previous.opener?.isConnected) previous.opener.focus();
  }

  function dismiss(s) {
    setSaving(s,false);
    surface(s.id).hidden = true; surface(s.id).style.display = 'none';
    if (s.id === 'itemModal') {
      document.getElementById('itemEditorScreen').hidden = true;
      document.getElementById('tab-library').classList.remove('page-editor-open');
    } else if (!s.rootCreated || s.indexCreated) setup = null;
    if (active === s) active = null;
    if (leave?.s === s && !leave.busy) cancelLeave(false);
  }

  function returnTo(s) {
    if (!current(s)) return;
    entering = true;
    try {
      if (s.id === 'campaignModal') showCampaignSelector();
      else if (s.scope === 'root') {
        hideAllScreens();
        document.getElementById('rootCatalogueScreen').style.display = 'block';
        document.getElementById('siteScreenTitle').textContent = 'Root Catalogue · CampaignAtlas';
      } else showTab('library');
    } finally { entering = false; }
    returnFocus(s);
  }

  function returnFocus(s, onlyIfLost = false) {
    if(!current(s)||active||(onlyIfLost&&document.activeElement!==document.body))return;
    const fallback = document.getElementById(s.id === 'campaignModal' ? 'openCreateCampaignBtn' : s.scope === 'root' ? 'createRootItem' : 'addItemBtn');
    const replacement = s.openerItemId ? [...document.querySelectorAll((s.scope === 'root' ? '#rootCards' : '#card-container') + ' .item-card')]
      .find(card => card.dataset.itemId === s.openerItemId)?.querySelector('.' + s.openerAction) : null;
    const target = s.opener?.isConnected && s.opener.getClientRects().length ? s.opener : replacement || fallback;
    target?.focus();
  }

  function requestLeave(s, action) {
    if (leave) { leave.dialog.focus(); return false; }
    if (busy(s)) { status(s.id, 'Wait for saving to finish before leaving.'); return false; }
    if (!dirty(s)) return true;
    const dialog = document.createElement('dialog');
    dialog.id = 'pageEditorLeaveDialog'; dialog.className = 'page-editor-leave';
    dialog.setAttribute('aria-labelledby', 'pageEditorLeaveTitle');
    dialog.setAttribute('aria-describedby', 'pageEditorLeaveDescription');
    dialog.innerHTML = '<h2 id="pageEditorLeaveTitle">Save your changes?</h2><p id="pageEditorLeaveDescription">Save before continuing, discard this draft, or stay here.</p><p data-page-editor-leave-status role="status" aria-live="polite"></p><div class="page-editor-leave-actions"><button type="button" class="btn-primary" data-page-editor-save>Save and continue</button><button type="button" data-page-editor-discard>Leave without saving</button><button type="button" data-page-editor-stay>Stay here</button></div>';
    const p = {s, dialog, action, opener: document.activeElement, busy: false}; leave = p;
    const valid = () => leave === p && current(s);
    const proceed = async () => { if (!valid()) return; cancelLeave(false); await action(); };
    dialog.querySelector('[data-page-editor-save]').onclick = async () => {
      if (!valid() || p.busy) return;
      p.busy = true; dialog.querySelectorAll('button').forEach(button => button.disabled = true);
      const feedback = dialog.querySelector('[data-page-editor-leave-status]'); feedback.textContent = 'Saving…';
      try {
        if (s.id === 'itemModal') await saveItemModal(); else await saveSetup();
        if (!valid()) return;
        if (s.saved) { await proceed(); return; }
        feedback.textContent = surface(s.id).querySelector('[data-page-editor-status]').textContent || 'Your changes could not be saved. Stay here to correct them or try again.';
      } catch (error) { if (valid()) feedback.textContent = error.message; }
      finally { p.busy = false; if (valid()) dialog.querySelectorAll('button').forEach(button => button.disabled = false); }
    };
    dialog.querySelector('[data-page-editor-discard]').onclick = () => { if (!p.busy) void proceed(); };
    dialog.querySelector('[data-page-editor-stay]').onclick = () => { if (!p.busy) cancelLeave(); };
    dialog.addEventListener('cancel', event => { event.preventDefault(); if (!p.busy) cancelLeave(); });
    document.body.append(dialog); dialog.showModal(); dialog.querySelector('[data-page-editor-stay]').focus();
    return false;
  }

  function guard(action) {
    if(typeof CampaignJournal!=='undefined'&&!CampaignJournal.guard(action))return false;
    if (entering || !active) return true;
    const s = active;
    if (!current(s)) { clear(); return true; }
    const finish = async () => { dismiss(s); await action(); };
    if (!requestLeave(s, finish)) return false;
    dismiss(s); return true;
  }

  function beforeNavigate(tab, render = true) {
    return guard(() => showTab(tab, render));
  }

  function show(s) {
    entering = true;
    try {
      if (s.id === 'campaignModal' || s.scope === 'root') hideAllScreens();
      else {
        showTab('library');
        if (document.getElementById('tab-library').style.display === 'none') return false;
      }
      if (s.id === 'itemModal') {
        const host = document.getElementById(s.scope === 'root' ? 'itemEditorScreen' : 'tab-library');
        host.append(surface(s.id));
        if (s.scope === 'root') host.hidden = false;
        else host.classList.add('page-editor-open');
        const back = document.getElementById('closeItemModal');
        back.textContent = s.scope === 'root' ? '← Back to Root Catalogue' : '← Back to Library';
        back.setAttribute('aria-label', back.textContent.replace('← ', ''));
      }
      active = s; surface(s.id).hidden = false; surface(s.id).style.display = 'block';
      document.getElementById('siteScreenTitle').textContent = surface(s.id).querySelector('h2').textContent + ' · CampaignAtlas';
      surface(s.id).querySelector('h2').focus();
      return true;
    } finally { entering = false; }
  }

  function open(id) {
    if (!ids.has(id)) return false;
    ensure();
    if (id === 'campaignModal') return openSetup();
    const editor = typeof itemEditor === 'undefined' ? null : itemEditor;
    if (!actor() || !editor || (editor.scope === 'root' ? !isAdmin() : !canManageCampaign() || activeCampaign?.id !== editor.campaignId)) return false;
    if (active?.id === id && active.editor === editor) return show(active);
    if (!guard(() => open(id))) return false;
    if (typeof SheetNavigation !== 'undefined' && !SheetNavigation.guard(() => open(id))) return false;
    const s = {id, uid: actor(), generation, scope: editor.scope, campaignId: editor.campaignId, editor, opener: itemOpener || document.activeElement, saved: false, saving: false, baseline: draft(id)};
    s.openerItemId = s.opener?.closest('.item-card')?.dataset.itemId;
    s.openerAction = s.opener?.classList.contains('clone-button') ? 'clone-button' : 'edit-button';
    itemOpener = null;
    status(id); return show(s);
  }

  function close(id, {navigate = true, discard = false} = {}) {
    const s = active?.id === id ? active : null;
    if (!s) { if (surface(id)) { surface(id).hidden = true; surface(id).style.display = 'none'; } return true; }
    if (!current(s)) { clear(); return true; }
    const finish = () => { dismiss(s); if (navigate) returnTo(s); };
    if (!discard && !s.saved && !requestLeave(s, finish)) return false;
    finish(); return true;
  }

  function markSaved(id) {
    if (active?.id === id && current(active)) { active.saved = true; active.baseline = draft(id); }
  }

  function openSetup(campaign = null) {
    ensure();
    if (campaign) {
      if (!actor() || !canManageCampaign() || activeCampaign?.id !== campaign.id) return false;
      if (!guard(() => openSetup(campaign))) return false;
      showTab('dm-settings'); return true;
    }
    if (!actor() || !isDM()) return false;
    if (active?.id === 'campaignModal' && current(active)) return show(active);
    if (!guard(() => openSetup())) return false;
    if (typeof SheetNavigation !== 'undefined' && !SheetNavigation.guard(() => openSetup())) return false;
    for (const workspace of [typeof CampaignWorkspace === 'undefined' ? null : CampaignWorkspace, typeof CampaignHome === 'undefined' ? null : CampaignHome, typeof CampaignInformation === 'undefined' ? null : CampaignInformation]) {
      if (workspace && !workspace.beforeNavigate('campaign-setup')) return false;
    }
    if (!setup || !current(setup)) {
      document.getElementById('campaign-name').value = '';
      document.getElementById('campaign-description').value = '';
      document.getElementById('campaignModal').dataset.editId = '';
      document.getElementById('campaignModalTitle').textContent = 'Create Campaign';
      document.getElementById('saveCampaignModal').textContent = 'Create Campaign';
      for (const id of ['campaign-name', 'campaign-description']) document.getElementById(id).readOnly = false;
      setup = {id: 'campaignModal', uid: actor(), generation, campaignId: crypto.randomUUID(), opener: document.activeElement, rootCreated: false, memberCreated: false, indexCreated: false, saved: false, saving: false};
      setup.baseline = draft(setup.id); status(setup.id);
    } else status(setup.id, 'Your campaign details are saved. Retry to finish setup.');
    return show(setup);
  }

  async function saveSetup() {
    const s = setup;
    if (!current(s) || active !== s || s.saving || !isDM()) return false;
    const name = document.getElementById('campaign-name').value.trim();
    if (!name) { status(s.id, 'Campaign name is required.', true); document.getElementById('campaign-name').focus(); return false; }
    if (!s.rootCreated) {
      const stamp = s.createdAt ||= Date.now();
      s.data = {name, description: document.getElementById('campaign-description').value.trim(), dmId: s.uid, ownerId: s.uid, defaultItemVisible: true, inventoryVersion: 2, created: stamp, updatedAt: stamp};
    }
    setSaving(s,true); const button = saveButton(s.id); button.disabled = true;
    status(s.id, s.rootCreated ? 'Finishing campaign setup…' : 'Creating campaign…');
    try {
      if (!s.rootCreated) {
        await setDoc(doc(db, 'campaigns', s.campaignId), s.data);
        if (!current(s)) return false;
        s.rootCreated = true;
        for (const id of ['campaign-name', 'campaign-description']) document.getElementById(id).readOnly = true;
      }
      if (!s.memberCreated) {
        await setDoc(doc(db, 'campaigns', s.campaignId, 'members', s.uid), {uid: s.uid, role: 'dm', status: 'active', joinedAt: s.createdAt}, {merge: true});
        if (!current(s)) return false;
        s.memberCreated = true;
      }
      if (!s.indexCreated) {
        await setDoc(doc(db, 'users', s.uid, 'campaigns', s.campaignId), {role: 'dm', status: 'active', joinedAt: s.createdAt}, {merge: true});
        if (!current(s)) return false;
        s.indexCreated = true;
      }
      if (!current(s) || active !== s) return false;
      const row = {id: s.campaignId, membershipRole: 'dm', ...s.data};
      const index = campaigns.findIndex(campaign => campaign.id === s.campaignId);
      if (index < 0) campaigns.push(row); else campaigns[index] = row;
      s.saved = true; close(s.id); return true;
    } catch (error) {
      if (current(s) && active === s) status(s.id, (s.rootCreated ? 'Campaign details are saved. Retry to finish setup: ' : 'Could not create campaign: ') + error.message, true);
      return false;
    } finally {
      setSaving(s,false);
      if (current(s) && (!active || active === s)) { button.disabled = false; if (s.rootCreated && !s.indexCreated) button.textContent = 'Retry setup'; }
    }
  }

  function clear() {
    setSaving(active,false);
    if(typeof itemEditor!=='undefined')itemEditor=null;
    ++generation; cancelLeave(false); active = null; setup = null; itemOpener = null; hide();
    for (const id of ids) {
      const page = surface(id); if (!page) continue;
      for (const field of page.querySelectorAll('input,textarea')) {
        if (['checkbox', 'radio'].includes(field.type)) field.checked = false; else field.value = '';
        field.readOnly = false;
      }
      saveButton(id).disabled = false; status(id);
    }
  }

  window.addEventListener('beforeunload',event=>{if(active&&current(active)&&(dirty(active)||busy(active))){event.preventDefault();event.returnValue='';}});

  return {ensure, openCampaign:openSetup, saveCampaign:saveSetup, handles: id => ids.has(id), open, close, beforeNavigate, guard, hide, clear, status, markSaved, setSaving, returnFocus,
    session: id => active?.id === id ? active : id === 'campaignModal' && current(setup) ? setup : null};
})();
