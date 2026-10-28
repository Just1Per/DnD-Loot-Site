'use strict';
/* Private paper reminders and ammunition counters; never grants attacks or gear. */
var CharacterPaperCombat=(()=>{
 const groups=['action','bonus','reaction'],labels={action:'Action',bonus:'Bonus Action',reaction:'Reaction'};
 const ammoTypes={"Alchemist's Fire, flasks":'Flasks',Arrows:'Arrows',Bolts:'Arrows',Bullets:'Bullets',Daggers:'Daggers',Darts:'Arrows','Flasks (1 pint)':'Flasks',Handaxes:'Axes','Holy Water, flasks':'Flasks',Javelins:'Spears','Light Hammers':'Hammers',Needles:'Bullets',Spears:'Spears',Tridents:'Spears','Vials (4 ounces)':'Vials','Vials of Acid':'Vials'};
 const iconFor=name=>Object.hasOwn(ammoTypes,name)?ammoTypes[name]:'Arrows';
 const limits={Arrows:20,Axes:8,Bullets:50,Daggers:10,Flasks:20,Hammers:8,Spears:10,Vials:20};
 const integer=(v,max=1000000)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.trunc(Number(v)))):0;
 function ammo(raw={}){const name=String(raw?.name||'').slice(0,120),capacity=limits[iconFor(name)],amount=integer(raw?.amount);return{name,amount,loaded:Math.min(amount,integer(raw?.loaded??Math.min(amount,capacity),capacity))};}
 function normalize(raw={}){const dc=raw?.secondaryDC||{};return{secondaryDC:{visible:dc.visible===true,ability:['str','dex','con','int','wis','cha'].includes(dc.ability)?dc.ability:'int',bonus:Math.max(-30,Math.min(30,Math.trunc(Number(dc.bonus)||0)))},actions:Object.fromEntries(groups.map(key=>[key,Array.from({length:12},(_,i)=>String(raw?.actions?.[key]?.[i]||'').slice(0,4000))])),ammunition:Array.from({length:2},(_,i)=>ammo(raw?.ammunition?.[i]))};}
 function editDC(raw,key,value){const out=normalize(raw);if(key==='visible'){if(typeof value!=='boolean')throw Error('Choose whether to show the second DC.');}else if(key==='ability'){if(!['str','dex','con','int','wis','cha'].includes(value))throw Error('Choose an ability for the second DC.');}else if(key==='bonus'){if(String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<-30||Number(value)>30)throw Error('Enter a DC adjustment from -30 to 30.');value=Number(value);}else throw Error('Choose an available second-DC setting.');out.secondaryDC[key]=value;return out;}
 function checkRow(group,index){if(!groups.includes(group)||!Number.isInteger(index)||index<0||index>11)throw Error('Choose an available action row.');}
 function editAction(raw,group,index,text){checkRow(group,index);if(typeof text!=='string'||text.length>4000)throw Error('An action reminder can contain up to 4,000 characters.');const out=normalize(raw);out.actions[group][index]=text;return out;}
 function operation(raw,group,index,command){
  checkRow(group,index);const out=normalize(raw),rows=out.actions[group];let selected=index;
  if(command==='up'||command==='down'){selected=index+(command==='up'?-1:1);checkRow(group,selected);[rows[index],rows[selected]]=[rows[selected],rows[index]];}
  else if(command==='opposite'){if(group!=='action'||index<6)throw Error('Opposing fields are available on the action overflow page.');selected=index<9?index+3:index-3;[rows[index],rows[selected]]=[rows[selected],rows[index]];}
  else if(command==='insert'){if(!rows[index])throw Error('This action row is already empty.');const end=rows.findIndex((value,i)=>i>index&&!value);if(end<0)throw Error('No empty row below this action. Nothing was removed.');for(let i=end;i>index;i--)rows[i]=rows[i-1];rows[index]='';}
  else if(command==='delete'){const end=index<6&&!rows[5]?6:12;for(let i=index;i<end-1;i++)rows[i]=rows[i+1];rows[end-1]='';}
  else if(command==='clear')rows[index]='';else throw Error('Choose an available action command.');
  return{data:out,index:selected};
 }
 function editAmmo(raw,index,key,value){
  if(!Number.isInteger(index)||index<0||index>1)throw Error('Choose the left or right ammunition tracker.');const out=normalize(raw),row=out.ammunition[index];
  if(key==='name'){if(typeof value!=='string'||value.length>120)throw Error('Ammunition names can contain up to 120 characters.');row.name=value;row.loaded=Math.min(row.amount,limits[iconFor(value)]);}
  else if(key==='amount'){if(String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<0||Number(value)>1000000)throw Error('Enter a whole ammunition amount from 0 to 1000000.');row.amount=Number(value);row.loaded=Math.min(row.amount,limits[iconFor(row.name)]);}
  else if(key==='reload')row.loaded=Math.min(row.amount,limits[iconFor(row.name)]);
  else if(key==='spend'){if(row.loaded<=0||row.amount<=0)throw Error(row.amount?'Reload the remaining ammunition before using more.':'No ammunition remains.');row.amount--;row.loaded--;}
  else if(key==='undo'){const max=limits[iconFor(row.name)];if(row.loaded>=max||row.amount>=1000000)throw Error('This ammunition tracker is full.');row.amount++;row.loaded++;}
  else throw Error('Choose an available ammunition command.');return out;
 }
 function ammoProjection(row){const normalized=ammo(row),icon=iconFor(normalized.name);return{...normalized,icon,capacity:limits[icon]};}
 function ammoSlots(raw){const row=ammoProjection(raw);if(row.icon==='Bullets')return Array.from({length:50},(_,i)=>'Bullet.'+(i+1));if(['Axes','Hammers'].includes(row.icon))return ['Top.Axe.2','Top.Axe.4','Top.Axe.6','Top.Axe.8','Base.Axe.13','Base.Axe.15','Base.Axe.17','Base.Axe.19'];return Array.from({length:row.capacity},(_,i)=>(row.icon==='Spears'?'Base.':i<10?'Top.':'Base.')+(row.icon==='Spears'?i+11:i+1));}
 // Original top/base shapes share logical positions; axes have explicit names.
 function sourceAmmoSlot(raw,suffix){const row=ammoProjection(raw),slots=ammoSlots(raw);if(row.icon==='Bullets')return slots.indexOf(suffix);if(['Axes','Hammers'].includes(row.icon))return slots.indexOf(suffix);return slots.findIndex(name=>name===suffix.replace('.Axe.','.'));}
 return{groups,labels,ammoTypes,limits,normalize,editDC,editAction,operation,editAmmo,ammoProjection,ammoSlots,sourceAmmoSlot};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPaperCombat;
