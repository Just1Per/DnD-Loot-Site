"use strict";

// Member-facing campaign introduction. DM secrets belong in the private workspace.
var CampaignHome = (() => {
  const {runTransaction, getBlob, ref, storage, uploadBytes} = window.__DND_VAULT_DEPS__;
  const limits = {tagline:160, introduction:6000, expectations:4000, imageUrl:2000, imageAlt:240, imageCredit:240};
  const layouts = [
    {id:'classic',name:'Classic',subtitle:'Standard',description:'The familiar introduction on the left, with your image on the right.'},
    {id:'chronicle',name:'Chronicle',subtitle:'An open campaign book',description:'A grand chapter heading, facing pages and a bookplate for your artwork.'},
    {id:'atlas',name:'Atlas',subtitle:'A world waiting to be explored',description:'A wide map or illustration above the title and two columns of campaign notes.'},
    {id:'grimoire',name:'Grimoire',subtitle:'A leather-bound adventure',description:'A burgundy title band, gold detailing and an illustration beside the story.'}
  ];
  const layoutId = value => layouts.some(layout=>layout.id===value) ? value : 'classic';
  const imageReadTimeoutMs = 20000, pendingReads = new Map(), imageLoads = new WeakMap();
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
    result.imagePath = /^campaign-cover-images\/[A-Za-z0-9_-]{1,100}\/[A-Za-z0-9_-]{1,100}$/.test(data?.imagePath || '') ? data.imagePath : '';
    if (result.imagePath) result.imageUrl = '';
    result.layout = layoutId(data?.layout);
    result.revision = Number.isSafeInteger(data?.revision) && data.revision > 0 ? data.revision : 0;
    return result;
  }
  function contents(data, campaign) {
    const introduction = data.introduction || text(campaign.description);
    const hasImage = !!(data.imageUrl || data.imagePath);
    return `<article class="campaign-book" data-home-layout="${layoutId(data.layout)}" aria-label="Campaign introduction">
      <div class="campaign-book-opening${hasImage ? ' campaign-book-opening--illustrated' : ''}"><div class="campaign-book-copy">
      <div class="campaign-book-title"><p class="campaign-book-eyebrow">Your campaign</p><h2>${escapeHtml(campaign.name || 'An unwritten adventure')}</h2>${data.tagline ? `<p class="campaign-book-tagline">${escapeHtml(data.tagline)}</p>` : ''}<div class="campaign-book-rule" aria-hidden="true"></div></div>
      <div class="campaign-book-chapters"><section><h3>The adventure begins</h3><p class="campaign-book-prose">${escapeHtml(introduction || 'Your story begins here. Your DM can add an introduction to welcome the party to this campaign.')}</p></section>
      ${data.expectations ? `<section><h3>Campaign information &amp; table rules</h3><p class="campaign-book-prose">${escapeHtml(data.expectations)}</p></section>` : ''}</div></div>
      ${hasImage ? `<figure class="campaign-book-cover"><img ${data.imagePath ? `data-cover-path="${escapeHtml(data.imagePath)}" hidden` : `src="${escapeHtml(data.imageUrl)}"`} alt="${escapeHtml(data.imageAlt)}" referrerpolicy="no-referrer">${data.imagePath ? '<p data-cover-status role="status">Loading campaign image…</p>' : ''}${data.imageCredit ? `<figcaption>${escapeHtml(data.imageCredit)}</figcaption>` : ''}</figure>` : ''}</div>
    </article>`;
  }
  function bindImages(root) {
    root.querySelectorAll('.campaign-book-cover img').forEach(img => {
      const failed = (message = 'This image could not be displayed. Try a different PNG, JPEG or WebP image.') => {
        if (img.dataset.coverPath) {
          img.hidden = true;
          const figure = img.closest('figure');
          let status = figure.querySelector('[data-cover-status]');
          if (!status) {status = document.createElement('p');status.dataset.coverStatus = '';status.setAttribute('role', 'status');figure.append(status);}
          status.textContent = message;
          if (!figure.querySelector('[data-cover-retry]')) {
            const retry = document.createElement('button');retry.type = 'button';retry.dataset.coverRetry = '';retry.textContent = 'Try loading image again';
            retry.addEventListener('click', () => loadImage(img, failed));figure.append(retry);
          }
          return;
        }
        img.closest('figure').hidden = true;
        const opening = img.closest('.campaign-book-opening');
        if (!opening?.classList.contains('campaign-book-opening--editing')) opening?.classList.remove('campaign-book-opening--illustrated');
        const empty = img.closest('[data-home-image-preview]')?.querySelector('[data-home-image-empty]'); if (empty) empty.hidden = false;
      };
      img.addEventListener('error', () => failed());
      if (img.hasAttribute('src') && img.complete && !img.naturalWidth) failed();
      if (img.dataset.coverPath) loadImage(img, failed);
    });
  }
  function releaseImages(root) {
    root?.querySelectorAll('.campaign-book-cover img').forEach(img => {
      imageLoads.get(img)?.cancel?.();imageLoads.delete(img);
      if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
    });
  }
  function readCover(path, uid) {
    const key = JSON.stringify([uid, path]);
    if (!pendingReads.has(key)) {
      // The SDK owns network retries. Reuse a pending read so UI retries do not
      // start several background downloads of the same immutable object.
      const request = getBlob(ref(storage, path), 5 * 1024 * 1024);
      pendingReads.set(key, request);
      const remove = () => {if (pendingReads.get(key) === request) pendingReads.delete(key);};
      request.then(remove, remove);
    }
    return pendingReads.get(key);
  }
  async function loadImage(img, failed) {
    const campaignId = activeCampaign?.id, uid = auth.currentUser?.uid, path = img.dataset.coverPath;
    const retry = img.closest('figure').querySelector('[data-cover-retry]');
    if (retry?.disabled) return;
    const attempt = {};imageLoads.set(img, attempt);let timer;
    const current = () => imageLoads.get(img) === attempt && img.isConnected && activeCampaign?.id === campaignId && auth.currentUser?.uid === uid;
    if (retry) retry.disabled = true;
    const status = img.closest('figure').querySelector('[data-cover-status]');
    if (status) status.textContent = 'Loading campaign image…';
    try {
      if (!path.startsWith(`campaign-cover-images/${campaignId}/`)) throw Error('Invalid campaign image.');
      // The uploaded file is already in this editor. Do not download it again
      // merely to show a draft; saved/reopened pages still use authenticated reads.
      const local = session?.id === campaignId && session.uid === uid && session.imagePath === path ? session.imageFile : null;
      const request = local ? Promise.resolve(local) : readCover(path, uid);
      const interrupted = new Promise((_, reject) => {
        attempt.cancel = () => reject(Object.assign(Error('Image view closed'), {code:'storage/canceled'}));
        timer = setTimeout(() => reject(Object.assign(Error('Image read timed out'), {code:'storage/read-timeout'})), imageReadTimeoutMs);
      });
      const blob = await Promise.race([request, interrupted]);
      if (!current()) return;
      if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
      img.src = URL.createObjectURL(blob); img.hidden = false;
      img.closest('figure').querySelector('[data-cover-status]')?.remove();
      img.closest('figure').querySelector('[data-cover-retry]')?.remove();
    } catch (error) {
      if (current()) {
        const message = error.code === 'storage/unauthorized' ? 'You do not have access to this campaign image. Ask the campaign DM to check image access.'
          : error.code === 'storage/object-not-found' ? 'The saved campaign image could not be found. Ask the campaign DM to upload it again.'
          : error.code === 'storage/read-timeout' ? `${img.closest('#campaignHomeEditor')?'':'Your front page is saved. '}The campaign image is taking too long to load. Try loading it again. If this continues, ask the site administrator to check image loading.`
          : 'The campaign image could not be loaded. Try loading it again. Your campaign text is still available.';
        failed(message);
      }
    } finally {
      clearTimeout(timer);if (imageLoads.get(img) === attempt) imageLoads.delete(img);
      if (retry?.isConnected) retry.disabled = false;
    }
  }
  function render() {
    const root = document.getElementById('tab-campaign-home');
    if (!root) return;
    if (session) {
      if (session.id === activeCampaign?.id && session.uid === auth.currentUser?.uid && canManageCampaign() && document.getElementById('campaignHomeEditor')?.isConnected) return;
      clear(true);
    }
    releaseImages(root);
    root.replaceChildren();
    if (!activeCampaign || !auth.currentUser) return;
    root.innerHTML = `<div class="campaign-home-shell">
      <div class="campaign-home-toolbar"><p>A place for your party’s story.</p>${canManageCampaign() ? '<button type="button" class="btn-primary" data-edit-campaign-home>Edit front page</button>' : ''}</div>
      ${contents(normalize(activeCampaign.frontPage), activeCampaign)}
      <nav class="campaign-home-links" aria-label="Campaign shortcuts"><button type="button" class="btn-primary" data-home-tab="campaign-information">Campaign information</button><button type="button" class="vault-secondary-btn" data-home-tab="campaign-npcs">NPC catalogue</button><button type="button" class="vault-secondary-btn" data-home-tab="campaign-chapters">Chapter overview</button><button type="button" class="vault-secondary-btn" data-home-tab="library">Explore the item library</button>${canUseCharacters() ? '<button type="button" class="vault-secondary-btn" data-home-tab="player">My characters</button>' : ''}${canManageCampaign() ? '<button type="button" class="vault-secondary-btn" data-home-tab="dm">Prepare the campaign</button>' : ''}</nav>
      <p id="campaignHomeStatus" role="status" aria-live="polite"></p></div>`;
    root.querySelector('[data-edit-campaign-home]')?.addEventListener('click', edit);
    root.querySelectorAll('[data-home-tab]').forEach(button => button.addEventListener('click', () => showTab(button.dataset.homeTab)));
    bindImages(root);
  }
  function clear(force = false) {
    if (!force && session?.busy) return false;
    if (!force && session?.dirty && !confirm('Discard unsaved front-page changes?')) return false;
    clearTimeout(session?.previewTimer);
    const editor = document.getElementById('campaignHomeEditor');
    releaseImages(editor); editor?.remove();
    session = null;
    if (force) {releaseImages(document.getElementById('tab-campaign-home'));document.getElementById('tab-campaign-home')?.replaceChildren();}
    return true;
  }
  function beforeNavigate(tab) { return tab === 'campaign-home' || clear(); }
  function updateImagePreview(form) {
    if (!form.isConnected || !session || session.id !== activeCampaign?.id || session.uid !== auth.currentUser?.uid) return;
    const host = form.querySelector('[data-home-image-preview]'), data = readForm(form);
    releaseImages(host);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = contents(data, activeCampaign);
    const figure = wrapper.querySelector('figure');
    host.replaceChildren();
    if (figure) host.appendChild(figure);
    const empty = document.createElement('div');
    empty.dataset.homeImageEmpty = ''; empty.className = 'campaign-home-image-empty'; empty.hidden = !!figure;
    empty.innerHTML = '<p>A map of your world.<br>An image to begin the story.</p><p>Choose an image below.</p>';
    host.appendChild(empty); bindImages(host);
  }
  function setPreview(form, preview) {
    const surface = form.querySelector('[data-home-preview-surface]');
    releaseImages(surface); surface.replaceChildren();
    form.querySelector('[data-home-edit-fields]').hidden = preview;
    surface.hidden = !preview; form.dataset.preview = String(preview);
    form.querySelector('[data-home-preview]').textContent = preview ? 'Back to editing' : 'Preview';
    if (preview) {surface.innerHTML = contents(readForm(form), activeCampaign); bindImages(surface);}
  }
  function edit() {
    if (!activeCampaign || !canManageCampaign() || session) return;
    const root = document.getElementById('tab-campaign-home'), article = root?.querySelector('.campaign-book');
    if (!article) return;
    const data = normalize(activeCampaign.frontPage);
    session = {id:activeCampaign.id, uid:auth.currentUser.uid, revision:data.revision, imagePath:data.imagePath, layout:data.layout, dirty:false, busy:false, previewTimer:null};
    const field = (key,label,type='text',placeholder='') => `<label><span>${label}</span>${type === 'textarea' ? `<textarea name="${key}" rows="6" maxlength="${limits[key]}" placeholder="${placeholder}">${escapeHtml(data[key])}</textarea>` : `<input name="${key}" type="${type}" maxlength="${limits[key]}" placeholder="${placeholder}" value="${escapeHtml(data[key])}">`}</label>`;
    const form = document.createElement('form');
    form.id = 'campaignHomeEditor'; form.className = 'campaign-book campaign-home-editor';
    // Show editing fields before reporting validity when saving from preview mode.
    form.noValidate = true;
    form.setAttribute('aria-labelledby', 'campaignHomeEditorTitle');
    form.innerHTML = `<header class="campaign-home-edit-header"><h2 id="campaignHomeEditorTitle" class="sr-only">Edit campaign front page</h2><p>Editing your front page. Save when it is ready for the party.</p><div class="campaign-home-editor-actions"><button type="submit" class="btn-primary">Save front page</button><button type="button" class="vault-secondary-btn" data-home-preview>Preview</button><button type="button" class="vault-secondary-btn" data-home-layout-options aria-expanded="false" aria-controls="campaignHomeLayoutOptions">Layout options</button><button type="button" class="cancel-button" data-home-cancel>Cancel</button></div><p data-home-editor-status role="status" aria-live="polite"></p></header>
      <section id="campaignHomeLayoutOptions" class="campaign-home-layout-options" hidden>
        <fieldset><legend>Choose your campaign’s opening page</legend><p>Preview a layout here. Your text and image stay the same; Save front page shares the choice with your party.</p>
        <div class="campaign-home-layout-grid">${layouts.map(layout=>`<label class="campaign-home-layout-choice"><input type="radio" name="homeLayout" value="${layout.id}" ${data.layout===layout.id?'checked':''}><span class="campaign-home-layout-name">${layout.name}${layout.id==='classic'?' · Standard':''}</span><span class="campaign-home-layout-sample" data-layout-sample="${layout.id}" aria-hidden="true"><i class="layout-sample-title"></i><i class="layout-sample-copy"></i><i class="layout-sample-art"></i></span><span class="campaign-home-layout-subtitle">${layout.subtitle}</span><span class="campaign-home-layout-description">${layout.description}</span></label>`).join('')}</div>
        </fieldset>
      </section>
      <div class="campaign-book-opening campaign-book-opening--illustrated campaign-book-opening--editing" data-home-edit-fields>
        <div class="campaign-book-copy"><div class="campaign-book-title"><p class="campaign-book-eyebrow">Your campaign</p><h2>${escapeHtml(activeCampaign.name || 'An unwritten adventure')}</h2>${field('tagline','A line to set the scene','text','A tale of…')}<div class="campaign-book-rule" aria-hidden="true"></div></div><div class="campaign-book-chapters">${field('introduction','Campaign introduction','textarea','Welcome the party to your world.')}${field('expectations','Important campaign information & table rules','textarea','Tone, play style, session plans and table agreements.')}</div></div>
        <aside class="campaign-home-image-tools" aria-label="Campaign image controls"><div data-home-image-preview></div>
          ${field('imageAlt','Image description','text','Describe the map or artwork.')}
          <p id="campaignHomeImageHint" class="campaign-home-hint">Required when using an image. Briefly describe what the party can see in the map or artwork.</p>
          <p id="campaignHomeImageError" class="campaign-home-image-error" hidden></p>
          <label class="campaign-home-upload-control"><span>Upload image</span><input type="file" accept="image/png,image/jpeg,image/webp" data-home-upload></label>
          <p class="campaign-home-hint">PNG, JPEG or WebP, smaller than 5 MB. Uploaded images are visible only to campaign members.</p>
          <p data-home-image-source>${data.imagePath ? 'An uploaded image is selected.' : 'Use an image URL or upload a file.'}</p>
          ${field('imageUrl','Or use an HTTPS image URL','url','https://…')}${field('imageCredit','Artwork credit','text','Artist or source')}
          <button type="button" class="cancel-button" data-home-remove-image>Remove image</button>
        </aside></div><div data-home-preview-surface hidden></div>`;
    releaseImages(article); article.replaceWith(form);
    root.querySelector('[data-edit-campaign-home]').hidden = true;
    root.querySelector('.campaign-home-toolbar p').textContent = 'Shape the page your party will see.';
    form.elements.imageAlt.setAttribute('aria-describedby', 'campaignHomeImageHint campaignHomeImageError');
    form.addEventListener('invalid', event => {
      const control = event.target;
      form.querySelector('[data-home-editor-status]').textContent = control === form.elements.imageAlt
        ? 'Add an image description before saving the front page.'
        : `Could not save yet: ${control.validationMessage}`;
      control.setAttribute('aria-invalid', 'true');
      if (control === form.elements.imageAlt) {
        const error = form.querySelector('#campaignHomeImageError');
        error.textContent = 'Describe the image, then choose Save front page. Your selected image is still in the draft.';
        error.hidden = false;
      }
    }, true);
    form.addEventListener('input', event => {
      if (!session) return;
      session.dirty = true;
      if (event.target === form.elements.imageUrl) {
        session.imagePath = '';session.imageFile = null; form.querySelector('[data-home-image-source]').textContent = 'Using the image URL.';
        form.querySelector('[data-home-upload]').value = '';
        clearTimeout(session.previewTimer); session.previewTimer = setTimeout(() => updateImagePreview(form), 300);
      }
      if (event.target === form.elements.imageAlt) {
        const img = form.querySelector('[data-home-image-preview] img'); if (img) img.alt = form.elements.imageAlt.value;
      }
      if (event.target === form.elements.imageCredit) {
        const figure = form.querySelector('[data-home-image-preview] figure');
        if (figure) {let caption = figure.querySelector('figcaption');if (!caption) {caption = document.createElement('figcaption');figure.appendChild(caption);}caption.textContent = form.elements.imageCredit.value;}
      }
      form.elements.imageUrl.setCustomValidity(''); form.elements.imageAlt.setCustomValidity('');
      if (event.target.validity?.valid) event.target.removeAttribute('aria-invalid');
      if (form.elements.imageAlt.value.trim() || !(form.elements.imageUrl.value.trim() || session.imagePath)) {
        form.elements.imageAlt.removeAttribute('aria-invalid');form.querySelector('#campaignHomeImageError').hidden = true;
      }
      form.elements.imageAlt.required = !!(form.elements.imageUrl.value.trim() || session.imagePath);
    });
    const layoutPanel=form.querySelector('#campaignHomeLayoutOptions'), layoutButton=form.querySelector('[data-home-layout-options]');
    layoutButton.addEventListener('click',()=>{layoutPanel.hidden=!layoutPanel.hidden;layoutButton.setAttribute('aria-expanded',String(!layoutPanel.hidden));});
    layoutPanel.addEventListener('keydown',event=>{if(event.key==='Escape'&&!session?.busy){event.preventDefault();event.stopPropagation();layoutPanel.hidden=true;layoutButton.setAttribute('aria-expanded','false');layoutButton.focus();}});
    layoutPanel.addEventListener('change',event=>{
      if(event.target.name!=='homeLayout'||!session||session.busy)return;
      session.layout=layoutId(event.target.value);session.dirty=true;
      setPreview(form,true);
      form.querySelector('[data-home-editor-status]').textContent=layouts.find(layout=>layout.id===session.layout).name+' layout selected. Save front page to share it with your party.';
    });
    form.elements.imageAlt.required = !!(data.imageUrl || data.imagePath);
    form.querySelector('[data-home-upload]').addEventListener('change', event => upload(event.target.files[0], form));
    form.querySelector('[data-home-remove-image]').addEventListener('click', () => {
      session.imagePath = '';session.imageFile = null; session.dirty = true; form.elements.imageUrl.value = '';
      form.elements.imageAlt.required = false; form.elements.imageAlt.setCustomValidity('');form.elements.imageUrl.setCustomValidity('');
      form.elements.imageAlt.removeAttribute('aria-invalid');form.elements.imageUrl.removeAttribute('aria-invalid');form.querySelector('#campaignHomeImageError').hidden = true;
      form.querySelector('[data-home-upload]').value = '';
      form.querySelector('[data-home-image-source]').textContent = 'No image selected. Save to remove the cover.';
      updateImagePreview(form);
    });
    form.addEventListener('submit', save);
    form.querySelector('[data-home-cancel]').addEventListener('click', () => {if (clear()) {render();root.querySelector('[data-edit-campaign-home]')?.focus();}});
    form.querySelector('[data-home-preview]').addEventListener('click', () => setPreview(form, form.dataset.preview !== 'true'));
    updateImagePreview(form); form.elements.tagline.focus({preventScroll:true});
  }
  function readForm(form) {
    return normalize({...Object.fromEntries(Object.keys(limits).map(key => [key, form.elements[key].value])),imagePath:session?.imagePath || '',layout:session?.layout || 'classic'});
  }
  async function upload(file, form) {
    const current = session;
    if (!file || !current || current.busy || current.id !== activeCampaign?.id || current.uid !== auth.currentUser?.uid || !canManageCampaign()) return;
    const status = form.querySelector('[data-home-editor-status]');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size >= 5*1024*1024) {status.textContent='Choose a PNG, JPEG or WebP image smaller than 5 MB.';form.querySelector('[data-home-upload]').value = '';return;}
    current.busy = true;status.textContent = 'Uploading campaign image…';
    for (const control of form.elements) control.disabled = true;
    let uploaded = false;
    try {
      const path = `campaign-cover-images/${current.id}/${crypto.randomUUID()}`;
      await uploadBytes(ref(storage, path), file, {contentType:file.type});
      if (session !== current || current.id !== activeCampaign?.id || current.uid !== auth.currentUser?.uid || !canManageCampaign()) return;
      current.imagePath = path;current.imageFile = file;current.dirty = true;
      uploaded = true;
      form.elements.imageUrl.value = '';form.elements.imageUrl.setCustomValidity('');form.elements.imageAlt.required = true;
      form.elements.imageUrl.removeAttribute('aria-invalid');
      form.querySelector('[data-home-image-source]').textContent = `Uploaded: ${file.name}`;
      updateImagePreview(form);
      status.textContent = form.elements.imageAlt.value.trim()
        ? 'Image uploaded and selected. Choose Save front page to save your changes.'
        : 'Image uploaded and selected. Add an image description below the preview, then choose Save front page.';
    } catch (error) {
      if (session === current) status.textContent = error.code === 'storage/unauthorized' ? 'Upload denied. Ask the site administrator to enable campaign image uploads.' : `Could not upload: ${error.message}`;
    } finally {
      current.busy = false;
      if (session === current) {
        for (const control of form.elements) control.disabled = false;
        // Keep the successful selection visible. Failed attempts reset the
        // chooser so selecting the same file triggers a retry.
        if (!uploaded) form.querySelector('[data-home-upload]').value = '';
      }
    }
  }
  async function save(event) {
    event.preventDefault();
    const current = session, form = event.currentTarget;
    if (!current || current.busy || current.id !== activeCampaign?.id || current.uid !== auth.currentUser?.uid || !canManageCampaign()) return;
    if (form.dataset.preview === 'true') setPreview(form, false);
    const data = readForm(form);
    const status = form.querySelector('[data-home-editor-status]');
    if (form.elements.imageUrl.value.trim() && !data.imageUrl) {
      status.textContent = 'Use an HTTPS image URL, or upload a PNG, JPEG or WebP image.';
      form.elements.imageUrl.setCustomValidity('Use an HTTPS image URL without a username or password.');
      form.reportValidity(); return;
    }
    if ((data.imageUrl || data.imagePath) && !data.imageAlt) {
      status.textContent = 'Add an image description before saving the front page.';
      form.elements.imageAlt.setCustomValidity('Describe the cover image for readers who cannot see it.');
      form.reportValidity(); return;
    }
    if (!form.reportValidity()) return;
    current.busy = true; status.textContent = 'Saving your campaign front page…';
    // Lock the captured draft until the transaction finishes.
    for (const control of form.elements) control.disabled = true;
    try {
      data.revision = current.revision + 1;
      // Preserve the legacy payload when using the unchanged standard layout.
      if(data.layout==='classic')delete data.layout;
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
      if (session === current) {
        const denied = error.code === 'permission-denied' || /permission denied|missing or insufficient permissions/i.test(error.message || '');
        status.textContent = `Could not save: ${error.message}` + (denied
          ? ' Your draft is still in this editor. Ask the site administrator to check your campaign editing access' + (data.layout ? ' and support for the selected layout.' : '.')
          : '');
      }
    } finally {
      current.busy = false;
      if (session === current) for (const control of form.elements) control.disabled = false;
    }
  }
  return {render, edit, clear, beforeNavigate};
})();
