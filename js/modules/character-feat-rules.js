/* Deterministic sheet effects. Situational combat resolution remains with the table. */
var CharacterFeatRules = (() => {
  const definitions=typeof CharacterFeatData!=='undefined'?CharacterFeatData:require('./character-feat-data');
  const abilityKeys=['str','dex','con','int','wis','cha'];
  function choice(raw={}) {
    const safe=v=>typeof v==='string'?v.slice(0,100):'';
    return {option:Number.isInteger(raw.option)&&raw.option>=0&&raw.option<2?raw.option:0,abilities:[0,1].map(i=>abilityKeys.includes(raw.abilities?.[i])?raw.abilities[i]:''),training:[0,1,2].map(i=>safe(raw.training?.[i])),expertise:safe(raw.expertise),confirmed:raw.confirmed===true,armored:raw.armored===true,used:Math.max(0,Math.min(99,Math.trunc(Number(raw.used)||0)))};
  }
  function entries(data) {
    const seen={};const result=(data.rulesChoices?.feats||[]).map(id=>{seen[id]=(seen[id]||0)+1;return {id,key:id+(seen[id]>1?'--'+seen[id]:'')};});
    if(data.build.edition==='2014' && data.build.raceFeat) {
      const R=typeof CharacterRules!=='undefined'?CharacterRules:require('./character-rules');
      const race=R.races?.[data.build.race];
      if(data.build.race==='variant-human'||race?.feat){
        const id=Object.keys(definitions).find(id=>definitions[id].edition==='2014' && definitions[id].name.toLowerCase()===data.build.raceFeat.trim().toLowerCase());
        if(id)result.unshift({id,key:'variant',origin:true,originLabel:data.build.race==='variant-human'?'Variant Human':race?.name||'Race'});
      }
    }
    if(data.build.edition==='2024') {
      const B=typeof CharacterBackgrounds!=='undefined'?CharacterBackgrounds:require('./character-backgrounds');
      const background=B.get(data.build.background);
      const bg=background?.featChoices?.length?(background.featChoices.includes(data.build.backgroundFeat)?data.build.backgroundFeat:''):(background?.feat||data.build.backgroundFeat);
      const origins=[['origin-background',bg,'Background'],...(data.build.race==='human-2024'?[['origin-human',data.build.humanOriginFeat,'Human']]:[])];
      for(const [key,name,label] of origins.reverse())if(name) {
        const candidates=Object.keys(definitions).filter(id=>definitions[id].edition==='2024'&&definitions[id].name===name);
        const id=candidates.find(id=>definitions[id].source==='XPHB')||candidates[0];
        if(id)result.unshift({id,key,origin:true,managedOrigin:true,originLabel:label});
      }
    }
    return result;
  }
  function trainingOptions(def,rules) {
    if(def.name==='Crafter')return rules.tools.filter(t=>(def.toolChoices||[]).includes(t.toLowerCase().replaceAll('’',"'"))).map(t=>'tool:'+t);
    if(def.name==='Musician')return rules.instruments.map(t=>'tool:'+t);
    if(def.name==='Linguist')return rules.languages.map(l=>'language:'+l);
    if(def.name==='Keen Mind')return ['arcana','history','investigation','nature','religion'].map(s=>'skill:'+s);
    return [];
  }
  function requirements(def,scores,level,confirmed) {
    if(!def.requirements.length)return [];
    const numeric=def.requirements.filter(r=>level>=r.level && (!r.ability.length || r.ability.some(a=>Object.entries(a).every(([k,v])=>abilityKeys.includes(k)&&Number.isFinite(v)&&scores[k]>=v))));
    if(!numeric.length)return ['Level / ability prerequisite is not met.'];
    if(numeric.every(r=>r.manual)&&!confirmed)return ['Confirm the remaining source prerequisites with your DM.'];
    return [];
  }
  function apply(data,level,effects,scores,skillNames,tools) {
    const reports=[],seen=new Map((effects.originFeats||[]).map(n=>[n.replace(/ \(.*\)$/,''),'2024'])), expertise=[],pb=Math.ceil(Math.max(1,Math.min(20,level))/4)+1;
    const R=typeof CharacterRules!=='undefined'?CharacterRules:require('./character-rules');
    const origins={};for(const n of effects.originFeats||[])origins[n]=(origins[n]||0)+1;
    let acBonus=0,rangedBonus=0,passiveBonus=0,speedBonus=0,athleteClimb=false;
    for(const entry of entries(data)) {
      const def=Object.hasOwn(definitions,entry.id)?definitions[entry.id]:null;
      if(!def){reports.push({...entry,def:{name:entry.id,edition:'Unknown',source:'Reference',ability:[],requirements:[]},choice:choice(),warnings:['No bundled automation definition; selection preserved.'],automated:[]});continue;}
      const c=choice(data.rulesChoices?.effects?.[entry.key]),warnings=[],automated=[],identity=def.name==='Mobile'&&def.source==='PHB'?'Speedy':def.name;
      const report={...entry,def,choice:c,warnings,automated};reports.push(report);
      if(entry.managedOrigin){if(!origins[identity]){warnings.push('Duplicate or unavailable Origin feat: no effects applied.');continue;}origins[identity]--;}
      else {if(seen.has(identity)&&(!def.repeatable||seen.get(identity)!==def.edition)){warnings.push('Duplicate feat: no additional effects applied.');continue;}seen.set(identity,def.edition);}
      const moderatelyArmored=def.name==='Moderately Armored'&&['PHB','XPHB'].includes(def.source);
      const hasLightArmor=effects.proficiencies.some(v=>String(v).toLowerCase()==='light armor');
      warnings.push(...requirements(def,scores,level,c.confirmed||(moderatelyArmored&&hasLightArmor)));
      if(moderatelyArmored&&!hasLightArmor)warnings.push('Requires Light armor training.');
      if(warnings.length)continue;
      if(def.name==='Resilient'&&def.source==='XPHB'&&(effects.saves.includes(c.abilities[0])||data.saves[c.abilities[0]]?.proficient)){warnings.push('Choose an ability without saving throw proficiency.');continue;}
      const option=def.ability[c.option]||def.ability[0];
      if(option){
        const increases={};for(const a of abilityKeys)if(option[a])increases[a]=option[a];
        const select=option.choose;
        if(select){
          const picks=c.abilities.slice(0,select.count||1);
          if(picks.some(a=>!select.from.includes(a)) || new Set(picks).size!==picks.length)warnings.push('Choose the required distinct abilities.');
          else for(const a of picks)increases[a]=(increases[a]||0)+(select.amount||1);
        }
        if(!warnings.length){
          report.abilityIncreases={...increases};report.appliedAbilityIncreases={};
          if(data.build.scoreMode==='base')for(const [a,n] of Object.entries(increases)){const applied=Math.max(0,Math.min(n,option.max-scores[a]));scores[a]+=applied;report.appliedAbilityIncreases[a]=applied;}
          automated.push('Ability increase (maximum '+option.max+'); '+(data.build.scoreMode==='base'?'included in totals':'reference only in Final totals mode'));
        }
      }
      const core=def.source==='PHB'||def.source==='XPHB'||def.source==='TCE';
      if(!core)continue;
      if(def.name==='Alert') {effects.initiativeBonus=def.edition==='2014'?(effects.initiativeBonus||0)+5:Math.max(effects.initiativeBonus||0,pb);automated.push('Initiative');}
      if(def.name==='Tough'){effects.hpBonus+=2*level;automated.push('Maximum HP (+2 per level in Base mode)');}
      if(def.name==='Observant'&&def.edition==='2014'){passiveBonus+=5;automated.push('Passive Perception +5 (passive Investigation remains manual)');}
      if(def.name==='Resilient'&&!warnings.length){
        const a=c.abilities[0];
        if(a){effects.saves.push(a);automated.push('Saving throw proficiency');}
      }
      const train=(value,upgrade=false)=>{
        if(value.startsWith('skill:')&&skillNames.includes(value.slice(6))){
          const key=value.slice(6),rank=Math.max(data.skills[key]?.rank||0,effects.skills.includes(key)?1:0,expertise.includes(key)?2:0);
          if(upgrade&&rank>=1){if(rank>=2)warnings.push('Choose a skill without expertise.');else expertise.push(key);}
          else if(rank>=1)warnings.push('Choose an untrained skill.');else effects.skills.push(key);
          return;
        }
        if(!upgrade&&value.startsWith('tool:')&&tools.includes(value.slice(5))&&!effects.proficiencies.includes(value.slice(5))){effects.proficiencies.push(value.slice(5));return;}
        warnings.push('Choose valid, distinct training.');
      };
      if(def.name==='Skilled'){for(const value of c.training)train(value);automated.push('Three skill/tool proficiencies');}
      if(def.name==='Skill Expert'){
        train(c.training[0]);const key=c.expertise;
        if(skillNames.includes(key)&&(effects.skills.includes(key)||(data.skills[key]?.rank||0)>=1)&&!expertise.includes(key)&&(data.skills[key]?.rank||0)<2)expertise.push(key);
        else warnings.push('Choose a proficient skill without expertise.');
        automated.push('Skill proficiency and expertise');
      }
      if(def.name==='Observant'&&def.edition==='2024'){
        if(['skill:insight','skill:investigation','skill:perception'].includes(c.training[0]))train(c.training[0],true);else warnings.push('Choose Insight, Investigation or Perception.');automated.push('Proficiency or expertise in chosen skill');
      }
      if(def.name==='Keen Mind'&&def.edition==='2024'){
        if(trainingOptions(def,R).includes(c.training[0]))train(c.training[0],true);else warnings.push('Choose an eligible knowledge skill.');
        automated.push('Proficiency or expertise in the selected knowledge skill');
      }
      if(['Crafter','Musician'].includes(def.name)&&def.source==='XPHB'){
        const allowed=trainingOptions(def,R),seenChoices=new Set();
        for(const value of c.training){if(!allowed.includes(value)||seenChoices.has(value)){warnings.push('Choose three different eligible tools/instruments.');continue;}seenChoices.add(value);if(!effects.proficiencies.includes(value.slice(5)))effects.proficiencies.push(value.slice(5));}
        automated.push('Three tool/instrument proficiencies');
        if(def.name==='Musician')effects.traits.push(`Musician: eligible allies for the rest-end song: ${pb}. Assign their inspiration at the table.`);
      }
      if(def.name==='Linguist'&&def.source==='PHB'){
        const selected=new Set();for(const value of c.training){const language=value.slice(9);if(!trainingOptions(def,R).includes(value)||selected.has(value)||effects.languages.includes(language)){warnings.push('Choose three different new languages.');continue;}selected.add(value);effects.languages.push(language);}
        automated.push('Three selected languages');
      }
      if(def.armorTraining?.length){
        for(const type of def.armorTraining)effects.proficiencies.push({light:'Light armor',medium:'Medium armor',heavy:'Heavy armor',shield:'Shields'}[type]);
        automated.push('Edition-specific armor/shield training');
      }
      if((def.name==='Mobile'&&def.source==='PHB')||(def.name==='Speedy'&&def.source==='XPHB')){speedBonus+=10;automated.push('Walking speed +10 ft');}
      if(def.name==='Athlete'&&def.source==='XPHB'){athleteClimb=true;automated.push('Climb speed equals effective walking speed');}
      if(def.name==='Boon of Speed'&&def.source==='XPHB'){speedBonus+=30;automated.push('Walking speed +30 ft');}
      if(def.name==='Boon of Fortitude'&&def.source==='XPHB'){effects.hpBonus+=40;automated.push('Maximum HP +40 in Base mode');}
      if(def.name==='Boon of Skill'&&def.source==='XPHB'){
        effects.skills.push(...skillNames);const key=c.expertise;
        if(skillNames.includes(key)&&!expertise.includes(key)&&(data.skills[key]?.rank||0)<2)expertise.push(key);else warnings.push('Choose one skill without expertise.');
        automated.push('Proficiency in all skills and one expertise');
      }
      if(resource(def,level))automated.push('Tracked feature uses and recovery');
      if(def.name==='Archery'&&def.edition==='2024'){rangedBonus=2;automated.push('Ranged weapon attack +2');}
      if(def.name==='Defense'&&def.edition==='2024'){if(c.armored)acBonus=1;automated.push('AC +1 while confirmed wearing Light/Medium/Heavy armor (entered AC must exclude this bonus)');}
      if(def.name==='Boon of Truesight'&&def.edition==='2024'){effects.traits.push('Boon of Truesight: Truesight 60 ft.');automated.push('Truesight 60 ft');}
    }
    effects.speed+=speedBonus;
    if(athleteClimb)effects.climb=Math.max(effects.climb,effects.speed);
    effects.proficiencies=[...new Set(effects.proficiencies)];effects.skills=[...new Set(effects.skills)];effects.saves=[...new Set(effects.saves)];
    for(const r of reports)for(const message of r.warnings)effects.warnings.push(r.def.name+': '+message);
    return {reports,expertise,acBonus,rangedBonus,passiveBonus,speedBonus};
  }
  function resource(def,level=1) {
    if(def?.name==='Lucky'&&['PHB','XPHB'].includes(def.source))return {label:'Luck points',max:def.edition==='2014'?3:Math.ceil(Math.max(1,Math.min(20,Number(level)||1))/4)+1,resets:['long']};
    if(!def || def.edition!=='2024')return null;
    const r={'Boon of Fortitude':{label:'Extra healing (apply the CON bonus when eligible)',resets:['turn']},'Boon of Fate':{label:'Improve Fate',resets:['initiative','short','long']},'Boon of Combat Prowess':{label:'Peerless Aim',resets:['turn']},'Grappler':{label:'Punch and Grab',resets:['turn']},'Savage Attacker':{label:'Extra damage roll',resets:['turn']}}[def.name]||null;
    return r?{max:1,...r}:null;
  }
  function remove(data,key) {
    const before=entries(data).filter(e=>!e.origin),index=before.findIndex(e=>e.key===key);
    if(index<0)return;
    const oldEffects={...data.rulesChoices.effects},oldGrants={...data.rulesChoices.grants};
    for(const e of before){delete data.rulesChoices.effects[e.key];delete data.rulesChoices.grants[e.key];}
    data.rulesChoices.feats.splice(index,1);before.splice(index,1);
    entries(data).filter(e=>!e.origin).forEach((e,i)=>{
      if(oldEffects[before[i].key])data.rulesChoices.effects[e.key]=oldEffects[before[i].key];
      if(oldGrants[before[i].key])data.rulesChoices.grants[e.key]=oldGrants[before[i].key];
    });
  }
  function reset(data,event) {
    if(event==='long')for(const grant of Object.values(data.rulesChoices.grants||{}))grant.used=0;
    for(const e of entries(data))if(resource(definitions[e.id])?.resets.includes(event)&&data.rulesChoices.effects[e.key])data.rulesChoices.effects[e.key].used=0;
  }
  return {definitions,choice,entries,trainingOptions,apply,resource,reset,remove};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterFeatRules;
