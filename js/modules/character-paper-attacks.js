'use strict';
/* Source row placement only. Numbers remain the shared equipment/action output. */
var CharacterPaperAttacks=(()=>{
 const validKey=key=>typeof key==='string'&&/^(?:gear:[^/\r\n]{1,200}|attack:[A-Za-z0-9_-]{1,80})$/.test(key);
 function normalize(raw){return Array.from({length:5},(_,i)=>{const row=raw?.[i];return{key:validKey(row?.key)?row.key:'',name:String(row?.name||'').slice(0,200),empty:row?.empty===true};});}
 function candidates(data,derived){
  const sign=n=>(Number(n)>=0?'+':'')+Number(n||0);
  return [
   ...(derived.gear.attacks||[]).map(row=>({...row,key:'gear:'+row.id,origin:'gear',entryId:row.id,abilityChoice:derived.gear.entries?.find(entry=>entry.entry.id===row.id)?.choice.ability||'auto',damage:row.damageDice??row.damage,hit:row.attack===null?'—':sign(row.attack),default:row.equipped,notes:[...(row.notes||[]),...(!row.equipped?['In backpack: ready this item before using it.']:[])]})),
   ...(data.attacks||[]).map((row,i)=>({...row,key:row.id?'attack:'+row.id:'legacy-manual:'+i,origin:'manual',index:i,hit:sign(derived.attacks[i]),default:true})),
   ...(derived.actions||[]).map((row,i)=>({...row,key:data.actions[i]?.id?'attack:'+data.actions[i].id:'legacy-action:'+i,origin:'action',index:i,damage:row.damageDice??row.damage,default:true}))
  ];
 }
 function rows(raw,all){const slots=normalize(raw),reserved=new Set(slots.map(row=>row.key).filter(Boolean)),queue=all.filter(row=>row.default&&!reserved.has(row.key));return slots.map(slot=>slot.empty?null:slot.key?all.find(row=>row.key===slot.key)||{key:slot.key,name:(slot.name||'Saved attack')+' (unavailable)',hit:'—',damage:'',range:'',notes:['This saved source is no longer available. Choose carried gear or another existing attack.'],unavailable:true}:queue.shift()||null);}
 function select(raw,index,key,name,empty=false){if(!Number.isInteger(index)||index<0||index>4||typeof key!=='string'||key&&!validKey(key)||typeof name!=='string'||name.length>200)throw Error('Choose an available paper attack row.');const slots=normalize(raw);slots[index]={key,name,empty:empty===true};return slots;}
 function operation(raw,all,index,command){
  if(!Number.isInteger(index)||index<0||index>4)throw Error('Choose an available paper attack row.');
  const visible=rows(raw,all),slots=visible.map(row=>row?{key:row.key,name:row.name,empty:false}:{key:'',name:'',empty:true});let selected=index;
  if(command==='up'||command==='down'){selected=index+(command==='up'?-1:1);if(selected<0||selected>4)throw Error('This row is already at the edge.');[slots[index],slots[selected]]=[slots[selected],slots[index]];}
  else if(command==='insert'){if(!visible[index])throw Error('This row is already empty.');const end=visible.findIndex((row,i)=>i>index&&!row);if(end<0)throw Error('No empty row below this attack. Nothing was removed.');for(let i=end;i>index;i--)slots[i]=slots[i-1];slots[index]={key:'',name:'',empty:true};}
  else if(command==='delete'){for(let i=index;i<4;i++)slots[i]=slots[i+1];slots[4]={key:'',name:'',empty:true};}
  else if(command==='clear')slots[index]={key:visible[index]?.key||'',name:visible[index]?.name||'',empty:true};else throw Error('Choose an available attack command.');
  if(slots.some(slot=>slot.key&&!validKey(slot.key)))throw Error('Assign stable attack references before arranging paper rows.');
  return{slots:normalize(slots),index:selected};
 }
 return{normalize,candidates,rows,select,operation};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperAttacks;
