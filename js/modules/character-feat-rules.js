/* Deterministic sheet effects. Situational combat resolution remains with the table. */
var CharacterFeatRules = (() => {
  const definitions=typeof CharacterFeatData!=='undefined'?CharacterFeatData:require('./character-feat-data');
  const abilityKeys=['str','dex','con','int','wis','cha'];
  function choice(raw={}) {
    const safe=v=>typeof v==='string'?v.slice(0,100):'';
    return {option:Number.isInteger(raw.option)&&raw.option>=0&&raw.option<2?raw.option:0,abilities:[0,1].map(i=>abilityKeys.includes(raw.abilities?.[i])?raw.abilities[i]:''),training:[0,1,2].map(i=>safe(raw.training?.[i])),expertise:safe(raw.expertise),confirmed:raw.confirmed===true,armored:raw.armored===true,used:raw.used?1:0};
  }
  function entries(data) {
    const seen={};const result=(data.rulesChoices?.feats||[]).map(id=>{seen[id]=(seen[id]||0)+1;return {id,key:id+(seen[id]>1?'--'+seen[id]:'')};});
    if(data.build.edition==='2014' && data.build.race==='variant-human') {
      const id=Object.keys(definitions).find(id=>definitions[id].source==='PHB' && definitions[id].name.toLowerCase()===data.build.raceFeat.trim().toLowerCase());
      if(id)result.unshift({id,key:'variant',origin:true});
    }
    return result;
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
    let acBonus=0,rangedBonus=0,passiveBonus=0;
    for(const entry of entries(data)) {
      const def=Object.hasOwn(definitions,entry.id)?definitions[entry.id]:null;
      if(!def){reports.push({...entry,def:{name:entry.id,edition:'Unknown',source:'Reference',ability:[],requirements:[]},choice:choice(),warnings:['No bundled automation definition; selection preserved.'],automated:[]});continue;}
      const c=choice(data.rulesChoices?.effects?.[entry.key]),warnings=[],automated=[],identity=def.name;
      const report={...entry,def,choice:c,warnings,automated};reports.push(report);
      if(seen.has(identity)&&(!def.repeatable||seen.get(identity)!==def.edition)){warnings.push('Duplicate feat: no additional effects applied.');continue;}
      seen.set(identity,def.edition);
      warnings.push(...requirements(def,scores,level,c.confirmed));
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
          if(data.build.scoreMode==='base')for(const [a,n] of Object.entries(increases))scores[a]+=Math.max(0,Math.min(n,option.max-scores[a]));
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
      if(def.name==='Archery'&&def.edition==='2024'){rangedBonus=2;automated.push('Ranged weapon attack +2');}
      if(def.name==='Defense'&&def.edition==='2024'){if(c.armored)acBonus=1;automated.push('AC +1 while confirmed wearing Light/Medium/Heavy armor (entered AC must exclude this bonus)');}
      if(def.name==='Boon of Truesight'&&def.edition==='2024'){effects.traits.push('Boon of Truesight: Truesight 60 ft.');automated.push('Truesight 60 ft');}
    }
    for(const r of reports)for(const message of r.warnings)effects.warnings.push(r.def.name+': '+message);
    return {reports,expertise,acBonus,rangedBonus,passiveBonus};
  }
  function resource(def) {
    if(!def || def.edition!=='2024')return null;
    return {'Boon of Fate':{label:'Improve Fate',resets:['initiative','short','long']},'Boon of Combat Prowess':{label:'Peerless Aim',resets:['turn']},'Grappler':{label:'Punch and Grab',resets:['turn']},'Savage Attacker':{label:'Extra damage roll',resets:['turn']}}[def.name]||null;
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
    for(const e of entries(data))if(resource(definitions[e.id])?.resets.includes(event)&&data.rulesChoices.effects[e.key])data.rulesChoices.effects[e.key].used=0;
  }
  return {definitions,choice,entries,apply,resource,reset,remove};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterFeatRules;
