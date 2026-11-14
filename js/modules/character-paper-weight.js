'use strict';
/* Source CalcWeightCarried / WeightToCalc_Button facts; no Acrobat execution. */
var CharacterPaperWeight=(()=>{
 const sections=[
  {id:'cArm',name:'Armor',location:'Page 1'},
  {id:'cShi',name:'Shield',location:'Page 1'},
  {id:'cWea',name:'Weapons',location:'Page 1 · Attacks'},
  {id:'cAmL',name:'Left ammunition',location:'Page 1'},
  {id:'cAmR',name:'Right ammunition',location:'Page 1'},
  {id:'cCoi',name:'Coins',location:'Page 2'},
  {id:'cP2L',name:'Left equipment column',location:'Page 2'},
  {id:'cP2M',name:'Middle equipment column',location:'Page 2'},
  {id:'cP2R',name:'Right equipment column',location:'Page 2'},
  {id:'cP3L',name:'Left extra-equipment column',location:'Page 3 / continuations'},
  {id:'cP3R',name:'Right extra-equipment column',location:'Page 3 / continuations'},
  {id:'cMaI',name:'Magic items',location:'Page 3 / continuations'}
 ];
 const defaults=['cCoi','cP2L','cP2M','cP2R'],ids=new Set(sections.map(row=>row.id));
 const validKey=key=>typeof key==='string'&&/^(?:armor|shield|ammo:[01]|(?:attack|magic):[^\r\n/]{1,220})$/.test(key);
 const number=value=>typeof value==='string'?Number(value.replace(',','.')):Number(value);
 const weight=value=>['number','string'].includes(typeof value)&&String(value).trim()!==''&&Number.isFinite(number(value))&&number(value)>=0&&number(value)<=1000000?number(value):null;
 function normalize(raw={}){
  return{mode:raw?.mode==='adobe'?'adobe':'inventory',sections:[...new Set(Array.isArray(raw?.sections)?raw.sections.filter(id=>ids.has(id)):defaults)],overrides:Object.fromEntries(Object.entries(raw?.overrides&&typeof raw.overrides==='object'&&!Array.isArray(raw.overrides)?raw.overrides:{}).filter(([key,value])=>validKey(key)&&weight(value)!==null).slice(0,1200).map(([key,value])=>[key,weight(value)]))};
 }
 function edit(raw,command,key,value){
  const out=normalize(raw);
  if(command==='mode'){if(!['inventory','adobe'].includes(value))throw Error('Choose Inventory or Adobe sheet sections.');out.mode=value;}
  else if(command==='section'){if(!ids.has(key)||typeof value!=='boolean')throw Error('Choose an original sheet section.');out.sections=sections.filter(row=>row.id===key?value:out.sections.includes(row.id)).map(row=>row.id);}
  else if(command==='weight'){if(!validKey(key)||weight(value)===null)throw Error('Use a weight from 0 to 1000000 lb.');out.overrides[key]=weight(value);}
  else if(command==='automatic'){if(!validKey(key))throw Error('Choose an available weight field.');delete out.overrides[key];}
  else throw Error('Choose an available weight setting.');return out;
 }
 function subtotal(rows,overrides,blankQuantityIsOne=false){
  let total=0,unknown=0;
  for(const row of rows||[]){
   const quantity=row.quantity===undefined||blankQuantityIsOne&&row.quantity===''?1:Number(row.quantity);if(!Number.isFinite(quantity)||quantity<0){unknown++;continue;}if(quantity===0)continue;
   const unit=Object.hasOwn(overrides,row.key)?overrides[row.key]:row.weight;
   if(unit===null||unit===undefined||!['number','string'].includes(typeof unit)||!Number.isFinite(number(unit))||number(unit)<0||!Number.isFinite(total+number(unit)*quantity)){unknown++;continue;}
   total+=number(unit)*quantity;
  }
  return{total,unknown};
 }
 function calculate(raw,{groups={},coins={},inventoryWeight={gear:0,coins:0,total:0,unknown:0}}={}){
  const preferences=normalize(raw),selected=new Set(preferences.sections);
  const rows=sections.map(section=>{
   const result=section.id==='cCoi'?subtotal(Object.entries(coins).map(([key,count])=>({key:'coin:'+key,weight:1/50,quantity:count})),{}):subtotal(groups[section.id],preferences.overrides,/^cP[23]/.test(section.id));
   // Original imperial CalcWeightCarried floors coin weight to one decimal place.
   if(section.id==='cCoi')result.total=Math.floor(result.total*10+1e-9)/10;
   return{...section,...result,selected:selected.has(section.id)};
  });
  const selectedRows=rows.filter(row=>row.selected),coinWeight=rows.find(row=>row.id==='cCoi'),coinTotal=coinWeight.selected?coinWeight.total:0,total=selectedRows.reduce((sum,row)=>sum+row.total,0),unknown=selectedRows.reduce((sum,row)=>sum+row.unknown,0);
  const adobe={gear:total-coinTotal,coins:coinTotal,total,unknown,source:'adobe'};
  return{preferences,rows,adobe,inventory:inventoryWeight,weight:preferences.mode==='adobe'?adobe:inventoryWeight};
 }
 function columnWeight(rows){const result=subtotal((rows||[]).filter(row=>row&&!row.header&&!row.automaticAttunement),{},true);return{gear:result.total,unknown:result.unknown};}
 return{sections,defaults,normalize,edit,calculate,columnWeight};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterPaperWeight=CharacterPaperWeight;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperWeight;
