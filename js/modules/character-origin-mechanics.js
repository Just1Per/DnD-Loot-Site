'use strict';
/* Structured source facts mapped to existing private origin choices. */
var CharacterOriginMechanics=(()=>{
 const facts=typeof CharacterOriginFacts!=='undefined'?CharacterOriginFacts:require('./character-origin-facts'),norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''),cache=new WeakMap();
 const source=s=>({bomt:'bmt',paitm:'sato',sais:'aag',efota:'efa',rthw:'rhw'}[norm(s)]||norm(s));
 function background(row){
  if(!row||!row.partial)return row;if(cache.has(row))return cache.get(row);
  const name=row.name.replace(/ \(City Watch variant\)$/,'').replace(/^House Agent \((.*?)\)$/,'House Agent ($1)'),key=source(row.source)+'|'+norm(name),f=facts.backgrounds[key];if(!f)return row;
  const out={...row,page:row.page||f.page,originFacts:key};
  if(f.tools){out.fixedTools=f.tools.fixed;out.toolChoices=f.tools.choices.map(from=>from.length===1&&/^any/.test(from[0])?from[0]:{from});}
  if(f.languages){out.fixedLanguages=f.languages.fixed;out.languageChoices=f.languages.choices;out.languages=f.languages.choices.length;}
  cache.set(row,out);return out;
 }
 function toolOptions(kind,R){
  if(!kind?.from)return null;
  const lookup=value=>{if(/^(anyMusicalInstrument|musical instrument)$/i.test(value))return R.instruments||[];if(/^(anyGamingSet|gaming set)$/i.test(value))return(R.tools||[]).filter(x=>/set$/i.test(x));if(/^(anyArtisansTool|artisan.s tools?)$/i.test(value))return(R.tools||[]).slice(0,17);return(R.tools||[]).filter(x=>norm(x)===norm(value));};
  return [...new Set(kind.from.flatMap(lookup))];
 }
 function languageOptions(row,index,languages){const choices=row?.languageChoices?.[index];return!choices||choices.some(x=>['any','anyStandard','other'].includes(x))?languages:languages.filter(lang=>choices.some(x=>norm(x)===norm(lang)));}
 function races(rows){
  const aliases={'pallidelf':'pallid','lotusdenhalfling':'lotusden','chromaticdragonborn':'dragonbornchromatic','gemdragonborn':'dragonborngem','metallicdragonborn':'dragonbornmetallic'};
  for(const [id,r] of Object.entries(rows)){
   const Species=globalThis.CharacterSpeciesResources||(typeof require==='function'?require('./character-species-resources'):null);if(Species?.definitions[id]?.abilityChoice)r.featureAbilityChoice=true;if(Species?.definitions[id]?.featureOptions&&!r.optionChoices)r.optionChoices=Species.definitions[id].featureOptions;
   if(!r.partial)continue;const f=facts.races[source(r.book)+'|'+(aliases[norm(r.name)]||norm(r.name))];if(!f)continue;
   if(Array.isArray(f.resist)&&f.resist.every(x=>typeof x==='string'))r.resistances=f.resist.map(x=>x[0].toUpperCase()+x.slice(1));
   // Fixed cantrips and explicit daily grants are safe; alternative packages and choices stay separate.
   if(['pallid','lotusden'].includes(aliases[norm(r.name)])||!r.spells?.length&&f.additionalSpells?.length===1){
    const spells=[];for(const group of f.additionalSpells||[])for(const [kind,levels]of Object.entries(group))if(['known','innate'].includes(kind))for(const [level,picks]of Object.entries(levels)){
     const add=(names,usage,cantripsOnly=false)=>{for(const id of names)if(typeof id==='string'&&(!cantripsOnly||/#c$/.test(id))&&Number.isInteger(Number(level))&&Number(level)>=1)spells.push({name:id.split(/[|#]/)[0].replace(/\b\w/g,c=>c.toUpperCase()),level:Number(level),ability:typeof group.ability==='string'?group.ability:'choice',usage});};
     if(Array.isArray(picks))add(picks,'at will',true);else for(const [count,names]of Object.entries(picks.daily||{}))if(/^\d+$/.test(count))add(names,count+' per long rest');
    }if(spells.length){r.spells=spells;r.traits=r.traits.filter(t=>!/source-specific spell details remain manual/.test(t));}
   }
  }
  const ancestry={chromatic:{black:'Acid',blue:'Lightning',green:'Poison',red:'Fire',white:'Cold'},gem:{amethyst:'Force',crystal:'Radiant',emerald:'Psychic',sapphire:'Thunder',topaz:'Necrotic'},metallic:{brass:'Fire',bronze:'Lightning',copper:'Acid',gold:'Fire',silver:'Cold'}};
  for(const [type,options]of Object.entries(ancestry)){const r=rows[type+'-dragonborn-ftd'];if(!r)continue;for(const [id,damage]of Object.entries(options))if(r.optionChoices?.[id])r.optionChoices[id]={...r.optionChoices[id],resistances:[damage],traits:[damage+' ancestry: breath uses '+damage+' damage.']};}
 }
 function resources(data,level){
  const R=globalThis.CharacterRules||(typeof require==='function'?require('./character-rules'):null),profile=R?.profile(data.build,level),stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{};
  return(profile?.spells||[]).filter(s=>s.level<=level&&/^(?:once|[1-9]\d?) per long rest(?:;|$)/i.test(s.usage)).map(s=>{const id='origin-'+norm(s.name),key='origin:'+data.build.race+':'+norm(s.name)+'-used',raw=stored.classFeatureChoices?.[key]?.[0],used=/^\d+$/.test(raw||'')?Math.min(10000,Number(raw)):0,max=/^once/i.test(s.usage)?1:Number(s.usage.match(/^\d+/)[0]),ability=s.ability==='choice'?data.build.raceAbility:s.ability;return{id,key,name:s.name,source:profile.name,className:profile.name,max,used,remaining:Math.max(0,max-used),resets:['long'],recovery:'Long Rest recovery',unit:'uses',useLabel:'Use racial spell',undoLabel:'Undo use',description:(ability?ability.toUpperCase():'Choose casting ability')+' racial spell · free casting; spell slots are separate.'};});
 }
 return{background,toolOptions,languageOptions,races,resources};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterOriginMechanics;
