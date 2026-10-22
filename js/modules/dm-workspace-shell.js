'use strict';
// Preparation navigation and saved-record summaries do not create workspace drafts.
var DMWorkspaceShell=(()=>{
 const sections=[['dm','Overview'],['dm-world','World'],['dm-map','Maps'],['dm-creatures','Creatures & NPCs'],['dm-chapters','Chapters'],['dm-one-shots','One Shots'],['dm-party','Party & Loot']];
 const kinds={world:'World',creature:'Creature or NPC',chapter:'Chapter',encounter:'Encounter'};
 const e=value=>escapeHtml(String(value??''));
 const overviewStates=new WeakMap();
 let route=null,generation=0;
 function ensure(){
  const main=document.getElementById('mainApp');if(!main)return null;
  let shell=document.getElementById('dmWorkspaceShell');
  if(!shell){
   shell=document.createElement('section');shell.id='dmWorkspaceShell';shell.className='dm-workspace-shell';shell.hidden=true;
   shell.innerHTML='<nav id="dmWorkspaceSidebar" class="dm-workspace-sidebar" aria-label="DM workspace sections"><h2>DM Workspace</h2><button type="button" data-dm-workspace-tab="dm">Overview</button></nav><div id="dmWorkspaceBody" class="dm-workspace-body"></div>';
   shell.querySelector('[data-dm-workspace-tab="dm"]').onclick=()=>showTab('dm');
   const secondary=document.getElementById('campaignSectionNavigation');if(secondary?.parentElement===main)secondary.after(shell);else main.append(shell);
  }
  const body=shell.querySelector('#dmWorkspaceBody');
  for(const [tab]of sections){const panel=document.getElementById('tab-'+tab);if(panel&&panel.parentElement!==body)body.append(panel);}
  return shell;
 }
 function update(tab){
  route=tab;++generation;
  const shell=ensure();if(!shell)return;
  const active=sections.some(([key])=>key===tab)&&!!activeCampaign&&canManageCampaign();shell.hidden=!active;
  const secondary=document.getElementById('campaignSectionNavigation'),group=secondary?.querySelector('[data-section-group="dm"]');
  const sidebar=shell.querySelector('#dmWorkspaceSidebar');
  if(active){
   for(const [key,label]of sections){
    const button=key==='dm'?sidebar.querySelector('[data-dm-workspace-tab="dm"]'):document.querySelector('.tab[data-tab="'+key+'"]');
    if(!button)continue;
    button.dataset.dmWorkspaceTab=key;button.textContent=label;if(button.parentElement!==sidebar)sidebar.append(button);
    const selected=key===tab;button.classList.toggle('active',selected);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
   }
   if(secondary)secondary.hidden=true;
  }else if(group){
   // AppShell normally restores these first; keep direct update calls safe as well.
   for(const button of sidebar.querySelectorAll('.tab[data-tab]'))group.append(button);
   const oneShot=document.querySelector('#tab-dm > [data-dm-legacy-adventures] .tab');if(oneShot)group.append(oneShot);
  }
 }
 async function loadOverview(host,retry=false){
  const previous=overviewStates.get(host);
  if(retry&&previous?.busy)return;
  const campaignId=activeCampaign?.id,uid=auth.currentUser?.uid,token=++generation;
  const valid=()=>route==='dm'&&token===generation&&host.isConnected&&activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canManageCampaign();
  const state=previous?.campaignId===campaignId&&previous.uid===uid?previous:{campaignId,uid,groups:new Map()};overviewStates.set(host,state);state.busy=true;state.token=token;
  host.setAttribute('aria-busy','true');host.querySelectorAll('button').forEach(button=>button.disabled=true);
  host.querySelectorAll('[data-dm-retry-overview]').forEach(button=>button.textContent='Retrying…');
  const next=host.querySelector('[data-dm-next-chapter]'),recent=host.querySelector('[data-dm-recent-work]');
  const requested=Object.keys(kinds).filter(kind=>!retry||!state.groups.has(kind)||state.groups.get(kind).failed),results=await Promise.allSettled(requested.map(kind=>CampaignWorkspace.store.list(campaignId,kind)));
  if(!valid()){if(overviewStates.get(host)===state&&state.token===token){state.busy=false;host.setAttribute('aria-busy','false');}return;}
  state.busy=false;host.setAttribute('aria-busy','false');
  results.forEach((result,index)=>state.groups.set(requested[index],{kind:requested[index],rows:result.status==='fulfilled'?result.value:[],failed:result.status==='rejected'}));
  const groups=Object.keys(kinds).map(kind=>state.groups.get(kind));
  const chapters=groups.find(group=>group.kind==='chapter');
  const ordered=chapters.rows.filter(row=>!row.archived).sort((a,b)=>(Number(a.data?.order)||0)-(Number(b.data?.order)||0)||a.title.localeCompare(b.title));
  const progress=row=>['Planned','Current','Completed'].includes(row.data?.status)?row.data.status:'Planned';
  const chapter=ordered.find(row=>progress(row)==='Current')||ordered.find(row=>progress(row)==='Planned');
  next.innerHTML='<h2>Next chapter</h2>'+(chapters.failed?'<p role="status">Chapter preparation could not be loaded.</p><button type="button" data-dm-retry-overview>Retry chapter overview</button>':chapter?'<p class="dm-workspace-summary-label">'+(chapter.data?.status==='Current'?'Current chapter':'Next planned chapter')+'</p><h3>'+e(chapter.title)+'</h3><p>'+e(chapter.summary)+'</p><button type="button" data-dm-next-chapter-open>Open chapter</button>':'<p>No current or planned chapters yet.</p><button type="button" data-dm-browse-chapters>Browse chapters</button>');
  next.querySelector('[data-dm-next-chapter-open]')?.addEventListener('click',()=>{if(valid())CampaignWorkspace.navigateTo('chapter',chapter.id);});
  next.querySelector('[data-dm-browse-chapters]')?.addEventListener('click',()=>{if(valid())showTab('dm-chapters');});
  const rows=groups.flatMap(group=>group.rows.filter(row=>!row.archived).map(row=>({...row,kind:group.kind}))).sort((a,b)=>(Number(b.updatedAt)||Number(b.createdAt)||0)-(Number(a.updatedAt)||Number(a.createdAt)||0)||a.title.localeCompare(b.title)).slice(0,6);
  const incomplete=groups.some(group=>group.failed);
  recent.innerHTML='<h2>Recent work</h2>'+(rows.length?'<div class="dm-recent-work-list">'+rows.map(row=>'<button type="button" data-dm-recent-entry="'+e(row.kind+':'+row.id)+'"><strong>'+e(row.title)+'</strong><span>'+e(kinds[row.kind])+(row.summary?' · '+e(row.summary.slice(0,100)):'')+'</span></button>').join('')+'</div>':incomplete?'':'<p>No saved preparation yet.</p>')+(incomplete?'<p role="status">Some recent work could not be loaded. Try again to load the missing entries.</p><button type="button" data-dm-retry-overview>Retry recent work</button>':'');
  recent.querySelectorAll('[data-dm-recent-entry]').forEach(button=>button.onclick=()=>{if(!valid())return;const [kind,id]=button.dataset.dmRecentEntry.split(':');CampaignWorkspace.navigateTo(kind,id);});
  host.querySelectorAll('[data-dm-retry-overview]').forEach(button=>button.onclick=()=>{if(valid()&&!state.busy)loadOverview(host,true);});
 }
 function organizeDMTools(){
  const panel=document.getElementById('dmToolsPanel'),party=document.querySelector('#dmPartyPanel .dm-tools-grid');
  const cards=panel?[...panel.querySelectorAll('[data-dm-party-card]')]:[];
  if(party&&cards.length){party.replaceChildren();cards.forEach(card=>party.append(card));}
  if(panel&&activeCampaign&&canManageCampaign()){
   const grid=panel.querySelector('.dm-tools-grid');
   if(grid){
    let preparation=grid.querySelector('[data-dm-overview-preparation]');
    if(!preparation){preparation=document.createElement('div');preparation.className='dm-overview-preparation';preparation.dataset.dmOverviewPreparation='';preparation.innerHTML='<section class="dm-tool-card" data-dm-next-chapter><h2>Next chapter</h2><p role="status">Loading chapter preparation…</p></section><section class="dm-tool-card" data-dm-recent-work><h2>Recent work</h2><p role="status">Loading saved preparation…</p></section>';grid.querySelector('.dm-tool-card')?.after(preparation);}
    const oldShortcut=grid.querySelector('[data-open-dm-planning="one-shots"]')?.closest('.dm-planning-shortcut');
    oldShortcut?.remove();
    update(AppShell.route);
    if(route==='dm')loadOverview(preparation);
   }
  }else update(AppShell.route);
 }
 return{organizeDMTools,update};
})();
