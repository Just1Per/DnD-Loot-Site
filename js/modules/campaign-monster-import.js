'use strict';
var CampaignMonsterImport = (()=>{
 const LICENSE='https://creativecommons.org/licenses/by/4.0/';
 const text=rows=>(rows||[]).map(row=>`${row.name || ''}. ${row.desc || ''}`).join('\n\n');
 function normalize(raw,edition) {
   if(!['2014','2024'].includes(edition)||!raw.index||!raw.name)throw Error('Unsupported or incomplete SRD entry.');
   const ac=Array.isArray(raw.armor_class)?raw.armor_class[0]?.value:raw.armor_class;
   if(!Number.isInteger(ac)||!Number.isInteger(raw.hit_points))throw Error('Missing creature AC or HP.');
   const prof=raw.proficiencies||[], senses=Object.entries(raw.senses||{}).map(([key,value])=>`${key.replaceAll('_',' ')}: ${value}`).join(', ');
   const stringify=list=>(list||[]).map(value=>typeof value==='string'?value:JSON.stringify(value)).join(', ');
   const version=edition==='2014'?'5.1':'5.2.1';
   const source={provider:'D&D 5e SRD API',id:raw.index,edition,srdVersion:version,url:`https://www.dnd5eapi.co/api/${edition}/monsters/${raw.index}`,license:LICENSE,attribution:`Includes material from the System Reference Document ${version} by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd under CC BY 4.0.`,changes:'Statistics normalized; action text retained; API artwork excluded.'};
   return {id:`srd-${edition}-${raw.index}`,title:raw.name,summary:`${raw.size||''} ${raw.type||''} · CR ${raw.challenge_rating}`,content:raw.desc||'',edition,data:{category:'Monster',edition,combatEnabled:true,ac,hp:raw.hit_points,speed:parseInt(raw.speed?.walk)||0,str:raw.strength,dex:raw.dexterity,con:raw.constitution,int:raw.intelligence,wis:raw.wisdom,cha:raw.charisma,cr:String(raw.challenge_rating),size:raw.size||'',creatureType:raw.type||'',movement:Object.entries(raw.speed||{}).map(([key,value])=>`${key}: ${value}`).join(', '),saves:prof.filter(row=>row.proficiency?.index?.startsWith('saving-throw-')).map(row=>`${row.proficiency.name}: ${row.value>=0?'+':''}${row.value}`).join(', '),skills:prof.filter(row=>row.proficiency?.index?.startsWith('skill-')).map(row=>`${row.proficiency.name}: ${row.value>=0?'+':''}${row.value}`).join(', '),resistances:stringify(raw.damage_resistances),immunities:stringify(raw.damage_immunities),vulnerabilities:stringify(raw.damage_vulnerabilities),conditionImmunities:stringify(raw.condition_immunities),senses,languages:raw.languages||'',actions:text(raw.actions),traits:text(raw.special_abilities),legendaryActions:text(raw.legendary_actions),bonusActions:text(raw.bonus_actions),reactions:text(raw.reactions),source}};
 }
 return{normalize,LICENSE};
})();
if(typeof module!=='undefined')module.exports=CampaignMonsterImport;
