'use strict';
/* Campaign-local policy. Source catalogues and existing character selections are never deleted. */
var CampaignRules=(()=>{
 const overrides=new Map(),unavailable=new Set();let unsubscribe=[];
 const stop=()=>{unsubscribe.forEach(fn=>fn());unsubscribe=[];};
 const active=()=>typeof activeCampaign==='undefined'?null:activeCampaign;
 const editions=(campaign=active())=>Array.isArray(campaign?.allowedEditions)&&campaign.allowedEditions.length?['2014','2024'].filter(v=>campaign.allowedEditions.includes(v)):['2014','2024'];
 function recordEdition(row){
  if(['2014','2024'].includes(String(row?.edition)))return String(row.edition);
  const text=[row?.source,row?.book,row?.name,row?.id].filter(Boolean).join(' ');
  if(/2024|\bPHB24\b|\bXPHB\b|\bXDMG\b|\bXMM\b/i.test(text))return'2024';
  if(/2014|\bPHB\b|\bDMG\b|\bMM\b/i.test(text))return'2014';
  return null; // Edition-neutral equipment and homebrew remain available.
 }
 const allowed=(row,campaign=active())=>!recordEdition(row)||editions(campaign).includes(recordEdition(row));
 const records=(campaign=active())=>overrides.get(campaign?.id)||[];
 function normalize(raw){
  const number=(v,min,max)=>Math.max(min,Math.min(max,Math.trunc(Number(v)||0)));
  return {name:String(raw.name||'').trim().slice(0,160),description:String(raw.description||'').slice(0,12000),edition:raw.edition==='2014'?'2014':'2024',hidden:raw.hidden===true,custom:raw.custom===true,minimumLevel:number(raw.minimumLevel,0,20),hpPerLevel:number(raw.hpPerLevel,0,10),speedBonus:number(raw.speedBonus,0,60),armorTraining:[...new Set((raw.armorTraining||[]).filter(v=>['light','medium','heavy','shield'].includes(v)))]};
 }
 function setOverrides(id,rows){overrides.set(id,(rows||[]).filter(r=>/^[a-zA-Z0-9_-]{1,100}$/.test(r.id)).map(r=>({id:r.id,...normalize(r)})));}
 function feat(id,base,campaign=active()){
  const edit=records(campaign).find(r=>r.id===id);if(!edit)return base;
  return {...base,...edit,category:base?.category||'G',source:edit.custom?'Homebrew':base?.source,book:edit.custom?'Campaign homebrew':base?.book,licensedText:true};
 }
 function feats(base,campaign=active(),includeHidden=false){
  const ids=new Set(base.map(r=>r.id)),rows=base.map(r=>feat(r.id,r,campaign)).concat(records(campaign).filter(r=>r.custom&&!ids.has(r.id)).map(r=>feat(r.id,null,campaign)));
  return includeHidden?rows:rows.filter(r=>!r.hidden&&allowed(r,campaign));
 }
 const selectableFeat=(id,base,campaign=active())=>feats(base,campaign).some(r=>r.id===id);
 function backgroundAllowed(row,campaign=active()){
  if(!allowed(row,campaign))return false;
  const names=row?.featChoices?.length?row.featChoices:row?.feat?[row.feat]:[];if(!names.length)return true;
  const base=globalThis.CharacterCatalog?.rawData?.feats||Object.entries(globalThis.CharacterFeatData||{}).map(([id,def])=>({id,...def}));
  return names.some(name=>{const matches=base.filter(f=>f.edition==='2024'&&(globalThis.CharacterFeatData?.[f.id]?.name||f.name)===name);return !matches.length||matches.some(f=>!feat(f.id,f,campaign).hidden&&allowed(f,campaign));});
 }
 function definition(id,base){
  const row=records().find(r=>r.id===id);if(!row)return base;
  if(!row.custom)return base?{...base,displayName:row.name}:base;
  return {name:row.name,source:'Homebrew',edition:row.edition,ability:[],requirements:[{level:row.minimumLevel,ability:[]}],repeatable:false,armorTraining:row.armorTraining,campaignEffects:{hpPerLevel:row.hpPerLevel,speedBonus:row.speedBonus}};
 }
 async function load(campaign=active()){
  if(!campaign)return;const sdk=globalThis.__DND_VAULT_DEPS__;if(!sdk?.getDocs)return;
  try{const snapshot=await sdk.getDocs(sdk.collection(sdk.db,'campaigns',campaign.id,'featCatalog'));
   setOverrides(campaign.id,snapshot.docs.map(d=>({id:d.id,...d.data()})));unavailable.delete(campaign.id);
  }catch(error){if(error.code==='permission-denied'&&!campaign.allowedEditions){unavailable.add(campaign.id);setOverrides(campaign.id,[]);return;}throw error;}
 }
 function watch(campaign=active()){
  stop();const sdk=globalThis.__DND_VAULT_DEPS__;if(!campaign||!sdk?.onSnapshot||unavailable.has(campaign.id))return;
  let previous=JSON.stringify([editions(campaign),records(campaign)]);
  const refresh=()=>{if(active()?.id!==campaign.id)return;const next=JSON.stringify([editions(),records()]);if(next===previous)return;previous=next;
   if(typeof sheetSession!=='undefined'&&sheetSession?.campaignId===campaign.id){const tab=document.querySelector('[data-sheet-tab][aria-selected="true"]')?.dataset.sheetTab;readSheetForm();renderCharacterSheet();if(tab)selectSheetTab(tab);}
   if(typeof renderCards==='function')renderCards();
  };
  const error=e=>{if(active()?.id===campaign.id&&typeof alert==='function')alert('Could not refresh campaign rules: '+e.message);};
  unsubscribe.push(sdk.onSnapshot(sdk.doc(sdk.db,'campaigns',campaign.id),snap=>{if(active()?.id===campaign.id&&snap.exists()){activeCampaign={...activeCampaign,allowedEditions:snap.data().allowedEditions};refresh();}},error));
  unsubscribe.push(sdk.onSnapshot(sdk.collection(sdk.db,'campaigns',campaign.id,'featCatalog'),snap=>{if(active()?.id===campaign.id){setOverrides(campaign.id,snap.docs.map(d=>({id:d.id,...d.data()})));refresh();}},error));
 }
 return {policyAvailable:(campaign=active())=>!unavailable.has(campaign?.id),watch,stop,backgroundAllowed,editions,recordEdition,allowed,records,normalize,setOverrides,feat,feats,selectableFeat,definition,load};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CampaignRules;
