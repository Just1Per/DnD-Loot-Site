'use strict';
var CampaignWorkspace = (() => {
  const sdk = window.__DND_VAULT_DEPS__, store = createCampaignWorkspaceStore(sdk);
  const configs = {
    world:{title:'World Building', tab:'dm-world', noun:'world entry', categories:['World','Region','Location','Faction','Lore'], fields:[['category','Category','select'],['connections','Related places and people','textarea']], content:'Player description', secret:'DM secrets', help:'Build the setting one entry at a time. Describe what players experience, then keep hidden motives and future revelations in DM secrets.'}
  };
  let session = null, generation = 0, imageURL = null;
  const id = () => crypto.randomUUID().replaceAll('-','');
  const permitted = kind => !!activeCampaign && (configs[kind]?.canUse ? configs[kind].canUse() : canManageCampaign());
  const current = s => !!s && session === s && s.campaignId === activeCampaign?.id && s.uid === auth.currentUser?.uid && permitted(s.kind);
  const escape = value => escapeHtml(String(value ?? ''));
  function status(message, error=false) {
    const host = session?.host.querySelector('[data-workspace-status]');
    if(host){host.textContent=message;host.classList.toggle('workspace-error',error);}
  }
  function clear(force=false) {
    if(!force && session?.dirty && !confirm('Discard unsaved campaign workspace changes?')) return false;
    if(typeof SiteConfirmation!=='undefined')SiteConfirmation.cancel();
    session?.publishedPreviewDispose?.();
    session?.journalImageController?.dispose();
    if(session)configs[session.kind].onClear?.(session);
    ++generation; session=null;
    if(imageURL){URL.revokeObjectURL(imageURL);imageURL=null;}
    document.querySelectorAll('.campaign-workspace').forEach(host=>host.remove());
    for(const dialogId of ['workspaceMonsterCatalog','workspacePersonalCreatureEditor','workspacePersonalCreatures'])document.getElementById(dialogId)?.remove();
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
    const rows=s.rows.filter(row=>!!row.archived===archived&&(!category||row.data?.category===category)&&(!q||[row.title,row.summary,row.data?.category,configs[s.kind].searchText?.(row)||''].join(' ').toLowerCase().includes(q))).sort((a,b)=>(Number(a.data?.order)||0)-(Number(b.data?.order)||0)||a.title.localeCompare(b.title));
    const list=s.host.querySelector('[data-workspace-list]');
    list.innerHTML=rows.map(row=>`<button type="button" data-open-record="${escape(row.id)}">${escape(row.title)}<small>${escape(row.data?.category||row.data?.status||'Draft')}${row.summary?' · '+escape(row.summary.slice(0,90)):''}</small></button>`).join('')||'<p>No entries yet.</p>';
    list.querySelectorAll('[data-open-record]').forEach(button=>button.onclick=()=>openRecord(button.dataset.openRecord));
    configs[s.kind].onListed?.(s);
    notebookCategoryButtons(s);
  }
  async function openRecord(recordId) {
    const s=session;if(!current(s)||s.busy)return;
    if(s.dirty&&!confirm('Discard unsaved changes before opening another entry?'))return;
    const token=++generation;status('Loading…');
    try{const record=await (configs[s.kind].loadRecord?configs[s.kind].loadRecord(s.campaignId,recordId):store.load(s.campaignId,s.kind,recordId));if(!current(s)||token!==generation)return;s.record=record;s.dirty=false;renderEditor();AppNavigation.remember();}
    catch(error){if(current(s)&&token===generation)status(error.message,true);}
  }
  function newRecord() {
    const s=session;if(!current(s)||s.busy)return;
    if(configs[s.kind].initialData&&!s.rowsLoaded){status('Wait for campaign entries to load before creating a new one.');return;}
    if(s.dirty&&!confirm('Discard unsaved changes before creating another entry?'))return;
    const data=configs[s.kind].initialData?.(s)||{};if(s.kind==='chapter')data.category=s.host.querySelector('[data-workspace-category]').value||'';
    ++generation;s.record={id:id(),revision:0,createdBy:s.uid,title:'',summary:'',content:'',privateNotes:'',data:configs[s.kind].normalize?configs[s.kind].normalize(data):data,archived:false};s.dirty=false;renderEditor();AppNavigation.remember();
  }
  async function save() {
    const s=session;if(!current(s)||s.busy)return;
    const input=draft(), form=s.host.querySelector('form');
    if(!form.reportValidity())return;
    try{if(configs[s.kind].normalize)input.data=configs[s.kind].normalize(input.data);}catch(error){status(error.message,true);return;}
    const snapshot=JSON.stringify(draft());s.busy=true;form.querySelector('[data-save-record]').disabled=true;status('Saving…');
    try{
      const saved=await (configs[s.kind].saveRecord||store.save)({campaignId:s.campaignId,kind:s.kind,id:s.record.id,revision:s.record.revision,input});
      if(!current(s))return;
      const latest=draft();s.dirty=snapshot!==JSON.stringify(latest);s.record={...saved,data:latest.data,archived:latest.archived};
      const index=s.rows.findIndex(row=>row.id===saved.id);if(index<0)s.rows.push(saved);else s.rows[index]=saved;
      AppNavigation.remember();renderList();if(!s.dirty)configs[s.kind].onSaved?.(s.host.querySelector('[data-extra-editor]'),s);status(s.dirty?'Saved. Newer edits are still unsaved.':configs[s.kind].savedMessage?.(s)||'All changes saved.');return true;
    }catch(error){if(current(s))status(`Could not save: ${error.message}`,true);return false;}
    finally{s.busy=false;if(current(s)){form.querySelector('[data-save-record]').disabled=false;configs[s.kind].onSaveSettled?.(s.host.querySelector('[data-extra-editor]'),s);}}
  }
  async function archive() {
    const s=session;if(!current(s)||s.busy)return;
    if(!s.record.revision){status('Save this entry before archiving.',true);return;}
    const record=s.record,restore=record.archived,shared=['world','creature','chapter'].includes(s.kind);
    const valid=()=>current(s)&&s.record===record&&!s.busy;
    const accepted=await SiteConfirmation.ask({title:(restore?'Restore':'Archive')+' “'+record.title+'”?',confirmLabel:restore?'Restore entry':'Archive entry',isCurrent:valid,paragraphs:[
      restore?'This entry will return to the active list.':'This entry will move to the archived list. Find it again using Show archived.',
      'The entry is kept, including its notes, illustrations, maps and connections. Archiving does not delete it.',
      shared?(restore?'Restoring does not share it with players. Review it and explicitly share it again when ready.':'If shared, it will be removed from the player journal. Related entries'+(s.kind==='chapter'?' and players’ personal chapter notes':'')+' are kept.'):'Related campaign records are kept.',
      s.dirty?'Your current unsaved changes will also be saved when you confirm.':''
    ]});
    if(!accepted||!valid())return;
    const previous=s.record.archived;s.record.archived=!previous;const saved=await save();if(!saved&&current(s))s.record.archived=previous;
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
    }catch(error){if(current(s)){const denied=error?.code==='storage/unauthorized';status(denied?'Map upload blocked by Firebase Storage permissions. The campaign-world-images rule must be merged and published in Firebase Console → Storage → Rules (hosting and Firestore deploys do not publish Storage rules).':'Map upload failed: '+error.message,true);}}
    finally{s.busy=false;}
  }
  async function publishedPreview(s){
    if(!current(s)||!s.record)return;
    s.publishedPreviewDispose?.();
    const recordId=s.record.id,dialog=document.createElement('dialog');dialog.className='workspace-sheet-dialog notebook-published-preview';
    dialog.innerHTML='<h2>Published player page</h2><p role="status" data-published-preview-content>Loading the shared version…</p><button type="button" data-close-published-preview>Close</button>';
    document.body.append(dialog);dialog.showModal();let url=null;
    const dispose=()=>{if(url){URL.revokeObjectURL(url);url=null;}dialog.remove();};s.publishedPreviewDispose=dispose;
    dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',dispose,{once:true});
    const active=()=>current(s)&&s.record.id===recordId&&dialog.isConnected;
    try{
      const row=await createCampaignInformationStore(sdk,s.kind).load(s.campaignId,recordId);if(!active())return;
      const host=dialog.querySelector('[data-published-preview-content]');host.replaceChildren();
      if(!row){host.textContent='This page is not shared with players.';return;}
      const title=document.createElement('h3'),text=document.createElement('div');title.textContent=row.title;text.className='workspace-prose';text.textContent=row.content;host.append(title,text);
      if(row.image){
        const prefix=`campaign-journal-images/${s.campaignId}/${s.kind}/${recordId}/`;
        if(!row.image.path?.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(row.image.path.slice(prefix.length)))throw Error('Invalid shared illustration.');
        const blob=await sdk.getBlob(sdk.ref(sdk.storage,row.image.path),6*1024*1024);if(!active())return;
        url=URL.createObjectURL(blob);const image=document.createElement('img');image.src=url;image.alt=row.image.alt||'Shared illustration';image.style.maxWidth='100%';host.append(image);
        if(row.image.caption){const caption=document.createElement('p');caption.textContent=row.image.caption;host.append(caption);}
      }
    }catch(error){if(active())dialog.querySelector('[data-published-preview-content]').textContent='Could not load the published page: '+error.message;}
  }
  function notebookKey(s){return 'campaign-notebook-v1:'+s.uid+':'+s.campaignId+':'+s.kind;}
  function notebookMode(s){
    s.host.classList.toggle('campaign-notebook',!!s.notebook);
    for(const [label,hidden] of s.notebookSidebar||[])label.hidden=s.notebook||hidden;
    if(!s.notebook||!s.record)return;
    const form=s.host.querySelector('[data-workspace-form]');if(!form)return;
    const sheet=document.createElement('section');sheet.className='notebook-sheet';sheet.dataset.notebookSheet='';
    const title=form.querySelector('[name=title]').closest('label'),description=form.querySelector('[name=content]').closest('label'),notes=form.querySelector('[name=privateNotes]').closest('label');
    const noteBox=document.createElement('aside');noteBox.className='notebook-private-notes';
    const heading=document.createElement('h3');heading.textContent='Private DM notes';noteBox.append(heading,notes);
    notes.querySelector('textarea').rows=3;
    if(s.kind==='chapter'){
      const category=document.createElement('label');category.className='workspace-field';category.textContent='Category';
      const select=document.createElement('select');select.dataset.recordField='category';
      for(const name of notebookCategories(s)){const option=document.createElement('option');option.value=name;option.textContent=name||'Chapters';select.append(option);}
      select.value=s.record.data.category||'';category.append(select);sheet.append(category);
    }
    const previewButton=document.createElement('button');previewButton.type='button';previewButton.dataset.notebookPublishedPreview='';previewButton.textContent='View published player page';
    previewButton.onclick=()=>publishedPreview(s);
    sheet.append(title,description,noteBox,previewButton);
    form.querySelector('[data-preview-record]').textContent='Preview draft description';
    s.host.querySelector('[data-player-preview] h3').textContent='Draft player description · DM preview';
    const illustration=form.querySelector('[data-journal-image-editor]');if(illustration)sheet.append(illustration);
    const sharing=form.querySelector('[data-extra-editor]');if(sharing)sheet.append(sharing);
    const advanced=document.createElement('details');advanced.className='notebook-preparation';advanced.dataset.notebookPreparation='';
    const summary=document.createElement('summary');summary.textContent='More preparation, connections and print options';advanced.append(summary);
    const status=form.querySelector('[data-workspace-status]');
    for(const child of [...form.children])if(child!==status&&!child.matches('.workspace-actions'))advanced.append(child);
    form.append(sheet,advanced);
    form.addEventListener('invalid',event=>{for(let node=event.target.parentElement;node&&node!==form;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;},true);
  }
  function notebookCategories(s){
    return ['',...new Set([...(s.notebookCategories||[]).map(row=>row.name),...s.rows.map(row=>row.data?.category),s.record?.data?.category].filter(value=>typeof value==='string'&&value))].sort((a,b)=>a.localeCompare(b));
  }
  function notebookCategoryButtons(s){
    const host=s.host.querySelector('[data-notebook-categories]');if(!host)return;
    const select=s.host.querySelector('[data-workspace-category]'),selected=select.value;
    const names=notebookCategories(s);
    if(s.kind==='chapter')select.innerHTML=names.map(name=>'<option value="'+escape(name)+'">'+escape(name||'All categories')+'</option>').join('');
    if(names.includes(selected))select.value=selected;
    host.innerHTML=s.kind==='chapter'?names.map(name=>'<button type="button" data-notebook-category="'+escape(name)+'" aria-pressed="'+(name===select.value)+'">'+escape(name||'All chapters')+' <span>'+s.rows.filter(row=>!row.archived&&(!name||row.data?.category===name)).length+'</span></button>').join(''):'';
    host.querySelectorAll('[data-notebook-category]').forEach(button=>button.onclick=()=>{select.value=button.dataset.notebookCategory;notebookCategoryButtons(s);renderList();});
  }
  function notebookToolbar(s){
    if(!['world','chapter'].includes(s.kind))return;
    try{s.notebook=localStorage.getItem(notebookKey(s))==='true';}catch{s.notebook=false;}
    s.notebookSidebar=[...s.host.querySelectorAll('.workspace-sidebar label')].filter(label=>label.querySelector('[data-workspace-search],[data-workspace-category]')).map(label=>[label,label.hidden]);
    const host=document.createElement('section');host.className='notebook-controls';
    host.innerHTML='<label class="notebook-choice"><input type="checkbox" data-notebook-mode> Notebook layout</label><nav data-notebook-categories aria-label="Notebook categories"></nav><details data-add-notebook-category><summary>Add category</summary><div class="workspace-actions"><label class="workspace-field">Category name<input data-notebook-category-name maxlength="80"></label><button type="button" data-save-notebook-category>Add category</button></div><p data-notebook-category-status role="status"></p></details>';
    s.host.querySelector('[data-workspace-tools]').append(host);
    const toggle=host.querySelector('[data-notebook-mode]');toggle.checked=s.notebook;
    toggle.onchange=()=>{
      if(!current(s)||s.busy){toggle.checked=s.notebook;return;}
      if(s.record)s.record={...s.record,...draft()};s.notebook=toggle.checked;
      try{localStorage.setItem(notebookKey(s),String(s.notebook));}catch{}
      if(s.notebook){s.host.querySelector('[data-workspace-search]').value='';const visibility=s.host.querySelector('[data-world-visibility]');if(visibility)visibility.value='';}
      if(s.record)renderEditor();else notebookMode(s);renderList();
    };
    const add=host.querySelector('[data-save-notebook-category]'),feedback=host.querySelector('[data-notebook-category-status]');
    add.onclick=async()=>{
      if(!current(s)||s.busy||s.categoryBusy)return;
      const name=host.querySelector('[data-notebook-category-name]').value.trim();
      if(!name||name.length>80){feedback.textContent='Enter a name of 1–80 characters.';return;}
      if([...notebookCategories(s),...(configs[s.kind].categories||[])].some(value=>value.toLowerCase()===name.toLowerCase())){feedback.textContent='That category already exists.';return;}
      const request=s.categoryRequest?.name===name?s.categoryRequest:{id:id(),name};s.categoryRequest=request;s.categoryBusy=true;add.disabled=true;
      try{
        const category=await store.addCategory({campaignId:s.campaignId,kind:s.kind,...request,isCurrent:()=>current(s)});
        if(!current(s))return;
        s.notebookCategories.push(category);s.categoryRequest=null;notebookCategoryButtons(s);renderList();s.host.querySelector('[data-workspace-category]').value=name;renderList();
        feedback.textContent='Category saved. It is available before you create its first entry.';host.querySelector('[data-notebook-category-name]').value='';
      }catch(error){if(current(s))feedback.textContent='Could not save category: '+error.message;}
      finally{s.categoryBusy=false;if(current(s))add.disabled=false;}
    };
    notebookMode(s);
  }
  function renderEditor() {
    const s=session;if(!current(s))return;
    s.publishedPreviewDispose?.();
    s.journalImageController?.dispose();s.journalImageController=null;const config=configs[s.kind],r=s.record,page=s.host.querySelector('[data-workspace-page]');
    page.innerHTML=`<form data-workspace-form><div class="workspace-actions"><button type="submit" data-save-record>Save ${escape(config.noun)}</button><button type="button" data-archive-record>${r.archived?'Restore':'Archive'}</button><button type="button" data-preview-record>Player description</button><button type="button" data-print-record>Print</button></div><p data-workspace-status class="workspace-status" role="status"></p>${config.editorBody?config.editorBody(r):`<div class="workspace-fields"><label class="workspace-field workspace-full">Title<input name="title" required maxlength="160" value="${escape(r.title)}"></label><label class="workspace-field workspace-full">Short summary<textarea name="summary" maxlength="1000">${escape(r.summary)}</textarea></label>${fieldsHTML(config,r.data)}<label class="workspace-field workspace-full">${escape(config.content)}<textarea name="content" maxlength="20000">${escape(r.content)}</textarea></label><label class="workspace-field workspace-full">${escape(config.secret)}<textarea name="privateNotes" maxlength="20000">${escape(r.privateNotes)}</textarea></label></div>${s.kind==='world'?'<label class="workspace-field">Image or map (PNG, JPEG, WebP · max 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" data-map-upload></label><p>Click the map to add a named location marker. Use the marker list to remove a marker.</p><div data-map class="workspace-map"></div><div data-marker-list></div>':''}<label class="workspace-field" data-private-print><span><input type="checkbox" data-print-private> Include private preparation and statistics in print</span></label><section data-workspace-links></section><div data-extra-editor></div>`}</form><section class="workspace-preview" hidden data-player-preview><h3>Player description preview</h3><div class="workspace-prose"></div></section>`;
    const form=page.querySelector('form');
    if(canManageCampaign()&&s.kind!=='oneShot'&&typeof CampaignJournalImages!=='undefined'){
      s.journalImageController=CampaignJournalImages.mount(form,s,{
        isCurrent:()=>current(s),
        changed:()=>{s.dirty=true;configs[s.kind].onEdit?.(page.querySelector('[data-extra-editor]'),s);},
        status
      });
    }
    form.onsubmit=event=>{event.preventDefault();save();};form.oninput=event=>{if(!event.target.matches('[name],[data-record-field]'))return;s.dirty=true;configs[s.kind].onEdit?.(page.querySelector('[data-extra-editor]'),s);};form.onchange=event=>{if(!event.target.matches('[name],[data-record-field]'))return;s.dirty=true;configs[s.kind].onEdit?.(page.querySelector('[data-extra-editor]'),s);};
    page.querySelector('[data-archive-record]').onclick=archive;
    page.querySelector('[data-preview-record]').onclick=()=>{const preview=page.querySelector('[data-player-preview]'),input=draft();preview.hidden=!preview.hidden;preview.querySelector('div').textContent=config.playerContent?config.playerContent(input):input.content;};
    page.querySelector('[data-print-record]').onclick=()=>printRecord(page.querySelector('[data-print-private]').checked);
    page.querySelector('[data-map-upload]')?.addEventListener('change',event=>upload(event.target.files[0]));
    page.querySelector('[data-map]')?.addEventListener('click',event=>{
      if(!event.target.matches('img')||s.busy)return;
      const label=prompt('Location name for this marker:');if(!label?.trim())return;
      const box=event.target.getBoundingClientRect();s.record.data.markers||=[];
      if(s.record.data.markers.length>=50){status('A map can have up to 50 markers.',true);return;}
      s.record.data.markers.push({x:Math.max(0,Math.min(1,(event.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(event.clientY-box.top)/box.height)),label:label.trim().slice(0,160)});s.dirty=true;mapImage();renderMarkers();
    });
    if(!canManageCampaign()||config.hideLinks)page.querySelector('[data-workspace-links]').remove();
    if(!canManageCampaign())s.host.querySelectorAll('[data-workspace-kind]').forEach(button=>button.hidden=true);
    renderLinks();renderMarkers();mapImage();configs[s.kind].extra?.(page.querySelector('[data-extra-editor]'),s);
    const editable=config.canEdit?config.canEdit(r):true;
    for(const key of config.lockFields?.(r)||[])form.querySelector(`[data-record-field="${key}"]`).disabled=true;
    if(!editable){form.querySelectorAll('[name],[data-record-field],[data-save-record],[data-archive-record]').forEach(control=>control.disabled=true);}
    if(config.showPrivate&&!config.showPrivate(r)){form.querySelector('[name=privateNotes]').closest('label').hidden=true;form.querySelector('[data-private-print]').hidden=true;}
    notebookMode(s);
    if(typeof SiteHelp!=='undefined')SiteHelp.refresh();
  }
  async function renderLinks() {
    const s=session,recordId=s?.record?.id,host=s?.host.querySelector('[data-workspace-links]');if(!current(s)||!host)return;
    const kinds=['world','creature','chapter','encounter'].filter(kind=>configs[kind]);
    try{
      const lists=await Promise.all(kinds.map(async kind=>(await store.list(s.campaignId,kind)).map(row=>({...row,kind}))));
      if(!current(s)||s.record.id!==recordId||!host.isConnected)return;
      const rows=lists.flat(),links=s.record.data.links||[],incoming=rows.filter(row=>(row.data?.links||[]).some(link=>link.id===recordId&&link.kind===s.kind));
      host.innerHTML=`<h3>Connected campaign entries</h3><div class="workspace-actions"><select data-link-picker aria-label="Entry to link"><option value="">Choose a location, creature, chapter or encounter…</option>${rows.filter(row=>!row.archived&&row.id!==recordId&&!links.some(link=>link.id===row.id&&link.kind===row.kind)).map(row=>`<option value="${row.kind}:${escape(row.id)}">${escape(configs[row.kind].title)} · ${escape(row.title)}</option>`).join('')}</select><button type="button" data-add-link>Add link</button></div>${links.map((link,index)=>{const row=rows.find(row=>row.id===link.id&&row.kind===link.kind);return `<p>${escape(configs[link.kind]?.title||link.kind)} · ${escape(row?.title||'Unavailable entry')}${row?.archived?' (archived)':''} ${row?`<button type="button" data-open-link="${index}">Open</button>`:''} <button type="button" data-remove-link="${index}">Remove link</button></p>`;}).join('')}`;
      if(incoming.length)host.insertAdjacentHTML('beforeend',`<h4>Referenced by</h4><p>${incoming.map(row=>escape(configs[row.kind].title)+' · '+escape(row.title)+(row.archived?' (archived)':'')).join('<br>')}</p>`);
      host.querySelector('[data-add-link]').onclick=()=>{const value=host.querySelector('select').value;if(!value)return;const [kind,id]=value.split(':');s.record.data.links||=[];if(s.record.data.links.length>=40){status('An entry can have up to 40 links.',true);return;}s.record.data.links.push({kind,id});s.dirty=true;renderLinks();configs[s.kind].onEdit?.(s.host.querySelector('[data-extra-editor]'),s);};
      host.querySelectorAll('[data-open-link]').forEach(button=>button.onclick=async()=>{
        const link=links[Number(button.dataset.openLink)];
        if(!link||!configs[link.kind]||!current(s))return;
        await navigateTo(link.kind,link.id);
      });
      host.querySelectorAll('[data-remove-link]').forEach(button=>button.onclick=()=>{s.record.data.links.splice(Number(button.dataset.removeLink),1);s.dirty=true;renderLinks();configs[s.kind].onEdit?.(s.host.querySelector('[data-extra-editor]'),s);});
    }catch(error){if(current(s)&&s.record.id===recordId)host.textContent='Could not load linked entries: '+error.message;}
  }
  function renderMarkers(){const s=session,host=s?.host.querySelector('[data-marker-list]');if(!host)return;host.innerHTML=(s.record.data.markers||[]).map((pin,i)=>`<p>${i+1}. ${escape(pin.label)} <button type="button" data-remove-marker="${i}" aria-label="Remove ${escape(pin.label)}">Remove</button></p>`).join('');host.querySelectorAll('[data-remove-marker]').forEach(button=>button.onclick=()=>{s.record.data.markers.splice(Number(button.dataset.removeMarker),1);s.dirty=true;renderMarkers();mapImage();});}
  function printRecord(includeSecrets=false) {
    const s=session;if(!current(s))return;includeSecrets=includeSecrets&&(!configs[s.kind].showPrivate||configs[s.kind].showPrivate(s.record));const input=draft();let surface=document.getElementById('workspacePrintSurface');
    if(!surface){surface=document.createElement('article');surface.id='workspacePrintSurface';document.body.append(surface);}
    const publicContent=!includeSecrets&&configs[s.kind].playerContent?configs[s.kind].playerContent(input):input.content;
    surface.innerHTML=`<h1>${escape(input.title)}</h1><p>${escape(input.summary)}</p><div class="workspace-prose">${escape(publicContent)}</div>${includeSecrets&&input.privateNotes?`<section><h2>DM notes</h2><div class="workspace-prose">${escape(input.privateNotes)}</div></section>`:''}`;
    const illustration=includeSecrets?s.host.querySelector('[data-journal-image-view]'):null;
    if(illustration){
      const figure=document.createElement('figure'),copy=illustration.cloneNode(true);
      copy.alt=input.data.journalImage?.alt||input.title;figure.append(copy);
      if(input.data.journalImage?.caption){const caption=document.createElement('figcaption');caption.textContent=input.data.journalImage.caption;figure.append(caption);}
      surface.append(figure);
    }
    const image=includeSecrets?s.host.querySelector('[data-map] img'):null;if(image)surface.insertAdjacentHTML('beforeend',`<img src="${escape(image.src)}" alt="${escape(input.title)}"><p>${(input.data.markers||[]).map((pin,i)=>`${i+1}. ${escape(pin.label)}`).join(' · ')}</p>`);
    if(includeSecrets){
      surface.insertAdjacentHTML('beforeend',configs[s.kind].fields.filter(([key])=>input.data[key]!==''&&input.data[key]!=null).map(([key,label])=>`<section><h2>${escape(label)}</h2><div class="workspace-prose">${escape(input.data[key])}</div></section>`).join(''));
      if(input.data.combatants)surface.insertAdjacentHTML('beforeend',`<h2>Round ${Number(input.data.round)||1}</h2>`+CampaignEncounters.ordered(input.data).map(row=>`<section><h2>${escape(row.name)}</h2><p>Initiative ${row.initiative} · AC ${row.stats.ac} · HP ${row.hp} / ${row.maxHp} · Temporary HP ${row.tempHp}</p><p>${escape(row.conditions.join(', '))}${row.concentration?' · Concentrating':''}</p><div class="workspace-prose">${escape([row.stats.actions,row.stats.traits,row.stats.legendaryActions,row.stats.phases].filter(Boolean).join('\n\n'))}</div></section>`).join(''));
    }
    const sources=[input.data.source,...(input.data.combatants||[]).map(row=>row.stats.source)].filter(Boolean);
    const uniqueSources=[...new Map(sources.map(source=>[source.attribution+' '+source.license,source])).values()];
    if(uniqueSources.length)surface.insertAdjacentHTML('beforeend','<section><h2>Rules sources</h2>'+uniqueSources.map(source=>`<p class="workspace-prose">${escape(source.attribution)} ${escape(source.changes)} Licence: ${escape(source.license)}</p>`).join('')+'</section>');
    document.body.classList.add('printing-workspace');window.print();
  }
  async function render(kind) {
    if(!configs[kind]||!permitted(kind))return;
    if(current(session)&&session.kind===kind)return;
    if(!clear())return;const config=configs[kind],panel=document.getElementById('tab-'+config.tab);if(!panel)return;
    panel.innerHTML=`<section class="campaign-workspace"><header class="workspace-heading"><h2>${escape(config.title)}</h2><button type="button" data-new-record>+ New ${escape(config.noun)}</button></header><p>${escape(config.help)}</p><div class="workspace-actions" data-workspace-navigation><button type="button" data-workspace-kind="world">World entries</button><button type="button" data-workspace-kind="creature">Creatures &amp; NPCs</button><button type="button" data-workspace-kind="encounter">Encounters</button></div><div data-workspace-tools></div><div class="workspace-layout"><aside class="workspace-sidebar"><label>Search<input type="search" data-workspace-search></label><label>Category<select data-workspace-category><option value="">All categories</option>${(config.categories||[]).map(value=>`<option>${escape(value)}</option>`).join('')}</select></label><label><input type="checkbox" data-workspace-archived> Show archived</label><div class="workspace-list" data-workspace-list></div></aside><article class="workspace-page" data-workspace-page><p data-workspace-status role="status">Loading campaign entries…</p></article></div></section>`;
    const s={campaignId:activeCampaign.id,uid:auth.currentUser.uid,kind,host:panel.firstElementChild,rows:[],notebookCategories:[],rowsLoaded:false,record:null,dirty:false,busy:false};session=s;const token=++generation;AppNavigation.remember();
    s.host.querySelector('[data-new-record]').disabled=!!config.initialData;
    s.host.querySelector('[data-workspace-navigation]').hidden=!!config.hideNavigation;
    config.toolbar?.(s.host.querySelector('[data-workspace-tools]'),s);
    notebookToolbar(s);
    s.host.querySelectorAll('[data-workspace-kind]').forEach(button=>{button.hidden=!canManageCampaign()||!!config.hideNavigation;button.onclick=()=>switchKind(button.dataset.workspaceKind)});
    s.host.querySelector('[data-new-record]').onclick=newRecord;s.host.querySelector('[data-workspace-search]').oninput=renderList;s.host.querySelector('[data-workspace-archived]').onchange=renderList;s.host.querySelector('[data-workspace-category]').onchange=renderList;
    try{s.rows=await (config.list?config.list(s.campaignId):store.list(s.campaignId,kind));if(!current(s))return;s.rowsLoaded=true;s.host.querySelector('[data-new-record]').disabled=false;if(token!==generation)return;renderList();if(!s.record)s.host.querySelector('[data-workspace-page]').innerHTML='<p>Select an entry, or create a new one.</p>';}
    catch(error){if(current(s))status(`Could not load: ${error.message}. Publish the updated Firestore rules if permission is denied.`,true);}
    if(['world','chapter'].includes(kind)){
      try{s.notebookCategories=await store.listCategories(s.campaignId,kind);if(current(s)){notebookCategoryButtons(s);renderList();}}
      catch(error){if(current(s))s.host.querySelector('[data-notebook-category-status]').textContent='Saved categories unavailable: '+error.message;}
    }
  }
  function importCreature(record){
    if(session?.kind!=='creature'||!current(session)||session.busy)return false;
    if(session.dirty&&!confirm('Discard unsaved changes before importing this creature?'))return false;
    session.record={id:id(),revision:0,title:record.title,summary:record.summary,content:record.content||'',privateNotes:'',data:CampaignCreatures.normalize((()=>{const d=structuredClone(record.data||{});for(const k of ['journalImage','links','markers','imagePath','imageUrl','campaignId','chapterId','chapterIds','encounterId','encounterIds','locationId','locationIds','factionIds'])delete d[k];return d;})()),archived:false};session.dirty=true;renderEditor();status('Campaign copy created. Save to keep it.');return true;
  }
  async function importCreatures(requests,{isCurrent=()=>true,onProgress=()=>{}}={}){
    const s=session;
    if(s?.kind!=='creature'||!current(s)||s.busy)throw Error('Open the campaign creature workspace before importing.');
    if(!s.rowsLoaded)throw Error('Wait for campaign creatures to finish loading, then import your selection.');
    if(!Array.isArray(requests)||!requests.length||requests.length>100||new Set(requests.map(row=>row.id)).size!==requests.length)throw Error('Choose between 1 and 100 different creatures.');
    const active=()=>current(s)&&isCurrent();
    const prepared=requests.map(request=>{
      if(!CampaignRules.allowed(request.record)||!/^srd-(2014|2024)-/.test(request.record.id||''))throw Error('A selected creature is outside the allowed SRD editions.');
      const data=structuredClone(request.record.data||{});
      for(const key of ['journalImage','links','markers','imagePath','imageUrl','campaignId','chapterId','chapterIds','encounterId','encounterIds','locationId','locationIds','factionIds'])delete data[key];
      const input=store.normalize('creature',{title:request.record.title,summary:request.record.summary,content:request.record.content||'',privateNotes:'',archived:false,data:CampaignCreatures.normalize(data)});
      return {...request,input};
    });
    const completed=[];let error=null;s.busy=true;
    try{
      for(const request of prepared){
        if(!active())throw Error('Campaign access changed. Remaining creatures were not imported.');
        let saved;
        try{saved=await store.save({campaignId:s.campaignId,kind:'creature',id:request.id,revision:0,input:request.input,isCurrent:()=>active()&&CampaignRules.allowed(request.record)});}
        catch(failure){
          // Reuse the same destination ID on retry. An acknowledged matching
          // record proves a prior transaction succeeded despite a lost response.
          if(!active())throw failure;
          const previous=await store.load(s.campaignId,'creature',request.id).catch(()=>null);
          const fields=['title','summary','content','privateNotes','data','archived'];
          if(!previous||previous.createdBy!==s.uid||previous.revision!==1||fields.some(key=>JSON.stringify(previous[key])!==JSON.stringify(request.input[key])))throw failure;
          saved=previous;
        }
        completed.push(request.key);
        if(!active())break;
        const index=s.rows.findIndex(row=>row.id===saved.id);if(index<0)s.rows.push(saved);else s.rows[index]=saved;
        onProgress(completed.length,prepared.length,request.key);
      }
    }catch(failure){error=failure;}
    finally{s.busy=false;if(current(s)){renderList();status(`${completed.length} creature${completed.length===1?'':'s'} imported privately.${error?' '+error.message:' Your current draft is kept.'}`,!!error);}}
    return {completed,error};
  }
  async function navigateTo(kind,recordId){
    const old=session;
    if(!configs[kind]||!permitted(kind)||!recordId)return false;
    if(old?.dirty&&!confirm('Discard unsaved campaign workspace edits before navigating?'))return false;
    if(old?.busy)return false;
    if(old?.kind===kind){await openRecord(recordId);return true;}
    if(!clear(true))return false;
    showTab(configs[kind].tab,false);
    await render(kind);
    if(session?.kind!==kind||session.campaignId!==activeCampaign?.id)return false;
    await openRecord(recordId);
    return true;
  }
  function switchKind(kind){if(session?.busy)return;if(!clear())return;showTab(configs[kind].tab,false);render(kind);}
  window.addEventListener('beforeunload',event=>{if(session?.dirty){event.preventDefault();event.returnValue='';}});
  window.addEventListener('afterprint',()=>{document.body.classList.remove('printing-workspace');document.getElementById('workspacePrintSurface')?.replaceChildren();});
  return {render,importCreature,importCreatures,switchKind,navigateTo,clear,beforeNavigate,configs,store,get session(){return session;},draft,save,newRecord,openRecord,renderEditor,renderList,renderLinks,status,id};
})();
