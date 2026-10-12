'use strict';
var CampaignInformation = (() => {
  const store=createCampaignInformationStore(window.__DND_VAULT_DEPS__);
  let session=null;
  const escape=value=>escapeHtml(String(value??''));
  const current=s=>session===s && activeCampaign?.id===s.id && auth.currentUser?.uid===s.uid;
  function clear() {
    session?.unsubscribe?.();session=null;
    document.getElementById('tab-campaign-information')?.replaceChildren();
  }
  function paint(s) {
    if(!current(s))return;
    const query=s.root.querySelector('[data-information-search]').value.trim().toLowerCase(),category=s.root.querySelector('[data-information-category]').value;
    const list=s.root.querySelector('[data-information-list]');
    const openIds=new Set([...list.querySelectorAll('details[open]')].map(node=>node.dataset.informationId));
    const rows=s.rows.filter(row=>(!category||row.category===category)&&(!query||[row.title,row.summary,row.content].join(' ').toLowerCase().includes(query))).sort((a,b)=>a.title.localeCompare(b.title));
    list.innerHTML=rows.map(row=>`<article class="campaign-information-card"><details data-information-id="${escape(row.id)}" ${openIds.has(row.id)?'open':''}><summary><strong>${escape(row.title)}</strong><span>${escape(row.category)}</span></summary>${row.summary?`<p>${escape(row.summary)}</p>`:''}<div class="campaign-book-prose">${escape(row.content)}</div></details></article>`).join('')||`<p class="campaign-information-empty">${s.rows.length?'No shared entries match your search.':'Your DM has not shared campaign information yet. Revealed places, lore and factions will appear here.'}</p>`;
  }
  function update(s, rows) {
    if(!current(s)||s.denied)return;s.rows=rows;
    const select=s.root.querySelector('[data-information-category]'),selected=select.value;
    select.innerHTML='<option value="">All categories</option>'+[...new Set(rows.map(row=>row.category))].sort().map(value=>`<option>${escape(value)}</option>`).join('');
    select.value=selected;paint(s);
    s.root.querySelector('[data-information-status]').textContent=`${rows.length} shared ${rows.length===1?'entry':'entries'}.`;
  }
  async function render() {
    clear();if(!activeCampaign||!auth.currentUser)return;
    const root=document.getElementById('tab-campaign-information');
    root.innerHTML=`<section class="campaign-information-shell" aria-labelledby="campaignInformationTitle"><header><p class="campaign-book-eyebrow">${escape(activeCampaign.name)}</p><h2 id="campaignInformationTitle">Campaign information</h2><p>Places, lore and factions your DM has shared with the party.</p></header><div class="campaign-information-filters"><label>Search campaign information<input type="search" data-information-search></label><label>Category<select data-information-category><option value="">All categories</option></select></label><button class="vault-secondary-btn" type="button" data-information-refresh>Refresh</button></div><p role="status" aria-live="polite" data-information-status>Loading shared campaign information…</p><div data-information-list></div></section>`;
    const s={id:activeCampaign.id,uid:auth.currentUser.uid,root,rows:[],unsubscribe:null,denied:false};session=s;
    root.querySelector('[data-information-search]').addEventListener('input',()=>paint(s));
    root.querySelector('[data-information-category]').addEventListener('change',()=>paint(s));
    root.querySelector('[data-information-refresh]').addEventListener('click',()=>render());
    try {
      update(s,await store.list(s.id));
      if(!current(s))return;
      s.unsubscribe=store.watch(s.id,rows=>update(s,rows),error=>{
        if(!current(s))return;s.denied=true;s.unsubscribe?.();s.rows=[];root.querySelector('[data-information-list]').replaceChildren();
        root.querySelector('[data-information-category]').innerHTML='<option value="">All categories</option>';
        root.querySelector('[data-information-status]').textContent=`Shared information is unavailable: ${error.message}`;
      });
    } catch(error) {
      if(current(s)){s.rows=[];root.querySelector('[data-information-list]').replaceChildren();root.querySelector('[data-information-status]').textContent=`Could not load shared information: ${error.message}`;}
    }
  }
  function attachSharing(host,s) {
    if(s.kind!=='world'||!host||!canManageCampaign())return;
    host.querySelector('[data-world-sharing]')?.remove();
    const section=document.createElement('section');section.dataset.worldSharing='';section.className='campaign-world-sharing';
    section.innerHTML='<h3>Share campaign information</h3><p>Share only this entry’s saved title, summary and player description. DM secrets, private maps and connections stay private. Later edits remain private until you update the shared version.</p><p data-sharing-status role="status">Loading sharing status…</p><div class="workspace-actions"><button type="button" data-publish-world disabled>Share with players</button><button type="button" data-unpublish-world disabled>Remove from player information</button><button type="button" data-refresh-sharing>Refresh sharing status</button></div>';
    host.append(section);let published=null,loaded=false,busy=false,requestToken=0;
    const active=()=>section.isConnected&&CampaignWorkspace.session===s&&activeCampaign?.id===s.campaignId&&auth.currentUser?.uid===s.uid&&canManageCampaign();
    const state=()=>{
      if(!active())return;
      section.querySelector('[data-publish-world]').disabled=!loaded||busy||s.busy||s.dirty||!s.record.revision||s.record.archived;
      section.querySelector('[data-publish-world]').textContent=published?'Update shared version':'Share with players';
      section.querySelector('[data-unpublish-world]').disabled=!loaded||busy||s.busy||!published;
      section.querySelector('[data-refresh-sharing]').disabled=busy;
    };
    const refresh=async()=>{
      const token=++requestToken;loaded=false;state();
      try{const result=await store.load(s.campaignId,s.record.id);if(!active()||token!==requestToken)return;published=result;loaded=true;section.querySelector('[data-sharing-status]').textContent=published?`Shared with players${published.sourceRevision!==s.record.revision?' — saved changes have not been shared yet.':'.'}`:'Not shared. Save changes before sharing this entry.';state();}
      catch(error){if(active()&&token===requestToken)section.querySelector('[data-sharing-status]').textContent=`Could not load sharing status: ${error.message}`;}
    };
    section.querySelector('[data-refresh-sharing]').onclick=refresh;
    const form=host.closest('form');host._sharingController?.abort();host._sharingController=new AbortController();form.addEventListener('input',state,{signal:host._sharingController.signal});
    section.querySelector('[data-publish-world]').onclick=async()=>{
      if(!active()||busy||s.busy||s.dirty||!loaded||s.record.archived)return;
      if(!confirm('Share this saved player description with campaign members? DM secrets and maps stay private.'))return;
      busy=true;s.busy=true;state();
      try{published=await store.publish({campaignId:s.campaignId,id:s.record.id,sourceRevision:s.record.revision,publishedRevision:published?.revision||0,isCurrent:active});if(active())section.querySelector('[data-sharing-status]').textContent='Shared with campaign members.';}
      catch(error){if(active())section.querySelector('[data-sharing-status]').textContent=`Could not share: ${error.message}`;}
      finally{busy=false;s.busy=false;state();}
    };
    section.querySelector('[data-unpublish-world]').onclick=async()=>{
      if(!active()||busy||s.busy||!published||!loaded)return;
      if(!confirm('Remove this entry from player campaign information? Your private world entry is kept.'))return;
      busy=true;s.busy=true;state();
      try{await store.unpublish({campaignId:s.campaignId,id:s.record.id,publishedRevision:published.revision,isCurrent:active});if(active()){published=null;section.querySelector('[data-sharing-status]').textContent='Removed from player information. Your world entry is kept.';}}
      catch(error){if(active())section.querySelector('[data-sharing-status]').textContent=`Could not remove: ${error.message}`;}
      finally{busy=false;s.busy=false;state();}
    };
    refresh();
  }
  const config=CampaignWorkspace.configs.world,oldExtra=config.extra,oldSaved=config.onSaved;
  config.extra=(host,s)=>{oldExtra?.(host,s);attachSharing(host,s);};
  config.onSaved=(host,s)=>{oldSaved?.(host,s);attachSharing(host,s);};
  return {render,clear,store};
})();
