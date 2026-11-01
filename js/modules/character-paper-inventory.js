'use strict';
/* Original equipment destinations are paper references, never extra physical inventory. */
var CharacterPaperInventory=(()=>{
 const Layout=typeof CharacterPaperGearLayout!=='undefined'?CharacterPaperGearLayout:typeof require==='function'?require('./character-paper-gear-layout'):null;
 const validId=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\r\n/]/.test(id);
 const validCopyKey=key=>typeof key==='string'&&/^c:[^\r\n/]{1,220}$/.test(key),copyKey=row=>row.key===undefined?'c:'+row.destination+':'+row.id:row.key;
 function normalize(raw={}){
  const copyIds=new Set(),copies=(Array.isArray(raw?.copies)?raw.copies:[]).slice(0,200).filter(row=>{
   const key=row&&copyKey(row);if(!validId(row?.id)||!validCopyKey(key)||!['gear','extra'].includes(row.destination)||!Number.isInteger(row.slot)||row.slot<0||row.slot>89||copyIds.has(key))return false;copyIds.add(key);return true;
  }).map(row=>({id:row.id,name:String(row.name||'').slice(0,200),destination:row.destination,slot:row.slot,key:copyKey(row)}));
  const ids=new Set(),footer=Array.from({length:3},(_,i)=>{const row=raw?.footer?.[i];if(!validId(row?.id)||ids.has(row.id))return null;ids.add(row.id);return{id:row.id,name:String(row.name||'').slice(0,200)};});
  return{attunedFooter:raw?.attunedFooter===true,footer,copies,gearLayout:Layout.normalize(raw?.gearLayout)};
 }
 const range=(state,destination)=>destination==='gear'?[0,state.attunedFooter?49:53]:[54,89];
 const reference=(saved,byId)=>{const source=byId.get(saved.id);return source?{...source,quantity:'',reference:true}:{id:saved.id,name:(saved.name||'Saved item')+' (unavailable)',quantity:'',weight:null,reference:true,unavailable:true};};
 function project(raw,all,{base=false}={}){
  const state=normalize(raw),byId=new Map(all.map(row=>[row.id,row])),entries=state.attunedFooter?[...Array.from({length:50},(_,i)=>all[i]||null),{header:true,name:'',quantity:'',weight:null},...state.footer.map(row=>row?{...reference(row,byId),footer:true}:null),...all.slice(50)]:[...all];
  const copyRows=[];for(const saved of state.copies){const [start,end]=range(state,saved.destination);let slot=saved.slot>=start&&saved.slot<=end&&!entries[saved.slot]?saved.slot:-1;
   if(slot<0)for(let i=start;i<=end;i++)if(!entries[i]){slot=i;break;}
   // Inventory growth may displace a saved reference; keep it on a continuation.
   if(slot<0){slot=Math.max(90,entries.length);while(entries[slot])slot++;}
   entries[slot]=reference(saved,byId);copyRows.push({id:saved.id,key:saved.key,destination:saved.destination,slot,displaced:slot<start||slot>end});
  }
  if(base||!state.gearLayout.layout.length&&!state.gearLayout.hidden.length&&!Object.keys(state.gearLayout.values).length)return{state,entries,copyRows};
  const arranged=Layout.project(state.gearLayout,entries,{footer:state.attunedFooter,copyRows}).entries;
  for(const row of copyRows){row.slot=arranged.findIndex(value=>value?.key===row.key);const [start,end]=range(state,row.destination);row.displaced=row.slot<start||row.slot>end;}
  return{state,entries:arranged,copyRows};
 }
 function copy(raw,all,id,destination){
  if(!validId(id)||!all.some(row=>row.id===id))throw Error('Choose an owned item.');const state=normalize(raw),source=all.find(row=>row.id===id);
  if(destination==='footer'){
   if(!state.attunedFooter)throw Error('Enable the Attuned Magical Items footer first.');const key='f:'+id,restoring=state.gearLayout.hidden.includes(key);state.gearLayout.hidden=state.gearLayout.hidden.filter(value=>value!==key);
   let slot=state.footer.findIndex(row=>row?.id===id);if(slot>=0)return{state,slot:51+slot,reused:!restoring};slot=state.footer.findIndex(row=>!row);if(slot<0)throw Error('The three footer rows are full. Clear a reference first.');state.footer[slot]={id,name:source.name};return{state,slot:51+slot,reused:false};
  }
  if(!['gear','extra'].includes(destination))throw Error('Choose an original equipment destination.');const projected=project(state,all),[start,end]=range(state,destination);
  for(let i=start;i<=end;i++)if(projected.entries[i]?.id===id)return{state,slot:i,reused:true};
  let slot=-1;for(let i=start;i<=end;i++)if(!projected.entries[i]){slot=i;break;}if(slot<0)throw Error('This equipment section is full. No existing row was changed.');
  const restore=state.copies.find(row=>row.id===id&&row.destination===destination&&state.gearLayout.hidden.includes(row.key));
  let key=restore?.key||'c:'+destination+':'+id;
  if(restore){state.gearLayout.hidden=state.gearLayout.hidden.filter(value=>value!==key);restore.slot=slot;}
  else{
   if(state.copies.length>=200)throw Error('The paper-reference limit has been reached.');for(let i=1;state.copies.some(row=>row.key===key);i++)key='c:copy'+i+':'+id;state.copies.push({id,name:source.name,destination,slot,key});
  }
  // An explicit copy may fill a saved blank even when automatic physical placement differs.
  if(state.gearLayout.layout.length||state.gearLayout.hidden.length||Object.keys(state.gearLayout.values).length){state.gearLayout.layout=state.gearLayout.layout.filter(row=>row.slot!==slot&&row.key!==key);state.gearLayout.layout.push({slot,key,name:source.name});}
  return{state,slot,reused:false};
 }
 function remove(raw,id,destination,referenceKey){
  const state=normalize(raw);let keys;
  if(destination==='footer'){state.footer=state.footer.map(row=>row?.id===id?null:row);keys=['f:'+id];}
  else if(['gear','extra'].includes(destination)){keys=state.copies.filter(row=>row.id===id&&row.destination===destination&&(!referenceKey||row.key===referenceKey)).map(row=>row.key);state.copies=state.copies.filter(row=>!keys.includes(row.key));}
  else throw Error('Choose an original equipment destination.');
  state.gearLayout.layout=state.gearLayout.layout.filter(row=>!keys.includes(row.key));for(const key of keys)delete state.gearLayout.values[key];return state;
 }
 function footer(raw,enabled){if(typeof enabled!=='boolean')throw Error('Choose whether to show the footer.');return{...normalize(raw),attunedFooter:enabled};}
 function gearRows(raw,all){const base=project(raw,all,{base:true});return Layout.project(base.state.gearLayout,base.entries,{footer:base.state.attunedFooter,copyRows:base.copyRows}).entries;}
 function gearAction(raw,all,index,command,...args){
  const base=project(raw,all,{base:true}),options={footer:base.state.attunedFooter,copyRows:base.copyRows};
  const result=command==='edit'?{state:Layout.edit(base.state.gearLayout,base.entries,index,...args,options),index}:command==='choose'?Layout.choose(base.state.gearLayout,base.entries,index,args[0],options):command==='put'?Layout.put(base.state.gearLayout,base.entries,index,args[0],options):command.startsWith('page:')?Layout.transfer(base.state.gearLayout,base.entries,index,command.slice(5),options):command.startsWith('combine:')?Layout.combine(base.state.gearLayout,base.entries,index,command.slice(8),options):Layout.operation(base.state.gearLayout,base.entries,index,command,options);
  base.state.gearLayout=result.state;if(command.startsWith('page:')&&result.key?.startsWith('c:'))base.state.copies=base.state.copies.map(row=>row.key===result.key?{...row,destination:command.slice(5),slot:result.index}:row);return{state:base.state,index:result.index};
 }
 function combination(raw,all,index,destination){const base=project(raw,all,{base:true});return Layout.combination(base.state.gearLayout,base.entries,index,destination,{footer:base.state.attunedFooter,copyRows:base.copyRows});}
 return{normalize,project,copy,remove,footer,gearRows,gearAction,combination};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterPaperInventory=CharacterPaperInventory;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperInventory;
