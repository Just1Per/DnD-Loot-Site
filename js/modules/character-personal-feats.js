'use strict';
/* Private character-owned homebrew definitions; no campaign publication or executable rules. */
var CharacterPersonalFeats=(()=>{
 const isId=id=>typeof id==='string'&&/^personal-feat-[a-z0-9-]{1,80}$/.test(id),integer=(value,max)=>Number.isFinite(Number(value))?Math.max(0,Math.min(max,Math.trunc(Number(value)))):0;
 function record(raw={}){return {name:String(raw.name||'').trim().slice(0,160),description:String(raw.description||'').slice(0,6000),edition:raw.edition==='2014'?'2014':'2024',minimumLevel:integer(raw.minimumLevel,20),hpPerLevel:integer(raw.hpPerLevel,10),speedBonus:integer(raw.speedBonus,60),armorTraining:[...new Set((Array.isArray(raw.armorTraining)?raw.armorTraining:[]).filter(value=>['light','medium','heavy','shield'].includes(value)))]};}
 function normalize(raw){return Object.fromEntries(Object.entries(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}).filter(([id,value])=>isId(id)&&value&&typeof value==='object'&&!Array.isArray(value)).slice(0,30).map(([id,value])=>[id,record(value)]).filter(([,value])=>value.name));}
 const records=data=>normalize((data?.adobe||data?.rulesChoices?.grants?.__adobe?.data)?.personalFeats);
 function find(data,id){const row=records(data)[id];return row?{id,...row,source:'Personal homebrew',book:'Private character feat',category:'G',licensedText:true,personal:true}:null;}
 function definition(data,id){const row=find(data,id);return row?{...row,ability:[],requirements:[{level:row.minimumLevel,ability:[]}],repeatable:false,campaignEffects:{hpPerLevel:row.hpPerLevel,speedBonus:row.speedBonus}}:null;}
 const blocked=id=>typeof CampaignRules!=='undefined'&&CampaignRules.records().some(row=>row.id===id&&row.hidden);
 const selectable=(data,id)=>{const row=find(data,id);return !!row&&!blocked(id)&&(typeof CampaignRules==='undefined'||CampaignRules.allowed(row));};
 const catalogue=data=>Object.keys(records(data)).map(id=>find(data,id)).filter(row=>selectable(data,row.id));
 function validate(raw){if(!String(raw.name||'').trim()||String(raw.name).length>160)throw Error('Enter a custom feat name of 1–160 characters.');if(String(raw.description||'').length>6000)throw Error('Use at most 6,000 characters for the feat description.');for(const [key,max]of [['minimumLevel',20],['hpPerLevel',10],['speedBonus',60]])if(String(raw[key]??0).trim()===''||!Number.isInteger(Number(raw[key]??0))||Number(raw[key]??0)<0||Number(raw[key]??0)>max)throw Error('Enter a whole '+{minimumLevel:'minimum level',hpPerLevel:'HP per level bonus',speedBonus:'speed bonus'}[key]+' from 0 to '+max+'.');return record(raw);}
 function set(data,id,raw){if(!isId(id))throw Error('Invalid personal feat reference.');const value=validate(raw),rows=records(data);if(!Object.hasOwn(rows,id)&&Object.keys(rows).length>=30)throw Error('This character has 30 custom feats. Remove an unused custom feat before creating another.');data.adobe||={};data.adobe.personalFeats={...rows,[id]:value};return find(data,id);}
 function remove(data,id){if(data.rulesChoices.feats.includes(id))throw Error('Remove this feat from the character before deleting its definition.');const rows=records(data);delete rows[id];if(Object.keys(rows).length)data.adobe.personalFeats=rows;else delete data.adobe.personalFeats;}
 return{isId,record,normalize,records,find,definition,blocked,selectable,catalogue,validate,set,remove};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPersonalFeats;
