'use strict';
var CampaignCreatures = (() => {
  const abilities=['str','dex','con','int','wis','cha'];
  const categories=['Story NPC','Monster','Boss','Companion'];
  function number(value,fallback,min,max,label){const n=value===''||value==null?fallback:Number(value);if(!Number.isInteger(n)||n<min||n>max)throw Error(`${label} must be a whole number from ${min} to ${max}.`);return n;}
  function normalize(input={}) {
    const data=structuredClone(input);
    data.category=categories.includes(data.category)?data.category:'Story NPC';
    data.edition=['2014','2024','Homebrew'].includes(data.edition)?data.edition:'Homebrew';
    data.combatEnabled=!!data.combatEnabled||['Monster','Boss'].includes(data.category);
    for(const [key,fallback,min,max]of [['ac',10,0,40],['hp',1,1,10000],['speed',30,0,600],...abilities.map(key=>[key,10,1,30])])data[key]=number(data[key],fallback,min,max,key.toUpperCase());
    for(const key of ['appearance','personality','voice','goals','relationships','saves','skills','resistances','immunities','senses','languages','cr','actions','traits','legendaryActions','phases']){data[key]=String(data[key]||'');if(data[key].length>20000)throw Error('Creature text exceeds the field limit.');}
    return data;
  }
  function snapshot(record) {
    const data=normalize(record.data);
    return {templateId:record.id,templateRevision:record.revision,name:record.title,stats:data};
  }
  return {normalize,snapshot,abilities,categories};
})();
if(typeof module!=='undefined')module.exports=CampaignCreatures;
