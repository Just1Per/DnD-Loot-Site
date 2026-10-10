'use strict';
/* DM-owned creature templates, independent from campaign-owned copies. */
var PersonalCreatureLibrary=(()=>{
 const sdk=window.__DND_VAULT_DEPS__||{};
 const owner=()=>{const uid=sdk.auth?.currentUser?.uid;if(!uid)throw Error('Sign in first.');return uid};
 const location=()=>sdk.collection(sdk.db,'users',owner(),'creatureTemplates');
 const assert=record=>{
  const title=String(record?.title||'').trim();
  if(!title||title.length>160)throw Error('Creature name must be 1–160 characters.');
  const summary=String(record.summary||''),content=String(record.content||''),data=CampaignCreatures.normalize(record.data||{});
  if(summary.length>1000||content.length>20000||JSON.stringify(data).length>90000)throw Error('Creature entry is too large.');
  return{title,summary,content,data,sourceCampaignId:String(record.sourceCampaignId||'').slice(0,100)};
 };
 async function list(){const rows=await sdk.getDocs(location());return rows.docs.map(row=>({id:row.id,...row.data()})).sort((a,b)=>a.title.localeCompare(b.title));}
 async function add(record){const uid=owner(),values=assert(record),now=Date.now(),id=crypto.randomUUID().replaceAll('-','');await sdk.setDoc(sdk.doc(location(),id),{...values,createdBy:uid,createdAt:now,updatedAt:now});return id;}
 async function remove(id){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw Error('Invalid template ID.');await sdk.deleteDoc(sdk.doc(location(),id));}
 return{list,add,remove};
})();
