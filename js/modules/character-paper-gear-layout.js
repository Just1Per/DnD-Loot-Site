'use strict';
/* Stable private paper positions and field overrides. Physical ownership stays outside this module. */
var CharacterPaperGearLayout=(()=>{
 const Rows=typeof CharacterPaperGearRows!=='undefined'?CharacterPaperGearRows:require('./character-paper-gear-rows');
 // Whole original tables: 54 initial rows plus 31 complete 36-row continuations.
 const maxRows=1170,key=value=>typeof value==='string'&&/^[pcf]:[^\r\n/]{1,220}$/.test(value),position=n=>Number.isInteger(n)&&n>=0&&n<maxRows;
 function normalize(raw={}){
  const slots=new Set(),keys=new Set(),layout=[];
  for(const value of (Array.isArray(raw?.layout)?raw.layout:[]).slice(0,1200)){
   if(!position(value?.slot)||slots.has(value.slot)||value.empty!==true&&(!key(value.key)||keys.has(value.key)||value.key.startsWith('f:')&&(value.slot<51||value.slot>53)))continue;
   slots.add(value.slot);if(value.empty===true)layout.push({slot:value.slot,empty:true});else{keys.add(value.key);layout.push({slot:value.slot,key:value.key,name:typeof value.name==='string'?value.name.slice(0,200):''});}
  }
  const hidden=[...new Set((Array.isArray(raw?.hidden)?raw.hidden:[]).filter(key))].slice(0,1200),values={};
  for(const [id,fields]of Object.entries(raw?.values&&typeof raw.values==='object'&&!Array.isArray(raw.values)?raw.values:{}).slice(0,1200)){
   if(!key(id)||!fields||typeof fields!=='object'||Array.isArray(fields))continue;const out={};
   for(const field of ['name','location','quantity','weight'])if(Object.hasOwn(fields,field))try{const draft=Rows.edit({},0,field,fields[field]);out[field]=draft.rows[0][field];}catch{}
   if(Object.keys(out).length)values[id]=out;
  }
  return{layout,hidden,values};
 }
 function project(raw,base,{footer=false,copyRows=[]}={}){
  const state=normalize(raw),copies=new Map(copyRows.map(row=>[row.slot,row.destination])),byKey=new Map(),tagged=base.map((row,i)=>{
   if(!row||row.header)return row;
   const id=(row.footer?'f:':row.reference?'c:'+copies.get(i)+':':'p:')+row.id,value={...row,key:id,location:row.location||''};byKey.set(id,value);return value;
  }),hidden=new Set(state.hidden),entries=[],used=new Set(),reserved=new Set(),deferred=[];
  if(footer){entries[50]=base[50];for(let i=50;i<54;i++)reserved.add(i);}
  const place=(slot,row)=>{const value={...row,...(state.values[row.key]||{})};if(value.unavailable&&!value.name.endsWith(' (unavailable)'))value.name+=' (unavailable)';entries[slot]=value;used.add(row.key);};
  const available=id=>!hidden.has(id)&&(!id.startsWith('f:')||footer);
  for(const saved of state.layout){
   if(saved.empty){if(!reserved.has(saved.slot))reserved.add(saved.slot);continue;}
   if(!available(saved.key))continue;
   const row=byKey.get(saved.key)||{id:saved.key.replace(/^[pcf]:/,''),name:(saved.name||'Saved item')+' (unavailable)',quantity:'',weight:null,key:saved.key,reference:!saved.key.startsWith('p:'),unavailable:true};
   if(reserved.has(saved.slot)&&!(saved.key.startsWith('f:')&&saved.slot>50&&saved.slot<54)){deferred.push(row);continue;}place(saved.slot,row);
  }
  const free=(start,end)=>{for(let i=start;i<=end;i++)if(!entries[i]&&!reserved.has(i))return i;return-1;};
  const firstFree=(start=0)=>{const slot=free(start,maxRows-1);if(slot<0)throw Error('The paper-equipment row limit has been reached.');return slot;};
  for(const [i,row]of tagged.entries()){
   if(!row||row.header||used.has(row.key)||!available(row.key))continue;
   let slot=!entries[i]&&(!reserved.has(i)||row.footer)?i:row.footer?[51,52,53].find(slot=>!entries[slot]):-1;
   if(slot===undefined)throw Error('The three footer rows are full.');
   if(slot<0){if(row.reference){const extra=row.key.startsWith('c:extra:'),target=free(extra?54:0,extra?89:footer?49:53);slot=target<0?firstFree(90):target;}else slot=firstFree();}place(slot,row);
  }
  for(const row of deferred)if(!used.has(row.key))place(firstFree(54),row);
  // Retain explicit empty positions, including a trailing Delete/Insert result.
  const last=Math.max(entries.length-1,...state.layout.filter(row=>row.empty&&(!footer||row.slot<50||row.slot>53)).map(row=>row.slot));
  return{state,entries:Array.from({length:last+1},(_,i)=>entries[i]||null)};
 }
 function section(entries,index,footer){
  if(!position(index)||footer&&index===50)throw Error('Choose an editable equipment row.');
  const offset=index<54?0:54+36*Math.floor((index-54)/36),kind=index<54?'gear':'extra',length=kind==='gear'?54:36;
  return{offset,index:index-offset,table:{kind,footer:kind==='gear'&&footer,rows:Array.from({length},(_,i)=>{
   const row=entries[offset+i];return row&&!row.header?{...row,reference:row.key}:{};
  })}};
 }
 function arranged(raw,before,after,{hidden=[],pins=[]}={}){
  const state=normalize(raw),oldPins=new Set(state.layout.filter(row=>row.empty).map(row=>row.slot));
  for(const slot of pins)oldPins.add(slot);
  for(let i=0;i<before.length;i++)if(before[i]&&!before[i].header&&!after[i])oldPins.add(i);
  state.layout=after.flatMap((row,i)=>row&&!row.header?[{slot:i,key:row.key,name:row.name}]:oldPins.has(i)?[{slot:i,empty:true}]:[]);
  for(const slot of oldPins)if(slot>=after.length)state.layout.push({slot,empty:true});
  state.hidden=[...new Set([...state.hidden,...hidden])];return normalize(state);
 }
 function operation(raw,base,index,command,options={}){
  const projection=project(raw,base,options),before=projection.entries,part=section(before,index,options.footer),result=command.startsWith('column:')?Rows.moveColumn(part.table,part.index,Number(command.slice(7))):Rows.operation(part.table,part.index,command),after=[...before],byKey=new Map(before.filter(row=>row&&!row.header).map(row=>[row.key,row]));
  for(let i=0;i<result.state.rows.length;i++){const row=result.state.rows[i];if(options.footer&&part.offset+i===50)continue;after[part.offset+i]=row.name?{...byKey.get(row.reference),...row,key:row.reference}:null;}
  const removed=['clear','delete'].includes(command)&&before[index]?[before[index].key]:[];
  return{state:arranged(raw,before,after,{hidden:removed}),index:part.offset+result.index};
 }
 function edit(raw,base,index,field,value,options={}){
  const state=normalize(raw),{entries}=project(state,base,options),part=section(entries,index,options.footer),source=entries[index];
  if(!source||source.header||source.unavailable)throw Error('Choose an available equipment reference.');
  const result=Rows.edit(part.table,part.index,field,value);state.values[source.key]={...(state.values[source.key]||{}),[field]:result.rows[part.index][field]};if(field==='weight'&&result.rows[part.index][field]==='')delete state.values[source.key].weight;return normalize(state);
 }
 function automatic(raw,id,field){const state=normalize(raw);if(!key(id)||!['name','quantity','weight','location'].includes(field))throw Error('Choose an equipment field.');if(state.values[id])delete state.values[id][field];return normalize(state);}
 function choose(raw,base,index,id,options={}){
  const projection=project(raw,base,options),before=projection.entries,after=[...before],part=section(before,index,options.footer),source=base.find(row=>row?.id===id&&!row.header&&!row.reference);
  if(!source)throw Error('Choose an owned equipment item.');if(part.table.footer&&part.index>=50)throw Error('Use the original footer reference controls.');
  const selectedKey='p:'+source.id,from=before.findIndex(row=>row?.key===selectedKey),removed=from<0&&before[index]?[before[index].key]:[];
  if(from>=0)[after[index],after[from]]=[after[from],after[index]];else after[index]={...source,key:selectedKey};
  const state=arranged(raw,before,after,{hidden:removed});state.hidden=state.hidden.filter(key=>key!==selectedKey);return{state,index};
 }
 function put(raw,base,index,source,options={}){
  const id='p:'+source?.id;if(!key(id)||base.some(row=>row?.id===source.id))throw Error('Choose a new private equipment reference.');
  const {entries:before}=project(raw,base,options),part=section(before,index,options.footer);if(part.table.footer&&part.index>=50)throw Error('Use the original footer reference controls.');
  const after=[...before];after[index]={...source,key:id};const state=arranged(raw,before,after,{hidden:before[index]?[before[index].key]:[]});state.hidden=state.hidden.filter(key=>key!==id);return{state,index};
 }
 return{maxRows,normalize,project,operation,edit,automatic,choose,put};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperGearLayout;
