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
   ...(derived.actions||[]).map((row,i)=>({...row,key:data.actions[i]?.id?'attack:'+data.actions[i].id:'legacy-action:'+i,origin:'action',index:i,default:true}))
  ];
 }
 function rows(raw,all){const slots=normalize(raw),reserved=new Set(slots.map(row=>row.key).filter(Boolean)),queue=all.filter(row=>row.default&&!reserved.has(row.key));return slots.map(slot=>slot.empty?null:slot.key?all.find(row=>row.key===slot.key)||{key:slot.key,name:(slot.name||'Saved attack')+' (unavailable)',hit:'—',damage:'',range:'',notes:['This saved source is no longer available. Choose carried gear or another existing attack.'],unavailable:true}:queue.shift()||null);}
 function select(raw,index,key,name,empty=false){if(!Number.isInteger(index)||index<0||index>4||typeof key!=='string'||key&&!validKey(key)||typeof name!=='string'||name.length>200)throw Error('Choose an available paper attack row.');const slots=normalize(raw);slots[index]={key,name,empty:empty===true};return slots;}
 return{normalize,candidates,rows,select};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperAttacks;
