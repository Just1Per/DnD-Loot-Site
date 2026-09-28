/* Background grants are derived, so changing a choice never leaves stale bonuses. */
var CharacterBackgrounds=(()=>{
 const data=typeof CharacterBackgroundData!=='undefined'?CharacterBackgroundData:require('./character-background-data');
 const get=id=>Object.hasOwn(data.modern,id)?data.modern[id]:Object.hasOwn(data.legacy,id)?data.legacy[id]:null;
 const norm=s=>s.toLowerCase().replaceAll('’',"'");
 const toolName=(name,tools)=>tools.find(t=>norm(t)===norm(name))||name.replace(/^./,s=>s.toUpperCase());
 function toolOptions(kind,R){
  if(kind==='anyArtisansTool')return R.tools.slice(0,17);
  if(kind==='anyMusicalInstrument')return R.instruments;
  if(kind==='anyGamingSet')return R.tools.filter(v=>/set$/i.test(v));
  if(kind==='merchant')return [...R.tools.slice(0,17),toolName("navigator's tools",R.tools),'Additional language'];
  return [];
 }
 function apply(e,b,data,skillNames,tools,languages,instruments){
  const bg=get(b.background);if(!bg||bg.edition==='2024'&&b.edition==='2014')return;
  const before=new Set([...e.skills,...skillNames.filter(k=>(data.skills[k]?.rank||0)>=1)]);
  e.backgroundDuplicates=[];
  bg.skills.forEach((key,i)=>{
   if(before.has(key)){
    e.backgroundDuplicates.push(i);const replacement=b.backgroundReplacementSkills[i];
    if(skillNames.includes(replacement)&&!before.has(replacement)&&!bg.skills.includes(replacement)){e.skills.push(replacement);before.add(replacement);}
    else {e.skills.push(key);e.warnings.push('Background: choose a different untrained skill to replace '+key+'.');}
   }else e.skills.push(key);
  });
  const R={tools,instruments};
  for(const t of bg.fixedTools)e.proficiencies.push(toolName(t,tools));
  let count=bg.languages;
  bg.toolChoices.forEach((kind,i)=>{
   const value=b.backgroundTools[i],options=toolOptions(kind,R);
   if(value==='Additional language'&&kind==='merchant')count++;
   else if(options.includes(value))e.proficiencies.push(value);
   else e.warnings.push('Background: choose the required tool proficiency.');
  });
  for(const lang of b.backgroundLanguages.slice(0,count)){
   if(languages.includes(lang)&&!e.languages.includes(lang))e.languages.push(lang);
   else e.warnings.push('Choose '+count+' different additional background language'+(count===1?'':'s')+'.');
  }
  if(bg.feature)e.traits.push(bg.feature+' — background feature; resolve its narrative benefits with your DM (PHB 2014, p. '+bg.page+').');
  e.proficiencies=[...new Set(e.proficiencies)];
 }
 return {...data,get,toolName,toolOptions,apply};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBackgrounds;
