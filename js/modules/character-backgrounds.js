/* Background grants are derived, so changing a choice never leaves stale bonuses. */
var CharacterBackgrounds=(()=>{
 const data=typeof CharacterBackgroundData!=='undefined'?CharacterBackgroundData:require('./character-background-data');
 if(typeof CharacterBackgroundData==='undefined'&&typeof require==='function')require('./character-expanded-background-data');
 const Origin=typeof CharacterOriginMechanics!=='undefined'?CharacterOriginMechanics:require('./character-origin-mechanics');
 const rawGet=id=>Object.hasOwn(data.modern,id)?data.modern[id]:Object.hasOwn(data.legacy,id)?data.legacy[id]:Object.hasOwn(data.expanded||{},id)?data.expanded[id]:null;
 const get=id=>Origin.background(rawGet(id));
 const norm=s=>s.toLowerCase().replaceAll('’',"'");
 const sourceName=bg=>data.sourceNames?.[bg?.source]||bg?.source||'D&D';
 const toolName=(name,tools)=>tools.find(t=>norm(t)===norm(name))||name.replace(/^./,s=>s.toUpperCase());
 function toolOptions(kind,R){
  const structured=Origin.toolOptions(kind,R);if(structured)return structured;
  if(kind==='anyArtisansTool')return R.tools.slice(0,17);
  if(kind==='anyMusicalInstrument')return R.instruments;
  if(kind==='anyGamingSet')return R.tools.filter(v=>/set$/i.test(v));
  if(kind==='merchant')return [...R.tools.slice(0,17),toolName("navigator's tools",R.tools),'Additional language'];
  return [];
 }
 function apply(e,b,data,skillNames,tools,languages,instruments){
  const bg=get(b.background);if(!bg||bg.edition==='2024'&&b.edition==='2014')return;
  const warn=(message,category,target)=>{e.warnings.push(message);(e.choiceIssues||=[]).push({message,category,target,tab:'builder',source:'background'});};
  const before=new Set([...e.skills,...skillNames.filter(k=>(data.skills[k]?.rank||0)>=1)]);
  e.backgroundDuplicates=[];
  (bg.skills||[]).forEach((key,i)=>{
   if(before.has(key)){
    e.backgroundDuplicates.push(i);const replacement=b.backgroundReplacementSkills[i];
    if(skillNames.includes(replacement)&&!before.has(replacement)&&!(bg.skills||[]).includes(replacement)){e.skills.push(replacement);before.add(replacement);}
    else {e.skills.push(key);warn('Background: choose a different untrained skill to replace '+key+'.','Skill','[name="build.backgroundReplacementSkills.'+i+'"]');}
   }else e.skills.push(key);
  });
  const R={tools,instruments};
  for(const t of (bg.fixedTools||[]))e.proficiencies.push(toolName(t,tools));
  let count=Number(bg.languages||0);
  (bg.toolChoices||[]).forEach((kind,i)=>{
   const value=b.backgroundTools[i],options=toolOptions(kind,R);
   if(value==='Additional language'&&kind==='merchant')count++;
   else if(options.includes(value)&&!b.backgroundTools.slice(0,i).includes(value))e.proficiencies.push(value);
   else warn('Background: choose the required tool proficiency.','Proficiency','[name="build.backgroundTools.'+i+'"]');
  });
  for(const fixed of bg.fixedLanguages||[]){const lang=languages.find(x=>norm(x)===norm(fixed));if(lang&&!e.languages.includes(lang))e.languages.push(lang);}
  for(let index=0;index<count;index++){const lang=b.backgroundLanguages[index];
   if(Origin.languageOptions(bg,index,languages).includes(lang)&&!e.languages.includes(lang))e.languages.push(lang);
   else warn('Choose '+count+' different additional background language'+(count===1?'':'s')+'.','Language','[name="build.backgroundLanguages.'+index+'"]');
  }
  const F=globalThis.CharacterBackgroundFeatures||(typeof require==='function'?require('./character-background-features'):null),feature=F?.project(data);if((bg.edition!=='2024'||feature?.selection!=='auto')&&(feature?feature.name:bg.feature)){const ref=feature?.reference||(bg.page?`${sourceName(bg)}, p. ${bg.page}`:sourceName(bg));e.traits.push((feature?.name||bg.feature)+' — background feature; resolve its narrative benefits with your DM ('+ref+').');}
  for(let i=0;i<(bg.skillChoiceCount||0);i++){const key=b.backgroundSkills?.[i];if(bg.skillOptions?.includes(key)&&!before.has(key)){e.skills.push(key);before.add(key);}else warn('Background: choose a distinct untrained skill from its allowed list.','Skill','[name="build.backgroundSkills.'+i+'"]');}
  if(bg.partial)e.warnings.push(bg.name+': source-specific feature/equipment'+(bg.edition==='2024'?' and ability/feat details':'')+' are only partially automated; use the source entry for remaining choices.');
  e.proficiencies=[...new Set(e.proficiencies)];
 }
 return {...data,get,sourceName,toolName,toolOptions,languageOptions:Origin.languageOptions,apply};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBackgrounds;
