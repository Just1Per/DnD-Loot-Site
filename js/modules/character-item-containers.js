'use strict';
/* Explicit owned-stack placement. Paper location text never controls physical weight. */
var CharacterItemContainers=(()=>{
 const P=typeof CharacterPinnedItems!=='undefined'?CharacterPinnedItems:require('./character-pinned-items'),stored=d=>d.adobe||d.rulesChoices?.grants?.__adobe?.data||{},valid=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\/\r\n]/.test(id),own=(obj,k)=>Object.hasOwn(obj,k);
 function normalize(raw){return Object.fromEntries(Object.entries(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}).filter(([id,parent])=>valid(id)&&valid(parent)&&id!==parent).slice(0,200));}
 const directCarrier=(data,id)=>(Array.isArray(stored(data).companions)?stored(data).companions:[]).findIndex(c=>c.equipment?.rows?.some(r=>r?.id===id));
 const mass=r=>{if(r.weight!==null&&r.weight!==undefined&&Number.isFinite(Number(r.weight)))return Number(r.weight);const prop=r.item?.properties?.find(p=>p.title==='Weight per unit (lb)')?.text;if(prop!==undefined&&prop!==''&&Number.isFinite(Number(prop)))return Number(prop);return null;};
 function project(data,entries){
  const owned=new Map(entries.filter(r=>valid(r.id)&&Number(r.quantity)>0).map(r=>[r.id,r])),saved=normalize(stored(data).itemContainers),placements=Object.create(null),warnings=[];
  for(const [id,parent]of Object.entries(saved)){
   const child=owned.get(id),bag=owned.get(parent),definition=bag&&P.container(bag.item||bag);if(!child||!bag||!definition||Number(bag.quantity)!==1||directCarrier(data,id)!==directCarrier(data,parent)){if(child)warnings.push((child.name||child.item?.name||id)+': saved container placement is unavailable; its weight counts normally.');continue;}
   let at=parent,seen=new Set([id]),bad=false,magical=P.container(child.item||child)?.weightless===true;
   while(at){if(seen.has(at)){bad=true;break;}seen.add(at);const r=owned.get(at),c=r&&P.container(r.item||r);if(c?.weightless){if(magical){bad=true;break;}magical=true;}at=saved[at];}
   if(bad){warnings.push((child.name||child.item?.name||id)+': cyclic or nested magical container placement is inactive.');continue;}placements[id]=parent;
  }
  const ancestors=id=>{const out=[];let at=placements[id];while(at&&out.length<200&&!out.includes(at)){out.push(at);at=placements[at];}return out;};
  const weightlessAncestor=(id,stop)=>ancestors(id).some(parent=>parent!==stop&&P.container(owned.get(parent)?.item||owned.get(parent))?.weightless);
  const effective=entries.map(r=>({...r,weight:weightlessAncestor(r.id)?0:mass(r)})),containers=[];
  for(const [id,r]of owned){const definition=P.container(r.item||r);if(!definition||Number(r.quantity)!==1)continue;let used=0,unknown=0;const contents=[];
   for(const [childId,child]of owned){if(!ancestors(childId).includes(id))continue;contents.push(childId);const chain=ancestors(childId),inner=chain.slice(0,chain.indexOf(id)),hidden=inner.some(parent=>P.container(owned.get(parent)?.item||owned.get(parent))?.weightless);if(hidden)continue;const unit=mass(child);if(unit===null)unknown++;else used+=Number(child.quantity)*unit;}
   const over=definition.capacity!==null&&used>definition.capacity;containers.push({id,name:r.name||r.item?.name||id,...definition,used:Number(used.toFixed(3)),unknown,contents,over});if(over)warnings.push((r.name||r.item?.name)+': contents exceed '+definition.capacity+' lb capacity.');if(unknown)warnings.push((r.name||r.item?.name)+': container capacity has '+unknown+' unknown item weight'+(unknown===1?'':'s')+'.');
  }
  return{placements,entries:effective,containers,warnings};
 }
 function location(data,entries,id,projection=project(data,entries)){
  const entry=entries.find(row=>row.id===id);if(!entry)return null;
  const carrierIndex=directCarrier(data,id),carrier=carrierIndex<0?'You':stored(data).companions[carrierIndex]?.name||'Companion '+(carrierIndex+1),path=[carrier];
  let at=projection.placements[id],seen=new Set();while(at&&!seen.has(at)){seen.add(at);const parent=entries.find(row=>row.id===at);path.splice(1,0,parent?.name||parent?.item?.name||'Container');at=projection.placements[at];}
  return{id,carrierIndex,carrier,parent:projection.placements[id]||'',path,locationNote:String(entry.location||''),inactive:own(normalize(stored(data).itemContainers),id)&&!projection.placements[id]};
 }
 function place(data,entries,id,parent){
  if(!valid(id)||parent!==''&&!valid(parent))throw Error('Choose an owned item and an available container.');const owned=new Map(entries.filter(r=>Number(r.quantity)>0).map(r=>[r.id,r]));if(!owned.has(id))throw Error('This owned item is no longer available.');const next=normalize(stored(data).itemContainers);if(parent){if(!own(next,id)&&Object.keys(next).length>=200)throw Error('The character already has 200 container placements.');Object.defineProperty(next,id,{value:parent,enumerable:true,writable:true,configurable:true});}else delete next[id];
  const after=project({...data,adobe:{...stored(data),itemContainers:next}},entries);if(parent&&after.placements[id]!==parent)throw Error('Choose one owned container on the same carrier. Cycles and nested magical containers are not allowed.');return next;
 }
 function descendants(data,entries,id){const placements=project(data,entries).placements;return entries.filter(row=>{let at=placements[row.id],count=0;while(at&&count++<200){if(at===id)return true;at=placements[at];}return false;}).map(r=>r.id);}
 function release(map,id){const next=normalize(map);delete next[id];return next;}
 return{normalize,project,location,place,descendants,release,directCarrier};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterItemContainers=CharacterItemContainers;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterItemContainers;
