'use strict';
/* Source catalogue placement plan. No live character, account, coins or inventory writes. */
var CharacterPaperGearCatalog=(()=>{
 const Inventory=typeof CharacterPaperInventory!=='undefined'?CharacterPaperInventory:require('./character-paper-inventory');
 const clean=value=>typeof value==='string'?value.trim():'';
 function choices(gear=[],facts={},allowed=()=>true){
  const rows=[...gear.map(row=>({...row,sourceAmount:Object.hasOwn(facts.gearAmounts||{},row.id)?facts.gearAmounts[row.id]:row.quantity,kind:'gear'})),...(facts.tools||[]).map(row=>({...row,kind:'tool'}))],seen=new Set();
  return rows.filter(row=>row&&typeof row.id==='string'&&!seen.has(row.id)&&seen.add(row.id)&&['gear','tool'].includes(row.kind)&&allowed(row));
 }
 function plan(data,all,index,id,{catalogue=[],newId,weight}={}){
  const template=catalogue.find(row=>row.id===id);if(!template)throw Error('Choose an available catalogue item.');
  if(!Array.isArray(data.personalGear)||data.personalGear.length>=200)throw Error('A character can have up to 200 personal gear rows. Remove unused rows first.');
  if(typeof newId!=='string'||!/^personal-[A-Za-z0-9_-]{1,80}$/.test(newId)||all.some(row=>row.id===newId)||data.personalGear.some(row=>row.id===newId))throw Error('Choose a new private equipment identifier.');
  const sourceAmount=template.sourceAmount===undefined?template.quantity:template.sourceAmount,quantity=sourceAmount===''?1:Number(sourceAmount),name=clean(template.unitName||template.name);
  const mass=weight===undefined?template.weight:typeof weight==='string'&&/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(weight.trim())?Number(weight.replace(',','.')):typeof weight==='number'?weight:NaN;
  if(mass===null||mass===undefined||!Number.isFinite(mass)||mass<0||mass>99999)throw Error('Enter an item weight from 0 to 99999 lb. The reference does not specify every weight.');
  if(!name||name.length>160||!Number.isInteger(quantity)||quantity<1||quantity>9999)throw Error('This catalogue item needs review before it can be added.');
  const paper=data.adobe?.paperInventory||{},rows=Inventory.gearRows(paper,all),old=rows[index],preceding=rows[index-1];
  const item={id:newId,name,quantity,weight:mass,location:(old?.location||'Backpack').slice(0,80),carried:true,notes:'Original Adobe '+(template.kind==='tool'?'Tools':'Gear')+' reference ('+(template.edition||'2014')+').',edition:template.edition==='2024'?'2024':'2014'};
  const source={id:newId,name,quantity:sourceAmount===''?'':quantity,weight:mass,location:old?.location||''};
  const placed=Inventory.gearAction(paper,all,index,'put',source),key='p:'+newId;
  placed.state.gearLayout.values[key]={quantity:source.quantity,location:source.location};
  // Original Put Gear/Tool keeps the existing location and indents after a container.
  if(preceding&&/^.{0,2}-|backpack|\bbag\b|^(?=.*saddle)(?=.*bag).*$|\bsack\b|\bchest\b|, with|, contain/i.test(preceding.name))placed.state.gearLayout.values[key].name='- '+name;
  return{personalGear:[...data.personalGear,item],paperInventory:Inventory.normalize(placed.state),index,replaced:old?.name||'',item};
 }
 return{choices,plan};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperGearCatalog;
