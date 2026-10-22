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
    button.onclick=()=>{
      if(s.busy)return;
      const state=browsing.get(browseKey(s.kind)),selected=state?.selected;
      if(state)state.selected=null;
      try{showTab(views[s.kind].tab);}
      finally{
        // A rejected leave keeps this editor alive. Keep its original reader too.
        if(CampaignWorkspace.session===s&&state)state.selected=selected;
      }
    };
    s.host.querySelector('[data-workspace-page]').prepend(button);
  }
  const escape=value=>escapeHtml(String(value??''));
  const prose=value=>String(value||'').split(/\n\s*\n/).filter(Boolean).map(text=>'<p>'+escape(text).replaceAll('\n','<br>')+'</p>').join('');
  const current=s=>session===s && activeCampaign?.id===s.id && auth.currentUser?.uid===s.uid;
  function loadState(s,phase,message){
    if(!current(s))return;s.phase=phase;
    for(const control of s.root.querySelectorAll('[data-information-search],[data-information-category],[data-information-clear]'))control.disabled=phase!=='ready';
    const refresh=s.root.querySelector('[data-information-refresh]');refresh.disabled=phase==='loading';refresh.textContent=phase==='loading'?'Loading…':phase==='failed'?'Try again':'Refresh';
    s.root.querySelector('[data-information-list]').setAttribute('aria-busy',String(phase==='loading'));
    if(message)s.root.querySelector('[data-information-status]').textContent=message;
  }
  function clear(force=false) {
    if(typeof CampaignChapterNotes!=='undefined'&&!CampaignChapterNotes.beforeClear(session,force))return false;
    if(session)remember(session);
    session?.unsubscribe?.();revokeImages(session);session=null;
    for(const view of Object.values(views))document.getElementById('tab-'+view.tab)?.replaceChildren();
    return true;
  }
  function revokeImages(s){s?.imageObserver?.disconnect();if(s)s.imageObserver=null;for(const url of s?.imageUrls||[])URL.revokeObjectURL(url);if(s){s.imageUrls=[];s.imageGeneration=(s.imageGeneration||0)+1;}}
  function loadImages(s,list){
    const generation=s.imageGeneration;
    const active=()=>current(s)&&!s.denied&&s.imageGeneration===generation&&list.isConnected;
    // Capture these hosts: late work must never target a replacement list/reader.
    const hosts=new Map([...list.querySelectorAll('[data-shared-image]')].map(node=>[node.dataset.sharedImage,node]));
    const jobs=s.rows.filter(row=>row.image&&hosts.has(row.id)).map(row=>({row,host:hosts.get(row.id)}));
    if(!jobs.length)return;
    const queue=[];let running=0;
    async function load({row,host}){
      if(!active()||!host.isConnected)return;
      const prefix=`campaign-journal-images/${s.id}/${s.kind}/${row.id}/`,image=row.image;
      if(typeof image.path!=='string'||!image.path.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,100}$/.test(image.path.slice(prefix.length))){host.textContent='Illustration unavailable. Ask your DM to publish this entry again.';return;}
      try{
        const blob=await CampaignJournalImages.publishedBlob({campaignId:s.id,kind:s.kind,id:row.id,image});
        if(!active()||!host.isConnected)return;
        const url=URL.createObjectURL(blob);s.imageUrls.push(url);
        const img=document.createElement('img');img.decoding='async';img.src=url;img.alt=image.alt||'Shared campaign illustration';
        img.style.maxWidth='100%';host.replaceChildren(img);
        if(image.caption){const caption=document.createElement('figcaption');caption.textContent=image.caption;host.append(caption);}
      }catch(error){if(active()&&host.isConnected)host.textContent='Illustration unavailable. Ask your DM to publish this entry again.';}
    }
    function pump(){
      while(active()&&running<4&&queue.length){
        const job=queue.shift();running++;
        load(job).finally(()=>{running--;pump();});
      }
    }
    // Readers keep eager illustrations. Only World/NPC overview cards defer reads.
    if(list.classList.contains('campaign-information-grid')&&typeof IntersectionObserver!=='undefined'){
      const pending=new Map(jobs.map(job=>[job.host,job]));
      const observer=new IntersectionObserver(entries=>{
        if(!active())return;
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          observer.unobserve(entry.target);
          const job=pending.get(entry.target);pending.delete(entry.target);
          if(job)queue.push(job);
        }
        pump();
      },{rootMargin:'400px 0px'});
      s.imageObserver=observer;
      for(const job of jobs)observer.observe(job.host);
    }else{queue.push(...jobs);pump();}
  }

  function paint(s) {
    if(!current(s)||s.phase!=='ready')return;
    revokeImages(s);
    if(s.kind==='world'||s.kind==='creature'){paintReference(s);return;}
    const focused=document.activeElement?.matches?.('[data-note-text]')?{id:document.activeElement.closest('[data-chapter-note-id]').dataset.chapterNoteId,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
    const query=s.root.querySelector('[data-information-search]').value.trim().toLowerCase(),category=s.root.querySelector('[data-information-category]').value;
    const list=s.root.querySelector('[data-information-list]');
    s.root.querySelector('[data-information-clear]').hidden=!query&&!category;
    const openIds=new Set([...list.querySelectorAll('details[open]')].map(node=>node.dataset.informationId));
    const rows=s.rows.filter(row=>(!category||row.category===category)&&(!query||[row.title,row.summary,row.introduction,row.content].join(' ').toLowerCase().includes(query))).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title));
    list.classList.remove('campaign-information-grid');
    list.innerHTML=rows.map(row=>`<article class="campaign-information-card"><details data-information-id="${escape(row.id)}" ${openIds.has(row.id)?'open':''}><summary><strong>Chapter ${Number(row.order)} · ${escape(row.title)}</strong><span>${escape(row.category)}</span></summary>${row.summary?`<p>${escape(row.summary)}</p>`:''}${row.image?`<figure data-shared-image="${escape(row.id)}">Loading shared illustration…</figure>`:''}${row.introduction?`<h4>Chapter introduction</h4><div class="campaign-book-prose">${escape(row.introduction)}</div><h4>Recap</h4>`:''}<div class="campaign-book-prose">${escape(row.content)}</div>${CampaignChapterNotes.controls(s,row.id)}</details></article>`).join('')||`<p class="campaign-information-empty">${s.rows.length?'No shared entries match your search.':escape(s.view.empty)}</p>`;
    if(s.targetId){
      const target=[...list.querySelectorAll('[data-information-id]')].find(node=>node.dataset.informationId===s.targetId);
      if(target){target.open=true;target.querySelector('summary').focus();target.scrollIntoView({block:'start'});s.targetId=null;}
    }
    loadImages(s,list);
    list.insertAdjacentHTML('beforeend',CampaignChapterNotes.orphanDrafts(s));CampaignChapterNotes.bind(s);
    if(focused){const host=[...list.querySelectorAll('[data-chapter-note-id]')].find(node=>node.dataset.chapterNoteId===focused.id),input=host?.querySelector('[data-note-text]');if(input&&!input.disabled){input.focus({preventScroll:true});input.setSelectionRange(focused.start,focused.end);}}
  }
  function paintReference(s){
    const npc=s.kind==='creature',hook=npc?'npc':'world',destination=s.view.title;
    const list=s.root.querySelector('[data-information-list]'),filters=s.root.querySelector('.campaign-information-filters');
    const query=s.root.querySelector('[data-information-search]').value.trim().toLowerCase(),category=s.root.querySelector('[data-information-category]').value;
    s.root.querySelector('[data-information-clear]').hidden=!query&&!category;
    const matches=s.rows.filter(row=>(!category||row.category===category)&&(!query||[row.title,row.summary,row.introduction,row.content].join(' ').toLowerCase().includes(query)));
    s.root.querySelector('[data-information-status]').textContent=s.selected?'':`${matches.length} of ${s.rows.length} shared ${npc?'NPCs':'World posts'}.`;
    const selected=s.rows.find(row=>row.id===s.selected);
    if(s.selected&&!selected){s.selected=null;s.root.querySelector('[data-information-status]').textContent=`This entry is no longer shared. Choose another entry in ${destination}.`;}
    filters.hidden=!!selected;list.classList.toggle('campaign-information-grid',!selected);
    if(selected){
      list.innerHTML=`<article class="world-post-reader${npc?' npc-post-reader':''}" ${npc?'':`data-post-layout="${WorldPostLayouts.resolve(selected.postLayout)}"`} data-information-id="${escape(selected.id)}"><div class="workspace-actions"><button type="button" data-${hook}-back>← Back to ${destination}</button>${canManageCampaign()?`<button type="button" data-${hook}-edit>${npc?'Edit NPC':'Edit post'}</button>`:''}</div><p class="campaign-book-eyebrow">Journal → ${destination} → ${escape(selected.title)}</p><h3 tabindex="-1" data-${hook}-title>${escape(selected.title)}</h3><p class="campaign-reference-category">${escape(selected.category)}</p>${npc?`${selected.image?`<figure class="world-reader-image" data-shared-image="${escape(selected.id)}">Loading illustration…</figure>`:''}${selected.summary?`<p class="world-reader-introduction">${escape(selected.summary)}</p>`:''}<div class="campaign-book-prose">${prose(selected.content)}</div>`:WorldPostLayouts.body(selected,{imageHTML:selected.image?`<figure class="world-reader-image" data-shared-image="${escape(selected.id)}">Loading illustration…</figure>`:''})}</article>`;
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
    if(selected&&s.targetId===selected.id){s.targetId=null;s.root.querySelector(`[data-${hook}-title]`)?.focus();}
  }
  function update(s, rows) {
    if(!current(s)||s.denied)return;s.rows=rows;loadState(s,'ready');
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
    const s={id:activeCampaign.id,uid:auth.currentUser.uid,root,view,kind,phase:'loading',rows:[],notes:new Map(),unsubscribe:null,denied:false,imageUrls:[],selected:saved?.selected||null,listScroll:saved?.scroll||0,focusId:saved?.focusId};session=s;
    loadState(s,'loading');
    root.querySelector('[data-information-search]').value=saved?.query||'';
    if(saved?.category)root.querySelector('[data-information-category]').add(new Option(saved.category,saved.category,true,true));s.isCurrent=()=>current(s);
    root.querySelector('[data-information-search]').addEventListener('input',()=>paint(s));
    root.querySelector('[data-information-category]').addEventListener('change',()=>paint(s));
    root.querySelector('[data-information-clear]').onclick=()=>{root.querySelector('[data-information-search]').value='';root.querySelector('[data-information-category]').value='';paint(s);root.querySelector('[data-information-search]').focus();};
    root.querySelector('[data-information-refresh]').addEventListener('click',()=>{if(current(s)&&s.phase!=='loading')render(kind);});
    try {
      update(s,await view.store.list(s.id));
      if(!current(s))return;
      if(saved&&!s.selected){const button=[...root.querySelectorAll('[data-read-world],[data-read-npc]')].find(node=>(node.dataset.readWorld||node.dataset.readNpc)===s.focusId);button?.focus({preventScroll:true});window.scrollTo(0,s.listScroll);}
      s.unsubscribe=view.store.watch(s.id,rows=>update(s,rows),error=>{
        if(!current(s))return;s.denied=true;s.unsubscribe?.();revokeImages(s);root.querySelector('.campaign-information-filters').hidden=false;s.rows=[];s.notes.clear();root.querySelector('[data-information-list]').replaceChildren();
        root.querySelector('[data-information-category]').innerHTML='<option value="">All categories</option>';
        loadState(s,'failed',`Shared information is unavailable: ${error.message}. Try again to reload this page.`);
      });
    } catch(error) {
      if(current(s)){s.rows=[];root.querySelector('[data-information-list]').replaceChildren();loadState(s,'failed',`Could not load shared information: ${error.message}. Try again to reload this page.`);}
    }
  }
  function attachPostSharing(host,s){
    const form=host.closest('form'),header=form.querySelector('[data-editor-header]'),actions=header.querySelector('[data-editor-actions]'),npc=s.kind==='creature',chapter=s.kind==='chapter',hook=chapter?'chapter':npc?'npc':'world';
    form.querySelector('[data-entry-sharing]')?.remove();actions.querySelector('[data-publish-entry]')?.remove();actions.querySelector('[data-unpublish-entry]')?.remove();actions.querySelector('[data-publication-options]')?.remove();
    const section=document.createElement('section');section.dataset.entrySharing='';section.className='post-publication-status';
    section.innerHTML='<p data-release-includes data-context-help="publication" data-help-label="Publishing to players"></p><p data-sharing-status role="status">Loading publication status…</p><div data-publication-options><button type="button" data-refresh-sharing>Retry publication status</button></div>';
    const publicationOptions=section.querySelector('[data-publication-options]');actions.querySelector('.workspace-editor-options > div').append(publicationOptions);header.append(section);
    const button=document.createElement('button');button.type='button';button.dataset.publishEntry='';button.setAttribute('data-publish-'+hook,'');button.disabled=true;button.textContent='Publish to players';
    const remove=document.createElement('button');remove.type='button';remove.dataset.unpublishEntry='';remove.setAttribute('data-unpublish-'+hook,'');remove.disabled=true;remove.textContent='Unpublish';
    actions.querySelector('.workspace-editor-options').before(button,remove);
    const store=views[s.kind].store,message=section.querySelector('[data-sharing-status]');let published=null,loaded=false,busy=false,problem=false;
    const active=()=>section.isConnected&&CampaignWorkspace.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
    const eligible=()=>chapter?form.querySelector('[data-record-field=status]').value==='Completed':!npc||form.querySelector('[data-record-field=category]').value==='Story NPC';
    const state=()=>{
      if(!active())return;const art=form.querySelector('[data-journal-image-editor]');if(art&&npc){const badge=art.querySelector('.journal-image-private');if(eligible()){badge?.remove();art.querySelector('.journal-image-heading p').textContent='Included with the text and caption when you publish to players.';}else{art.querySelector('.journal-image-heading p').textContent='Private DM illustration. Only Story NPC entries can be published to players.';if(!badge){const label=document.createElement('span');label.className='journal-image-private';label.textContent='PRIVATE DRAFT';art.querySelector('.journal-image-heading').append(label);}}art.querySelector('.journal-image-note').textContent=eligible()?'Save draft keeps changes private. Publish to players includes the illustration and caption.':'Private preparation. Choose Story NPC to make an entry eligible for publishing.';}button.disabled=!loaded||busy||s.busy||s.record.archived||!eligible();button.textContent=published&&!chapter?'Publish changes':'Publish to players';
      if(loaded&&!busy&&!s.busy&&!problem){if(s.dirty)message.textContent=published?'Unsaved draft changes. The player version is unchanged.':'Not published. Your unsaved draft is kept.';else if(published&&published.sourceRevision!==s.record.revision)message.textContent='Draft saved; the player version is unchanged.';}
      form.querySelector('[data-save-record]').disabled=busy||s.busy;remove.disabled=!loaded||busy||s.busy||!published;
      section.querySelector('[data-release-includes]').textContent=!eligible()?(chapter?'Set Story progress to Completed before publishing to players.':'Only Story NPC entries appear in Journal → NPCs.'):chapter?'Text and illustration publish together. Private preparation stays private.':s.record.data?.journalImage?.path?'Publishing includes the text, image and caption.':'Publishing includes the text. Add an illustration to publish it too.';
    };
    section._sharingState=state;
    const refresh=async()=>{problem=false;loaded=false;state();try{published=await store.load(s.campaignId,s.record.id);if(!active())return;loaded=true;CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,published);message.textContent=published?'Published. Later draft saves stay private.':'Not published yet.';}catch(error){problem=true;if(active())message.textContent='Could not load publication status: '+error.message;}state();};
    publicationOptions.querySelector('[data-refresh-sharing]').onclick=refresh;
    button.onclick=async()=>{
      if(!active()||busy||s.busy||!loaded||s.record.archived||!eligible())return;problem=false;busy=true;s.postPublishBusy=true;state();
      try{
        if(s.dirty||!s.record.revision){if(!await CampaignWorkspace.save())return;}
        if(!active()||s.dirty)return;s.busy=true;state();message.textContent='Publishing text and illustration…';
        const preparedImage=await CampaignJournalImages.preparePublished({campaignId:s.campaignId,kind:s.kind,id:s.record.id,image:s.record.data?.journalImage,isCurrent:active});
        if(!active())return;
        published=await store.publish({campaignId:s.campaignId,id:s.record.id,sourceRevision:s.record.revision,publishedRevision:published?.revision||0,includeImage:true,preparedImage,isCurrent:active});
        if(active()){CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,published);message.textContent='Published to players.';}
      }catch(error){problem=true;if(active())message.textContent='Could not publish: '+error.message;}
      finally{busy=false;s.busy=false;s.postPublishBusy=false;state();}
    };
    remove.onclick=async()=>{
      if(!active()||busy||s.busy||!published)return;problem=false;busy=true;s.busy=true;state();
      try{await store.unpublish({campaignId:s.campaignId,id:s.record.id,publishedRevision:published.revision,isCurrent:active});if(active()){published=null;CampaignWorkspace.configs[s.kind].onPublicationChange?.(s,null);message.textContent='Removed from players. Your draft is kept.';}}
      catch(error){problem=true;if(active())message.textContent='Could not remove publication: '+error.message;}
      finally{busy=false;s.busy=false;state();}
    };
    refresh();
  }
  function attachSharing(host,s) {
    if(!views[s.kind]||!host||!canManageCampaign())return;
    return attachPostSharing(host,s);
  }
  for(const kind of Object.keys(views)){
    const config=CampaignWorkspace.configs[kind],oldExtra=config.extra,oldSaved=config.onSaved,oldEdit=config.onEdit;
    config.extra=(host,s)=>{oldExtra?.(host,s);attachSharing(host,s);};
    config.onSaved=(host,s)=>{oldSaved?.(host,s);if(kind!=='world')oldExtra?.(host,s);if(!s.postPublishBusy)attachSharing(host,s);};
    if(oldEdit)config.onEdit=(host,s)=>{const sharing=s.host.querySelector('[data-entry-sharing]');oldEdit(host,s);if(sharing?.isConnected)sharing._sharingState?.();else attachSharing(host,s);};
  }
  function beforeNavigate(tab){return session?.view.tab===tab||clear();}
  function hasUnsavedNotes(){return !!session&&[...session.notes.values()].some(note=>note.dirty||note.saving);}
  function onAccountChanged(uid){if(session&&session.uid!==uid)clear(true);browsing.clear();returnToJournal=null;}
  function openWorld(id){showTab('campaign-information');if(session?.kind==='world'){session.selected=id;session.targetId=id;if(session.rows.length)paint(session);}}
  return {openWorld,decorateJournalEditor,render,clear,beforeNavigate,hasUnsavedNotes,onAccountChanged,store,npcStore,chapterStore};
})();
