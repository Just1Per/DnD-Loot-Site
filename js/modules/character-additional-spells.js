'use strict';
/* Additional spells are a separate, explicit source; they never fill class allowances. */
var CharacterAdditionalSpells=(()=>{
 const classId='additional',abilities=['str','dex','con','int','wis','cha'];
 const isRow=row=>row?.classId===classId;
 function profile(data,level){
  if(!(data.spells||[]).some(isRow))return null;
  return{classId,name:'Additional spells',ability:abilities.includes(data.spellAbility)?data.spellAbility:'int',edition:data.build?.edition||'2014',level,mode:'personal',sourceKind:'personal',cantrips:0,spellCount:0,maxSpellLevel:9};
 }
 function custom(raw){
  const bounds={name:120,casting:4000,range:4000,duration:4000,components:4000,save:4000,school:4000,book:4000,page:4000,shortDescription:400,notes:4000},row={classId,catalogId:'',level:Number(raw.level),prepared:raw.prepared!==false};
  if(!Number.isInteger(row.level)||row.level<0||row.level>9)throw Error('Choose a spell level from 0 to 9.');
  for(const [field,max]of Object.entries(bounds)){const value=raw[field]??'';if(typeof value!=='string'||value.length>max)throw Error(field==='shortDescription'?'Use at most 400 characters for the short description.':'The '+field+' field is too long.');row[field]=field==='name'?value.trim():value;}
  if(!row.name)throw Error('Enter a spell name.');return row;
 }
 function merge(data,rows,{catalogue=[],allowed=()=>true}={}){
  const before=(data.spells||[]).filter(isRow),byId=new Map(catalogue.map(s=>[s.id,s])),seen=new Set();
  for(const row of rows){
   if(!isRow(row))throw Error('Only additional spells can be changed here.');
   if(row.catalogId){const source=byId.get(row.catalogId),old=before.some(s=>s.catalogId===row.catalogId);if((!source||!allowed(source))&&!old)throw Error('This catalogue spell is no longer available.');if(seen.has(row.catalogId))throw Error('This spell is already in Additional spells.');seen.add(row.catalogId);}
   else custom(row);
  }
  const next=[...(data.spells||[]).filter(row=>!isRow(row)),...rows.map(row=>({...row}))];
  if(next.length>150)throw Error('The spell list has reached 150 saved entries. Remove a spell before adding another.');return next;
 }
 return{classId,isRow,profile,custom,merge};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdditionalSpells;
