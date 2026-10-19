'use strict';
// World preparation keeps its saved records; sharing remains a deliberate snapshot.
(()=>{
 const W=CampaignWorkspace,config=W.configs.world,e=value=>escapeHtml(String(value??''));
 const sharing=createCampaignInformationStore(window.__DND_VAULT_DEPS__);
 const labels={private:'Private draft',shared:'Shared with players',changed:'Versions differ',unknown:'Sharing unknown',archived:'Archived'};
 const current=s=>W.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
 function categories(s){
  const custom=[...new Set([...(s?.rows||[]).map(row=>row.data?.category),...(s?.notebookCategories||[]).map(row=>row.name),s?.record?.data?.category].filter(value=>typeof value==='string'&&value&&!config.categories.includes(value)))].sort((a,b)=>a.localeCompare(b));
  return [...config.categories,...custom];
 }
 function categoryFilters(s){
  const values=categories(s),key=JSON.stringify(values);if(key===s.worldCategoryKey)return false;
  s.worldCategoryKey=key;
  const select=s.host.querySelector('[data-workspace-category]'),selected=select.value;
  select.innerHTML='<option value="">All categories</option>'+values.map(value=>`<option value="${e(value)}">${e(value)}</option>`).join('');
  select.value=values.includes(selected)?selected:'';
  s.host.querySelector('.world-category-shortcuts').innerHTML=['',...values].map(value=>`<button type="button" data-world-category="${e(value)}" aria-pressed="${value===select.value}">${e(value||'All entries')} <span>0</span></button>`).join('');
  return selected!==select.value;
 }
 function visibility(s,row){
  if(row.archived)return 'archived';
  if(!s.worldSharingLoaded&&!s.worldKnown.has(row.id))return 'unknown';
  const published=s.worldPublications.get(row.id);
  return !published?'private':published.sourceRevision===row.revision?'shared':'changed';
 }
 function entryState(_host,s){
  if(!current(s)||!s.record)return;
  const state=s.host.querySelector('[data-world-entry-state]');if(!state)return;
  const kind=visibility(s,s.record);
  state.textContent=!s.record.revision?'New draft · Save before sharing.':s.dirty?'Unsaved changes · Players still see the previously shared version, if any.':labels[kind];
  state.dataset.visibility=s.dirty?'draft':kind;
 }
 function listed(s){
  if(!current(s))return;
  if(categoryFilters(s))return W.renderList();
  const archived=s.host.querySelector('[data-workspace-archived]').checked;
  const rows=s.rows.filter(row=>!!row.archived===archived),category=s.host.querySelector('[data-workspace-category]').value;
  s.host.querySelectorAll('[data-world-category]').forEach(button=>{
   const value=button.dataset.worldCategory,count=rows.filter(row=>!value||row.data?.category===value).length;
   button.setAttribute('aria-pressed',String(value===category));button.querySelector('span').textContent=count;
  });
  const visibilitySelect=s.host.querySelector('[data-world-visibility]');
  visibilitySelect.disabled=archived||!s.worldSharingLoaded;if(archived)visibilitySelect.value='';
  const filter=s.worldSharingLoaded&&!archived?visibilitySelect.value:'',list=s.host.querySelector('[data-workspace-list]');
  list.querySelector('[data-world-filter-empty]')?.remove();let shown=0;
  list.querySelectorAll('[data-open-record]').forEach(button=>{
   const row=s.rows.find(row=>row.id===button.dataset.openRecord);if(!row)return;
   const kind=visibility(s,row),badge=document.createElement('span');
   badge.className='world-visibility-badge';badge.dataset.visibility=kind;badge.textContent=labels[kind];button.append(badge);
   button.hidden=!!filter&&kind!==filter;if(!button.hidden)shown++;
   if(s.record?.id===row.id)button.setAttribute('aria-current','true');
  });
  if(!shown&&list.querySelector('[data-open-record]')){
   const message=document.createElement('p');message.dataset.worldFilterEmpty='';message.textContent='No world entries match these filters.';list.append(message);
  }else if(!shown&&s.rows.length)list.querySelector('p').textContent='No world entries match these filters.';
  s.host.querySelector('[data-world-results]').textContent=`${shown} of ${rows.length} ${archived?'archived':'active'} world entries shown.`;
  const add=s.host.querySelector('[data-new-record]');if(add)add.textContent='+ Add '+(category&&category!=='Location'?category.toLowerCase():'place');
  entryState(null,s);
 }
 function replacePublications(s,rows){
  s.worldPublications=new Map(rows.map(row=>[row.id,row]));s.worldKnown.clear();s.worldSharingLoaded=true;W.renderList();
 }
 async function refreshSharing(s){
  if(!current(s))return;
  const token=++s.worldSharingRequest;s.worldUnsubscribe?.();s.worldUnsubscribe=null;
  s.worldSharingLoaded=false;s.worldKnown.clear();s.worldPublications.clear();
  const select=s.host.querySelector('[data-world-visibility]'),button=s.host.querySelector('[data-world-refresh]'),status=s.host.querySelector('[data-world-sharing-overview]');
  select.disabled=true;button.disabled=true;status.textContent='Loading player-sharing status…';W.renderList();
  const active=()=>current(s)&&token===s.worldSharingRequest;
  try{
   const rows=await sharing.list(s.campaignId);if(!active())return;
   replacePublications(s,rows);status.textContent='Saving keeps preparation private. Share descriptions deliberately.';
   let denied=false;
   s.worldUnsubscribe=sharing.watch(s.campaignId,updates=>{if(active()&&!denied)replacePublications(s,updates);},error=>{
    if(!active())return;denied=true;s.worldUnsubscribe?.();s.worldUnsubscribe=null;
    s.worldSharingLoaded=false;s.worldKnown.clear();s.worldPublications.clear();select.disabled=true;select.value='';
    status.textContent=`Sharing status is unavailable: ${error.message}. Refresh to try again.`;W.renderList();
   });
  }catch(error){if(active()){select.value='';status.textContent=`Could not load sharing status: ${error.message}. Refresh to try again.`;W.renderList();}}
  finally{if(active())button.disabled=false;}
 }
 function toolbar(host,s){
  s.worldPublications=new Map();s.worldKnown=new Set();s.worldSharingLoaded=false;s.worldSharingRequest=0;
  host.innerHTML=`<nav class="world-category-shortcuts" aria-label="World entry categories"></nav><div class="world-browse-controls"><label class="workspace-field"><span>Player visibility</span><select data-world-visibility disabled><option value="">All entries</option><option value="private">Private drafts</option><option value="shared">Shared with players</option><option value="changed">Versions differ</option></select></label><button type="button" data-world-refresh>Refresh sharing status</button></div><p data-world-sharing-overview role="status"></p><p data-world-results role="status"></p>`;
  categoryFilters(s);
  host.querySelector('.world-category-shortcuts').onclick=event=>{const button=event.target.closest('[data-world-category]');if(!button)return;s.host.querySelector('[data-workspace-category]').value=button.dataset.worldCategory;W.renderList();};
  host.querySelector('[data-world-visibility]').onchange=()=>W.renderList();host.querySelector('[data-world-refresh]').onclick=()=>refreshSharing(s);
  for(const label of s.host.querySelectorAll('.workspace-sidebar label')){
   const span=document.createElement('span');for(const node of [...label.childNodes])if(node.nodeType===3)span.append(node);
   label.prepend(span);const checkbox=label.querySelector('[data-workspace-archived]');if(checkbox){span.prepend(checkbox);span.className='world-archived-filter';}
  }
  refreshSharing(s);
 }
 const textarea=(name,label,value,max=20000,field=false)=>`<label class="workspace-field"><span>${e(label)}</span><textarea ${field?`data-record-field="${name}"`:`name="${name}"`} maxlength="${max}">${e(value)}</textarea></label>`;
 const categoryField=record=>`<label class="workspace-field"><span>Entry type</span><select data-record-field="category">${categories(W.session).map(value=>`<option value="${e(value)}" ${record.data?.category===value?'selected':''}>${e(value)}</option>`).join('')}<option value="" data-world-custom-option>Custom…</option></select></label><label class="workspace-field" data-world-custom-field hidden><span>Custom category name</span><input name="worldCustomCategory" maxlength="80" placeholder="For example, Religion or Trade route" aria-describedby="worldCustomCategoryHelp" disabled><small id="worldCustomCategoryHelp">Use 1–80 characters. Save the entry to add this type beside World, Region, Location, Faction and Lore. You can then reuse it for other entries.</small></label>`;
 config.editorBody=record=>`<p class="world-visibility-badge" data-world-entry-state role="status"></p>
  <section class="world-editor-section world-entry-basics" data-world-basics><h3>${record.revision?'Describe this place or entry':'Add a place to your world'}</h3><p>Give it a name and describe the area. Saving keeps it private until you choose to share it.</p><label class="workspace-field"><span>Name</span><input name="title" required maxlength="160" placeholder="For example, Hollow Harbor" value="${e(record.title)}"></label>${textarea('content','Description',record.content)}</section>
  <details class="world-editor-section" data-world-option="sharing"><summary>Share with players</summary><p>Share the saved description when the party discovers it. Private notes and marker maps stay with the DM. Journal illustrations can be shared separately.</p><div data-extra-editor></div></details>
  <details class="world-editor-section world-editor-private" data-world-option="notes"><summary>DM notes (optional)</summary>${textarea('privateNotes','Private DM notes',record.privateNotes)}</details>
  <details class="world-editor-section" data-world-option="images"><summary>Images &amp; maps (optional)</summary><div data-journal-image-mount></div><details class="world-map-tools" data-world-option="map"><summary>Private map &amp; markers</summary><p>Use a map when you want to add named location markers. Maps and markers remain private.</p><label class="workspace-field"><span>Map (PNG, JPEG, WebP · max 5 MB)</span><input type="file" accept="image/png,image/jpeg,image/webp" data-map-upload></label><div data-map class="workspace-map"></div><div data-marker-list></div></details></details>
  <details class="world-editor-section world-editor-private" data-world-option="connections"><summary>Connections (optional)</summary><p>Connect saved locations, factions, NPCs, chapters and encounters. Connections stay in your DM workspace.</p>${textarea('connections','Related places and people',record.data?.connections,20000,true)}<section data-workspace-links></section></details>
  <details class="world-editor-section" data-world-option="options"><summary>Entry type &amp; summary (optional)</summary>${categoryField(record)}${textarea('summary','Short summary',record.summary,1000)}</details>
  <details class="world-editor-section" data-world-option="print"><summary>Print options</summary><label class="workspace-field" data-private-print><span><input type="checkbox" data-print-private> Include private preparation, illustrations and maps in print</span></label></details>`;
 config.initialData=s=>({category:s.host.querySelector('[data-workspace-category]')?.value||'Location'});
 config.toolbar=toolbar;config.onListed=listed;config.hideNavigation=true;
 config.searchText=row=>[row.content,row.data?.connections].join(' ');
 config.help='Build your world, regions, locations, factions and lore. Keep player descriptions separate from DM preparation, then share discoveries when your party is ready.';
 config.extra=(_host,s)=>{
  s.worldSavedCategory=s.record.revision?s.record.data?.category:null;
  const select=s.host.querySelector('[data-record-field="category"]'),field=s.host.querySelector('[data-world-custom-field]'),input=field.querySelector('input'),option=select.querySelector('[data-world-custom-option]');
  input.value=config.categories.includes(s.record.data?.category)?'':s.record.data?.category||'';
  const syncCustom=()=>{
   const custom=select.selectedOptions[0]===option;
   field.hidden=!custom;input.disabled=!custom;input.required=custom;
   input.setCustomValidity(custom&&!input.value.trim()?'Enter a custom category name.':'');
   // Drafts and saves read the actual label from the existing category field.
   if(custom)option.value=input.value.trim();
  };
  select.addEventListener('change',()=>{syncCustom();if(!field.hidden)input.focus();});
  input.addEventListener('input',syncCustom);
  input.addEventListener('invalid',()=>field.closest('details').open=true);
  if(s.record.revision){const index=s.rows.findIndex(row=>row.id===s.record.id);if(index>=0)s.rows[index]={...s.rows[index],...s.record};}
  W.renderList();entryState(null,s);
 };
 config.onEdit=entryState;
 config.onSaved=(_host,s)=>{
  if(!current(s))return;
  const category=s.record.data?.category;
  if(category&&category!==s.worldSavedCategory){
   // The previous type/search/visibility filter can otherwise hide a successfully saved entry.
   s.host.querySelector('[data-workspace-category]').value=category;
   const search=s.host.querySelector('[data-workspace-search]'),query=search.value.toLowerCase();
   const searchable=[s.record.title,s.record.summary,category,config.searchText(s.record)].join(' ').toLowerCase();
   if(query&&!searchable.includes(query))search.value='';
   s.host.querySelector('[data-workspace-archived]').checked=!!s.record.archived;
   const visible=s.host.querySelector('[data-world-visibility]');
   if(visible.value&&visible.value!==visibility(s,s.record))visible.value='';
   s.worldSavedCategory=category;W.renderList();
  }
  entryState(null,s);
 };
 config.savedMessage=s=>'All changes saved. Entry type: '+(s.record.data?.category||'Location')+'.';
 config.onPublicationChange=(s,published)=>{
  if(!current(s))return;
  s.worldKnown.add(s.record.id);if(published)s.worldPublications.set(s.record.id,published);else s.worldPublications.delete(s.record.id);
  W.renderList();
 };
 config.onClear=s=>{++s.worldSharingRequest;s.worldUnsubscribe?.();};
})();
