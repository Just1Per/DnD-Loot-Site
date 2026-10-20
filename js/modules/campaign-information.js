'use strict';
var CampaignInformation = (() => {
  const store=createCampaignInformationStore(window.__DND_VAULT_DEPS__);
  const npcStore=createCampaignInformationStore(window.__DND_VAULT_DEPS__,'creature');
  const chapterStore=createCampaignInformationStore(window.__DND_VAULT_DEPS__,'chapter');
  const views={
    world:{tab:'campaign-information',title:'World',description:'Places, lore and factions your DM has shared with the party.',empty:'Your DM has not shared campaign information yet. Revealed places, lore and factions will appear here.',store},
    creature:{tab:'campaign-npcs',title:'NPCs',description:'The people your party has met and your DM has revealed.',empty:'Your DM has not revealed any NPCs yet. People you meet will appear here when your DM shares them.',store:npcStore},
    chapter:{tab:'campaign-chapters',title:'Chapter overview',description:'Completed chapters your DM has shared, with space for your own private notes.',empty:'Your DM has not shared any completed chapters yet. Your adventure’s recaps will appear here.',store:chapterStore}
  };
  let session=null, returnToJournal=null;
  const browsing=new Map();
  const browseKey=kind=>[auth.currentUser?.uid,activeCampaign?.id,kind].join(':');
  function remember(s){
    if(!current(s))return;
    browsing.set(browseKey(s.kind),{query:s.root.querySelector('[data-information-search]').value,category:s.root.querySelector('[data-information-category]').value,selected:s.selected,scroll:s.selected?s.listScroll:window.scrollY,focusId:s.focusId});
  }
  function backToList(s){
    if(!current(s))return;
    const id=s.selected;s.selected=null;s.focusId=id;paint(s);remember(s);
    const button=[...s.root.querySelectorAll('[data-read-world],[data-read-npc]')].find(node=>node.getAttribute('data-read-world')===id||node.getAttribute('data-read-npc')===id);
    button?.focus({preventScroll:true});window.scrollTo(0,s.listScroll||0);
  }
  function decorateJournalEditor(s){
    if(!['world','creature'].includes(s.kind)||!returnToJournal||returnToJournal.kind!==s.kind||returnToJournal.uid!==s.uid||returnToJournal.campaignId!==s.campaignId||returnToJournal.recordId!==s.record.id)return;
    const button=document.createElement('button');button.type='button';button.setAttribute(s.kind==='world'?'data-back-to-world':'data-back-to-npcs','');button.textContent='← Back to '+views[s.kind].title;
    button.onclick=()=>{if(s.busy)return;const state=browsing.get(browseKey(s.kind));if(state)state.selected=null;showTab(views[s.kind].tab);};
    s.host.querySelector('[data-workspace-page]').prepend(button);
  }
  const escape=value=>escapeHtml(String(value??''));
  const prose=value=>String(value||'').split(/\n\s*\n/).filter(Boolean).map(text=>'<p>'+escape(text).replaceAll('\n','<br>')+'</p>').join('');
  const current=s=>session===s && activeCampaign?.id===s.id && auth.currentUser?.uid===s.uid;
  function clear(force=false) {
    if(typeof CampaignChapterNotes!=='undefined'&&!CampaignChapterNotes.beforeClear(session,force))return false;
    if(session)remember(session);
    session?.unsubscribe?.();revokeImages(session);session=null;
    for(const view of Object.values(views))document.getElementById('tab-'+view.tab)?.replaceChildren();
    return true;
  }
  function revokeImages(s){for(const url of s?.imageUrls||[])URL.revokeObjectURL(url);if(s)s.imageUrls=[];}
  async function loadImages(s,list){
    const sdk=window.__DND_VAULT_DEPS__;
    for(const row of s.rows){
      const host=[...list.querySelectorAll('[data-shared-image]')].find(node=>node.dataset.sharedImage===row.id);
      if(!host||!row.image)continue;
      const prefix=`campaign-journal-images/${s.id}/${s.kind}/${row.id}/`,image=row.image;
      if(typeof image.path!=='string'||!image.path.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(image.path.slice(prefix.length))){host.textContent='Illustration unavailable.';continue;}
      try{
        const blob=await sdk.getBlob(sdk.ref(sdk.storage,image.path),6*1024*1024);
        if(!current(s)||s.denied||!host.isConnected)continue;
        const url=URL.createObjectURL(blob);s.imageUrls.push(url);
        const img=document.createElement('img');img.src=url;img.alt=image.alt||'Shared campaign illustration';
        img.style.maxWidth='100%';host.replaceChildren(img);
        if(image.caption){const caption=document.createElement('figcaption');caption.textContent=image.caption;host.append(caption);}
      }catch(error){if(current(s)&&host.isConnected)host.textContent='Illustration unavailable.';}
    }
  }
  function paint(s) {
    if(!current(s))return;
    revokeImages(s);
    const focused=document.activeElement?.matches?.('[data-note-text]')?{id:document.activeElement.closest('[data-chapter-note-id]').dataset.chapterNoteId,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
    const query=s.root.querySelector('[data-information-search]').value.trim().toLowerCase(),category=s.root.querySelector('[data-information-category]').value;
    const list=s.root.querySelector('[data-information-list]');
    s.root.querySelector('[data-information-clear]').hidden=!query&&!category;
    const openIds=new Set([...list.querySelectorAll('details[open]')].map(node=>node.dataset.informationId));
    if(s.kind==='world'||s.kind==='creature'){paintReference(s);return;}
    const rows=s.rows.filter(row=>(!category||row.category===category)&&(!query||[row.title,row.summary,row.content].join(' ').toLowerCase().includes(query))).sort((a,b)=>(s.kind==='chapter'?a.order-b.order:0)||a.title.localeCompare(b.title));
    list.classList.toggle('campaign-information-grid',s.kind!=='chapter');
    list.innerHTML=rows.map(row=>{
      if(s.kind==='chapter')return `<article class="campaign-information-card"><details data-information-id="${escape(row.id)}" ${openIds.has(row.id)?'open':''}><summary><strong>${s.kind==='chapter'?`Chapter ${Number(row.order)} · `:''}${escape(row.title)}</strong><span>${escape(row.category)}</span></summary>${row.summary?`<p>${escape(row.summary)}</p>`:''}<div class="campaign-book-prose">${escape(row.content)}</div>${row.image?`<figure data-shared-image="${escape(row.id)}">Loading shared illustration…</figure>`:''}${s.kind==='chapter'?CampaignChapterNotes.controls(s,row.id):''}</details></article>`;
      return `<article class="campaign-information-card campaign-reference-card">${row.image?`<figure class="campaign-reference-art" data-shared-image="${escape(row.id)}">Loading illustration…</figure>`:`<div class="campaign-reference-art campaign-reference-placeholder" aria-hidden="true"><span>${escape(row.title.slice(0,1))}</span></div>`}<details data-information-id="${escape(row.id)}" ${openIds.has(row.id)?'open':''}><summary><strong>${escape(row.title)}</strong><span class="campaign-reference-category">${escape(row.category)}</span><span class="campaign-reference-summary">${escape(row.summary||'Open to read more.')}</span></summary><div class="campaign-book-prose">${escape(row.content)}</div></details></article>`;
    }).join('')||`<p class="campaign-information-empty">${s.rows.length?'No shared entries match your search.':escape(s.view.empty)}</p>`;
    if(s.targetId){
      const target=[...list.querySelectorAll('[data-information-id]')].find(node=>node.dataset.informationId===s.targetId);
      if(target){target.open=true;target.querySelector('summary').focus();target.scrollIntoView({block:'start'});s.targetId=null;}
    }
    loadImages(s,list);
    if(s.kind==='chapter'){list.insertAdjacentHTML('beforeend',CampaignChapterNotes.orphanDrafts(s));CampaignChapterNotes.bind(s);}
    if(focused){const host=[...list.querySelectorAll('[data-chapter-note-id]')].find(node=>node.dataset.chapterNoteId===focused.id),input=host?.querySelector('[data-note-text]');if(input&&!input.disabled){input.focus({preventScroll:true});input.setSelectionRange(focused.start,focused.end);}}
  }
  function paintReference(s){
    const npc=s.kind==='creature',hook=npc?'npc':'world',destination=s.view.title;
    const list=s.root.querySelector('[data-information-list]'),filters=s.root.querySelector('.campaign-information-filters');
    const query=s.root.querySelector('[data-information-search]').value.trim().toLowerCase(),category=s.root.querySelector('[data-information-category]').value;
    const matches=s.rows.filter(row=>(!category||row.category===category)&&(!query||[row.title,row.summary,row.content].join(' ').toLowerCase().includes(query)));
    s.root.querySelector('[data-information-status]').textContent=s.selected?'':`${matches.length} of ${s.rows.length} shared ${npc?'NPCs':'World posts'}.`;
    const selected=s.rows.find(row=>row.id===s.selected);
    if(s.selected&&!selected){s.selected=null;s.root.querySelector('[data-information-status]').textContent=`This entry is no longer shared. Choose another entry in ${destination}.`;}
    filters.hidden=!!selected;list.classList.toggle('campaign-information-grid',!selected);
    if(selected){
      list.innerHTML=`<article class="world-post-reader${npc?' npc-post-reader':''}" data-information-id="${escape(selected.id)}"><div class="workspace-actions"><button type="button" data-${hook}-back>← Back to ${destination}</button>${canManageCampaign()?`<button type="button" data-${hook}-edit>${npc?'Edit NPC':'Edit post'}</button>`:''}</div><p class="campaign-book-eyebrow">Journal → ${destination} → ${escape(selected.title)}</p><h3 tabindex="-1" data-${hook}-title>${escape(selected.title)}</h3><p class="campaign-reference-category">${escape(selected.category)}</p>${selected.image?`<figure class="world-reader-image" data-shared-image="${escape(selected.id)}">Loading illustration…</figure>`:''}${selected.summary?`<p class="world-reader-introduction">${escape(selected.summary)}</p>`:''}<div class="campaign-book-prose">${prose(selected.content)}</div></article>`;
      list.querySelector(`[data-${hook}-back]`).onclick=()=>backToList(s);
      list.querySelector(`[data-${hook}-edit]`)?.addEventListener('click',async()=>{
        if(!current(s)||!canManageCampaign())return;
        remember(s);returnToJournal={uid:s.uid,campaignId:s.id,recordId:selected.id,kind:s.kind};
        await CampaignWorkspace.navigateTo(s.kind,selected.id);
      });
    }else{
      const rows=matches.sort((a,b)=>a.title.localeCompare(b.title));
      list.innerHTML=rows.map(row=>`<article data-information-id="${escape(row.id)}" class="campaign-information-card campaign-reference-card"><button type="button" class="world-post-card" data-read-${hook}="${escape(row.id)}">${row.image?`<span class="campaign-reference-art" data-shared-image="${escape(row.id)}">Loading illustration…</span>`:`<span class="campaign-reference-art campaign-reference-placeholder" aria-hidden="true"><span>${escape(row.title.slice(0,1))}</span></span>`}<span class="world-post-card-text"><strong>${escape(row.title)}</strong><span class="campaign-reference-category">${escape(row.category)}</span><span class="campaign-reference-summary">${escape(row.summary||row.content.slice(0,180)||(npc?'Read about this NPC.':'Read this World post.'))}</span><span class="world-post-card-action">${npc?'Read NPC':'Read post'} →</span></span></button></article>`).join('')||`<p class="campaign-information-empty">${s.rows.length?'No shared entries match your search.':escape(s.view.empty)}</p>`;
      if(!rows.length&&s.rows.length){const reset=document.createElement('button');reset.type='button';reset.textContent='Clear search & filters';reset.dataset.informationEmptyClear='';reset.onclick=()=>s.root.querySelector('[data-information-clear]').click();list.append(reset);}
      list.querySelectorAll(`[data-read-${hook}]`).forEach(button=>button.onclick=()=>{
        s.listScroll=window.scrollY;s.focusId=button.getAttribute('data-read-'+hook);s.selected=button.getAttribute('data-read-'+hook);paint(s);remember(s);
        s.root.querySelector(`[data-${hook}-title]`)?.focus();
      });
    }
    loadImages(s,list);
  }
  function update(s, rows) {
    if(!current(s)||s.denied)return;s.rows=rows;
    const select=s.root.querySelector('[data-information-category]'),selected=select.value;
    select.innerHTML='<option value="">All categories</option>'+[...new Set(rows.map(row=>row.category))].sort().map(value=>`<option>${escape(value)}</option>`).join('');
    select.value=[...select.options].some(option=>option.value===selected)?selected:'';paint(s);
    if(s.kind==='chapter')s.root.querySelector('[data-information-status]').textContent=`${rows.length} shared ${rows.length===1?'entry':'entries'}.`;
  }
  async function render(kind='world') {
    if(!clear()||!activeCampaign||!auth.currentUser)return;
    const saved=browsing.get(browseKey(kind));
    const view=views[kind];if(!view)return;
    const root=document.getElementById('tab-'+view.tab);
    root.innerHTML=`<section class="campaign-information-shell" aria-labelledby="campaignInformationTitle"><header><p class="campaign-book-eyebrow">${escape(activeCampaign.name)}</p><h2 id="campaignInformationTitle">${view.title}</h2><p>${view.description}</p></header><div class="campaign-information-filters"><label><span>Search ${view.title.toLowerCase()}</span><input type="search" data-information-search></label><label><span>Category</span><select data-information-category><option value="">All categories</option></select></label><button type="button" data-information-clear hidden>Clear search &amp; filters</button><button class="vault-secondary-btn" type="button" data-information-refresh>Refresh</button></div><p role="status" aria-live="polite" data-information-status>Loading ${view.title.toLowerCase()}…</p><div data-information-list></div></section>`;
    const s={id:activeCampaign.id,uid:auth.currentUser.uid,root,view,kind,rows:[],notes:new Map(),unsubscribe:null,denied:false,imageUrls:[],selected:saved?.selected||null,listScroll:saved?.scroll||0,focusId:saved?.focusId};session=s;
    root.querySelector('[data-information-search]').value=saved?.query||'';
    if(saved?.category)root.querySelector('[data-information-category]').add(new Option(saved.category,saved.category,true,true));s.isCurrent=()=>current(s);
    root.querySelector('[data-information-search]').addEventListener('input',()=>paint(s));
    root.querySelector('[data-information-category]').addEventListener('change',()=>paint(s));
    root.querySelector('[data-information-clear]').onclick=()=>{root.querySelector('[data-information-search]').value='';root.querySelector('[data-information-category]').value='';paint(s);root.querySelector('[data-information-search]').focus();};
    root.querySelector('[data-information-refresh]').addEventListener('click',()=>render(kind));
    try {
      update(s,await view.store.list(s.id));
      if(!current(s))return;
      if(saved&&!s.selected){const button=[...root.querySelectorAll('[data-read-world],[data-read-npc]')].find(node=>(node.dataset.readWorld||node.dataset.readNpc)===s.focusId);button?.focus({preventScroll:true});window.scrollTo(0,s.listScroll);}
      s.unsubscribe=view.store.watch(s.id,rows=>update(s,rows),error=>{
        if(!current(s))return;s.denied=true;s.unsubscribe?.();revokeImages(s);root.querySelector('.campaign-information-filters').hidden=false;s.rows=[];s.notes.clear();root.querySelector('[data-information-list]').replaceChildren();
        root.querySelector('[data-information-category]').innerHTML='<option value="">All categories</option>';
        root.querySelector('[data-information-status]').textContent=`Shared information is unavailable: ${error.message}`;
      });
    } catch(error) {
      if(current(s)){s.rows=[];root.querySelector('[data-information-list]').replaceChildren();root.querySelector('[data-information-status]').textContent=`Could not load shared information: ${error.message}`;}
    }
  }
  function attachWorldSharing(host,s){
    host.querySelector('[data-entry-sharing]')?.remove();
    const section=document.createElement('section');section.dataset.entrySharing='';
    section.innerHTML='<h3>Release this post</h3><p data-release-includes></p><p>Players receive this version together. Later draft edits stay private until you release again.</p><div class="workspace-actions"><button type="button" data-publish-entry data-publish-world disabled>Release to players</button></div><p data-sharing-status role="status">Loading publication status…</p><details><summary>Publication options</summary><button type="button" data-unpublish-world disabled>Remove from players</button><button type="button" data-refresh-sharing>Retry publication status</button></details>';
    host.append(section);
    const store=views.world.store,button=section.querySelector('[data-publish-world]'),remove=section.querySelector('[data-unpublish-world]'),message=section.querySelector('[data-sharing-status]');
    let published=null,loaded=false,busy=false;
    const active=()=>section.isConnected&&CampaignWorkspace.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
    const state=()=>{if(!active())return;button.disabled=!loaded||busy||s.busy||s.record.archived;remove.disabled=!loaded||busy||s.busy||!published;section.querySelector('[data-release-includes]').textContent=s.record.data?.journalImage?.path?'Release includes the post, image and caption.':'Release includes the post text. Add an image above to include it.';};
    section._sharingState=state;
    const refresh=async()=>{loaded=false;state();try{const result=await store.load(s.campaignId,s.record.id);if(!active())return;published=result;loaded=true;CampaignWorkspace.configs.world.onPublicationChange?.(s,published);message.textContent=published?'Released to players. Save as draft keeps further edits private.':'Private draft. Only campaign DMs can see it.';}catch(error){if(active())message.textContent='Could not load publication status: '+error.message;}state();};
    section.querySelector('[data-refresh-sharing]').onclick=refresh;
    button.onclick=async()=>{
      if(!active()||busy||s.busy||!loaded||s.record.archived)return;
      busy=true;s.worldReleaseBusy=true;state();
      try{
        if(s.dirty||!s.record.revision){if(!await CampaignWorkspace.save())return;}
        if(!active()||s.dirty)return;
        s.busy=true;state();message.textContent='Releasing post…';
        published=await store.publish({campaignId:s.campaignId,id:s.record.id,sourceRevision:s.record.revision,publishedRevision:published?.revision||0,includeImage:true,isCurrent:active});
        if(active()){CampaignWorkspace.configs.world.onPublicationChange?.(s,published);message.textContent='Released to players.';}
      }catch(error){if(active())message.textContent='Could not release post: '+error.message;}
      finally{busy=false;s.busy=false;s.worldReleaseBusy=false;state();}
    };
    remove.onclick=async()=>{
      if(!active()||busy||s.busy||!published)return;
      busy=true;s.busy=true;state();
      try{await store.unpublish({campaignId:s.campaignId,id:s.record.id,publishedRevision:published.revision,isCurrent:active});if(active()){published=null;CampaignWorkspace.configs.world.onPublicationChange?.(s,null);message.textContent='Removed from players. Your draft is kept.';}}
      catch(error){if(active())message.textContent='Could not remove post: '+error.message;}
      finally{busy=false;s.busy=false;state();}
    };
    refresh();
  }
  function attachSharing(host,s) {
    if(!views[s.kind]||!host||!canManageCampaign())return;
    if(s.kind==='world')return attachWorldSharing(host,s);
    const npc=s.kind==='creature',chapter=s.kind==='chapter',sharingStore=views[s.kind].store;
    host.querySelector('[data-entry-sharing]')?.remove();
    const section=document.createElement('section');section.dataset.entrySharing='';section.className='campaign-world-sharing';
    const publishLabel=npc?'Reveal NPC to players':chapter?'Share completed chapter':'Share with players',removeLabel=npc?'Remove from NPC catalogue':chapter?'Remove from chapter overview':'Remove from player information';
    section.innerHTML=`<h3>${npc?'Reveal an NPC':chapter?'Share a completed chapter':'Share campaign information'}</h3><p>${npc?'Only Story NPC entries can be revealed. Share the saved name, summary and story description. Statistics, goals, relationships and private tactics stay private.':chapter?'Save this chapter as Completed, then share its player recap (or introduction if no recap is set). Private preparation, scenes, rewards, session notes and milestones stay private.':'Share only this entry’s saved title, summary and player description. DM secrets, private maps and connections stay private.'} Later edits remain private until you update the shared version.</p><p data-sharing-status role="status">Loading sharing status…</p><div class="workspace-actions"><button type="button" data-publish-entry ${npc?'data-publish-npc':chapter?'data-publish-chapter':'data-publish-world'} disabled>${publishLabel}</button><button type="button" data-unpublish-entry ${npc?'data-unpublish-npc':chapter?'data-unpublish-chapter':'data-unpublish-world'} disabled>${removeLabel}</button><button type="button" data-refresh-sharing>Refresh sharing status</button></div>`;
    section.insertAdjacentHTML('beforeend','<section class="player-image-sharing"><h4>Player illustration</h4><p>Share the page first. Saved illustration and caption are shared separately; DM notes, statistics and draft text stay private.</p><p data-image-sharing-status role="status"></p><div class="workspace-actions"><button type="button" data-share-entry-image disabled>Share image with players</button><button type="button" data-hide-entry-image disabled>Hide image</button></div></section>');
    host.append(section);let published=null,loaded=false,busy=false,requestToken=0;
    const active=()=>section.isConnected&&CampaignWorkspace.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
    const state=()=>{
      if(!active())return;
      section.querySelector('[data-publish-entry]').disabled=!loaded||busy||s.busy||s.dirty||!s.record.revision||s.record.archived||(npc&&s.record.data.category!=='Story NPC')||(chapter&&s.record.data.status!=='Completed');
      section.querySelector('[data-publish-entry]').textContent=published?'Update shared version':publishLabel;
      section.querySelector('[data-unpublish-entry]').disabled=!loaded||busy||s.busy||!published;
      section.querySelector('[data-refresh-sharing]').disabled=busy;
      section.querySelector('[data-share-entry-image]').disabled=!loaded||busy||s.busy||s.dirty||!published||!s.record.data?.journalImage||s.record.archived;
      section.querySelector('[data-share-entry-image]').textContent=published?.image?'Update shared image':'Share image with players';
      section.querySelector('[data-hide-entry-image]').disabled=!loaded||busy||s.busy||!published?.image;
      section.querySelector('[data-image-sharing-status]').textContent=published?.image?'An illustration is shared. Saved image or caption edits stay private until Update shared image.':'Illustration is private. Sharing text does not share its image.';
    };
    section._sharingState=state;
    const refresh=async()=>{
      const token=++requestToken;loaded=false;state();
      try{const result=await sharingStore.load(s.campaignId,s.record.id);if(!active()||token!==requestToken)return;published=result;loaded=true;CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,published);section.querySelector('[data-sharing-status]').textContent=published?`Shared with players${published.sourceRevision!==s.record.revision?' — saved changes have not been shared yet.':'.'}`:'Not shared. Save changes before sharing this entry.';state();}
      catch(error){if(active()&&token===requestToken)section.querySelector('[data-sharing-status]').textContent=`Could not load sharing status: ${error.message}`;}
    };
    section.querySelector('[data-refresh-sharing]').onclick=refresh;
    for(const [selector,hide] of [['[data-share-entry-image]',false],['[data-hide-entry-image]',true]]){
      section.querySelector(selector).onclick=async()=>{
        if(!active()||busy||s.busy||!loaded||!published||(!hide&&s.dirty))return;
        if(!confirm(hide?'Hide the shared illustration? The player text stays shared.':'Share this saved illustration and caption with campaign members?'))return;
        busy=true;s.busy=true;state();
        try{published=await sharingStore.shareImage({campaignId:s.campaignId,id:s.record.id,sourceRevision:s.record.revision,publishedRevision:published.revision,hide,isCurrent:active});if(active())section.querySelector('[data-sharing-status]').textContent=hide?'Illustration hidden. Player text is unchanged.':'Illustration shared. Player text is unchanged.';}
        catch(error){if(active())section.querySelector('[data-sharing-status]').textContent='Could not update shared illustration: '+error.message;}
        finally{busy=false;s.busy=false;state();}
      };
    }
    const form=host.closest('form');host._sharingController?.abort();host._sharingController=new AbortController();form.addEventListener('input',state,{signal:host._sharingController.signal});
    section.querySelector('[data-publish-entry]').onclick=async()=>{
      if(!active()||busy||s.busy||s.dirty||!loaded||s.record.archived||(npc&&s.record.data.category!=='Story NPC')||(chapter&&s.record.data.status!=='Completed'))return;
      if(!confirm('Share this saved player description with campaign members? DM secrets and maps stay private.'))return;
      busy=true;s.busy=true;state();
      try{published=await sharingStore.publish({campaignId:s.campaignId,id:s.record.id,sourceRevision:s.record.revision,publishedRevision:published?.revision||0,isCurrent:active});if(active()){CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,published);section.querySelector('[data-sharing-status]').textContent='Shared with campaign members.';}}
      catch(error){if(active())section.querySelector('[data-sharing-status]').textContent=`Could not share: ${error.message}`;}
      finally{busy=false;s.busy=false;state();}
    };
    section.querySelector('[data-unpublish-entry]').onclick=async()=>{
      if(!active()||busy||s.busy||!published||!loaded)return;
      if(!confirm('Remove this entry from player campaign information? Your private world entry is kept.'))return;
      busy=true;s.busy=true;state();
      try{await sharingStore.unpublish({campaignId:s.campaignId,id:s.record.id,publishedRevision:published.revision,isCurrent:active});if(active()){published=null;CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,null);section.querySelector('[data-sharing-status]').textContent=npc?'Removed from the NPC catalogue. Your creature entry is kept.':chapter?'Removed from chapter overview. Your private chapter and players’ personal notes are kept.':'Removed from player information. Your world entry is kept.';}}
      catch(error){if(active())section.querySelector('[data-sharing-status]').textContent=`Could not remove: ${error.message}`;}
      finally{busy=false;s.busy=false;state();}
    };
    refresh();
  }
  for(const kind of Object.keys(views)){
    const config=CampaignWorkspace.configs[kind],oldExtra=config.extra,oldSaved=config.onSaved,oldEdit=config.onEdit;
    config.extra=(host,s)=>{oldExtra?.(host,s);attachSharing(host,s);};
    config.onSaved=(host,s)=>{oldSaved?.(host,s);if(kind!=='world')oldExtra?.(host,s);if(!s.worldReleaseBusy)attachSharing(host,s);};
    if(oldEdit)config.onEdit=(host,s)=>{const sharing=host.querySelector('[data-entry-sharing]');oldEdit(host,s);if(sharing){if(sharing.parentNode!==host)host.append(sharing);sharing._sharingState?.();}else attachSharing(host,s);};
  }
  function beforeNavigate(tab){return session?.view.tab===tab||clear();}
  function hasUnsavedNotes(){return !!session&&[...session.notes.values()].some(note=>note.dirty||note.saving);}
  function onAccountChanged(uid){if(session&&session.uid!==uid)clear(true);browsing.clear();returnToJournal=null;}
  function openWorld(id){showTab('campaign-information');if(session?.kind==='world'){session.selected=id;session.targetId=id;if(session.rows.length)paint(session);}}
  return {openWorld,decorateJournalEditor,render,clear,beforeNavigate,hasUnsavedNotes,onAccountChanged,store,npcStore,chapterStore};
})();
