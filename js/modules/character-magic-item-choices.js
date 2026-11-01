'use strict';
/* Bounded original item choices. Projection never edits catalogue or inventory records. */
var CharacterMagicItemChoices=(()=>{
 const clean=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),originals=new WeakMap();
 const belts=[['hill',21,'Rare'],['frost',23,'Very Rare'],['stone',23,'Very Rare'],['fire',25,'Very Rare'],['cloud',27,'Legendary'],['storm',29,'Legendary']].map(([type,str,rarity])=>({id:'belt-'+type,name:'Belt of '+type[0].toUpperCase()+type.slice(1)+' Giant Strength',label:type[0].toUpperCase()+type.slice(1)+' · STR '+str+' · '+rarity,summary:'Strength becomes '+str+' while worn and attuned, unless it is already higher.',rarity}));
 const rings=['Acid','Cold','Fire','Force','Lightning','Necrotic','Poison','Psychic','Radiant','Thunder'].map(type=>({id:'ring-'+type.toLowerCase(),name:'Ring of '+type+' Resistance',label:type+' resistance',summary:'Resistance to '+type.toLowerCase()+' damage while worn and attuned.',rarity:'Rare'}));
 const byId=new Map([...belts,...rings].map(row=>[row.id,row]));
 const valid=value=>typeof value==='string'&&byId.has(value)?value:'';
 const families=new Map([['belt of giant strength',belts],['ring of resistance',rings],...belts.map(row=>[clean(row.name),belts]),...rings.flatMap(row=>[[clean(row.name),rings],[clean('Ring of Resistance '+row.id.slice(5)),rings]])]);
 function options(item={}){return(families.get(clean(item?.name))||[]).map(row=>({...row}));}
 const supported=item=>families.has(clean(item?.name));
 const original=entry=>originals.get(entry)?.source||entry;
 function project(loot=[],loadout=[]){
  const selected=new Map();for(const row of Array.isArray(loadout)?loadout:[]){if(typeof row?.id!=='string'||row.id.length>200||selected.has(row.id))continue;selected.set(row.id,valid(row.magicVariant));if(selected.size>=200)break;}
  return loot.map(entry=>{
   if(!entry||typeof entry!=='object')return entry;const source=original(entry),key=selected.get(source.id);if(!key)return source;const variant=(families.get(clean(source.item?.name))||[]).find(row=>row.id===key);if(!variant)return source;
   const result={...source,item:{...source.item,name:variant.name,rarity:variant.rarity,attunement:true,properties:[...(Array.isArray(source.item?.properties)?source.item.properties:[]),{title:'Selected item variant',text:variant.summary}]}};originals.set(result,{source,key});return result;
  });
 }
 function choose(loadout,loot,id,value){
  const source=(loot||[]).map(original).find(row=>row?.id===id&&Number(row.quantity)>0);if(!source)throw Error('Choose an available owned item.');
  if(value!==''&&(!valid(value)||!options(source.item).some(row=>row.id===value)))throw Error('Choose a variant offered by this item.');
  const rows=(Array.isArray(loadout)?loadout:[]).map(row=>({...row}));let choice=rows.find(row=>row.id===id);
  if(!choice){if(value==='')return rows;if(rows.length>=200)throw Error('Equipment selection limit reached.');choice={id,equipped:false,attuned:false};rows.push(choice);}
  if(value==='')delete choice.magicVariant;else choice.magicVariant=value;return rows;
 }
 return{valid,options,supported,original,project,choose};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterMagicItemChoices=CharacterMagicItemChoices;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterMagicItemChoices;
