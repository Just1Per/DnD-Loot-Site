'use strict';
/* A field adapter, not another rules engine. All totals come from shared derive. */
var CharacterAdobeFields=(()=>{
 const abilities={Str:'str',Dex:'dex',Con:'con',Int:'int',Wis:'wis',Cha:'cha'};
 const skills={Acr:'acrobatics',Ani:'animalHandling',Arc:'arcana',Ath:'athletics',Dec:'deception',His:'history',Ins:'insight',Inti:'intimidation',Inv:'investigation',Med:'medicine',Nat:'nature',Perc:'perception',Perf:'performance',Pers:'persuasion',Rel:'religion',Sle:'sleightOfHand',Ste:'stealth',Sur:'survival'};
 const raw={
  'PC Name':['identity.name','text',120],'Player Name':['profile.playerName','text',120],
  'HP Current':['hpCurrent','number',1000000],'HP Temp':['hpTemp','number',1000000],
  'Inspiration':['inspiration','checkbox'],
  'Personality Trait':['personality','textarea',12000],Ideal:['ideals','textarea',12000],Bond:['bonds','textarea',12000],Flaw:['flaws','textarea',12000],
  Sex:['profile.gender','select'],Age:['profile.age','number',100000],Height:['profile.height','number',100000],Weight:['profile.weight','number',100000],
  Alignment:['alignment','select'],'Faith/Deity':['profile.faith','text',200],
  'Hair colour':['profile.hair','text',200],'Eyes colour':['profile.eyes','text',200],'Skin colour':['profile.skin','text',200],
  'Background_Faction.Text':['profile.organization','text',200],
  'Background_Organisation.Left':['allies','textarea',12000],'Background_Organisation.Right':['profile.organizationNotes','textarea',12000],
  Background_Appearance:['appearance','textarea',12000],Background_Enemies:['enemies','textarea',12000],Background_History:['backstory','textarea',12000],
  'Extra.Other Holdings':['equipment','textarea',12000],
  Lifestyle:['profile.lifestyle','text',200],
  'Copper Pieces':['coins.cp','number',1000000],'Silver Pieces':['coins.sp','number',1000000],'Electrum Pieces':['coins.ep','number',1000000],'Gold Pieces':['coins.gp','number',1000000],'Platinum Pieces':['coins.pp','number',1000000]
 };
 const get=(o,path)=>path.split('.').reduce((v,key)=>v?.[key],o);
 const sign=n=>(Number(n)>=0?'+':'')+Number(n||0);
 const lines=value=>String(value||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
 const computed=(value,extra={})=>({state:'computed',value:value??'',kind:'text',...extra});
 const edit=(path,value,kind='text',max=12000,extra={})=>({state:'editable',path,value:value??(kind==='checkbox'?false:''),kind,max,...extra});
 function describe(field,context){
  const id=typeof field==='string'?field:field.id,{data,derived:d,identity,options={}}=context;
  const secondDC=data.adobe?.paperCombat?.secondaryDC?.visible===true;
  if(typeof field==='object'&&field.dcLayout&&((field.dcLayout==='dual')!==secondDC))return computed('',{hidden:true,kind:field.kind});
  if(Object.hasOwn(raw,id)){const [path,kind,max]=raw[id],value=get(path.startsWith('identity.')?{identity}:data,path);return edit(path,value,kind,max,{options:options[path]||[]});}
  let m;
  if((m=/^(Action|Bonus Action|Reaction) ([1-9]|1[0-2])$/.exec(id))){const group={Action:'action','Bonus Action':'bonus',Reaction:'reaction'}[m[1]],index=Number(m[2])-1;return {state:'editable',kind:'text',value:data.adobe?.paperCombat?.actions?.[group]?.[index]||'',max:4000,paperAction:{group,index}};}
  if((m=/^Ammo(Left|Right)Display\.(Name|Amount)$/.exec(id))){const index=m[1]==='Left'?0:1,row=CharacterPaperCombat.ammoProjection(data.adobe?.paperCombat?.ammunition?.[index]),key=m[2]==='Name'?'name':'amount';return {state:'editable',kind:key==='name'?'text':'number',value:row[key],max:key==='name'?120:1000000,choices:Object.keys(CharacterPaperCombat.ammoTypes),ammoEdit:{index,key},reason:'Paper ammunition tracker. Reload uses remaining ammunition; inventory quantities are managed separately.'};}
  if((m=/^Ammo(Left|Right)\.(Top|Base|Bullet)\.(?:Axe\.)?\d+$/.exec(id))){const index=m[1]==='Left'?0:1,row=CharacterPaperCombat.ammoProjection(data.adobe?.paperCombat?.ammunition?.[index]),slot=CharacterPaperCombat.sourceAmmoSlot(row,id.replace(/^Ammo(?:Left|Right)\./,''));return {state:'editable',kind:'checkbox',value:slot>=row.loaded,hidden:slot<0||!row.name&&row.amount===0,ammoEdit:{index,key:'mark'},reason:'Checked means spent or unavailable in the current load.'};}
  if(id.startsWith('Wildshape')){
   const state=context.wild;if(!state)return computed('',{command:'companion'});
   if(id==='Wildshapes.Info.Uses')return computed(state.available?(state.maxUses===Infinity?'Unlimited':state.remaining+' / '+state.maxUses):'Requires Druid 2',{command:'companion'});
   if(id==='Wildshapes.Info.Duration')return computed(state.available?'Up to '+state.durationHours+' hours':'',{command:'companion'});
   if(id==='Wildshapes.Info.Limitations')return computed(state.available?'CR ≤'+state.maxCR+(!state.fly&&!state.swim?' · no fly/swim':!state.fly?' · no flight':!state.swim?' · no swim':''):'',{command:'companion'});
   if((m=/^Wildshape\.Race\.([1-4])$/.exec(id))){const row=context.wildRows?.[Number(m[1])-1];return state.available&&row&&(!state.modern||row.index<state.knownLimit)?{state:'editable',kind:'select',value:row.id,wildChoice:row.index,options:(context.wildOptions||[]).map(option=>({...option,disabled:option.value!==row.id&&(context.wildIds||[]).includes(option.value)}))}:computed('',{kind:'select',reason:'No form choice is available at this class level.'});}
   if((m=/^Wildshape\.([1-4])\.(.+)$/.exec(id))){const row=context.wildRows?.[Number(m[1])-1],p=row?.profile,b=row?.creature?.data,key=m[2];if(!p?.valid)return computed('',{kind:typeof field==='object'?field.kind:'text',command:'companion'});
    if(key==='MonsterType'||key==='Size'||key==='CR')return computed(key==='MonsterType'?b.creatureType:key==='Size'?b.size:b.cr);
    if((m=/^Ability\.(Str|Dex|Con|Int|Wis|Cha)\.(Score|Mod|ST\.Mod|ST\.Prof)$/.exec(key))){const ability=abilities[m[1]],part=m[2];return computed(part==='Score'?p.scores[ability]:part==='ST.Prof'?p.saveProficient[ability]:sign(part==='Mod'?p.mods[ability]:p.saves[ability]),{kind:part==='ST.Prof'?'checkbox':'text',command:'companion'});}
    if((m=/^Skills\.([A-Za-z]+)\.(Mod|Prof|Exp)$/.exec(key))&&skills[m[1]]){const skill=skills[m[1]],part=m[2];return computed(part==='Mod'?sign(p.skills[skill]):p.skillRanks[skill]>=(part==='Exp'?2:1),{kind:part==='Mod'?'text':'checkbox'});}
    if(key==='HP Current'&&row.active)return {state:'editable',kind:'number',value:p.hp,min:0,max:p.hpMax,wildHP:row.id};
    if((m=/^Attack\.([12])\.(Weapon|Range|To Hit|Damage|Damage Type|Description)$/.exec(key))){const text=String(p.actions||'').split(/\n\n/).filter(text=>/(?:Melee|Ranged)(?: Weapon)? Attack(?: Roll)?:/i.test(text))[Number(m[1])-1]||'',part=m[2],hit=text.match(/Attack(?: Roll)?:\s*([+−-]\d+)/i)?.[1]||'',range=text.match(/\b(?:reach|range)\s+([^,;]+?\bft\.?)/i)?.[1]||'',damage=text.match(/Hit:\s*([^.]*)/i)?.[1]||'',type=damage.match(/\b(Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder) damage/i)?.[1]||'',dice=damage.match(/\(([^)]+)\)/)?.[1]||damage.replace(/\s+\w+ damage.*/i,'');return computed(part==='Weapon'?text.split(/\.\s/)[0]:part==='To Hit'?hit:part==='Range'?range:part==='Damage'?dice:part==='Damage Type'?type:text.replace(/^.*?Hit:\s*[^.]*\.\s*/i,''),{command:'companion',reason:text});}
    const values={'Proficiency Bonus':sign(p.pb),AC:p.ac,'Initiative Bonus':sign(p.initiative),Speed:p.speed+' ft','HP Max':p.hpMax,'HP Current':p.hp,'HP Temp':p.tempHP,'Skills.PassPerc':p.passive,Traits:[p.traits,p.primalStrike].filter(Boolean).join('\n\n')};
    if(Object.hasOwn(values,key))return computed(values[key],{kind:key==='Traits'?'textarea':'text',command:'companion',reason:row.active?'Active form from the shared Wild Shape engine.':'Reference only, with merged equipment; no form is assumed and no uses are spent.'});
   }
  }
  if(id.startsWith('Comp.')||id==='Cnote.Left'){
   const c=context.companion,stats=context.companionStats,index=context.companionIndex||0,prefix='adobe.companions.'+index+'.';if(!c)return computed('',{command:'companion'});
   const bindings={'Comp.Desc.Name':['name','text',120],'Comp.Desc.Height':['height','text',120],'Comp.Desc.Weight':['weight','text',120],'Comp.Desc.Age':['age','text',120],'Comp.Desc.Sex':['gender','text',120],'Comp.Use.Features':['features','textarea',8000],'Comp.Desc.Size':['size','select',undefined], 'Comp.Use.AC':['ac','number',50],'Comp.Use.HP.Max':['hpMax','number',100000],'Comp.Use.HP.Current':['hpCurrent','number',100000],'Comp.Use.HP.Temp':['hpTemp','number',100000],'Comp.Use.Speed':['speed','number',1000],'Comp.Use.Traits':['traits','textarea',8000],'Cnote.Left':['notes','textarea',8000]};
   if(bindings[id]){const [key,kind,max]=bindings[id];return edit(prefix+key,c[key],kind,max,{options:key==='size'?['Tiny','Small','Medium','Large','Huge'].map(value=>({value,label:value})):undefined});}
   if(id==='Comp.Use.Attack.perAction')return computed(stats.attacksAction??'',{command:'companion'});
   if((m=/^Comp\.Use\.Attack\.([1-3])\.(Weapon Selection|Proficiency|Mod|Range|To Hit|Damage|Damage Type|Description)$/.exec(id))){const slot=Number(m[1])-1,index=c.paperAttackSlots?.[slot]??slot,row=stats.attacks?.[index],key=m[2];if(key==='Weapon Selection')return stats.attacks?.length?{state:'editable',kind:'select',value:row?String(index):'',companionAttackSlot:{index:context.companionIndex||0,slot},options:stats.attacks.map(row=>({value:String(row.index),label:row.name}))}:computed('',{kind:'select',command:'companion'});return computed(!row?key==='Proficiency'?false:'':key==='Proficiency'?row.proficient:key==='Mod'?row.ability.toUpperCase():key==='To Hit'?row.attack===null?'Review':row.dc?'DC '+row.attack:sign(row.attack):key==='Range'?row.range:key==='Damage'?row.damage:key==='Damage Type'?row.damageType:[row.description,row.warning].filter(Boolean).join(' '),{kind:key==='Proficiency'?'checkbox':key==='Description'?'textarea':'text',command:'companion',reason:row?.warning||(key==='Description'?[row?.description,row?.tooltip].filter(Boolean).join(' '):'')||'Natural attack reference from the shared companion calculations.'});}
   if(id==='Comp.Use.HD.Level')return computed(stats.hitDiceCount||'',{command:'companion'});
   if(id==='Comp.Use.HD.Die')return computed(stats.hitDie?'d'+stats.hitDie:'',{command:'companion'});
   if(id==='Comp.Use.HD.Used')return stats.hitDiceCount?edit(prefix+'hitDiceUsed',c.hitDiceUsed,'number',stats.hitDiceCount):computed('',{command:'companion',reason:'Choose a catalogue creature with recorded hit dice.'});
   if(id==='Comp.Use.Combat.Init.Mod')return computed(sign(stats.initiative),{command:'companion'});
   if(id==='Comp.Use.Skills.Perc.Pass.Mod')return computed(stats.passive);
   if(id==='Comp.Desc.MonsterType'||id==='Comp.Desc.Alignment'){const key=id.endsWith('MonsterType')?'creatureType':'alignment';return edit(prefix+key,c[key]||(key==='creatureType'?context.companionCreature?.type||'':''),'select',120,{options:(typeof field==='object'?field.options||[]:[]).map(value=>({value,label:value}))});}
   if((m=/^Comp\.Use\.DeathSave\.(Success|Fail)\.([123])$/.exec(id))){const key=m[1]==='Success'?'deathSuccess':'deathFailure',count=Number(m[2]);return edit(prefix+key,c[key]>=count,'checkbox',3,{count});}
   if(id==='Comp.Use.Senses')return computed(context.companionCreature?.senses||'',{command:'companion'});
   if(id==='Comp.Type')return edit(prefix+'type',c.type,'select',undefined,{options:[{value:'companion',label:'Companion'},{value:'familiar',label:'Familiar'},{value:'wildshape',label:'Manual Wild Shape reference'}]});
   if(id==='Comp.Race')return {state:'editable',kind:'select',value:context.companionCreatureId||'',options:context.companionCreatures||[],companionCreature:index,requiredChoice:true,choiceMessage:'Choose a companion creature.'};
   if(id==='Comp.Use.Proficiency Bonus')return c.type==='wildshape'?computed(sign(stats.pb),{reason:'Character proficiency bonus for this manual form reference.'}):edit(prefix+'profBonus',c.profBonus,'number',10);
   if((m=/^Comp\.Use\.Ability\.(Str|Dex|Con|Int|Wis|Cha)\.(Score|Mod|ST\.Mod|ST\.Prof)$/.exec(id))){const key=abilities[m[1]],part=m[2];if(part==='Score')return c.type==='wildshape'&&['int','wis','cha'].includes(key)?computed(stats.scores[key],{command:'abilities'}):edit(prefix+'abilities.'+key,c.abilities[key],'number',30,{min:1});if(part==='ST.Prof')return edit(prefix+'saveProficient.'+key,c.saveProficient[key],'checkbox');return computed(sign(part==='Mod'?stats.mods[key]:stats.saves[key]));}
   if((m=/^Comp\.Use\.Skills\.([A-Za-z]+)\.(Prof|Exp|Mod)$/.exec(id))&&skills[m[1]]){const key=skills[m[1]],part=m[2];if(part==='Mod')return computed(sign(stats.skills[key]));const wanted=part==='Exp'?2:1,automatic=stats.skillRanks[key]>c.skillRank[key]?stats.skillRanks[key]:0;return automatic>=wanted?computed(true,{kind:'checkbox',reason:'Inherited from the character for this manual form reference.'}):edit(prefix+'skillRank.'+key,stats.skillRanks[key]>=wanted,'checkbox',2,{rank:wanted,currentRank:c.skillRank[key]});}
  }
  if(id.startsWith('AdvLog')||id.startsWith('Text.AdvLog.')){
   const L=typeof CharacterAdventureLog!=='undefined'?CharacterAdventureLog:require('./character-adventure-log'),log=context.adventureLog||L.normalize(data.adobe?.adventureLog),offset=(context.logPage||0)*6;
   if(id==='AdvLog.Class and Levels')return computed((d.progression?.classLevels||[]).map(c=>(context.className?.(c.classId)||c.classId)+' '+c.level).join(' / '));
   if(id==='AdvLog.Player Name')return edit('profile.playerName',data.profile.playerName,'text',120);
   if(id==='AdvLog.sheetNumber')return computed((context.logPage||0)+1);
   if(id==='AdvLogS.Background_Faction.Text'||id==='AdvLog.DCI.Text'){const key=id==='AdvLog.DCI.Text'?'playerId':'faction';return {state:'editable',kind:key==='faction'?'select':'text',options:key==='faction'?(typeof field==='object'?field.options||[]:[]).map(value=>({value,label:value})):undefined,value:log[key],max:key==='faction'?160:100,logEdit:{index:0,key,part:'header'}};}
   if((m=/^Text\.AdvLog\.([1-6])$/.exec(id)))return computed('Entry '+(offset+Number(m[1])));
   if((m=/^AdvLog\.([1-6])\.(adventure|session|dm|date|notes|xp|gold|downtime|renown|magicItems)(?:\.(start|gain|total))?$/.exec(id))){const index=offset+Number(m[1])-1,key=m[2],part=m[3],rows=context.logRows||L.project(log),row=rows[index],numeric=L.keys.includes(key);if(!row)return computed('');
    if(numeric&&(!part||!['start','gain','total'].includes(part)))return computed('');
    const value=numeric?row[part][key]:row[key];if(part==='total'||part==='start'&&index!==0){const hidden=part==='total'?row.gain[key]==='':row.gain[key]===''&&(rows[index-1]?.gain[key]??'')==='';return computed(hidden?'':value);}
    return {state:'editable',kind:key==='notes'?'textarea':'text',value:part==='start'?log.start[key]:value,max:key==='notes'?4000:200,logEdit:{index,key,part:part||'text'},reason:numeric?'Enter a signed number. Log balances are independent of character XP, coins and owned items.':''};
   }
  }
  if(id==='zAdvLog.PC Name'||id==='AdvLog.PC Name')return computed(identity.name);
  if((m=/^spells\.(name|description|save|school|time|range|components|duration|book|page)\.(\d+)$/.exec(id))){const index=Number(m[2]),key=m[1];if(index===0)return computed({name:'Spell',description:'Description',save:'Save',school:'School',time:'Time',range:'Range',components:'Comp.',duration:'Duration',book:'B',page:'P'}[key],{reason:'Column heading.'});const row=context.spellRows?.[(context.spellOffset||0)+index-1];let value='';if(row){value=key==='name'?row.spell.name:key==='description'?[row.description,row.mark?.detail,...(row.mark?.notes||[]),row.invocation?context.invocationText?.(row.invocation):'',row.beast?.relevant?row.beast.detail:''].filter(Boolean).join(' '):key==='time'?row.spell.casting:key==='range'?row.range:key==='book'?row.c?.source:key==='page'?row.c?.page:key==='save'||key==='school'?row.c?.[key]:row.spell[key];}return computed(value,{command:'spells',spellIndex:row&&(key==='name'||key==='description')?row.i:undefined});}
  if(id==='spellshead.Text.header.0')return computed(context.spellProfile?.name||context.spellCasterLabel||'All selected spells',{command:'spells'});
  if(id==='spellshead.ability.0')return computed(context.spellProfile?.ability?.toUpperCase()||'',{command:'spells'});
  if(id==='spellshead.prepare.0')return computed(context.spellProfile?.mode==='known'?'':context.spellProfile?.spellCount??'',{command:'spells'});
  if(id==='spellshead.attack.0')return computed(context.spellStats?sign(context.spellStats.attack):'',{command:'spells'});
  if(id==='spellshead.dc.0')return computed(context.spellStats?.dc??'',{command:'spells'});
  if(id==='spellsdiv.Text.0')return computed('Selected spells · sorted by level');
  if(id==='SpellSheetInformation')return computed((context.spellPact?'Pact Magic slots shown above are separate from ordinary Spellcasting slots. ':'Ordinary Spellcasting slots shown above are separate from Pact Magic. ')+'Choose a caster above to see its ability, attack modifier and save DC. Prepared choices and slots use the shared Spells controls. Spell descriptions may be abbreviated; open Spells for full information.');
  if(id==='Character Level')return data.adobe?.useExperience?computed(d.progression.targetLevel):edit('identity.level',identity.level,'number',20,{min:1});
  if(id==='Class and Levels'){const rows=d.progression?.classLevels||[];return computed(rows.map(c=>(context.className?.(c.classId)||c.classId)+(rows.length>1?' '+c.level:'')).join(' / '),{command:'classes'});}
  if(id==='Total Experience')return edit('experience',d.progression?.xp?.xp??(data.experience||0),'number',1000000000,{command:'classes'});
  if(id==='Next level')return computed(d.progression?.xp?.next??'',{command:'classes'});
  if((m=/^Feat (Name|Note|Description) ([1-8])$/.exec(id))){const row=context.feats?.[(context.featOffset||0)+Number(m[2])-1];return computed(!row?'':m[1]==='Name'?row.name:m[1]==='Note'?[row.origin,row.source].filter(Boolean).join(' · '):[row.description,...(row.report?.warnings||[])].filter(Boolean).join('\n'),{kind:m[1]==='Description'?'textarea':'text',command:'feats'});}
  if(id==='Race')return edit('build.race',data.build.race,'select',undefined,{options:options.races||[]});
  if(id==='Background')return edit('build.background',data.build.background,'select',undefined,{options:options.backgrounds||[]});
  if(Object.hasOwn(abilities,id))return computed(d.scores[abilities[id]],{command:'abilities'});
  if((m=/^(Str|Dex|Con|Int|Wis|Cha) Mod$/.exec(id)))return computed(sign(d.mods[abilities[m[1]]]));
  if((m=/^(Str|Dex|Con|Int|Wis|Cha) ST Mod$/.exec(id)))return computed(sign(d.saves[abilities[m[1]]]));
  if((m=/^(Str|Dex|Con|Int|Wis|Cha) ST Prof$/.exec(id))){const key=abilities[m[1]],automatic=d.effects.saves.includes(key);return automatic?computed(true,{kind:'checkbox',reason:'Granted by class or character choices.'}):edit('saves.'+key+'.proficient',data.saves[key].proficient,'checkbox');}
  if(Object.hasOwn(skills,id))return computed(sign(d.skills[skills[id]]));
  if((m=/^(Acr|Ani|Arc|Ath|Dec|His|Ins|Inti|Inv|Med|Nat|Perc|Perf|Pers|Rel|Sle|Ste|Sur) (Prof|Exp)$/.exec(id))){const key=skills[m[1]],auto=Math.max(d.effects.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0,d.classExpertise?.skills.includes(key)?2:0),rank=Math.max(data.skills[key].rank,auto),wanted=m[2]==='Exp'?2:1;return auto>=wanted?computed(true,{kind:'checkbox',reason:'Granted by class, feat or character choices.'}):edit('skills.'+key+'.rank',rank>=wanted,'checkbox',2,{rank:wanted,currentRank:data.skills[key].rank});}
  if((m=/^Proficiency (Armor (Light|Medium|Heavy)|Shields|Weapon (Simple|Martial))$/.exec(id))){const name=m[2]?m[2]+' armor':m[3]?m[3]+' weapons':'shields';return computed(m[2]?!!context.armorTraining?.(m[2].toLowerCase()):(d.effects.proficiencies||[]).some(p=>p.toLowerCase()===name.toLowerCase()),{kind:'checkbox',command:'origins',reason:'Training from the shared class, feat and origin choices.'});}
  if(id==='Proficiency Weapon Other')return computed(!!context.otherWeapons?.length,{kind:'checkbox',reason:'Individual weapon training from the shared class, feat and origin choices.'});
  if(id==='Proficiency Weapon Other Description')return computed((context.otherWeapons||[]).join(', '),{command:'origins'});
  if(id==='MoreProficiencies'){const languages=d.effects.languages||[],tools=context.toolNames||[];return computed([...languages.slice(6),...lines(data.languages).slice(Math.max(0,6-languages.length)),...tools.slice(6),...lines(data.proficiencies).slice(Math.max(0,6-tools.length))].join('\n'),{kind:'textarea',command:'origins'});}
  if(id==='HP Max')return computed(d.hpMax,{command:'hp'});
  if(id==='Proficiency Bonus')return computed(sign(d.pb));
  if(id==='AC')return computed(d.ac,{command:'equipment'});
  if(id.startsWith('AC ')||id==='Medium Armor'||id==='Heavy Armor'||id==='Stealth Disadv.alphabeta'){
   const gear=d.gear,armor=gear.entries.find(row=>row.active&&row.mechanics.kind==='armor'),shield=gear.entries.find(row=>row.active&&row.mechanics.kind==='shield'),parts=gear.baseParts;
   if(id==='AC Armor Description'||id==='AC Shield Bonus Description'){const kind=id==='AC Armor Description'?'armor':'shield',worn=kind==='armor'?armor:shield;return{state:'editable',kind:'text',value:worn?.item.name||'',max:200,choices:context.equipmentNames?.(kind)||[],namedEquipment:{kind},command:'equipment',reason:'Type an equipment name, including +1/+2/+3. Existing owned gear is reused; new recognized names become personal gear.'};}
   if(id==='Medium Armor'||id==='Heavy Armor')return computed(armor?.profile?.group===(id==='Medium Armor'?'medium':'heavy'),{kind:'checkbox',command:'equipment'});
   const values={'AC Armor Bonus':parts?.armor??gear.base,'AC Shield Bonus':gear.shield,'AC Dexterity Modifier':parts?.dex??'','AC Magic':gear.bonus,'AC Misc Mod 1':gear.defense+gear.adjustment,'AC Misc Mod 2':parts?.other??0,'AC Shield Bonus Description':shield?.item.name||'','AC Magic Description':gear.sources.map(row=>row.name).join(', '),'AC Misc Mod 1 Description':gear.defense?'Defense':'','AC Misc Mod 2 Description':parts?.otherLabel||'','Stealth Disadv.alphabeta':gear.warnings.some(w=>/disadvantage on Stealth/.test(w))?'Disadv.':''};
   if(Object.hasOwn(values,id))return computed(values[id],{command:'equipment',reason:'Uses the same selected armor formula, equipment and bonuses as the shared Armor Class total.'});
  }
  if(id==='Initiative bonus')return computed(sign(d.initiative));
  if(id==='Passive Perception')return computed(d.passive);
  if(id==='Speed')return computed((d.effects.speed||0)+' ft');
  if(id==='Vision')return computed([d.effects.darkvision?'Darkvision '+d.effects.darkvision+' ft':'',...(d.effects.specialSenses||[]).map(s=>s.name+': '+s.detail)].filter(Boolean).join('\n'),{kind:'textarea'});
  if(id==='Saving Throw advantages / disadvantages')return computed([data.conditions,...(d.saveTraining?.reports||[]).map(r=>r.detail)].filter(Boolean).join('\n'),{kind:'textarea',command:'conditions'});
  if(id==='Spell save DC 1')return computed(d.spellDC);
  if(id==='Spell DC 1 Mod'||id==='Spell DC 1 Mod #2')return edit('spellAbility',data.spellAbility,'select',undefined,{options:Object.entries(abilities).map(([name,value])=>({value,label:name}))});
  if(id==='Spell save DC 2')return computed(context.secondaryDCStats?.dc??'',{hidden:!secondDC,reason:'Second ability save DC from the shared casting calculation.'});
  if(id==='Spell DC 2 Mod')return edit('adobe.paperCombat.secondaryDC.ability',data.adobe?.paperCombat?.secondaryDC?.ability||'int','select',undefined,{hidden:!secondDC,options:Object.entries(abilities).map(([name,value])=>({value,label:name}))});
  if((m=/^Death Save (Success|Fail)([123])$/.exec(id))){const path=m[1]==='Success'?'deathSuccess':'deathFailure',index=Number(m[2]);return edit(path,data[path]>=index,'checkbox',3,{count:index});}
  if((m=/^Resistance Damage Type ([1-6])$/.exec(id))){const auto=d.effects.resistances||[],i=Number(m[1])-1,manual=lines(data.resistances);return i<auto.length?computed(auto[i]):edit('resistances',manual[i-auto.length]||'','text',12000,{listIndex:i-auto.length});}
  if((m=/^(Language|Tool) ([1-6])$/.exec(id))){const automatic=m[1]==='Language'?d.effects.languages:context.toolNames||(d.toolTraining?.tools||[]).map(t=>t.name),i=Number(m[2])-1,path=m[1]==='Language'?'languages':'proficiencies',manual=lines(data[path]);return i<automatic.length?computed(automatic[i]):edit(path,manual[i-automatic.length]||'','text',12000,{listIndex:i-automatic.length});}
  if(id==='Size Category')return computed(d.effects.race?.size||data.profile.size);
  if(id==='Class Features')return computed([...(d.progression.classLevels||[]).flatMap(c=>context.features?.(c)||[]),data.features].filter(Boolean).join('\n\n'),{kind:'textarea',command:'features'});
  if(id==='Racial Traits')return computed([...(d.effects.race?.traits||[]),...(d.effects.specialSenses||[]).map(s=>s.name+': '+s.detail)].join('\n\n'),{kind:'textarea'});
  if(id==='Background Feature')return computed(context.background?.feature?.name||context.background?.featureName||'',{command:'background'});
  if(id==='Background Feature Description')return computed(typeof context.background?.feature==='string'?context.background.feature:context.background?.feature?.description||'',{kind:'textarea'});
  if((m=/^Extra\.Magic Item(?: (Note|Attuned|Description))? ([1-9]|1[0-2])$/.exec(id))){const row=context.magicItems?.[(context.magicOffset||0)+Number(m[2])-1],key=m[1];if(!key)return row?{state:'editable',kind:'select',value:row.id,magicSlot:(context.magicOffset||0)+Number(m[2])-1,requiredChoice:true,options:(context.magicItems||[]).map(item=>({value:item.id,label:item.name}))}:computed('',{kind:'select',reason:'Add carried magic items using the shared Inventory controls.'});if(key==='Attuned')return row?.requiresAttunement?{state:'editable',kind:'checkbox',value:!!row.attuned,attunementId:row.id}:computed(false,{kind:'checkbox',reason:'This item does not require attunement.'});return computed(!row?'':key==='Description'?row.description:key==='Note'?row.note:row.name,{kind:key==='Description'?'textarea':'text',command:'equipment',itemId:row?.id});}
  if(id==='Weight Carried'){const weight=context.inventoryWeight;return computed(weight?weight.total.toFixed(2)+(weight.unknown?' + ?':''):'',{command:'equipment',reason:weight?.unknown?weight.unknown+' carried items have unknown weight; the shown total excludes them.':'Carried gear plus coin weight from the shared Inventory calculation.'});}
  if(id.startsWith('Display.Weighttxt.LbKg'))return computed('lb');
  if(id==='Extra.Notes'){const page=context.pageId==='template-ASfront'?(context.extraPage||0)+1:0,journalId='adobe-equipment-notes-'+page,note=data.adobe?.journal?.find(note=>note.id===journalId);return {state:'editable',kind:'textarea',value:note?.text||'',journalId,journalTitle:page?'Equipment continuation notes '+page:'Equipment notes',max:20000};}
  if(context.hitDiceOverflow&&(id==='Notes.Left'||id==='Notes.Right'))return computed(id==='Notes.Left'?'HIT DICE — ALL CLASS POOLS\n\n'+context.hitDiceText+'\n\nThe original character page has three hit-die rows. All four pools are preserved. Used counters do not automatically heal HP.':'',{kind:'textarea'});
  if(id==='Notes.Left'||id==='Notes.Right'){const source=(context.notesOffset||0)+(id==='Notes.Right'?1:0),all=data.adobe?.journal||[],notes=all.filter(note=>!/^adobe-equipment-notes-\d+$/.test(note.id)),note=notes[source],index=note?all.indexOf(note):all.length+Math.max(0,source-notes.length);return {state:'editable',kind:'textarea',value:note?.text||'',journalIndex:index,max:20000};}
  if((m=/^HD([123]) (Level|Die|Used)$/.exec(id))){const row=context.hitDiceRows?.[Number(m[1])-1];if(!row)return computed('',{command:'paperCombat'});if(m[2]==='Used')return {state:'editable',kind:'number',value:row.used,max:row.count,hitDiceEdit:row.die,reason:'Spent hit dice in the combined d'+row.die+' class pool. This counter does not roll dice or heal HP.'};return computed(m[2]==='Level'?row.count:'d'+row.die,{command:'paperCombat'});}
  if((m=/^Limited Feature (?:Max Usages |Used |Recovery )?([1-9]|1[0-6])$/.exec(id))){const row=(context.resources||d.classResources)?.[Number(m[1])-1];return computed(!row?'':id.startsWith('Limited Feature Max')?row.unlimited?'∞':row.max:id.startsWith('Limited Feature Used')?row.used:id.startsWith('Limited Feature Recovery')?row.recovery:row.name,{command:'resources'});}
  if((m=/^Attack\.([1-5])\.(Weapon Selection|Proficiency|Range|To Hit|Damage|Damage Type|Description|Mod)$/.exec(id))){const index=Number(m[1])-1,rows=context.paperAttackRows||[...(d.gear.attacks||[]).filter(a=>a.equipped).map(a=>({...a,hit:a.attack===null?'—':sign(a.attack)})),...data.attacks.map((a,i)=>({...a,hit:sign(d.attacks[i])})),...(d.actions||[])],row=rows[index],part=m[2],key={'Weapon Selection':'name',Proficiency:'proficient',Range:'range','To Hit':'hit',Damage:'damage','Damage Type':'damageType',Description:'notes',Mod:'ability'}[part];
   if(part==='Weapon Selection')return{state:'editable',kind:'text',value:row?.name||'',max:200,choices:context.equipmentNames?.('weapon')||[],namedEquipment:{kind:'weapon',slot:index},command:'attacks',reason:'Type a weapon name, including +1/+2/+3, or choose an existing attack. The shared equipment engine supplies proficiency, range, to hit and damage.'};
   if(part==='Proficiency'&&row?.origin==='gear')return{state:'editable',kind:'checkbox',value:!!row.proficient,gearChoice:{id:row.entryId,key:'proficiency'}};
   if(part==='Proficiency'&&row?.origin==='manual')return edit('attacks.'+row.index+'.proficient',row.proficient,'checkbox');
   if(part==='Mod'){const options=[{value:'auto',label:'Auto'},...Object.entries(abilities).map(([label,value])=>({value,label}))];if(row?.origin==='gear')return{state:'editable',kind:'select',value:row.abilityChoice||'auto',options,gearChoice:{id:row.entryId,key:'ability'}};if(row?.origin==='manual'||row?.origin==='action')return edit((row.origin==='manual'?'attacks.':'actions.')+row.index+'.ability',row.ability,'select',undefined,{options});return computed(row?.ability||'',{kind:'select',options,command:'attacks'});}
   return computed(key==='proficient'?!!row?.proficient:Array.isArray(row?.[key])?row[key].join('\n'):row?.[key]??'',{kind:key==='proficient'?'checkbox':'text',command:'attacks'});
  }
  if((m=/^(Adventuring Gear|Extra\.Gear) (Row|Amount|Weight) (\d+)$/.exec(id))){const offset=m[1]==='Extra.Gear'?(context.extraGearOffset??54):0,row=context.inventory?.[offset+Number(m[3])-1];return computed(!row?'':m[2]==='Row'?row.name:m[2]==='Amount'?row.quantity:row.weight??'',{command:'equipment',itemId:row?.id});}
  return {state:'pending',value:'',kind:typeof field==='object'?field.kind:'text',reason:'This PDF field is still being connected.'};
 }
 function planEdit(field,value,context){
  const d=describe(field,context);if(d.state!=='editable'||d.hidden)throw Error('This field is calculated or is not connected.');
  if(d.kind==='checkbox'){if(typeof value!=='boolean')throw Error('Choose checked or unchecked.');if(d.rank)return {...d,value:value?d.rank:d.rank===2?Math.min(d.currentRank,1):0};if(d.count)return {...d,value:value?d.count:d.count-1};return {...d,value};}
  if(d.kind==='number'){if(String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<(d.min??0)||Number(value)>(d.max??1000000))throw Error('Enter a whole number from '+(d.min??0)+' to '+(d.max??1000000)+'.');return {...d,value:Number(value)};}
  value=String(value??'');if(value.length>(d.max??12000))throw Error('This text is too long.');
  if(d.requiredChoice&&!value)throw Error(d.choiceMessage||'Choose a carried magic item.');
  if(d.kind==='select'&&value&&!d.options.some(o=>o.value===value&&!o.disabled))throw Error('Choose an available option.');
  if(d.listIndex!==undefined){const current=lines(get(context.data,d.path));current[d.listIndex]=value;value=current.filter(Boolean).join('; ');}
  return {...d,value};
 }
 return {describe,planEdit};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterAdobeFields=CharacterAdobeFields;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobeFields;
