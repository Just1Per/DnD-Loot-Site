'use strict';
var CampaignWorkspace = (() => {
  const sdk = window.__DND_VAULT_DEPS__, store = createCampaignWorkspaceStore(sdk);
  const configs = {
    world:{title:'World Building', tab:'dm-world', noun:'world entry', categories:['World','Region','Location','Faction','Lore'], fields:[['category','Category','select'],['connections','Related places and people','textarea']], content:'Player description', secret:'DM secrets', help:'Build the setting one entry at a time. Describe what players experience, then keep hidden motives and future revelations in DM secrets.'}
  };
  let session = null, generation = 0, imageURL = null;
  const id = () => crypto.randomUUID().replaceAll('-','');
  const permitted = () => !!activeCampaign && canManageCampaign();
  const current = s => !!s && session === s && s.campaignId === activeCampaign?.id && s.uid === auth.currentUser?.uid && permitted();
  const escape = value => escapeHtml(String(value ?? ''));
  function status(message, error=false) {
    const host = session?.host.querySelector('[data-workspace-status]');
    if(host){host.textContent=message;host.classList.toggle('workspace-error',error);}
  }
  function clear(force=false) {
    if(!force && session?.dirty && !confirm('Discard unsaved campaign workspace changes?')) return false;
    ++generation; session=null;
    if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}
    document.querySelectorAll('.campaign-workspace').forEach(host=>host.remove());
    return true;
  }
  function beforeNavigate(tab) {
    if(session && configs[session.kind].tab !== tab) return clear();
    return true;
  }
  function fieldsHTML(config, data) {
    return config.fields.map(([key,label,type,options,max])=>`<label class="workspace-field">${escape(label)}${type==='select'?`<select data-record-field="${key}">${(options||config.categories).map(v=>`<option value="${escape(v)}" ${data[key]===v?'selected':''}>${escape(v)}</option>`).join('')}</select>`:type==='checkbox'?`<input type="checkbox" data-record-field="${key}" ${data[key]?'checked':''}>`:type==='number'?`<input type="number" min="0" max="${max||(key==='order'?9999:20)}" step="1" data-record-field="${key}" value="${Number(data[key])||0}">`:`<textarea maxlength="20000" data-record-field="${key}">${escape(data[key]||'')}</textarea>`}</label>`).join('');
  }
  function draft() {
    const s=session, form=s?.host.querySelector('[data-workspace-form]'); if(!form)return null;
    const data=structuredClone(s.record.data||{});
    form.querySelectorAll('[data-record-field]').forEach(input=>data[input.dataset.recordField]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value);
    return {title:form.elements.namedItem('title').value,summary:form.elements.namedItem('summary').value,content:form.elements.namedItem('content').value,privateNotes:form.elements.namedItem('privateNotes').value,data,archived:s.record.archived};
  }
  function renderList() {
    const s=session;if(!current(s))return;
    const category=s.host.querySelector('[data-workspace-category]')?.value||'', q=s.host.querySelector('[data-workspace-search]').value.toLowerCase(), archived=s.host.querySelector('[data-workspace-archived]').checked;
    const rows=s.rows.filter(row=>!!row.archived===archived&&(!category||row.data?.category===category)&&(!q||[row.title,row.summary,row.data?.category].join(' ').toLowerCase().includes(q))).sort((a,b)=>(Number(a.data?.order)||0)-(Number(b.data?.order)||0)||a.title.localeCompare(b.title));
    const list=s.host.querySelector('[data-workspace-list]');
    list.innerHTML=rows.map(row=>`<button type="button" data-open-record="${escape(row.id)}">${escape(row.title)}<small>${escape(row.data?.category||row.data?.status||'Draft')}${row.summary?' · '+escape(row.summary.slice(0,90)):''}</small></button>`).join('')||'<p>No entries yet.</p>';
    list.querySelectorAll('[data-open-record]').forEach(button=>button.onclick=()=>openRecord(button.dataset.openRecord));
  }
  async function openRecord(recordId) {
    const s=session;if(!current(s)||s.busy)return;
    if(s.dirty&&!confirm('Discard unsaved changes before opening another entry?'))return;
    const token=++generation;status('Loading…');
    try{const record=await store.load(s.campaignId,s.kind,recordId);if(!current(s)||token!==generation)return;s.record=record;s.dirty=false;renderEditor();}
    catch(error){if(current(s)&&token===generation)status(error.message,true);}
  }
  function newRecord() {
    const s=session;if(!current(s)||s.busy)return;
    if(s.dirty&&!confirm('Discard unsaved changes before creating another entry?'))return;
    ++generation;s.record={id:id(),revision:0,title:'',summary:'',content:'',privateNotes:'',data:configs[s.kind].normalize?configs[s.kind].normalize({}):{},archived:false};s.dirty=false;renderEditor();
  }
  async function save() {
    const s=session;if(!current(s)||s.busy)return;
    const input=draft(), form=s.host.querySelector('form');
    if(!form.reportValidity())return;
    try{if(configs[s.kind].normalize)input.data=configs[s.kind].normalize(input.data);}catch(error){status(error.message,true);return;}
    const snapshot=JSON.stringify(draft());s.busy=true;form.querySelector('[data-save-record]').disabled=true;status('Saving…');
    try{
      const saved=await store.save({campaignId:s.campaignId,kind:s.kind,id:s.record.id,revision:s.record.revision,input});
      if(!current(s))return;
      s.record=saved;s.dirty=snapshot!==JSON.stringify(draft());
      const index=s.rows.findIndex(row=>row.id===saved.id);if(index<0)s.rows.push(saved);else s.rows[index]=saved;
      renderList();status(s.dirty?'Saved. Newer edits are still unsaved.':'All changes saved.');
    }catch(error){if(current(s))status(`Could not save: ${error.message}`,true);}
    finally{s.busy=false;if(current(s))form.querySelector('[data-save-record]').disabled=false;}
  }
  async function archive() {
    const s=session;if(!current(s)||s.busy)return;
    if(!s.record.revision){status('Save this entry before archiving.',true);return;}
    if(!confirm(s.record.archived?'Restore this entry?':'Archive this entry? Related records will be retained.'))return;
    const previous=s.record.archived;s.record.archived=!previous;await save();
    if(current(s)&&s.record.archived!==previous&& !s.dirty)renderEditor();
  }
  async function mapImage() {
    const s=session, path=s?.record.data?.imagePath;if(!current(s))return;
    if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}
    const host=s.host.querySelector('[data-map]');if(!host)return;
    if(!path){host.innerHTML='';return;}
    try{
      const blob=await sdk.getBlob(sdk.ref(sdk.storage,path),6*1024*1024);if(!current(s)||s.record.data.imagePath!==path)return;
      imageURL=URL.createObjectURL(blob);
      host.innerHTML=`<img src="${escape(imageURL)}" alt="${escape(s.record.title||'Campaign map')}">${(s.record.data.markers||[]).map((pin,i)=>`<span class="workspace-pin" style="left:${Number(pin.x)*100}%;top:${Number(pin.y)*100}%" title="${escape(pin.label)}">${i+1}</span>`).join('')}`;
    }catch(error){if(current(s))status(`Could not load map: ${error.message}`,true);}
  }
  async function upload(file) {
    const s=session;if(!current(s)||!file||s.busy)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){status('Choose a PNG, JPEG or WebP image smaller than 5 MB.',true);return;}
    s.busy=true;status('Uploading image…');const recordId=s.record.id;
    try{
      const path=`campaign-world-images/${s.campaignId}/${recordId}/${id()}`;
      await sdk.uploadBytes(sdk.ref(sdk.storage,path),file,{contentType:file.type});
      if(!current(s)||s.record.id!==recordId)return;
      s.record.data.imagePath=path;s.record.data.markers=[];s.dirty=true;await mapImage();status('Image uploaded. Save this entry to keep its reference.');
    }catch(error){if(current(s))status(`Upload failed: ${error.message}. Check the campaign map Storage rules.`,true);}
    finally{s.busy=false;}
  }
  function renderEditor() {
    const s=session;if(!current(s))return;const config=configs[s.kind],r=s.record,page=s.host.querySelector('[data-workspace-page]');
    page.innerHTML=`<form data-workspace-form><div class="workspace-actions"><button type="submit" data-save-record>Save ${escape(config.noun)}</button><button type="button" data-archive-record>${r.archived?'Restore':'Archive'}</button><button type="button" data-preview-record>Player description</button><button type="button" data-print-record>Print</button></div><p data-workspace-status class="workspace-status" role="status"></p><div class="workspace-fields"><label class="workspace-field workspace-full">Title<input name="title" required maxlength="160" value="${escape(r.title)}"></label><label class="workspace-field workspace-full">Short summary<textarea name="summary" maxlength="1000">${escape(r.summary)}</textarea></label>${fieldsHTML(config,r.data)}<label class="workspace-field workspace-full">${escape(config.content)}<textarea name="content" maxlength="20000">${escape(r.content)}</textarea></label><label class="workspace-field workspace-full">${escape(config.secret)}<textarea name="privateNotes" maxlength="20000">${escape(r.privateNotes)}</textarea></label></div>${s.kind==='world'?'<label class="workspace-field">Image or map (PNG, JPEG, WebP · max 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" data-map-upload></label><p>Click the map to add a named location marker. Use the marker list to remove a marker.</p><div data-map class="workspace-map"></div><div data-marker-list></div>':''}<div data-extra-editor></div></form><section class="workspace-preview" hidden data-player-preview><h3>Player description preview</h3><div class="workspace-prose"></div></section>`;
    const form=page.querySelector('form');form.onsubmit=event=>{event.preventDefault();save();};form.oninput=()=>{s.dirty=true;configs[s.kind].onEdit?.(page.querySelector('[data-extra-editor]'),s);};form.onchange=()=>{s.dirty=true;configs[s.kind].onEdit?.(page.querySelector('[data-extra-editor]'),s);};
    page.querySelector('[data-archive-record]').onclick=archive;
    page.querySelector('[data-preview-record]').onclick=()=>{const preview=page.querySelector('[data-player-preview]');preview.hidden=!preview.hidden;preview.querySelector('div').textContent=draft().content;};
    page.querySelector('[data-print-record]').onclick=()=>printRecord();
    page.querySelector('[data-map-upload]')?.addEventListener('change',event=>upload(event.target.files[0]));
    page.querySelector('[data-map]')?.addEventListener('click',event=>{
      if(!event.target.matches('img')||s.busy)return;
      const label=prompt('Location name for this marker:');if(!label?.trim())return;
      const box=event.target.getBoundingClientRect();s.record.data.markers||=[];
      if(s.record.data.markers.length>=50){status('A map can have up to 50 markers.',true);return;}
      s.record.data.markers.push({x:Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(event.clientY-box.top)/box.height)),label:label.trim().slice(0,160)});s.dirty=true;mapImage();renderMarkers();
    });
    renderMarkers();mapImage();configs[s.kind].extra?.(page.querySelector('[data-extra-editor]'),s);
    if(typeof SiteHelp!=='undefined')SiteHelp.refresh();
  }
  function renderMarkers(){const s=session,host=s?.host.querySelector('[data-marker-list]');if(!host)return;host.innerHTML=(s.record.data.markers||[]).map((pin,i)=>`<p>${i+1}. ${escape(pin.label)} <button type="button" data-remove-marker="${i}" aria-label="Remove ${escape(pin.label)}">Remove</button></p>`).join('');host.querySelectorAll('[data-remove-marker]').forEach(button=>button.onclick=()=>{s.record.data.markers.splice(Number(button.dataset.removeMarker),1);s.dirty=true;renderMarkers();mapImage();});}
  function printRecord(includeSecrets=false) {
    const s=session;if(!current(s))return;const input=draft();let surface=document.getElementById('workspacePrintSurface');
    if(!surface){surface=document.createElement('article');surface.id='workspacePrintSurface';document.body.append(surface);}
    surface.innerHTML=`<h1>${escape(input.title)}</h1><p>${escape(input.summary)}</p><div class="workspace-prose">${escape(input.content)}</div>${includeSecrets?`<section><h2>DM notes</h2><div class="workspace-prose">${escape(input.privateNotes)}</div></section>`:''}`;
    document.body.classList.add('printing-workspace');window.print();
  }
  async function render(kind) {
    if(!configs[kind]||!permitted())return;
    if(current(session)&&session.kind===kind)return;
    clear(true);const config=configs[kind],panel=document.getElementById('tab-'+config.tab);if(!panel)return;
    panel.innerHTML=`<section class="campaign-workspace"><header class="workspace-heading"><h2>${escape(config.title)}</h2><button type="button" data-new-record>+ New ${escape(config.noun)}</button></header><p>${escape(config.help)}</p><div class="workspace-actions"><button type="button" data-workspace-kind="world">World entries</button><button type="button" data-workspace-kind="creature">Creatures &amp; NPCs</button></div><div class="workspace-layout"><aside class="workspace-sidebar"><label>Search<input type="search" data-workspace-search></label><label>Category<select data-workspace-category><option value="">All categories</option>${(config.categories||[]).map(value=>`<option>${escape(value)}</option>`).join('')}</select></label><label><input type="checkbox" data-workspace-archived> Show archived</label><div class="workspace-list" data-workspace-list></div></aside><article class="workspace-page" data-workspace-page><p data-workspace-status role="status">Loading campaign entries…</p></article></div></section>`;
    const s={campaignId:activeCampaign.id,uid:auth.currentUser.uid,kind,host:panel.firstElementChild,rows:[],record:null,dirty:false,busy:false};session=s;const token=++generation;
    s.host.querySelectorAll('[data-workspace-kind]').forEach(button=>button.onclick=()=>switchKind(button.dataset.workspaceKind));
    s.host.querySelector('[data-new-record]').onclick=newRecord;s.host.querySelector('[data-workspace-search]').oninput=renderList;s.host.querySelector('[data-workspace-archived]').onchange=renderList;s.host.querySelector('[data-workspace-category]').onchange=renderList;
    try{s.rows=await store.list(s.campaignId,kind);if(!current(s)||token!==generation)return;renderList();s.host.querySelector('[data-workspace-page]').innerHTML='<p>Select an entry, or create a new one.</p>';}
    catch(error){if(current(s))status(`Could not load: ${error.message}. Publish the updated Firestore rules if permission is denied.`,true);}
  }
  function switchKind(kind){if(session?.busy)return;if(!clear())return;render(kind);}
  window.addEventListener('beforeunload',event=>{if(session?.dirty){event.preventDefault();event.returnValue='';}});
  window.addEventListener('afterprint',()=>{document.body.classList.remove('printing-workspace');document.getElementById('workspacePrintSurface')?.replaceChildren();});
  return {render,switchKind,clear,beforeNavigate,configs,store,get session(){return session;},draft,save,newRecord,openRecord,renderEditor,renderList,status,id};
})();
