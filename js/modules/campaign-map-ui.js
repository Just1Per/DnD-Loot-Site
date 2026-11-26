'use strict';
var CampaignMap=(()=>{
 const sdk=window.__DND_VAULT_DEPS__,store=createCampaignMapStore(sdk),worldStore=createCampaignInformationStore(sdk),media=createCampaignMapMedia(sdk),transfer=createCampaignMapTransfer(sdk);
 const escape=value=>escapeHtml(String(value??''));
 let session=null,nextMapId=null;
 const mapImageRequests=new WeakMap();
 const current=s=>session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid;
 const allowed=s=>current(s)&&!s.denied;
 const editable=s=>allowed(s)&&s.mode==='dm'&&canManageCampaign()&&!s.draftUnavailable;
 const dirty=s=>s.mapDirty||s.pinDirty;
 const working=s=>s.editing&&!!s.draft&&!s.preview&&editable(s);
 const displayed=s=>working(s)?s.draft:s.map;
 const places=s=>working(s)?s.draft?.pins||[]:s.pins;
 function status(s,message){if(!current(s))return;s.message=message;const host=s.root.querySelector('[data-map-status]');if(host)host.textContent=message;}
 function revoke(s){s.imageEpoch=(s.imageEpoch||0)+1;s.pendingImages.clear();s.failedPreviews.clear();for(const url of s.urls.values())URL.revokeObjectURL(url);s.urls.clear();}
 function clear(){document.getElementById('campaignMapCopyDialog')?.remove();document.getElementById('campaignMapPublicationDialog')?.remove();if(session){session.stops.forEach(stop=>stop());session.pinStop?.();revoke(session);}session=null;for(const id of ['tab-campaign-map','tab-dm-map'])document.getElementById(id)?.replaceChildren();}
 function guard(action){const s=session;if(!s)return true;if(!current(s)){clear();return true;}if(s.busy)return false;if(!dirty(s))return true;if(s.leaving)return false;s.leaving=true;
  SiteConfirmation.ask({title:'Leave without saving your map draft?',paragraphs:['Published places stay unchanged. Unsaved edits in this window will be discarded.'],confirmLabel:'Discard changes',cancelLabel:'Keep editing'}).then(yes=>{if(!current(s))return;s.leaving=false;if(yes){s.mapDirty=false;s.pinDirty=false;s.pinEditor=null;action();}});return false;
 }
 function beforeNavigate(tab){if(session&&tab===session.route)return true;if(!guard(()=>showTab(tab)))return false;clear();return true;}
 function changed(s){s.mapDirty=true;status(s,'Private draft changed. Save your draft or publish when ready.');}
 const pathType=type=>store.isPath(type);
 const typeLabel=type=>type==='Travelled'?'Party route':type==='Road'?'Road':type==='Region'?'Region':'Location';
 const icons={'Location':'●','City':'▣','Castle':'♜','Landmark':'▲','Point of interest':'✦'};
 const pinDefaults=pin=>({...pin,markerStyle:pin.markerStyle||'City',boundary:structuredClone(pin.boundary||[]),type:pin.type||'City',revealed:pin.revealed!==false,picturePath:pin.picturePath||'',pictureAlt:pin.pictureAlt||'',worldEntryId:pin.worldEntryId||''});
 function initialDraft(s){return {title:s.map?.title||s.maps?.find(row=>row.id===s.mapId)?.title||'Campaign map',imagePath:s.map?.imagePath||'',...(s.map?.previewPath?{previewPath:s.map.previewPath}:{}),revision:0,sourceRevision:s.map?.revision||0,pins:s.pins.map(pinDefaults)};}
 async function choosePin(s,id){if(!allowed(s)||s.busy)return;if(s.pinDirty){const yes=await SiteConfirmation.ask({title:'Discard changes to this place?',paragraphs:['Your saved draft and published map stay unchanged.'],confirmLabel:'Discard changes',cancelLabel:'Keep editing'});if(!yes||!allowed(s))return;}
  s.selected=id;s.pinEditor=null;s.pinDirty=false;s.placing=false;s.drawing=false;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;paint(s);s.root.querySelector('[data-place-heading]')?.focus();
 }
 function pictureMarkup(pin,extra=''){return pin.picturePath?`<img data-place-picture="${escape(pin.picturePath)}" class="map-place-picture ${extra}" alt="${escape(pin.pictureAlt)}">`:'';}
 function mainMapId(s){const published=s.maps.filter(row=>row.published);return published.find(row=>row.id===s.preferences.mainMapId)?.id||published.find(row=>row.id==='main')?.id||published[0]?.id||'';}
 function sortMaps(s){const order=Array.isArray(s.preferences.order)?s.preferences.order:[];s.maps.sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return (ai<0?999:ai)-(bi<0?999:bi)||(a.id==='main'?-1:b.id==='main'?1:0)||a.title.localeCompare(b.title)||a.id.localeCompare(b.id);});}
 function mapNavigation(s){
  const visible=s.preview?s.maps.filter(row=>row.published):s.maps,dm=editable(s)&&!s.preview,main=mainMapId(s),index=visible.findIndex(row=>row.id===s.mapId),row=visible[index];
  if(!s.maps.length&&!dm)return '';
  return `<div class="map-selector"><div class="map-selector-head"><nav class="map-tabs" aria-label="Campaign maps">${visible.map(row=>`<button type="button" data-select-map="${escape(row.id)}" aria-current="${row.id===s.mapId?'page':'false'}" title="${escape(row.title)}" ${s.busy?'disabled':''} ${dm?'draggable="true"':''}>${escape(row.title)}${row.id===main?' <span>· Main map</span>':!row.published?' <span>· Private draft</span>':''}</button>`).join('')}</nav>${dm?`<button type="button" data-map-new ${s.busy||!s.ready||s.maps.length>=50?'disabled':''}>+ Add map</button>`:''}</div>${dm&&s.maps.length?`<details class="map-organise" ${s.organising?'open':''}><summary>Organise maps</summary><p>Move this map earlier or later in the row, or drag any map name. Players only see published maps. The main map opens first when entering Maps.</p><div class="journal-actions"><button type="button" data-map-earlier ${s.busy||index<=0?'disabled':''}>Move earlier</button><button type="button" data-map-later ${s.busy||index<0||index===s.maps.length-1?'disabled':''}>Move later</button><button type="button" data-map-main ${s.busy||!row?.published||row.id===main?'disabled':''}>${row?.id===main?'Main map':'Make main map'}</button></div>${row&&!row.published?'<p class="map-hint">Publish this map before making it the main map.</p>':''}</details>`:''}</div>`;
 }
 async function organiseMaps(s,{moveTo=null,main=false,mapId=s.mapId}={}){
  if(!editable(s)||s.busy||!s.ready)return;const from=s.maps.findIndex(row=>row.id===mapId),order=s.maps.map(row=>row.id);
  if(main&&!s.maps[from]?.published)return;
  if(moveTo!==null){if(from<0||moveTo<0||moveTo>=order.length)return;order.splice(moveTo,0,order.splice(from,1)[0]);}
  const focusKey=['data-map-earlier','data-map-later','data-map-main'].find(key=>document.activeElement?.hasAttribute(key));s.organising=!!s.root.querySelector('.map-organise')?.open;s.busy=true;paint(s);
  try{s.preferences=await store.savePreferences({campaignId:s.campaignId,order,mainMapId:main?s.mapId:s.preferences.mainMapId||'',revision:s.preferences.revision,isCurrent:()=>editable(s)});if(!editable(s))return;sortMaps(s);status(s,main?'Main map updated. It opens first for your party.':'Map order saved.');}
  catch(error){if(allowed(s))status(s,'Could not organise maps: '+error.message);}
  finally{s.busy=false;if(allowed(s)){paint(s);const button=focusKey?s.root.querySelector('['+focusKey+']'):null;(button&&!button.disabled?button:s.root.querySelector('.map-tabs [aria-current=page]'))?.focus({preventScroll:true});}}
 }
 function bindMapNavigation(s){
  const organisation=s.root.querySelector('.map-organise');if(organisation)organisation.ontoggle=()=>{if(allowed(s)&&organisation.isConnected)s.organising=organisation.open;};
  const nav=s.root.querySelector('.map-tabs'),selected=nav?.querySelector('[aria-current="page"]');
  if(nav&&selected){const bounds=nav.getBoundingClientRect(),button=selected.getBoundingClientRect();if(button.right>bounds.right)nav.scrollLeft+=button.right-bounds.right;else if(button.left<bounds.left)nav.scrollLeft-=bounds.left-button.left;}
  s.root.querySelectorAll('[data-select-map]').forEach(button=>{button.onclick=()=>{if(button.dataset.selectMap!==s.mapId)render(s.mode,button.dataset.selectMap,s.preview)};button.ondragstart=event=>{if(!editable(s)||s.busy){event.preventDefault();return;}event.dataTransfer.setData('text/plain',button.dataset.selectMap);};button.ondragover=event=>{if(editable(s)&&!s.busy)event.preventDefault();};button.ondrop=event=>{if(!editable(s)||s.busy)return;event.preventDefault();const source=event.dataTransfer.getData('text/plain'),target=s.maps.findIndex(row=>row.id===button.dataset.selectMap);organiseMaps(s,{moveTo:target,mapId:source});};});
  s.root.querySelector('[data-map-new]')?.addEventListener('click',()=>{if(editable(s)&&!s.busy&&s.ready&&s.maps.length<50)render('dm',crypto.randomUUID())});
  s.root.querySelector('[data-map-copy]')?.addEventListener('click',()=>copyDialog(s,false));
  s.root.querySelector('[data-map-clone]')?.addEventListener('click',()=>copyDialog(s,true));
  s.root.querySelector('[data-map-delete]')?.addEventListener('click',()=>deleteMap(s));
  const index=s.maps.findIndex(row=>row.id===s.mapId);
  s.root.querySelector('[data-map-earlier]')?.addEventListener('click',()=>organiseMaps(s,{moveTo:index-1}));
  s.root.querySelector('[data-map-later]')?.addEventListener('click',()=>organiseMaps(s,{moveTo:index+1}));
  s.root.querySelector('[data-map-main]')?.addEventListener('click',()=>organiseMaps(s,{main:true}));
 }
 async function deleteMap(s){
  if(!editable(s)||s.busy||!s.ready||!s.map?.revision&&!s.draft?.revision&&!dirty(s))return;
  const signature=JSON.stringify({draft:s.draft,map:s.map,preferences:s.preferences}),valid=()=>editable(s)&&!s.busy&&JSON.stringify({draft:s.draft,map:s.map,preferences:s.preferences})===signature;
  if(!await SiteConfirmation.ask({title:'Delete “'+(s.draft?.title||s.map?.title)+'”?',confirmLabel:'Delete map',isCurrent:valid,paragraphs:['This removes the map and its private draft from the campaign. Players lose access to its places and pictures.','Other maps and linked World entries are kept. Uploaded originals stay private.',dirty(s)?'Unsaved changes to this map will also be discarded.':'']} )||!valid())return;
  s.busy=true;paint(s);
  try{if(s.map?.revision||s.draft?.revision)await s.store.remove({campaignId:s.campaignId,mapRevision:s.map?.revision||0,draftRevision:s.draft?.revision||0,preferencesRevision:s.preferences.revision,isCurrent:()=>editable(s)});if(!editable(s))return;s.mapDirty=s.pinDirty=false;s.busy=false;await render('dm');}
  catch(error){if(allowed(s))status(s,'Could not delete map: '+error.message);}
  finally{s.busy=false;if(allowed(s))paint(s);}
 }
 function copyDialog(s,clone,selectedPinId=''){
  if(!editable(s)||s.busy||!s.ready||s.pinDirty||!s.draft||clone&&(!s.draft.imagePath||s.maps.length>=50))return;
  document.getElementById('campaignMapCopyDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='campaignMapCopyDialog';dialog.className='vault-dialog map-copy-dialog';dialog.setAttribute('aria-labelledby','mapCopyTitle');const opener=document.activeElement,signature=JSON.stringify({draft:s.draft,map:s.map}),source=structuredClone(s.draft),sourceRevision=s.map?.revision||0;
  const valid=()=>editable(s)&&dialog.isConnected&&JSON.stringify({draft:s.draft,map:s.map})===signature,targets=s.maps.filter(row=>row.id!==s.mapId);
  const close=()=>{if(s.busy)return;if(dialog.open)dialog.close();dialog.remove();if(opener?.isConnected)opener.focus();};
  dialog.innerHTML='<h2 id="mapCopyTitle">'+(clone?'Clone map':selectedPinId?'Copy pin to another map':'Copy pins to another map')+'</h2><p>The result is a private draft. Copied places start hidden until you reveal and publish them. Positions use percentages; review them on the destination map.</p><form data-map-copy-form><div class="map-copy-fields">'+(clone?'<label>New map name<input data-copy-title maxlength="160" required value="'+escape((source.title+' (copy)').slice(0,160))+'"></label><label>Replacement background (optional)<input data-copy-background type="file" accept="image/png,image/jpeg,image/webp"></label><p>Leave blank to copy the original background. If it cannot load, choose a replacement here or copy places into an existing map instead.</p>':'<label>Destination map<select data-copy-destination required><option value="">Choose a map</option>'+targets.map(row=>'<option value="'+escape(row.id)+'">'+escape(row.title)+'</option>').join('')+'</select></label>')+'<label><input data-copy-pictures type="checkbox" checked> Include place pictures</label><p>Turn this off to rescue text and positions when a picture cannot be read.</p>'+(!clone&&!targets.length?'<p>No other saved maps yet. Add another map, or clone this map first.</p>':'')+'<fieldset><legend>Places, regions and routes</legend><div class="journal-actions"><button type="button" data-copy-all>Select all</button><button type="button" data-copy-none>Select none</button></div><div class="map-copy-places">'+source.pins.map(pin=>'<label><input type="checkbox" data-copy-pin value="'+escape(pin.id)+'" '+(!selectedPinId||selectedPinId===pin.id?'checked':'')+'> '+escape(pin.name)+' · '+escape(typeLabel(pin.type))+'</label>').join('')+(source.pins.length?'':'<p>No places; only the map image will be copied.</p>')+'</div></fieldset></div><p data-copy-status role="status"></p><div class="journal-actions"><button type="submit" data-copy-apply class="btn-primary">'+(clone?'Create private copy':'Copy selected places')+'</button><button type="button" data-copy-cancel>Cancel</button></div></form>';
  const form=dialog.querySelector('form'),message=dialog.querySelector('[data-copy-status]'),apply=dialog.querySelector('[data-copy-apply]');
  const refresh=()=>{const count=dialog.querySelectorAll('[data-copy-pin]:checked').length;apply.textContent=clone?'Create private copy':('Copy '+count+' place'+(count===1?'':'s'));apply.disabled=!clone&&(!count||!dialog.querySelector('[data-copy-destination]').value);};
  for(const command of ['all','none'])dialog.querySelector('[data-copy-'+command+']').onclick=()=>{if(s.busy)return;dialog.querySelectorAll('[data-copy-pin]').forEach(node=>node.checked=command==='all');refresh();};form.onchange=refresh;
  dialog.querySelector('[data-copy-cancel]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  form.onsubmit=async event=>{event.preventDefault();if(!valid()||s.busy||!form.reportValidity())return;const selectedIds=[...dialog.querySelectorAll('[data-copy-pin]:checked')].map(node=>node.value),destinationMapId=clone?crypto.randomUUID():dialog.querySelector('[data-copy-destination]').value;
   s.busy=true;form.querySelectorAll('input,select,button').forEach(node=>node.disabled=true);message.textContent='Preparing the private copy…';
   try{const result=await transfer.copy({campaignId:s.campaignId,sourceMapId:s.mapId,source,sourceMapRevision:sourceRevision,destinationMapId,selectedIds,clone,title:clone?dialog.querySelector('[data-copy-title]').value:'',includePictures:dialog.querySelector('[data-copy-pictures]').checked,replacement:dialog.querySelector('[data-copy-background]')?.files?.[0],preparePreview:async file=>{const bitmap=await createImageBitmap(file);try{return await createMapPreview(bitmap,file.size);}finally{bitmap.close();}},isCurrent:valid,onProgress:(done,total)=>{if(valid())message.textContent=total?'Preparing images '+done+' of '+total+'…':'Saving places…';}});if(!valid())return;
    s.busy=false;close();if(clone)s.maps.push({id:result.mapId,title:result.draft.title,published:false});status(s,'Private copy saved with '+result.count+' hidden places. Open the destination to review and publish.');await render('dm',result.mapId);
   }catch(error){if(valid())message.textContent='Could not copy: '+error.message+' Your source and destination records are unchanged. For an unreadable picture, turn off Include place pictures; for an unreadable background, choose a replacement.';}
   finally{s.busy=false;if(valid()){form.querySelectorAll('input,select,button').forEach(node=>node.disabled=false);refresh();}}
  };
  document.body.append(dialog);refresh();dialog.showModal();dialog.querySelector('input,select,button')?.focus();
 }
 const publicationConflict=s=>!!s.draft&&(s.publicationConflict||s.draft.sourceRevision!==(s.map?.revision||0));
 async function reviewPublication(s){
  if(!editable(s)||s.busy)return;if(s.pinDirty){status(s,'Keep or cancel your place edits before reviewing publication changes.');return;}
  const input=structuredClone(s.draft),signature=JSON.stringify(s.draft);s.busy=true;paint(s);
  try{
   const [latest,saved]=await Promise.all([s.store.load(s.campaignId,{includeDeleted:true}),s.store.loadDraft(s.campaignId)]);
   if(!editable(s)||JSON.stringify(s.draft)!==signature)return;if(latest?.deletedAt)throw Error('This map was deleted. Download or copy your local draft before choosing another map.');
   const publishedPins=latest?await s.store.listPins(s.campaignId,latest):[];if(!editable(s)||JSON.stringify(s.draft)!==signature)return;
   document.getElementById('campaignMapPublicationDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='campaignMapPublicationDialog';dialog.className='vault-dialog map-copy-dialog map-publication-dialog';dialog.setAttribute('aria-labelledby','mapPublicationTitle');
   const valid=()=>editable(s)&&dialog.isConnected&&JSON.stringify(s.draft)===signature&&!s.pinDirty;
   const publishedRevision=latest?.revision||0,newerDraft=(saved?.revision||0)!==input.revision;
   const normalized=s.store.normalizeDraft(s.campaignId,input),oldPins=new Map(publishedPins.map(pin=>[pin.id,pinDefaults(pin)])),draftPins=new Map(normalized.pins.filter(pin=>pin.revealed).map(pin=>[pin.id,pin]));
   const comparable=pin=>JSON.stringify({name:pin.name,description:pin.description,x:pin.x,y:pin.y,type:pin.type,markerStyle:pin.markerStyle||'City',boundary:pin.boundary||[],regionStyle:pin.regionStyle||null,picturePath:pin.picturePath||'',pictureAlt:pin.pictureAlt||'',worldEntryId:pin.worldEntryId||''});
   const describe=(pin,label)=>'<section><h4>'+label+'</h4>'+(pin?'<p><strong>'+escape(pin.name)+'</strong></p><p class="map-prose">'+escape(pin.description||'No description')+'</p><p>'+escape(typeLabel(pin.type))+' · '+escape(pin.markerStyle||'City')+' · '+escape(pin.x)+', '+escape(pin.y)+'%</p>'+(pin.boundary?.length?'<details><summary>'+pin.boundary.length+' boundary or route points</summary><p>'+pin.boundary.map((point,index)=>(index+1)+': '+escape(point.x)+', '+escape(point.y)+'%').join(' · ')+'</p></details>':'')+(pin.regionStyle?'<p>Area colour '+escape(pin.regionStyle.color)+' · '+Math.round(pin.regionStyle.opacity*100)+'% opacity</p>':'')+(pin.picturePath?'<p>Picture: '+escape(pin.pictureAlt||'Place picture')+'</p>':'')+(pin.worldEntryId?'<p>World link: '+escape(s.worlds.find(row=>row.id===pin.worldEntryId)?.title||'Linked entry')+'</p>':''):'<p>Not shown to players</p>')+'</section>';
   const changes=[...new Set([...oldPins.keys(),...draftPins.keys()])].flatMap(id=>{const old=oldPins.get(id),next=draftPins.get(id);if(old&&next&&comparable(old)===comparable(next))return [];return ['<details><summary>'+escape(next?.name||old.name)+' · '+(!old?'added by draft':!next?'removed or hidden by draft':'changed')+'</summary><div class="map-conflict-columns">'+describe(old,'Published')+describe(next,'Private draft')+'</div>'+(old&&next&&old.picturePath!==next.picturePath?'<p>Place picture differs.</p>':'')+(old&&next&&old.worldEntryId!==next.worldEntryId?'<p>Linked World entry differs.</p>':'')+'</details>'];});
   dialog.innerHTML='<h2 id="mapPublicationTitle">Review map publication</h2><p>Your saved draft is based on an older publication. Refresh keeps that saved draft. Review the differences before preparing it for publication.</p><div class="map-conflict-columns"><section><h3>Published map</h3><p>'+escape(latest?.title||'No published map')+'</p><p>'+publishedPins.length+' revealed place'+(publishedPins.length===1?'':'s')+'</p></section><section><h3>Your private draft</h3><p>'+escape(input.title)+'</p><p>'+draftPins.size+' revealed place'+(draftPins.size===1?'':'s')+' · '+normalized.pins.filter(pin=>!pin.revealed).length+' hidden place'+(normalized.pins.filter(pin=>!pin.revealed).length===1?'':'s')+' kept privately</p></section></div>'+(latest?.imagePath!==input.imagePath?'<p><strong>The map pictures differ.</strong> Your draft keeps its selected picture. Check place positions before publishing.</p>':'')+(latest?.previewPath!==input.previewPath?'<p>The overview pictures differ.</p>':'')+'<h3>Changes to places shown to players</h3>'+ (changes.join('')||'<p>No changes to revealed places.</p>')+'<p>Keeping your draft saves its current text, pictures, positions and hidden places against the reviewed publication. The published map stays unchanged. A later Publish changes will replace the published title, picture and revealed places with this draft.</p>'+(newerDraft?'<p role="alert">A newer saved private draft exists. Your local edits are kept here. Download a backup, close this review and select Refresh to load that saved draft. This review cannot replace it.</p>':'')+'<p role="status" data-publication-status></p><div class="journal-actions">'+(!newerDraft?'<button type="button" class="btn-primary" data-publication-keep>Keep my draft for review</button>':'')+'<button type="button" data-publication-download>Download my draft backup</button><button type="button" data-publication-cancel>Close review</button></div>';
   const close=()=>{if(s.busy)return;dialog.close();dialog.remove();s.root.querySelector('[data-map-review-publication]')?.focus();};
   dialog.querySelector('[data-publication-cancel]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
   dialog.querySelector('[data-publication-download]').onclick=()=>{if(!valid()||s.busy)return;const blob=new Blob([JSON.stringify({version:1,campaignId:s.campaignId,mapId:s.mapId,draft:input},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='map-draft-'+s.mapId+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
   dialog.querySelector('[data-publication-keep]')?.addEventListener('click',async()=>{
    if(!valid()||s.busy)return;s.busy=true;dialog.querySelectorAll('button').forEach(button=>button.disabled=true);const message=dialog.querySelector('[data-publication-status]');message.textContent='Keeping your private draft…';
    try{
     const next=await s.store.saveDraft({campaignId:s.campaignId,input,revision:input.revision,sourceRevision:publishedRevision,isCurrent:valid});if(!valid())return;
     s.draft=next;s.map=latest;s.pins=publishedPins;s.mapDirty=false;s.publicationConflict=false;s.repairResults=null;revoke(s);dialog.close();dialog.remove();
     status(s,'Your private draft is ready for review. Nothing was published. Check your draft, then choose Publish changes when ready.');
     try{await subscribePins(s);}catch{if(allowed(s))status(s,'Your private draft was saved. Published places could not reload; select Refresh to retry. Nothing was published.');}
    }catch(error){if(valid())message.textContent='Your draft was not replaced. Nothing was published. '+error.message+' Close this review and review the latest changes again.';}
    finally{s.busy=false;if(allowed(s)){paint(s);if(dialog.isConnected)dialog.querySelectorAll('button').forEach(button=>button.disabled=false);}}
   });
   document.body.append(dialog);dialog.showModal();dialog.querySelector('button')?.focus();
  }catch(error){if(allowed(s))status(s,'Could not review publication changes. Your local draft is kept. '+error.message);}
  finally{s.busy=false;if(allowed(s))paint(s);}
 }
 function repairReport(s){
  if(!s.repairResults?.length||s.preview||!editable(s))return '';
  const labels={verified:'Already readable · verified',repaired:'Player copy repaired',rebuilt:'New copy prepared · publish required',failed:'Could not repair'};
  return '<section class="map-repair-report" aria-labelledby="mapRepairHeading"><h3 id="mapRepairHeading">Image access check</h3><p>Checks protected image bytes. Player access also requires the current Firestore rules and a published map or pin. Private draft pictures stay private.</p><ul>'+s.repairResults.map(row=>'<li><strong>'+escape(row.label)+'</strong> · '+escape(labels[row.status]||row.status)+(row.privateOnly?' · private draft':'')+(row.message?'<p>'+escape(row.message)+'</p>':'')+'</li>').join('')+'</ul></section>';
 }
 function paint(s){
  if(!allowed(s))return;
  const dm=editable(s),manager=canManageCampaign(),edit=working(s),map=displayed(s),pins=places(s).slice().sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  if(edit&&s.pinEditor){const index=pins.findIndex(pin=>pin.id===s.pinEditor.id);if(index<0)pins.push(s.pinEditor);else pins[index]=s.pinEditor;}
  const selected=pins.find(pin=>pin.id===s.selected),form=edit?s.pinEditor:null,world=s.worlds.find(entry=>entry.id===selected?.worldEntryId);
  s.root.innerHTML=`<section class="campaign-map" aria-labelledby="campaignMapTitle" data-no-context-help>
   ${mapNavigation(s)}<header class="map-heading"><div><p class="journal-eyebrow">${escape(activeCampaign.name)} / ${s.mode==='dm'?'DM WORKSPACE · MAPS':'JOURNAL'}</p><h2 id="campaignMapTitle">${escape(map?.title||'Campaign map')}</h2><p>${s.preview?'Player preview · last published map':edit?'DM workspace · private draft':'Discover the places your party has uncovered.'}</p></div>
   <div class="journal-actions">${dm?`<button type="button" data-map-preview ${s.busy||!s.ready?'disabled':''}>${s.preview?'Back to DM draft':'Preview as player'}</button>${!s.preview?`<button type="button" class="btn-primary" data-map-publish ${s.busy||!s.ready||publicationConflict(s)||(s.pinDirty&&!s.drawing)?'disabled':''}>Publish changes</button>`:''}`:s.mode!=='dm'&&manager?'<button type="button" data-map-edit>Manage map</button>':''}<button type="button" data-map-refresh ${s.busy?'disabled':''}>Refresh</button></div></header>
   <p role="status" aria-live="polite" data-map-status>${escape(s.message)}</p>
   ${s.mode==='dm'&&manager&&!s.preview?`<div class="journal-actions map-management-actions" role="group" aria-label="DM map actions"><button type="button" data-map-copy ${!dm||s.busy||!s.ready||s.pinDirty||!s.draft?.pins.length?'disabled':''}>Copy pins…</button><button type="button" data-map-clone ${!dm||s.busy||!s.ready||s.pinDirty||!s.draft?.imagePath||s.maps.length>=50?'disabled':''}>Clone map…</button><button type="button" class="btn-danger" data-map-delete ${!dm||s.busy||!s.ready||!s.map?.revision&&!s.draft?.revision&&!dirty(s)?'disabled':''}>Delete map</button></div>`:''}
   ${edit&&publicationConflict(s)?`<section class="map-publication-conflict" role="alert"><h3>Review publication changes</h3><p>Your private draft is based on a different publication. Refresh reloads the same saved draft. Review the latest published map before preparing your draft for publication.</p><button type="button" data-map-review-publication ${s.busy||s.pinDirty?'disabled':''}>Review publication changes…</button>${s.pinDirty?'<p>Keep or cancel your place edits first.</p>':''}</section>`:''}
   ${repairReport(s)}
   ${edit?`<section class="map-settings" aria-label="Private map draft"><label><span>Map name</span><input data-map-title maxlength="160" value="${escape(s.draft.title)}" ${s.busy?'disabled':''}></label><label><span>${s.draft.imagePath?'Replace map image':'Upload a map'}</span><input data-map-file type="file" accept="image/png,image/jpeg,image/webp" ${s.busy?'disabled':''}></label><p class="map-hint">PNG, JPEG or WebP · up to 50 MB.</p><details class="map-upload-notes"><summary>Image quality and replacing maps</summary><p class="map-hint">The original image is preserved. A fast overview loads first when available; zoom in for original detail. Replacing an image keeps this map’s places; check their positions before publishing. Players keep seeing its last published version.</p></details><button type="button" data-map-save ${s.busy||publicationConflict(s)||(s.pinDirty&&!s.drawing)?'disabled':''}>Save private draft</button>${s.draft.imagePath||s.map?.imagePath?` <button type="button" data-map-repair ${s.busy?'disabled':''}>Repair image access</button><p class="map-hint">Checks the player-access copy of each picture and repairs missing or damaged copies. Originals and image quality are preserved. A rebuilt copy may need Publish changes before players can see it.</p>`:''}</section>`:''}
   <div class="map-layout"><div><div class="map-canvas ${s.placing||s.drawing?'map-placing':''} ${s.drawing?'map-drawing':''}" data-map-canvas tabindex="0" aria-label="Campaign map. Drag to pan when zoomed, or use the arrow keys.">
   <div class="map-scene" data-map-scene>${map?.imagePath?`<img data-map-image alt="${escape(map.title)}">${regionLayer(s,pins)}${pathLayer(s,pins)}${pins.map(pin=>`<button type="button" class="map-pin map-style-${store.markerStyles.indexOf(pin.markerStyle||'City')} ${pin.type==='Region'?'map-pin-region':''} ${pathType(pin.type)?'map-pin-path map-pin-path-'+pin.type.toLowerCase():''} ${edit&&!pin.revealed?'map-pin-private':''}" data-map-pin="${escape(pin.id)}" style="left:clamp(24px,${pin.x}%,calc(100% - 24px));top:clamp(24px,${pin.y}%,calc(100% - 24px))" aria-label="${escape(pin.name||'New place')}${edit&&!pin.revealed?' (DM only)':''}" aria-pressed="${pin.id===s.selected}"><span aria-hidden="true">${pathType(pin.type)?(pin.type==='Road'?'━':'⇢'):pin.type==='Region'?'◇':icons[pin.markerStyle||'City']||'●'}</span> ${escape(pin.name||'New place')}</button>`).join('')}`:`<div class="map-empty"><h3>${s.ready?'Your world starts here':'Loading map…'}</h3><p>${s.draftUnavailable?'Map setup is unavailable. Check the access message above, then select Refresh.':s.mode==='dm'?'Upload a map above to start preparing places.':'Your DM has not published a map yet.'}</p></div>`}</div>
   ${map?.imagePath?'<div class="map-legend" aria-hidden="true">● Location · ▣ City · ♜ Castle · ▲ Landmark · ✦ Interest · ◇ Region · ━ Road · ┄ Party route</div><div class="map-zoom"><button type="button" data-map-zoom="out" aria-label="Zoom out">−</button><button type="button" data-map-zoom="in" aria-label="Zoom in">+</button><button type="button" data-map-reset>Reset view</button></div>':''}<div class="map-hover" data-map-hover hidden></div></div>
   ${edit&&s.draft.imagePath?`<div class="journal-actions map-add"><button type="button" data-map-add ${s.busy?'disabled':''}>+ Add a place</button>${form&&form.type==='City'?'<button type="button" data-map-move>Move this pin</button>':''}<button type="button" data-map-add-region>Add a region area</button><button type="button" data-map-add-path="Road">Draw a road</button><button type="button" data-map-add-path="Travelled">Mark party route</button></div>`:''}
   ${map?.imagePath?'<p class="map-hint" data-map-quality role="status">Loading map…</p>':''}<p class="map-hint">Hover or focus a pin for a quick look. Click or tap to read more.</p><div class="map-places" role="group" aria-label="Places on this map">${pins.map(pin=>`<button type="button" data-map-place="${escape(pin.id)}" aria-pressed="${pin.id===s.selected}">${escape(pin.name||'New place')}${edit&&!pin.revealed?' · DM only':''}</button>`).join('')}</div></div>
   <aside class="map-place-panel" aria-label="Place details">${form?pinForm(s,form):selected?`<div class="map-hint">${escape(pathType(selected.type)?typeLabel(selected.type):selected.type==='Region'?'Region':selected.markerStyle||'City')}</div><h3 data-place-heading tabindex="-1">${escape(selected.name)}</h3>${pictureMarkup(selected)}<div class="map-prose">${escape(selected.description||'No description added yet.')}</div>${world?'<button type="button" data-map-more>See more in World Builder →</button>':selected.worldEntryId?'<p class="map-hint">The linked World entry is not currently shared.</p>':''}${edit?`<div class="journal-actions"><button type="button" data-pin-edit>${pathType(selected.type)?'Edit '+typeLabel(selected.type).toLowerCase():'Edit place'}</button><button type="button" data-pin-copy ${s.busy||!s.ready||s.pinDirty?'disabled':''}>Copy pin to another map…</button><button type="button" data-pin-delete>${pathType(selected.type)?'Remove '+typeLabel(selected.type).toLowerCase():'Remove place'}</button></div>`:''}`:'<div class="map-hint">YOUR NEXT DISCOVERY</div><h3>Every place has a story</h3><p>Choose a city or region on the map to read what your party knows about it.</p>'}</aside></div></section>`;
  s.root.querySelector('[data-map-refresh]').onclick=()=>render(s.mode,s.mapId,s.preview);
  bindMapNavigation(s);
  s.root.querySelector('[data-map-review-publication]')?.addEventListener('click',()=>reviewPublication(s));
  s.root.querySelector('[data-map-edit]')?.addEventListener('click',()=>{nextMapId={mapId:s.mapId,campaignId:s.campaignId,uid:s.uid};showTab('dm-map');});
  s.root.querySelector('[data-map-preview]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;if(s.pinDirty){status(s,'Save or cancel your place before switching views.');return;}s.preview=!s.preview;revoke(s);if(!s.preview)s.editing=true;s.selected=null;paint(s);});
  s.root.querySelector('[data-map-title]')?.addEventListener('input',event=>{s.draft.title=event.target.value;changed(s);});
  s.root.querySelector('[data-map-file]')?.addEventListener('change',event=>upload(s,event.target.files?.[0]));
  s.root.querySelector('[data-map-save]')?.addEventListener('click',()=>saveDraft(s));
  s.root.querySelector('[data-map-repair]')?.addEventListener('click',()=>repairImages(s));
  s.root.querySelector('[data-map-publish]')?.addEventListener('click',()=>publish(s));
  s.root.querySelectorAll('[data-map-pin],[data-map-place],[data-map-region],[data-map-path]').forEach(button=>{const id=button.dataset.mapPin||button.dataset.mapPlace||button.dataset.mapRegion||button.dataset.mapPath;button.onclick=event=>{if((button.dataset.mapRegion||button.dataset.mapPath)&&(s.drawing||s.placing))return;event.stopPropagation();choosePin(s,id);};if(button.dataset.mapPin){button.onpointerenter=()=>hover(s,pins.find(pin=>pin.id===id));button.onfocus=()=>hover(s,pins.find(pin=>pin.id===id));}});
  s.root.querySelector('[data-map-add]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;if(s.pinDirty){status(s,'Save or cancel your current place first.');return;}if(s.draft.pins.length>=100){status(s,'This map has reached its 100-place limit.');return;}s.placing=true;paint(s);status(s,'Click a spot on the map, or choose Place at centre.');});
  s.root.querySelector('[data-map-move]')?.addEventListener('click',()=>{s.placing=true;status(s,'Click the new location on the map.');});
  if(s.placing&&!s.pinEditor){const button=document.createElement('button');button.type='button';button.className='map-keyboard-place';button.textContent='Place at centre';button.onclick=()=>placeAt(s,50,50);s.root.querySelector('.map-place-panel').append(button);}
  s.root.querySelector('[data-pin-edit]')?.addEventListener('click',()=>{s.pinEditor=pinDefaults(selected);paint(s);s.root.querySelector('[data-pin-name]').focus();});
  s.root.querySelector('[data-pin-copy]')?.addEventListener('click',()=>copyDialog(s,false,selected?.id));
  s.root.querySelector('[data-pin-delete]')?.addEventListener('click',()=>remove(s,selected));
  s.root.querySelector('[data-pin-cancel]')?.addEventListener('click',async()=>{if(s.busy)return;if(s.pinDirty&&!await SiteConfirmation.ask({title:'Discard this place’s edits?',paragraphs:['Your saved draft and published map stay unchanged.'],confirmLabel:'Discard changes'}))return;if(!allowed(s))return;s.pinEditor=null;s.pinDirty=false;s.drawing=false;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;paint(s);});
  bindRegion(s);bindPaths(s);bindForm(s);bindCanvas(s);loadPictures(s);
  s.root.querySelector('[data-map-more]')?.addEventListener('click',()=>openWorld(s,selected.worldEntryId));
 }
 function pinForm(s,pin){return `<form data-map-pin-form><h3 data-place-heading tabindex="-1">${pathType(pin.type)?'Edit '+typeLabel(pin.type).toLowerCase():'Edit place'}</h3>
  <label><span>Name</span><input data-pin-name maxlength="100" required value="${escape(pin.name)}" ${s.busy?'disabled':''}></label>
  <label><span>Place type</span><select data-pin-type ${s.busy?'disabled':''}><option value="City">Location / city</option><option ${pin.type==='Region'?'selected':''}>Region</option><option value="Road" ${pin.type==='Road'?'selected':''}>Road</option><option value="Travelled" ${pin.type==='Travelled'?'selected':''}>Party route · travelled</option></select></label>
  ${pathType(pin.type)?pathControls(s,pin):pin.type==='Region'?regionControls(s,pin):`<label><span>Marker style</span><select data-pin-markerStyle>${store.markerStyles.map(style=>`<option ${style===(pin.markerStyle||'City')?'selected':''}>${escape(style)}</option>`).join('')}</select></label><div class="map-marker-preview" aria-label="Selected marker style">${icons[pin.markerStyle||'City']} ${escape(pin.markerStyle||'City')}</div>`}
  <label><span>Description</span><textarea data-pin-description maxlength="2000" rows="6" ${s.busy?'disabled':''}>${escape(pin.description)}</textarea></label>
  <label class="map-reveal"><input data-pin-revealed type="checkbox" ${pin.revealed?'checked':''} ${s.busy?'disabled':''}><span>Reveal to players when published</span></label>
  <label><span>World Builder entry</span><select data-pin-worldEntryId ${s.busy?'disabled':''}><option value="">No linked entry</option>${s.worlds.map(entry=>`<option value="${escape(entry.id)}" ${pin.worldEntryId===entry.id?'selected':''}>${escape(entry.title)}</option>`).join('')}${pin.worldEntryId&&!s.worlds.some(entry=>entry.id===pin.worldEntryId)?`<option selected value="${escape(pin.worldEntryId)}">Unavailable / private entry</option>`:''}</select></label><p class="map-hint">Only shared World entries are offered. Publishing a map never shares a private World entry.</p>
  <label><span>Place picture (optional)</span><input data-pin-picture type="file" accept="image/png,image/jpeg,image/webp" ${s.busy?'disabled':''}></label>
  ${pin.picturePath?`${pictureMarkup(pin)}<label><span>Picture description</span><input data-pin-pictureAlt maxlength="200" required value="${escape(pin.pictureAlt)}" ${s.busy?'disabled':''}></label><button type="button" data-picture-remove ${s.busy?'disabled':''}>Remove picture</button>`:''}
  <details><summary>${pathType(pin.type)?'Label position':'Pin position'}</summary><div class="map-coordinates"><label><span>Horizontal %</span><input data-pin-x type="number" min="0" max="100" step="0.1" required value="${pin.x}"></label><label><span>Vertical %</span><input data-pin-y type="number" min="0" max="100" step="0.1" required value="${pin.y}"></label></div></details>
  <p class="map-hint">This updates your working draft. Players see changes only after Publish changes.</p><div class="journal-actions"><button type="submit" class="btn-primary" ${s.busy?'disabled':''}>Keep ${pathType(pin.type)?'route':'place'} in draft</button><button type="button" data-pin-cancel ${s.busy?'disabled':''}>Cancel</button></div></form>`;}
 function bindForm(s){const form=s.root.querySelector('[data-map-pin-form]');if(!form)return;form.onsubmit=event=>{event.preventDefault();if(!editable(s)||s.busy)return;if(requireFinishedBoundary(s))return;try{if(s.pinEditor.type==='Region'&&!s.pinEditor.boundary?.length){status(s,'Draw a boundary for this region, or choose City for a point marker.');return;}const pins=s.draft.pins.filter(pin=>pin.id!==s.pinEditor.id).concat(s.pinEditor);s.store.normalizeDraft(s.campaignId,{...s.draft,pins});s.draft.pins=pins;s.pinEditor=null;s.pinDirty=false;changed(s);paint(s);}catch(error){showRegionBoundaryError(s,error);}};
  for(const field of ['name','description','type','markerStyle','revealed','worldEntryId','pictureAlt','x','y']){const input=form.querySelector('[data-pin-'+field+']');if(input)input.oninput=event=>{if(!editable(s)||s.busy)return;const previousType=s.pinEditor.type;s.pinEditor[field]=['x','y'].includes(field)?Number(event.target.value):field==='revealed'?event.target.checked:event.target.value;s.pinDirty=true;if(field==='type'){s.drawing=false;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;if(previousType!==s.pinEditor.type&&!(pathType(previousType)&&pathType(s.pinEditor.type)))s.pinEditor.boundary=[];if(s.pinEditor.type!=='Region')delete s.pinEditor.regionStyle;paint(s);}if(field==='markerStyle'){const preview=form.querySelector('.map-marker-preview');if(preview)preview.textContent=icons[s.pinEditor.markerStyle]+' '+s.pinEditor.markerStyle;}};}
  form.querySelector('[data-pin-picture]').onchange=event=>upload(s,event.target.files?.[0],true);
  form.querySelector('[data-picture-remove]')?.addEventListener('click',()=>{s.pinEditor.picturePath='';s.pinEditor.pictureAlt='';s.pinDirty=true;paint(s);});
 }
 function regionLayer(s,pins){
  const regions=pins.filter(pin=>pin.type==='Region'&&pin.boundary?.length);
  if(!regions.length)return '';
  return `<svg class="map-region-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${regions.map(pin=>`<polygon data-map-region="${escape(pin.id)}" style="--map-region-color:${store.regionStyle(pin.regionStyle).color};--map-region-opacity:${store.regionStyle(pin.regionStyle).opacity}" class="${pin.id===s.selected?'map-region-selected':''} ${working(s)&&!pin.revealed?'map-region-private':''}" points="${pin.boundary.map(p=>Number(p.x)+','+Number(p.y)).join(' ')}"/>`).join('')}${regionCrossingLines(s)}</svg>${regionCornerLabels(s)}`;
 }
 function regionCrossingLines(s){
  if(!working(s)||!s.pinEditor||!s.regionCrossing)return '';
  const points=s.pinEditor.boundary;
  return [s.regionCrossing.first,s.regionCrossing.second].map(index=>{const a=points[index],b=points[(index+1)%points.length];return `<line class="map-region-crossing-underlay" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><line class="map-region-crossing-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;}).join('');
 }
 function regionCornerLabels(s){
  if(!working(s)||!s.pinEditor||!s.regionRepair)return '';
  const points=s.pinEditor.boundary,indices=new Set([s.editCorner]);
  if(s.regionCrossing)for(const index of [s.regionCrossing.first,s.regionCrossing.second]){indices.add(index);indices.add((index+1)%points.length);}
  return [...indices].filter(index=>points[index]).map(index=>`<span class="map-corner-label ${s.regionCrossing?'map-corner-conflict':''}" data-region-corner="${index}" style="left:clamp(12px,${points[index].x}%,calc(100% - 12px));top:clamp(12px,${points[index].y}%,calc(100% - 12px))" aria-hidden="true">${index+1}</span>`).join('');
 }
 function refreshRegionCrossing(s){if(s.regionRepair)s.regionCrossing=store.boundaryCrossing(s.pinEditor.boundary);}
 function showRegionBoundaryError(s,error){
  if(!error.regionCrossing){status(s,error.message);return;}
  s.regionCrossing=error.regionCrossing;s.regionRepair=true;s.drawing=true;s.regionNeedsFinish=false;s.editCorner=(error.regionCrossing.first+1)%s.pinEditor.boundary.length;
  paint(s);status(s,error.message);const selector=s.root.querySelector('[data-region-edit-corner]');selector?.focus({preventScroll:true});selector?.scrollIntoView({block:'center'});
 }
 function regionRepairControls(s,pin){
  if(!s.regionRepair)return '';
  s.editCorner=Math.max(0,Math.min(s.editCorner||0,pin.boundary.length-1));const point=pin.boundary[s.editCorner];
  return `<section class="map-region-repair" aria-label="Adjust region corners">${s.regionCrossing?`<p role="alert" class="map-region-crossing-message">${escape(s.regionCrossing.message)} The highlighted lines cross. The last corner connects back to corner 1.</p>`:`<p role="status">${pin.boundary.length<3?'Add at least three corners to finish this boundary.':'No crossing lines. Finish boundary when you are ready.'}</p>`}<h4>Adjust a corner</h4><p>Choose a numbered corner, change its position or remove it. The rest of your outline is kept.</p>${point?`<label><span>Corner</span><select data-region-edit-corner>${pin.boundary.map((_,index)=>`<option value="${index}" ${index===s.editCorner?'selected':''}>Corner ${index+1}</option>`).join('')}</select></label><div class="map-coordinates"><label><span>Corner horizontal %</span><input data-region-edit-x required type="number" min="0" max="100" step="0.1" value="${point.x}"></label><label><span>Corner vertical %</span><input data-region-edit-y required type="number" min="0" max="100" step="0.1" value="${point.y}"></label></div><div class="journal-actions"><button type="button" data-region-update-corner>Update corner</button><button type="button" data-region-remove-corner>Remove this corner</button></div>`:''}</section>`;
 }
 function requireFinishedBoundary(s){
  if(!s.drawing)return false;
  s.regionNeedsFinish=true;paint(s);status(s,pathType(s.pinEditor?.type)?'Finish your route, then keep it in your draft before saving or publishing.':'Finish your region boundary, then keep the place in your draft before saving or publishing.');
  const button=s.root.querySelector('[data-region-finish],[data-route-finish]');button?.focus({preventScroll:true});button?.scrollIntoView({block:'center'});return true;
 }
 function regionControls(s,pin){const style=store.regionStyle(pin.regionStyle),transparency=Math.round((1-style.opacity)*100);return `<section class="map-region-tools ${s.drawing&&s.regionNeedsFinish?'map-region-needs-finish':''}"><h4>Region boundary</h4><p>Outline an area on the map with 3–${store.maxRegionCorners} corners. Its name and description belong to the whole area.</p><p role="status">${(pin.boundary||[]).length} of ${store.maxRegionCorners} corners${s.drawing?' · Drawing':''}</p><div class="journal-actions"><button type="button" data-region-draw>${pin.boundary?.length?'Redraw boundary':'Draw boundary'}</button>${s.drawing?`<button type="button" data-region-undo>Undo corner</button><button type="button" data-region-finish ${s.regionNeedsFinish?'aria-describedby="mapRegionFinishHelp"':''}>Finish boundary</button>`:''}</div>${s.drawing&&s.regionNeedsFinish?'<p id="mapRegionFinishHelp" class="map-region-next-step"><strong>Next step: Finish boundary.</strong> Then choose Keep place in draft before saving or publishing.</p>':''}${s.drawing?'<div class="map-coordinates"><label>Corner horizontal %<input data-corner-x type="number" min="0" max="100" step="0.1" value="50"></label><label>Corner vertical %<input data-corner-y type="number" min="0" max="100" step="0.1" value="50"></label></div><button type="button" data-corner-add>Add corner at coordinates</button>':''}${regionRepairControls(s,pin)}<div class="map-region-appearance"><h4>Region appearance</h4><div class="map-region-style-controls"><label><span>Area colour</span><input type="color" data-region-color value="${style.color}" ${s.busy?'disabled':''}></label><label><span>Transparency</span><input type="range" data-region-transparency min="0" max="100" step="1" value="${transparency}" aria-describedby="mapRegionTransparencyHelp" ${s.busy?'disabled':''}><output data-region-transparency-value>${transparency}% transparent</output></label></div><p id="mapRegionTransparencyHelp" class="map-hint">0% is solid; 100% shows only the outline. Preview changes on the map. Players see this appearance after publishing.</p></div></section>`;}
 function addCorner(s,x,y){if(!editable(s)||s.busy||!s.drawing||!['Region','Road','Travelled'].includes(s.pinEditor?.type))return;
  const points=s.pinEditor.boundary||=[];if(points.length>=store.maxRegionCorners){status(s,'Maximum '+store.maxRegionCorners+' corners. Finish the boundary or undo a corner.');return;}
  if(![x,y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)){status(s,'Corner positions must be between 0 and 100.');return;}
  points.push({x:Math.round(x*10)/10,y:Math.round(y*10)/10});s.pinDirty=true;refreshRegionCrossing(s);paint(s);status(s,pathType(s.pinEditor.type)?points.length+' route points. Add another point or finish the route.':points.length+' corners. Add another corner or finish the boundary.');
 }
 function updateRegionAppearance(s){
  if(!editable(s)||s.busy||s.pinEditor?.type!=='Region')return;
  const color=s.root.querySelector('[data-region-color]').value,transparency=Number(s.root.querySelector('[data-region-transparency]').value);
  s.pinEditor.regionStyle=store.regionStyle({color,opacity:(100-transparency)/100});s.pinDirty=true;
  s.root.querySelector('[data-region-transparency-value]').textContent=transparency+'% transparent';
  for(const node of s.root.querySelectorAll('[data-map-region]'))if(node.dataset.mapRegion===s.pinEditor.id){node.style.setProperty('--map-region-color',color);node.style.setProperty('--map-region-opacity',s.pinEditor.regionStyle.opacity);}
  // Keep input focus and the current outline while previewing slider/colour changes.
  for(const button of s.root.querySelectorAll('[data-map-save],[data-map-publish]'))button.disabled=!s.drawing;
 }
 function bindRegion(s){
  s.root.querySelector('[data-region-edit-corner]')?.addEventListener('change',event=>{if(!editable(s)||s.busy)return;s.editCorner=Number(event.target.value);paint(s);s.root.querySelector('[data-region-edit-corner]')?.focus({preventScroll:true});});
  s.root.querySelector('[data-region-update-corner]')?.addEventListener('click',()=>{
   if(!editable(s)||s.busy)return;const x=s.root.querySelector('[data-region-edit-x]'),y=s.root.querySelector('[data-region-edit-y]');if(!x.reportValidity()||!y.reportValidity())return;
   s.pinEditor.boundary[s.editCorner]={x:Math.round(x.valueAsNumber*10)/10,y:Math.round(y.valueAsNumber*10)/10};s.pinDirty=true;refreshRegionCrossing(s);paint(s);status(s,s.regionCrossing?s.regionCrossing.message:'Corner updated. Finish boundary when ready.');s.root.querySelector('[data-region-edit-corner]')?.focus({preventScroll:true});
  });
  s.root.querySelector('[data-region-remove-corner]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;s.pinEditor.boundary.splice(s.editCorner,1);s.pinDirty=true;refreshRegionCrossing(s);paint(s);status(s,s.regionCrossing?s.regionCrossing.message:'Corner removed. Add corners or finish the boundary.');s.root.querySelector('[data-region-edit-corner]')?.focus({preventScroll:true});});

  s.root.querySelector('[data-region-color]')?.addEventListener('input',()=>updateRegionAppearance(s));
  s.root.querySelector('[data-region-transparency]')?.addEventListener('input',()=>updateRegionAppearance(s));
  s.root.querySelector('[data-map-add-region]')?.addEventListener('click',()=>{
   if(!editable(s)||s.busy)return;if(s.pinDirty){status(s,'Keep or cancel your current place first.');return;}if(s.draft.pins.length>=100){status(s,'This map has reached its 100-place limit.');return;}
   s.pinEditor=pinDefaults({id:crypto.randomUUID(),name:'',description:'',type:'Region',x:50,y:50,revealed:false});s.selected=s.pinEditor.id;s.pinDirty=true;s.drawing=true;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;s.placing=false;paint(s);s.root.querySelector('[data-pin-name]').focus();status(s,'Name the region, then click its boundary corners on the map.');
  });
  s.root.querySelector('[data-region-draw]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;s.pinEditor.boundary=[];s.drawing=true;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;s.placing=false;s.pinDirty=true;paint(s);status(s,'Click 3–'+store.maxRegionCorners+' corners around your region.');});
  s.root.querySelector('[data-region-undo]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;s.pinEditor.boundary.pop();s.pinDirty=true;refreshRegionCrossing(s);paint(s);});
  s.root.querySelector('[data-corner-add]')?.addEventListener('click',()=>{const x=s.root.querySelector('[data-corner-x]'),y=s.root.querySelector('[data-corner-y]');if(!x.reportValidity()||!y.reportValidity())return;addCorner(s,x.valueAsNumber,y.valueAsNumber);});
  s.root.querySelector('[data-region-finish]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;try{const points=store.boundary(s.pinEditor.boundary,'Region');if(points.length<3)throw Error('Add at least three corners.');s.pinEditor.x=Math.round(points.reduce((n,p)=>n+p.x,0)/points.length*10)/10;s.pinEditor.y=Math.round(points.reduce((n,p)=>n+p.y,0)/points.length*10)/10;s.drawing=false;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;paint(s);status(s,'Boundary ready. Keep the place in your draft, then publish when ready.');}catch(error){showRegionBoundaryError(s,error);}});
 }
 function pathLayer(s,pins){
  const paths=pins.filter(pin=>pathType(pin.type)&&pin.boundary?.length);if(!paths.length)return '';
  return `<svg class="map-region-layer map-path-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths.map(pin=>`<polyline class="map-path-underlay" points="${pin.boundary.map(p=>p.x+','+p.y).join(' ')}"/><polyline data-map-path="${escape(pin.id)}" class="map-path map-path-${pin.type.toLowerCase()} ${pin.id===s.selected?'map-path-selected':''} ${working(s)&&!pin.revealed?'map-path-private':''}" points="${pin.boundary.map(p=>p.x+','+p.y).join(' ')}"/>${working(s)&&s.pinEditor?.id===pin.id?pin.boundary.map((p,index)=>`<circle class="map-path-point" cx="${p.x}" cy="${p.y}" r=".55"/>`).join(''):''}`).join('')}</svg>`;
 }
 function pathControls(s,pin){
  s.editCorner=Math.max(0,Math.min(s.editCorner||0,pin.boundary.length-1));const point=pin.boundary[s.editCorner];
  return `<section class="map-region-tools ${s.drawing&&s.regionNeedsFinish?'map-region-needs-finish':''}"><h4>${typeLabel(pin.type)}</h4><p>${pin.type==='Road'?'Draw a road or trail that exists on this map.':'Trace where the party has travelled, in journey order.'} Add 2–${store.maxRegionCorners} points. The line stays open and can cross itself or return to an earlier place.</p><p role="status">${pin.boundary.length} of ${store.maxRegionCorners} points${s.drawing?' · Drawing':''}</p><div class="journal-actions"><button type="button" data-route-continue>${pin.boundary.length?'Continue route':'Start drawing'}</button><button type="button" data-route-redraw>Redraw route</button>${s.drawing?`<button type="button" data-route-undo>Undo point</button><button type="button" data-route-finish>Finish route</button>`:''}</div>${s.drawing&&s.regionNeedsFinish?'<p class="map-region-next-step" role="alert"><strong>Next step: Finish route.</strong> Then choose Keep route in draft.</p>':''}${s.drawing?'<div class="map-coordinates"><label>Point horizontal %<input data-corner-x type="number" min="0" max="100" step="0.1" value="50"></label><label>Point vertical %<input data-corner-y type="number" min="0" max="100" step="0.1" value="50"></label></div><button type="button" data-route-add-point>Add point at coordinates</button>':''}${point?`<details><summary>Adjust route points</summary><label><span>Point</span><select data-route-point>${pin.boundary.map((_,index)=>`<option value="${index}" ${index===s.editCorner?'selected':''}>Point ${index+1}</option>`).join('')}</select></label><div class="map-coordinates"><label>Point horizontal %<input data-route-x type="number" required min="0" max="100" step="0.1" value="${point.x}"></label><label>Point vertical %<input data-route-y type="number" required min="0" max="100" step="0.1" value="${point.y}"></label></div><div class="journal-actions"><button type="button" data-route-update>Update point</button><button type="button" data-route-remove>Remove point</button></div></details>`:''}</section>`;
 }
 function bindPaths(s){
  s.root.querySelectorAll('[data-map-add-path]').forEach(button=>button.onclick=()=>{
   if(!editable(s)||s.busy)return;if(s.pinDirty){status(s,'Keep or cancel your current place first.');return;}if(s.draft.pins.length>=100){status(s,'This map has reached its 100-place limit.');return;}
   s.pinEditor=pinDefaults({id:crypto.randomUUID(),name:'',description:'',type:button.dataset.mapAddPath,x:50,y:50,revealed:false});s.selected=s.pinEditor.id;s.pinDirty=true;s.drawing=true;s.placing=false;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;s.editCorner=0;paint(s);s.root.querySelector('[data-pin-name]')?.focus();status(s,'Name the '+typeLabel(s.pinEditor.type).toLowerCase()+', then click points along it on the map.');
  });
  const redraw=clear=>{if(!editable(s)||s.busy)return;if(clear)s.pinEditor.boundary=[];s.drawing=true;s.placing=false;s.regionNeedsFinish=false;s.regionCrossing=null;s.regionRepair=false;s.pinDirty=true;paint(s);};
  s.root.querySelector('[data-route-continue]')?.addEventListener('click',()=>redraw(false));
  s.root.querySelector('[data-route-redraw]')?.addEventListener('click',()=>redraw(true));
  s.root.querySelector('[data-route-undo]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;s.pinEditor.boundary.pop();s.pinDirty=true;paint(s);});
  s.root.querySelector('[data-route-add-point]')?.addEventListener('click',()=>{const x=s.root.querySelector('[data-corner-x]'),y=s.root.querySelector('[data-corner-y]');if(x.reportValidity()&&y.reportValidity())addCorner(s,x.valueAsNumber,y.valueAsNumber);});
  s.root.querySelector('[data-route-finish]')?.addEventListener('click',()=>{
   if(!editable(s)||s.busy)return;try{const points=store.path(s.pinEditor.boundary);s.pinEditor.x=points[Math.floor(points.length/2)].x;s.pinEditor.y=points[Math.floor(points.length/2)].y;s.drawing=false;s.regionNeedsFinish=false;paint(s);status(s,'Route ready. Keep it in your draft, then publish when ready.');}catch(error){status(s,error.message);}
  });
  s.root.querySelector('[data-route-point]')?.addEventListener('change',event=>{if(!editable(s)||s.busy)return;s.editCorner=Number(event.target.value);paint(s);const controls=s.root.querySelector('[data-route-point]');controls?.closest('details')?.setAttribute('open','');controls?.focus();});
  s.root.querySelector('[data-route-update]')?.addEventListener('click',()=>{
   if(!editable(s)||s.busy)return;const x=s.root.querySelector('[data-route-x]'),y=s.root.querySelector('[data-route-y]');if(!x.reportValidity()||!y.reportValidity())return;
   const points=s.pinEditor.boundary.map((p,index)=>index===s.editCorner?{x:x.valueAsNumber,y:y.valueAsNumber}:p);try{store.path(points);s.pinEditor.boundary=points;s.pinDirty=true;paint(s);status(s,'Route point updated. Keep it in your draft.');}catch(error){status(s,error.message);}
  });
  s.root.querySelector('[data-route-remove]')?.addEventListener('click',()=>{if(!editable(s)||s.busy)return;if(s.pinEditor.boundary.length<=2){status(s,'A route needs two points. Redraw it or remove the whole route instead.');return;}const points=s.pinEditor.boundary.filter((_,i)=>i!==s.editCorner);try{store.path(points);s.pinEditor.boundary=points;s.pinDirty=true;paint(s);}catch(error){status(s,error.message);}});
 }
 function hover(s,pin){if(!allowed(s)||!pin)return;const host=s.root.querySelector('[data-map-hover]');host.innerHTML=`${pictureMarkup(pin,'map-hover-picture')}<strong>${escape(pin.name)}</strong><p>${escape(pin.description.slice(0,130))}${pin.description.length>130?'…':''}</p><small>Click or tap the pin to read more.</small>`;host.hidden=false;loadPictures(s);}
 function imageProblem(error) {
  if(error?.code==='permission-denied')return 'Firebase denied image access. Ask the DM to check the current Firestore rules and use Repair image access in Manage map.';
  if(error?.code==='storage/unauthorized')return 'Firebase denied the original image. Check campaign DM access, Storage rules and Storage cross-service permissions.';
  if(error?.code==='unauthenticated')return 'Sign in again, then reopen the map.';
  if(error?.code?.startsWith('map-media/'))return error.message;
  return 'Check your connection, then refresh to try again.';
 }
 async function cachedImage(s,path,limit=50*1024*1024){
  if(s.urls.has(path))return s.urls.get(path);if(s.pendingImages.has(path))return s.pendingImages.get(path);
  const epoch=s.imageEpoch||0,active=()=>allowed(s)&&(s.imageEpoch||0)===epoch;
  const pending=(async()=>{try{
   let blob;
   try{blob=await media.load({campaignId:s.campaignId,mapId:s.mapId,path,limit,isCurrent:active});}
   catch(error){
    // The DM can still see an older private original before repairing it.
    // Player preview exercises the published copy without that DM fallback.
    if(!active()||!canManageCampaign()||s.preview)throw error;
    blob=await sdk.getBlob(sdk.ref(sdk.storage,path),limit);
   }
   if(!active())return null;const url=URL.createObjectURL(blob);s.urls.set(path,url);return url;
  }catch(error){if(active()&&limit===512*1024)s.failedPreviews.add(path);throw error;}finally{if(s.pendingImages.get(path)===pending)s.pendingImages.delete(path);}})();
  s.pendingImages.set(path,pending);return pending;
 }
 function loadPictures(s){const map=displayed(s),img=s.root.querySelector('[data-map-image]');if(img&&map?.imagePath)attachMapImage(s,img,map);s.root.querySelectorAll('[data-place-picture]').forEach(node=>attachImage(s,node,node.dataset.placePicture));}
 async function attachImage(s,node,path){
  try{const url=await cachedImage(s,path);if(allowed(s)&&node.isConnected&&url)node.src=url;}
  catch(error){if(!allowed(s)||!node.isConnected)return;
   const box=document.createElement('div'),text=document.createElement('p'),retry=document.createElement('button');box.className='map-picture-error';box.setAttribute('role','status');text.textContent='This picture could not be loaded. Your place description is still available.';retry.type='button';retry.textContent='Try picture again';retry.onclick=()=>{if(!allowed(s)||!box.isConnected)return;const image=node.cloneNode(false);image.removeAttribute('src');box.replaceWith(image);attachImage(s,image,path);};box.append(text,retry);
   if(canManageCampaign()&&!s.preview){const repair=document.createElement('button'),details=document.createElement('details'),summary=document.createElement('summary'),reason=document.createElement('p');repair.type='button';repair.textContent='Repair this picture';repair.onclick=()=>{if(box.isConnected)repairImages(s,[path]);};summary.textContent='Image details';reason.textContent=imageProblem(error);details.append(summary,reason);box.append(repair,details);}
   else{const help=document.createElement('p');help.textContent='If retrying does not help, ask your DM to repair this picture’s image access.';box.append(help);}node.replaceWith(box);
  }
 }
 function quality(s,message){const node=s.root.querySelector('[data-map-quality]');if(allowed(s)&&node)node.textContent=message;}
 async function attachMapImage(s,node,map){
  const prefix=s.store.imagePrefix(s.campaignId),candidate=map.previewPath;
  const preview=typeof candidate==='string'&&candidate.startsWith(prefix)&&/^[A-Za-z0-9_-]{1,100}$/.test(candidate.slice(prefix.length))?candidate:null;
  const overview=preview&&s.zoom===1&&!s.failedPreviews.has(preview),path=overview?preview:map.imagePath;
  if(mapImageRequests.get(node)?.path===path)return;
  const request={path};mapImageRequests.set(node,request);
  const valid=()=>allowed(s)&&node.isConnected&&mapImageRequests.get(node)===request;
  quality(s,overview?'Loading map overview…':'Loading original detail…');
  function failed(error){
   if(!valid())return;node.onerror=null;node.onload=null;
   if(overview){s.failedPreviews.add(preview);attachMapImage(s,node,map);}
   else {const fallback=preview&&s.urls.get(preview);if(fallback)node.src=fallback;quality(s,'Original detail could not load. '+imageProblem(error));if(!node.src)node.replaceWith(Object.assign(document.createElement('p'),{textContent:'Image unavailable. '+imageProblem(error)}));}
  }
  try{
   const url=await cachedImage(s,path,overview?512*1024:50*1024*1024);
   if(!valid()||!url)return;
   node.decoding='async';node.onerror=failed;node.onload=()=>{if(valid())quality(s,overview?'Map overview · zoom in for original detail.':'Original map detail.');};node.src=url;
  }catch(error){failed(error);}
 }
 function bindCanvas(s){const canvas=s.root.querySelector('[data-map-canvas]'),scene=s.root.querySelector('[data-map-scene]');const transform=()=>{const limitX=(s.zoom-1)*scene.offsetWidth/2,limitY=(s.zoom-1)*scene.offsetHeight/2;s.panX=Math.max(-limitX,Math.min(limitX,s.panX));s.panY=Math.max(-limitY,Math.min(limitY,s.panY));canvas.classList.toggle('map-zoomed',s.zoom>1);scene.style.transform=`translate(${s.panX}px,${s.panY}px) scale(${s.zoom})`;};transform();
  s.root.querySelectorAll('[data-map-zoom]').forEach(button=>button.onclick=()=>{s.zoom=Math.max(1,Math.min(3,s.zoom+(button.dataset.mapZoom==='in'?.25:-.25)));if(s.zoom===1)s.panX=s.panY=0;transform();loadPictures(s);});
  s.root.querySelector('[data-map-reset]')?.addEventListener('click',()=>{s.zoom=1;s.panX=s.panY=0;transform();loadPictures(s);});
  canvas.onkeydown=event=>{if(event.key==='Escape'){s.root.querySelector('[data-map-hover]').hidden=true;return;}if(event.target!==canvas||s.zoom===1||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();s.panX+=event.key==='ArrowLeft'?30:event.key==='ArrowRight'?-30:0;s.panY+=event.key==='ArrowUp'?30:event.key==='ArrowDown'?-30:0;transform();};
  canvas.onpointerleave=()=>{s.root.querySelector('[data-map-hover]').hidden=true;};
  let drag=null,moved=false;
  canvas.onpointerdown=event=>{moved=false;if(s.zoom===1||s.placing||s.drawing||event.target.closest('button'))return;drag={x:event.clientX,y:event.clientY,panX:s.panX,panY:s.panY};canvas.setPointerCapture(event.pointerId);};
  canvas.onpointermove=event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;s.panX=drag.panX+dx;s.panY=drag.panY+dy;transform();};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
  canvas.onclick=event=>{if(moved||!editable(s)||!working(s)||s.busy||(!s.placing&&!s.drawing)||event.target.closest('button'))return;const rect=s.root.querySelector('[data-map-image]')?.getBoundingClientRect();if(rect?.width&&rect.height)(s.drawing?addCorner:placeAt)(s,Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100)));};
 }
 function placeAt(s,x,y){if(!editable(s)||s.busy||!s.draft.imagePath)return;s.pinEditor={...(s.pinEditor||{id:crypto.randomUUID(),name:'',description:'',type:'City',markerStyle:'Location',boundary:[],revealed:false,picturePath:'',pictureAlt:'',worldEntryId:''}),x:Math.round(x*10)/10,y:Math.round(y*10)/10};s.selected=s.pinEditor.id;s.pinDirty=true;s.placing=false;paint(s);s.root.querySelector('[data-pin-name]').focus();}
 async function createMapPreview(bitmap,originalSize){
  if(Math.max(bitmap.width,bitmap.height)<=1600&&originalSize<=256*1024)return null;
  const canvas=document.createElement('canvas');
  try{
   for(const bound of [1600,1200,900]){
    const ratio=Math.min(1,bound/Math.max(bitmap.width,bitmap.height));
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.82,.65,.5]){
     const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
     if(blob&&blob.size<=256*1024&&blob.size<originalSize)return blob;
    }
   }
   return null;
  }finally{canvas.width=0;canvas.height=0;}
 }
 async function upload(s,file,picture=false){
  if(!file||!editable(s)||s.busy)return;
  if(!picture&&s.pinDirty){status(s,'Keep or cancel your place before replacing the map.');return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<=0||(picture?file.size>=5*1024*1024:file.size>50*1024*1024)){status(s,picture?'Choose a PNG, JPEG or WebP under 5 MB.':'Choose a PNG, JPEG or WebP up to 50 MB.');return;}
  s.busy=true;paint(s);status(s,picture?'Uploading private place picture…':'Preparing private map…');
  try{
   const bitmap=await createImageBitmap(file);let preview=null;
   try{if(!picture)try{preview=await createMapPreview(bitmap,file.size);}catch{/* The original remains usable if a preview cannot be generated. */}}finally{bitmap.close();}
   if(!editable(s))return;
   const path=picture?s.store.picturePrefix(s.campaignId,s.pinEditor.id)+crypto.randomUUID():s.store.imagePrefix(s.campaignId)+crypto.randomUUID();
   status(s,picture?'Uploading private place picture…':'Uploading private map…');
   await sdk.uploadBytes(sdk.ref(sdk.storage,path),file,{contentType:file.type});if(!editable(s))return;
   status(s,'Preparing private image access…');
   await media.ensure({campaignId:s.campaignId,mapId:s.mapId,path,blob:file,isCurrent:()=>editable(s)});if(!editable(s))return;
   let previewPath=null;
   if(preview){const destination=s.store.imagePrefix(s.campaignId)+crypto.randomUUID();try{await sdk.uploadBytes(sdk.ref(sdk.storage,destination),preview,{contentType:preview.type});if(!editable(s))return;await media.ensure({campaignId:s.campaignId,mapId:s.mapId,path:destination,blob:preview,isCurrent:()=>editable(s)});previewPath=destination;}catch{/* Fall back to the unchanged original. */}}
   if(!editable(s))return;
   if(picture){s.pinEditor.picturePath=path;s.pinEditor.pictureAlt=s.pinEditor.name||'Place illustration';s.pinDirty=true;}
   else{s.draft.imagePath=path;if(previewPath)s.draft.previewPath=previewPath;else delete s.draft.previewPath;changed(s);}
   status(s,'Image uploaded privately. Players see it only after publishing.');
  }catch(error){if(current(s))status(s,'Could not upload: '+error.message);}
  finally{s.busy=false;if(allowed(s))paint(s);}
 }

 function mediaPaths(map,pins=map?.pins||[]) {
  return [...new Set([map?.imagePath,map?.previewPath,...pins.map(pin=>pin.picturePath)].filter(Boolean))];
 }
 function imageLabel(s,path){
  const pin=[...(s.draft?.pins||[]),...(s.pins||[])].find(pin=>pin.picturePath===path);return pin?'Picture for “'+pin.name+'”':path===s.draft?.previewPath||path===s.map?.previewPath?'Map overview':'Map image';
 }
 async function prepareImages(s,paths,{keepGoing=false}={}) {
  const failures=[];let prepared=0;
  for(let i=0;i<paths.length;i++) {
   if(!editable(s))throw Error('Campaign access changed.');const label=imageLabel(s,paths[i]);
   status(s,'Preparing image access '+(i+1)+' of '+paths.length+' · '+label+'…');
   try{await media.ensure({campaignId:s.campaignId,mapId:s.mapId,path:paths[i],isCurrent:()=>editable(s),onProgress:(done,total)=>status(s,'Preparing image access '+(i+1)+' of '+paths.length+' · '+label+' · '+Math.round(done/total*100)+'%')});prepared++;}
   catch(error){if(!editable(s))throw error;error.message=label+': '+error.message;if(!keepGoing||!['map-media/invalid','storage/object-not-found','storage/max-download-size-exceeded'].includes(error.code))throw error;failures.push({label,message:error.message,code:error.code});}
  }
  return {prepared,total:paths.length,failures};
 }
 async function repairImages(s,requestedPaths=null) {
  if(!editable(s)||s.busy)return;
  if(s.pinDirty){status(s,'Keep or cancel your pin edits before checking image access.');return;}
  const paths=requestedPaths||[...new Set([...mediaPaths(s.map,s.pins),...mediaPaths(s.draft)])];
  if(!paths.length){status(s,'There are no images to check on this map yet.');return;}
  const published=new Set(mediaPaths(s.map,s.pins));s.repairResults=[];s.busy=true;paint(s);
  try{
   for(let i=0;i<paths.length;i++){
    if(!editable(s))throw Error('Campaign access changed.');const path=paths[i],label=imageLabel(s,path),privateOnly=!published.has(path);
    status(s,'Checking image '+(i+1)+' of '+paths.length+' · '+label+'…');
    try{
     const result=await media.repair({campaignId:s.campaignId,mapId:s.mapId,path,isCurrent:()=>editable(s),validateImage:async blob=>{const bitmap=await createImageBitmap(blob);bitmap.close();},onProgress:(done,total)=>status(s,'Repairing image '+(i+1)+' of '+paths.length+' · '+label+' · '+Math.round(done/total*100)+'%')});
     if(!editable(s))return;let applied=false;
     if(result.publishRequired){
      for(const field of ['imagePath','previewPath'])if(s.draft?.[field]===path){s.draft[field]=result.path;applied=true;}
      for(const pin of s.draft?.pins||[])if(pin.picturePath===path){pin.picturePath=result.path;applied=true;}
      if(applied)s.mapDirty=true;
     }
     s.repairResults.push({label,status:result.status,privateOnly,message:result.publishRequired?(applied?'The replacement is in your private draft. Save the draft or Publish changes to update player access.':'Your private draft already uses a different picture. Review and publish that draft to replace the old published picture.'):''});
    }catch(error){if(!editable(s)||['permission-denied','unauthenticated','map-media/context'].includes(error.code))throw error;s.repairResults.push({label,status:'failed',privateOnly,message:error.message+' [code: '+(error.code||'unknown')+']. Replace this named image if its original cannot be read.'});}
   }
   if(editable(s)){revoke(s);const failed=s.repairResults.filter(row=>row.status==='failed').length,rebuilt=s.repairResults.filter(row=>row.status==='rebuilt').length,repaired=s.repairResults.filter(row=>row.status==='repaired').length;
    status(s,failed?(failed===paths.length?'Image access could not be repaired for any of the '+paths.length+' images. See each named image below.':'Prepared '+(paths.length-failed)+' of '+paths.length+' images. Could not repair '+failed+'. See each named image below.'):rebuilt?'Image copies rebuilt. Publish changes to apply the replacement pictures to players.':repaired?'Image access repaired. Players can refresh this map. Private draft pictures still require publication.':'All '+paths.length+' image copies were already readable. No repairs were needed. If a player is still denied access, deploy the current Firestore rules and check that this map/pin is published.');
   }
  }catch(error){if(allowed(s))status(s,'Image access could not be repaired. '+(error.code==='permission-denied'?'Firestore denied access to player image copies. Deploy the current firestore.rules and refresh before retrying. Original files and the published map are unchanged.':imageProblem(error))+' [code: '+(error.code||'unknown')+']');}
  finally{s.busy=false;if(allowed(s))paint(s);}
 }

 async function persistDraft(s){const saved=await s.store.saveDraft({campaignId:s.campaignId,input:s.draft,revision:s.draft.revision,sourceRevision:s.draft.sourceRevision,isCurrent:()=>editable(s)});if(!editable(s))return false;s.draft=saved;s.mapDirty=false;const row=s.maps.find(row=>row.id===s.mapId);if(row&&!row.published)row.title=saved.title;return true;}
 async function saveDraft(s){if(!editable(s)||s.busy)return;if(requireFinishedBoundary(s)||s.pinDirty)return;s.busy=true;paint(s);try{if(await persistDraft(s))status(s,'Private draft saved. The published map is unchanged.');}catch(error){if(error.code==='map-publication/conflict')s.publicationConflict=true;if(current(s))status(s,'Could not save draft: '+error.message);}finally{s.busy=false;if(allowed(s))paint(s);}}
 async function publish(s){
  if(!editable(s)||s.busy)return;if(requireFinishedBoundary(s)||s.pinDirty)return;if(publicationConflict(s)){await reviewPublication(s);return;}
  let stage='saving-private-draft',published=false;
  s.busy=true;paint(s);status(s,'Saving and publishing the revealed places…');
  try{
   if(s.mapDirty||!s.draft.revision){if(!await persistDraft(s))return;}
   stage='preparing-image-access';await prepareImages(s,mediaPaths(s.draft,s.draft.pins.filter(pin=>pin.revealed)));if(!editable(s))return;
   stage='writing-publication';
   const result=await s.store.publish({campaignId:s.campaignId,draftRevision:s.draft.revision,isCurrent:()=>editable(s)});
   if(!editable(s))return;published=true;s.map=result.map;s.draft=result.draft;s.pins=result.pins;s.mapDirty=false;s.repairResults=null;s.publicationConflict=false;
   const row=s.maps.find(row=>row.id===s.mapId);if(row){row.published=true;row.title=result.map.title;}
   stage='loading-published-places';await subscribePins(s);
   if(allowed(s))status(s,'Map published. Players can see '+result.pins.length+' revealed places. Hidden places remain private.');
  }catch(error){if(allowed(s)){
   if(error.code==='map-publication/conflict')s.publicationConflict=true;
   const phase=error.mapPublishStage||stage,denied=error?.code==='permission-denied',expired=error?.code==='unauthenticated';
   const steps={'preparing-image-access':'preparing protected image access','saving-private-draft':'saving the private draft','reading-private-draft':'reading the saved private draft','reading-published-map':'reading the existing publication','checking-publication-revision':'checking the publication version','checking-world-links':'checking linked World posts','writing-publication':'writing the map publication','loading-published-places':'loading the published places'};
   const context=' [step: '+phase+'; code: '+(error.code||'unknown')+'; map: '+s.mapId+']';
   status(s,(published?'Map published, but its places could not be reloaded. Use Refresh to reload; you do not need to publish again. ': 'Map was not published. Your private draft is kept. ')+(expired?'Your sign-in expired. Sign in again, then reopen this map.':denied?'Firebase denied '+steps[phase]+'. Ask the campaign owner to check campaign DM access and the current Firestore map rules.':'Failed while '+steps[phase]+': '+error.message)+context);
  }}finally{s.busy=false;if(allowed(s))paint(s);}
 }

 async function remove(s,pin){if(!editable(s)||s.busy)return;if(!await SiteConfirmation.ask({title:'Remove '+pin.name+' from the draft?',paragraphs:['The published pin stays visible until you publish this change.'],confirmLabel:'Remove from draft'}))return;if(!editable(s))return;s.draft.pins=s.draft.pins.filter(row=>row.id!==pin.id);s.selected=null;changed(s);paint(s);}
 async function openWorld(s,id){if(!allowed(s)||s.busy)return;try{const entry=await worldStore.load(s.campaignId,id);if(!allowed(s))return;if(!entry){status(s,'This World entry is no longer shared.');return;}CampaignInformation.openWorld(id);}catch{if(allowed(s))status(s,'Could not open the shared World entry. Refresh and try again.');}}
 function fail(s,error,stage='map access'){if(!current(s))return;if(error?.code==='permission-denied'||error?.code==='unauthenticated'){s.denied=true;s.stops.forEach(stop=>stop());s.pinStop?.();revoke(s);s.root.innerHTML=`<section class="campaign-map"><h2>Campaign map</h2><p role="status">Map access is unavailable.</p><p>${error?.code==='unauthenticated'?'Sign in again, then reopen the campaign map.':`Firebase denied ${escape(stage)}. Ask the campaign owner to check your membership and the published Firestore map rules, then try again.`}</p><button type="button" data-map-retry>Try again</button></section>`;s.root.querySelector('[data-map-retry]').onclick=()=>render(s.mode,s.mapId,s.preview);s.mapDirty=s.pinDirty=false;s.pinEditor=s.draft=null;return;}status(s,'Map unavailable. Your unsaved changes are kept here. Check your connection and refresh.');}
 async function subscribePins(s){s.pinStop?.();const map=s.map;if(!map){s.pins=[];return;}const revision=map.revision;const rows=await s.store.listPins(s.campaignId,map);if(!allowed(s)||s.map?.revision!==revision)return;s.pins=rows;s.pinStop=s.store.watchPins(s.campaignId,map,rows=>{if(allowed(s)&&s.map?.revision===revision){s.pins=rows;if(!s.busy&&!s.pinDirty)paint(s);}},error=>{if(allowed(s)&&s.map?.revision===revision)recoverPins(s,revision,error);});}
 async function recoverPins(s,revision,error){
  // Advancing a publication invalidates the previous revision's query. Listener
  // errors can arrive before the map listener, so distinguish this from revocation.
  try{const map=await s.store.load(s.campaignId);if(!allowed(s)||s.map?.revision!==revision)return;
   if(map?.revision!==revision){s.map=map;await subscribePins(s);if(allowed(s)&&!s.busy&&!s.pinDirty)paint(s);}else fail(s,error);
  }catch(nextError){fail(s,nextError);}
 }
 async function render(mode='player',requestedMapId=null,preview=false){
  requestedMapId=requestedMapId||(nextMapId?.campaignId===activeCampaign?.id&&nextMapId?.uid===auth.currentUser?.uid?nextMapId.mapId:null);nextMapId=null;
  if(mode==='dm'&&!canManageCampaign())return;if(!guard(()=>render(mode,requestedMapId,preview)))return;clear();if(!activeCampaign||!auth.currentUser)return;
  const s={campaignId:activeCampaign.id,uid:auth.currentUser.uid,mode,route:mode==='dm'?'dm-map':'campaign-map',root:document.getElementById(mode==='dm'?'tab-dm-map':'tab-campaign-map'),mapId:'main',store:createCampaignMapStore(sdk),maps:[],preferences:{order:[],mainMapId:'',revision:0},map:null,pins:[],draft:null,pinEditor:null,mapDirty:false,pinDirty:false,busy:false,ready:false,editing:mode==='dm',preview:preview&&mode==='dm',placing:false,denied:false,selected:null,worlds:[],stops:[],pinStop:null,urls:new Map(),pendingImages:new Map(),failedPreviews:new Set(),zoom:1,panX:0,panY:0,message:'Loading campaign maps…'};session=s;paint(s);
  try{
   s.loadStage='the map list';
   const [publishedRaw,preferences,drafts]=await Promise.all([store.listMaps(s.campaignId,{includeDeleted:true}),store.loadPreferences(s.campaignId),mode==='dm'?store.listMaps(s.campaignId,{drafts:true}):Promise.resolve([])]);
   if(!allowed(s))return;s.preferences=preferences;
   const retired=new Set(publishedRaw.filter(row=>row.deletedAt).map(row=>row.id)),published=publishedRaw.filter(row=>!row.deletedAt);
   const all=new Map(published.map(row=>[row.id,{id:row.id,title:row.title,published:true}]));
   for(const row of drafts)if(!all.has(row.id))all.set(row.id,{id:row.id,title:row.title,published:false});
   s.maps=[...all.values()];sortMaps(s);
   const selected=requestedMapId&&!retired.has(requestedMapId)&&/^[A-Za-z0-9_-]{1,100}$/.test(requestedMapId)&&(mode==='dm'||published.some(row=>row.id===requestedMapId))?requestedMapId:mainMapId(s)||s.maps[0]?.id||(mode==='dm'&&retired.has('main')?crypto.randomUUID():'main');
   s.mapId=selected;s.store=createCampaignMapStore(sdk,{mapId:selected});
   const newMap=mode==='dm'&&!!requestedMapId&&!all.has(selected);
   if(newMap){if(s.maps.length>=50)throw Error('This campaign already has 50 maps. Choose an existing map.');s.maps.push({id:selected,title:'New map',published:false});}
   if(mode==='dm'&&!s.maps.length)s.maps.push({id:selected,title:'Campaign map',published:false});
   s.loadStage='the published map';s.map=await s.store.load(s.campaignId);if(!allowed(s))return;
   s.loadStage='the published places';await subscribePins(s);if(!allowed(s))return;paint(s);
   if(editable(s)){
    try{s.draft=await s.store.loadDraft(s.campaignId);if(!editable(s))return;s.draft=s.draft||initialDraft(s);if(newMap)s.mapDirty=true;}
    catch(error){if(!allowed(s))return;s.draftUnavailable=true;s.editing=false;s.draft=null;s.draftProblem=error?.code==='permission-denied'?'Published map access works, but private map editing is unavailable. Ask the campaign owner to check DM access and deploy the current map rules, then select Refresh.':'Your private map draft could not be loaded. The published map is still available. Check your connection and select Refresh.';}
   }
   s.ready=true;status(s,s.draftProblem||(s.map?'Choose a place to explore.':'No published map yet.'));paint(s);if(requestedMapId)(newMap?s.root.querySelector('[data-map-title]'):s.root.querySelector('.map-tabs [aria-current=page]'))?.focus({preventScroll:true});
   s.stops.push(s.store.watchMap(s.campaignId,async map=>{if(!allowed(s))return;const changedRevision=s.map?.revision!==map?.revision;s.map=map;if(changedRevision){try{await subscribePins(s);if(editable(s)&&s.draft?.sourceRevision!==(map?.revision||0))status(s,'The published map changed. Your draft is kept. Use Review publication changes before publishing.');}catch(error){fail(s,error);}}if(allowed(s)&&!s.busy&&!s.pinDirty)paint(s);},error=>fail(s,error)));
   // Shared World pages are optional. A missing feed must not block the map.
   worldStore.list(s.campaignId).then(rows=>{if(allowed(s)){s.worlds=rows;if(!s.busy&&!s.pinDirty)paint(s);}},()=>{if(allowed(s))status(s,'Map loaded. Shared World links are unavailable; refresh to retry.');});
   s.stops.push(worldStore.watch(s.campaignId,rows=>{if(allowed(s)){s.worlds=rows;if(!s.busy&&!s.pinDirty)paint(s);}},()=>{if(allowed(s)){s.worlds=[];if(!s.busy&&!s.pinDirty)paint(s);}}));
  }catch(error){fail(s,error,s.loadStage);}
 }
 window.addEventListener('beforeunload',event=>{if(session&&(dirty(session)||session.busy)){event.preventDefault();event.returnValue='';}});
 return {render,clear,guard,beforeNavigate,onAccountChanged(uid){if(session&&session.uid!==uid)clear();},get session(){return session;}};
})();
