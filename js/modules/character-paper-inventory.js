'use strict';
/* Original equipment destinations are paper references, never extra physical inventory. */
var CharacterPaperInventory=(()=>{
 const validId=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\r\n/]/.test(id);
 function normalize(raw={}){
  const copyIds=new Set(),copies=(Array.isArray(raw?.copies)?raw.copies:[]).slice(0,200).filter(row=>{
   const key=row?.destination+':'+row?.id;if(!validId(row?.id)||!['gear','extra'].includes(row.destination)||!Number.isInteger(row.slot)||row.slot<0||row.slot>89||copyIds.has(key))return false;copyIds.add(key);return true;
  }).map(row=>({id:row.id,name:String(row.name||'').slice(0,200),destination:row.destination,slot:row.slot}));
  const ids=new Set(),footer=Array.from({length:3},(_,i)=>{const row=raw?.footer?.[i];if(!validId(row?.id)||ids.has(row.id))return null;ids.add(row.id);return{id:row.id,name:String(row.name||'').slice(0,200)};});
  return{attunedFooter:raw?.attunedFooter===true,footer,copies};
 }
 const range=(state,destination)=>destination==='gear'?[0,state.attunedFooter?49:53]:[54,89];
 const reference=(saved,byId)=>{const source=byId.get(saved.id);return source?{...source,quantity:'',reference:true}:{id:saved.id,name:(saved.name||'Saved item')+' (unavailable)',quantity:'',weight:null,reference:true,unavailable:true};};
 function project(raw,all){
  const state=normalize(raw),byId=new Map(all.map(row=>[row.id,row])),entries=state.attunedFooter?[...Array.from({length:50},(_,i)=>all[i]||null),{header:true,name:'',quantity:'',weight:null},...state.footer.map(row=>row?{...reference(row,byId),footer:true}:null),...all.slice(50)]:[...all];
  const copyRows=[];for(const saved of state.copies){const [start,end]=range(state,saved.destination);let slot=saved.slot>=start&&saved.slot<=end&&!entries[saved.slot]?saved.slot:-1;
   if(slot<0)for(let i=start;i<=end;i++)if(!entries[i]){slot=i;break;}
   // Inventory growth may displace a saved reference; keep it on a continuation.
   if(slot<0){slot=Math.max(90,entries.length);while(entries[slot])slot++;}
   entries[slot]=reference(saved,byId);copyRows.push({id:saved.id,destination:saved.destination,slot,displaced:slot<start||slot>end});
  }
  return{state,entries,copyRows};
 }
 function copy(raw,all,id,destination){
  if(!validId(id)||!all.some(row=>row.id===id))throw Error('Choose an owned item.');const state=normalize(raw),source=all.find(row=>row.id===id);
  if(destination==='footer'){
   if(!state.attunedFooter)throw Error('Enable the Attuned Magical Items footer first.');let slot=state.footer.findIndex(row=>row?.id===id);if(slot>=0)return{state,slot:51+slot,reused:true};slot=state.footer.findIndex(row=>!row);if(slot<0)throw Error('The three footer rows are full. Clear a reference first.');state.footer[slot]={id,name:source.name};return{state,slot:51+slot,reused:false};
  }
  if(!['gear','extra'].includes(destination))throw Error('Choose an original equipment destination.');const projected=project(state,all),[start,end]=range(state,destination);
  for(let i=start;i<=end;i++)if(projected.entries[i]?.id===id)return{state,slot:i,reused:true};
  let slot=-1;for(let i=start;i<=end;i++)if(!projected.entries[i]){slot=i;break;}if(slot<0)throw Error('This equipment section is full. No existing row was changed.');
  if(state.copies.length>=200)throw Error('The paper-reference limit has been reached.');state.copies.push({id,name:source.name,destination,slot});return{state,slot,reused:false};
 }
 function remove(raw,id,destination){const state=normalize(raw);if(destination==='footer')state.footer=state.footer.map(row=>row?.id===id?null:row);else if(['gear','extra'].includes(destination))state.copies=state.copies.filter(row=>row.id!==id||row.destination!==destination);else throw Error('Choose an original equipment destination.');return state;}
 function footer(raw,enabled){if(typeof enabled!=='boolean')throw Error('Choose whether to show the footer.');return{...normalize(raw),attunedFooter:enabled};}
 return{normalize,project,copy,remove,footer};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterPaperInventory=CharacterPaperInventory;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperInventory;
