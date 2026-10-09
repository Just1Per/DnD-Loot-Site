'use strict';
var CampaignEncounters = (()=>{
 const clone=value=>structuredClone(value),uid=()=>crypto.randomUUID().replaceAll('-','');
 function normalize(input={}){const data=clone(input);data.round=Math.max(1,Math.trunc(Number(data.round)||1));data.turn=Math.max(0,Math.trunc(Number(data.turn)||0));data.combatants||=[];if(!Array.isArray(data.combatants)||data.combatants.length>50)throw Error('An encounter supports up to 50 combatants.');for(const row of data.combatants){if(!row.id||!Number.isInteger(row.maxHp)||row.maxHp<1||row.maxHp>10000||!Number.isInteger(row.hp)||row.hp<0||row.hp>row.maxHp||!Number.isInteger(row.tempHp)||row.tempHp<0||row.tempHp>10000||!Number.isInteger(row.initiative)||Math.abs(row.initiative)>100)throw Error('Invalid encounter combat state.');}return data;}
 function add(input,record,count=1){const data=normalize(input);if(!Number.isInteger(count)||count<1||data.combatants.length+count>50)throw Error('Choose 1–50 combatants within the encounter limit.');const snapshot=CampaignCreatures.snapshot(record);for(let n=0;n<count;n++)data.combatants.push({...clone(snapshot),id:uid(),name:snapshot.name+(count>1?' '+(n+1):''),maxHp:snapshot.stats.hp,hp:snapshot.stats.hp,tempHp:0,initiative:0,conditions:[],concentration:false,notes:''});return data;}
 function changeHP(input,id,amount,heal=false){if(!Number.isInteger(amount)||amount<0||amount>10000)throw Error('Enter a whole-number amount from 0 to 10000.');const data=normalize(input),row=data.combatants.find(row=>row.id===id);if(!row)throw Error('Combatant not found.');if(heal)row.hp=Math.min(row.maxHp,row.hp+amount);else{const absorbed=Math.min(row.tempHp,amount);row.tempHp-=absorbed;row.hp=Math.max(0,row.hp-(amount-absorbed));}return data;}
 function ordered(input){return normalize(input).combatants.slice().sort((a,b)=>b.initiative-a.initiative||a.id.localeCompare(b.id));}
 function next(input){const data=normalize(input);if(!data.combatants.length)return data;data.turn++;if(data.turn>=data.combatants.length){data.turn=0;data.round++;}return data;}
 function reset(input){const data=normalize(input);data.round=1;data.turn=0;for(const row of data.combatants){row.hp=row.maxHp;row.tempHp=0;row.conditions=[];row.concentration=false;}return data;}
 return{normalize,add,changeHP,ordered,next,reset};
})();
if(typeof module!=='undefined')module.exports=CampaignEncounters;
