'use strict';
// Only locations, never editor data. One browser tab and authenticated UID at a time.
var AppNavigation=(()=>{
 const tabs=new Set(['campaign-home','campaign-journal','campaign-map','campaign-information','campaign-npcs','campaign-chapters','library','player','character-sheet','character-loot','character-wishlist','dm','dm-world','dm-creatures','dm-chapters','dm-party','dm-settings','dm-one-shots','player-adventures','admin']);
 const kinds=new Set(['world','creature','chapter','encounter','oneShot','playerAdventure']);
 const sections=new Set(['overview','skills','combat','spells','inventory','builder','feats','story','companion','rules']);
 const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
 const key=uid=>'campaignatlas.navigation.v1.'+encodeURIComponent(uid);
 let restoring=0,generation=0;
 function cancelRestore(){++generation;restoring=0;}
 function read(uid){
  try{const value=JSON.parse(sessionStorage.getItem(key(uid)));if(value?.version!==1)return null;
   if(value.dashboard===true)return{version:1,dashboard:true};
   if(!validId(value.campaignId)||!tabs.has(value.tab))return null;
   const route={version:1,campaignId:value.campaignId,tab:value.tab};
   if(validId(value.characterId))route.characterId=value.characterId;
   if(sections.has(value.sheetTab))route.sheetTab=value.sheetTab;
   if(kinds.has(value.workspaceKind))route.workspaceKind=value.workspaceKind;
   if(validId(value.recordId))route.recordId=value.recordId;
   return route;
  }catch{return null;}
 }
 function write(route){if(restoring||!auth.currentUser?.uid)return;try{sessionStorage.setItem(key(auth.currentUser.uid),JSON.stringify(route));}catch{}}
 function clear(uid=auth.currentUser?.uid){if(uid)try{sessionStorage.removeItem(key(uid));}catch{}}
 function allowed(tab){
  if(!tabs.has(tab)||!activeCampaign)return false;
  if(tab==='admin')return isAdmin();
  if(tab==='dm'||tab.startsWith('dm-'))return canManageCampaign();
  if(tab==='character-sheet')return canManageCampaign()||canUseCharacters();
  if(['player','character-loot','character-wishlist','player-adventures'].includes(tab))return canUseCharacters();
  return true;
 }
 function remember(tab){
  tab??=document.getElementById('tab-admin')?.style.display==='block'?'admin':typeof AppShell!=='undefined'?AppShell.route:document.querySelector('.tabs .tab.active')?.dataset.tab;
  if(!allowed(tab))return;
  const route={version:1,campaignId:activeCampaign.id,tab};
  if(['character-loot','character-wishlist'].includes(tab)&&typeof CharacterWorkspace!=='undefined'){const character=CharacterWorkspace.context;if(character?.campaignId===activeCampaign.id&&validId(character.characterId))route.characterId=character.characterId;}
  if(tab==='character-sheet'&&sheetSession?.campaignId===activeCampaign.id){
   if(sheetSession.adventureId){route.tab=canManageCampaign()?'dm-one-shots':'player-adventures';route.workspaceKind=canManageCampaign()?'oneShot':'playerAdventure';route.recordId=sheetSession.adventureId;}
   else{route.characterId=sheetSession.characterId;route.sheetTab=document.querySelector('[data-sheet-tab][aria-selected=true]')?.dataset.sheetTab;}
  }
  const s=typeof CampaignWorkspace==='undefined'?null:CampaignWorkspace.session;
  if(s?.campaignId===activeCampaign.id&&kinds.has(s.kind)&&CampaignWorkspace.configs[s.kind].tab===tab){route.workspaceKind=s.kind;if(s.record?.revision)route.recordId=s.record.id;}
  write(route);
 }
 function dashboard(){cancelRestore();write({version:1,dashboard:true});}
 async function restore(uid){
  const route=read(uid);if(!route||route.dashboard||auth.currentUser?.uid!==uid)return false;
  const campaign=campaigns.find(row=>row.id===route.campaignId);if(!campaign){clear(uid);return false;}
  const token=++generation;restoring=token;
  try{
   const entered=await enterCampaign(campaign);if(!entered||token!==generation||auth.currentUser?.uid!==uid||activeCampaign?.id!==route.campaignId)return false;
   const tab=allowed(route.tab)?route.tab:'campaign-home';
   if(tab==='character-sheet'&&route.characterId&&sheetCharacters().some(character=>character.id===route.characterId)){
    await openCharacterSheet(route.characterId);
    if(sheetSession?.characterId===route.characterId&&auth.currentUser?.uid===uid){const button=document.querySelector(`[data-sheet-tab="${route.sheetTab||'overview'}"]`);selectSheetTab(button&&!button.hidden?button.dataset.sheetTab:'overview');}
   }else if(['character-loot','character-wishlist'].includes(tab)){
    await CharacterWorkspace.open(sheetCharacters().some(row=>row.id===route.characterId)?route.characterId:null,tab);
   }else if(route.workspaceKind&&CampaignWorkspace.configs[route.workspaceKind]?.tab===tab){
    showTab(tab,false);await CampaignWorkspace.render(route.workspaceKind);
    const s=CampaignWorkspace.session,row=s?.rows.find(entry=>entry.id===route.recordId);
    if(s?.campaignId===route.campaignId&&s.kind===route.workspaceKind&&row&&document.getElementById('tab-'+tab)?.style.display==='block'){
     if(row.archived){s.host.querySelector('[data-workspace-archived]').checked=true;CampaignWorkspace.renderList();}
     await CampaignWorkspace.openRecord(row.id);
    }
   }else showTab(tab);
   return true;
  }finally{if(restoring===token){restoring=0;if(auth.currentUser?.uid===uid){if(activeCampaign)remember();else dashboard();}}}
 }
 return{read,remember,dashboard,restore,clear,cancelRestore};
})();
