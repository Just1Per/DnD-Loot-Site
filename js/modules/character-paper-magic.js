'use strict';
/* Source magic-item rows. Inventory ownership and equipment effects stay with their controllers. */
var CharacterPaperMagic=(()=>{
 const validId=id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\r\n/]/.test(id);
 function normalize(raw={}){
  const seen=new Set(),slots=(Array.isArray(raw?.slots)?raw.slots:[]).slice(0,1000).map(row=>{
   const id=validId(row?.id)&&!seen.has(row.id)?row.id:'';if(id)seen.add(id);
   return{id,name:typeof row?.name==='string'?row.name.slice(0,200):'',empty:row?.empty===true||!!row?.id&&!id};
  });
  const hidden=[...new Set((Array.isArray(raw?.hidden)?raw.hidden:[]).filter(validId))].slice(0,1000);
  return{slots,hidden};
 }
 function rows(raw,all){
  const state=normalize(raw),byId=new Map(all.map(row=>[row.entry.id,row])),reserved=new Set(state.slots.map(row=>row.id).filter(Boolean)),hidden=new Set(state.hidden),queue=all.filter(row=>!reserved.has(row.entry.id)&&!hidden.has(row.entry.id));
  const open=state.slots.filter(slot=>!slot.id&&!slot.empty).length,length=Math.min(1000,Math.max(12,state.slots.length,state.slots.length+Math.max(0,queue.length-open))); 
  return Array.from({length},(_,i)=>{const slot=state.slots[i];return slot?.empty?null:slot?.id?byId.get(slot.id)||{entry:{id:slot.id},item:{name:(slot.name||'Saved magic item')+' (unavailable)'},choice:{equipped:false,attuned:false},sourceName:slot.name,unavailable:true}:queue.shift()||null;});
 }
 const record=(row,empty=true)=>row?{id:row.entry.id,name:row.sourceName??row.item.name,empty:false}:{id:'',name:'',empty};
 const materialize=(state,visible)=>visible.map((row,i)=>record(row,state.slots[i]?.empty===true));
 function operation(raw,all,index,command){
  const state=normalize(raw),visible=rows(state,all),slots=materialize(state,visible);let selected=index;
  if(!Number.isInteger(index)||index<0||index>=slots.length)throw Error('Choose an available magic-item row.');
  const row=visible[index],hidden=new Set(state.hidden);let deactivate=[];
  if(command==='up'||command==='down'){
   selected=index+(command==='up'?-1:1);if(selected<0||selected>=slots.length)throw Error('This row is already at the edge.');[slots[index],slots[selected]]=[slots[selected],slots[index]];
  }else if(command==='insert'){
   if(!row)throw Error('This row is already empty.');const end=visible.findIndex((value,i)=>i>index&&!value);if(end<0)throw Error('There is no empty row below this item. Nothing was removed.');
   for(let i=end;i>index;i--)slots[i]=slots[i-1];slots[index]=record(null);
  }else if(command==='clear'||command==='delete'){
   if(row){hidden.add(row.entry.id);deactivate=[row.entry.id];}slots[index]=record(null);
   // Original Delete stops at the first-page boundary when its final row was empty.
   if(command==='delete'){const end=index<5&&!visible[4]?5:slots.length;for(let i=index;i<end-1;i++)slots[i]=slots[i+1];slots[end-1]=record(null);}
  }else throw Error('Choose an available magic-item command.');
  return{state:normalize({slots,hidden:[...hidden]}),index:selected,deactivate};
 }
 function choose(raw,all,index,id){
  if(!validId(id)||!all.some(row=>row.entry.id===id))throw Error('Choose an owned magic item.');
  const state=normalize(raw),visible=rows(state,all);if(!Number.isInteger(index)||index<0||index>=visible.length)throw Error('Choose an available magic-item row.');
  const slots=materialize(state,visible),from=visible.findIndex(row=>row?.entry.id===id),hidden=new Set(state.hidden);let deactivate=[];
  if(from>=0)[slots[from],slots[index]]=[slots[index],slots[from]];
  else{if(visible[index]){hidden.add(visible[index].entry.id);deactivate=[visible[index].entry.id];}slots[index]=record(all.find(row=>row.entry.id===id));}
  hidden.delete(id);return{state:normalize({slots,hidden:[...hidden]}),index,deactivate};
 }
 return{normalize,rows,operation,choose};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterPaperMagic=CharacterPaperMagic;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperMagic;
