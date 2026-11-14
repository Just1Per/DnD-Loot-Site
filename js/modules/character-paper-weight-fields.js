'use strict';
/* Collect the same source fields that CalcWeightCarried sums, using shared physical gear. */
var CharacterPaperWeightFields=(()=>{
 const dependency=(name,path)=>globalThis[name]||(typeof require==='function'?require(path):null);
 function collect(data,derived,entries=derived.gear.entries.map(row=>row.entry)){
  const Carry=dependency('CharacterCarrying','./character-carrying'),Inventory=dependency('CharacterPaperInventory','./character-paper-inventory'),MagicRows=dependency('CharacterPaperMagic','./character-paper-magic'),Magic=dependency('CharacterMagicItems','./character-magic-items'),Attacks=dependency('CharacterPaperAttacks','./character-paper-attacks');
  const adobe=Carry.stored(data);
  const groups=Object.fromEntries(['cArm','cShi','cWea','cAmL','cAmR','cP2L','cP2M','cP2R','cP3L','cP3R','cMaI'].map(id=>[id,[]])),units=item=>Carry.unitWeight(item||{}),add=(section,key,field,name,weight,quantity=1)=>groups[section].push({key,field,name,weight,quantity});
  for(const [kind,section,key,field]of [['armor','cArm','armor','AC Armor Weight'],['shield','cShi','shield','AC Shield Weight']]){
   const row=derived.gear.entries.find(row=>row.active&&row.mechanics.kind===kind);add(section,key,field,row?.item.name||'No '+kind+' equipped',row?units(row.item):0);
  }
  const attacks=Attacks.rows(adobe.paperCombat?.attackSlots,Attacks.candidates(data,derived));
  for(const [i,row]of attacks.entries()){
   if(!row)continue;const entry=row.origin==='gear'?derived.gear.entries.find(entry=>entry.entry.id===row.entryId):null,nonPhysical=row.origin==='action'&&row.kind!=='weapon'||/^unarmed (?:strike|attack)$/i.test(row.name||'');
   add('cWea','attack:'+row.key,'BlueText.Attack.'+(i+1)+'.Weight',row.name,entry?units(entry.item):nonPhysical?0:units({name:row.name}));
  }
  const aliases={Bolts:'Crossbow bolts',Bullets:'Sling bullets',Needles:'Blowgun needles','Alchemist\'s Fire, flasks':"Alchemist's fire (flask)",'Holy Water, flasks':'Holy water (flask)','Flasks (1 pint)':'Flask or tankard','Vials (4 ounces)':'Vial','Vials of Acid':'Acid (vial)',Daggers:'Dagger',Handaxes:'Handaxe','Light Hammers':'Light hammer',Javelins:'Javelin',Spears:'Spear',Tridents:'Trident',Darts:'Dart'};
  for(let i=0;i<2;i++){const row=adobe.paperCombat?.ammunition?.[i]||{name:'',amount:0},side=i?'Right':'Left',unit=units({name:row.name})??units({name:aliases[row.name]||row.name});add(i?'cAmR':'cAmL','ammo:'+i,'Ammo'+side+'Display.Weight',row.name||side+' ammunition',unit,row.amount);}
  const physical=entries.map(entry=>({id:entry.id,name:entry.item?.name||'',quantity:entry.quantity,weight:units(entry.item),attuned:derived.gear.entries.some(row=>row.entry.id===entry.id&&row.choice.attuned&&row.requiresAttunement&&row.magicActive)})),paper=Inventory.project(adobe.paperInventory,physical).entries;
  for(let i=0;i<paper.length;i++){const row=paper[i];if(!row||row.header||row.automaticAttunement)continue;const section=i<54?['cP2L','cP2M','cP2R'][Math.floor(i/18)]:((i-54)%36<18?'cP3L':'cP3R');add(section,'inventory:'+row.id+':'+i,i<54?'Adventuring Gear Weight '+(i+1):'Extra.Gear Weight '+(i-53),row.name,row.weight,row.quantity);}
  const ranks=new Map((Array.isArray(adobe.paperMagicOrder)?adobe.paperMagicOrder:[]).map((id,i)=>[id,i])),all=derived.gear.entries.filter(row=>Magic.isMagical(row.item)).sort((a,b)=>(ranks.get(a.entry.id)??Number.MAX_SAFE_INTEGER)-(ranks.get(b.entry.id)??Number.MAX_SAFE_INTEGER));
  for(const [i,row]of MagicRows.rows(adobe.paperMagic,all).entries())if(row)add('cMaI','magic:'+row.entry.id,'Extra.Magic Item Weight '+(i+1),row.item.name,units(row.item));
  return{groups,coins:data.coins||{},inventoryWeight:derived.inventoryWeight||Carry.weight(data,entries)};
 }
 return{collect};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterPaperWeightFields=CharacterPaperWeightFields;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperWeightFields;
