'use strict';
var CampaignInformation = (() => {
  const store=createCampaignInformationStore(window.__DND_VAULT_DEPS__);
  const npcStore=createCampaignInformationStore(window.__DND_VAULT_DEPS__,'creature');
  const chapterStore=createCampaignInformationStore(window.__DND_VAULT_DEPS__,'chapter');
  const views={
    world:{tab:'campaign-information',title:'Campaign information',description:'Places, lore and factions your DM has shared with the party.',empty:'Your DM has not shared campaign information yet. Revealed places, lore and factions will appear here.',store},
    creature:{tab:'campaign-npcs',title:'NPC catalogue',description:'The people your party has met and your DM has revealed.',empty:'Your DM has not revealed any NPCs yet. People you meet will appear here when your DM shares them.',store:npcStore},
    chapter:{tab:'campaign-chapters',title:'Chapter overview',description:'Completed chapters your DM has shared, with space for your own private notes.',empty:'Your DM has not shared any completed chapters yet. Your adventure’s recaps will appear here.',store:chapterStore}
  };
  let session=null;
  const escape=value=>escapeHtml(String(value??''));
  const current=s=>session===s && activeCampaign?.id===s.id && auth.currentUser?.uid===s.uid;
  function clear(force=false) {
    if(typeof CampaignChapterNotes!=='undefined'&&!CampaignChapterNotes.beforeClear(session,force))return false;
    session?.unsubscribe?.();session=null;
    for(const view of Object.values(views))document.getElementById('tab-'+view.tab)?.replaceChildren();
    return true;
  }
  function paint(s) {
    if(!current(s))return;
    const focused=document.activeElement?.matches?.('[data-note-text]')?{id:document.activeElement.closest('[data-chapter-note-id]').dataset.chapterNoteId,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
    const query=s.root.querySelector('[data-information-search]').value.trim().toLowerCase(),category=s.root.querySelector('[data-information-category]').value;
    const list=s.root.querySelector('[data-information-list]');
    const openIds=new Set([...list.querySelectorAll('details[open]')].map(node=>node.dataset.informationId));
    const rows=s.rows.filter(row=>(!category||row.category===category)&&(!query||[row.title,row.summary,row.content].join(' ').toLowerCase().includes(query))).sort((a,b)=>(s.kind==='chapter'?a.order-b.order:0)||a.title.localeCompare(b.title));
    list.innerHTML=rows.map(row=>`<article class="campaign-information-card"><details data-information-id="${escape(row.id)}" ${openIds.has(row.id)?'open':''}><summary><strong>${s.kind==='chapter'?`Chapter ${Number(row.order)} · `:''}${escape(row.title)}</strong><span>${escape(row.category)}</span></summary>${row.summary?`<p>${escape(row.summary)}</p>`:''}<div class="campaign-book-prose">${escape(row.content)}</div>${s.kind==='chapter'?CampaignChapterNotes.controls(s,row.id):''}</details></article>`).join('')||`<p class="campaign-information-empty">${s.rows.length?'No shared entries match your search.':escape(s.view.empty)}</p>`;
    if(s.kind==='chapter'){list.insertAdjacentHTML('beforeend',CampaignChapterNotes.orphanDrafts(s));CampaignChapterNotes.bind(s);}
    if(focused){const host=[...list.querySelectorAll('[data-chapter-note-id]')].find(node=>node.dataset.chapterNoteId===focused.id),input=host?.querySelector('[data-note-text]');if(input&&!input.disabled){input.focus({preventScroll:true});input.setSelectionRange(focused.start,focused.end);}}
  }
  function update(s, rows) {
    if(!current(s)||s.denied)return;s.rows=rows;
    const select=s.root.querySelector('[data-information-category]'),selected=select.value;
    select.innerHTML='<option value="">All categories</option>'+[...new Set(rows.map(row=>row.category))].sort().map(value=>`<option>${escape(value)}</option>`).join('');
    select.value=selected;paint(s);
    s.root.querySelector('[data-information-status]').textContent=`${rows.length} shared ${rows.length===1?'entry':'entries'}.`;
  }
  async function render(kind='world') {
    if(!clear()||!activeCampaign||!auth.currentUser)return;
    const view=views[kind];if(!view)return;
    const root=document.getElementById('tab-'+view.tab);
    root.innerHTML=`<section class="campaign-information-shell" aria-labelledby="campaignInformationTitle"><header><p class="campaign-book-eyebrow">${escape(activeCampaign.name)}</p><h2 id="campaignInformationTitle">${view.title}</h2><p>${view.description}</p></header><div class="campaign-information-filters"><label>Search ${view.title.toLowerCase()}<input type="search" data-information-search></label><label>Category<select data-information-category><option value="">All categories</option></select></label><button class="vault-secondary-btn" type="button" data-information-refresh>Refresh</button></div><p role="status" aria-live="polite" data-information-status>Loading ${view.title.toLowerCase()}…</p><div data-information-list></div></section>`;
    const s={id:activeCampaign.id,uid:auth.currentUser.uid,root,view,kind,rows:[],notes:new Map(),unsubscribe:null,denied:false};session=s;s.isCurrent=()=>current(s);
    root.querySelector('[data-information-search]').addEventListener('input',()=>paint(s));
    root.querySelector('[data-information-category]').addEventListener('change',()=>paint(s));
    root.querySelector('[data-information-refresh]').addEventListener('click',()=>render(kind));
    try {
      update(s,await view.store.list(s.id));
      if(!current(s))return;
      s.unsubscribe=view.store.watch(s.id,rows=>update(s,rows),error=>{
        if(!current(s))return;s.denied=true;s.unsubscribe?.();s.rows=[];s.notes.clear();root.querySelector('[data-information-list]').replaceChildren();
        root.querySelector('[data-information-category]').innerHTML='<option value="">All categories</option>';
        root.querySelector('[data-information-status]').textContent=`Shared information is unavailable: ${error.message}`;
      });
    } catch(error) {
      if(current(s)){s.rows=[];root.querySelector('[data-information-list]').replaceChildren();root.querySelector('[data-information-status]').textContent=`Could not load shared information: ${error.message}`;}
    }
  }
  function attachSharing(host,s) {
    if(!views[s.kind]||!host||!canManageCampaign())return;
    const npc=s.kind==='creature',chapter=s.kind==='chapter',sharingStore=views[s.kind].store;
    host.querySelector('[data-entry-sharing]')?.remove();
    const section=document.createElement('section');section.dataset.entrySharing='';section.className='campaign-world-sharing';
    const publishLabel=npc?'Reveal NPC to players':chapter?'Share completed chapter':'Share with players',removeLabel=npc?'Remove from NPC catalogue':chapter?'Remove from chapter overview':'Remove from player information';
    section.innerHTML=`<h3>${npc?'Reveal an NPC':chapter?'Share a completed chapter':'Share campaign information'}</h3><p>${npc?'Only Story NPC entries can be revealed. Share the saved name, summary and story description. Statistics, goals, relationships and private tactics stay private.':chapter?'Save this chapter as Completed, then share its player recap (or introduction if no recap is set). Private preparation, scenes, rewards, session notes and milestones stay private.':'Share only this entry’s saved title, summary and player description. DM secrets, private maps and connections stay private.'} Later edits remain private until you update the shared version.</p><p data-sharing-status role="status">Loading sharing status…</p><div class="workspace-actions"><button type="button" data-publish-entry ${npc?'data-publish-npc':chapter?'data-publish-chapter':'data-publish-world'} disabled>${publishLabel}</button><button type="button" data-unpublish-entry ${npc?'data-unpublish-npc':chapter?'data-unpublish-chapter':'data-unpublish-world'} disabled>${removeLabel}</button><button type="button" data-refresh-sharing>Refresh sharing status</button></div>`;
    host.append(section);let published=null,loaded=false,busy=false,requestToken=0;
    const active=()=>section.isConnected&&CampaignWorkspace.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
    const state=()=>{
      if(!active())return;
      section.querySelector('[data-publish-entry]').disabled=!loaded||busy||s.busy||s.dirty||!s.record.revision||s.record.archived||(npc&&s.record.data.category!=='Story NPC')||(chapter&&s.record.data.status!=='Completed');
      section.querySelector('[data-publish-entry]').textContent=published?'Update shared version':publishLabel;
      section.querySelector('[data-unpublish-entry]').disabled=!loaded||busy||s.busy||!published;
      section.querySelector('[data-refresh-sharing]').disabled=busy;
    };
    section._sharingState=state;
    const refresh=async()=>{
      const token=++requestToken;loaded=false;state();
      try{const result=await sharingStore.load(s.campaignId,s.record.id);if(!active()||token!==requestToken)return;published=result;loaded=true;CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,published);section.querySelector('[data-sharing-status]').textContent=published?`Shared with players${published.sourceRevision!==s.record.revision?' — saved changes have not been shared yet.':'.'}`:'Not shared. Save changes before sharing this entry.';state();}
      catch(error){if(active()&&token===requestToken)section.querySelector('[data-sharing-status]').textContent=`Could not load sharing status: ${error.message}`;}
    };
    section.querySelector('[data-refresh-sharing]').onclick=refresh;
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
    config.onSaved=(host,s)=>{oldSaved?.(host,s);if(kind!=='world')oldExtra?.(host,s);attachSharing(host,s);};
    if(oldEdit)config.onEdit=(host,s)=>{const sharing=host.querySelector('[data-entry-sharing]');oldEdit(host,s);if(sharing){host.append(sharing);sharing._sharingState?.();}else attachSharing(host,s);};
  }
  function beforeNavigate(tab){return session?.view.tab===tab||clear();}
  function hasUnsavedNotes(){return !!session&&[...session.notes.values()].some(note=>note.dirty||note.saving);}
  function onAccountChanged(uid){if(session&&session.uid!==uid)clear(true);}
  return {render,clear,beforeNavigate,hasUnsavedNotes,onAccountChanged,store,npcStore,chapterStore};
})();
