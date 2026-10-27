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
  if(Object.hasOwn(raw,id)){const [path,kind,max]=raw[id],value=get(path.startsWith('identity.')?{identity}:data,path);return edit(path,value,kind,max,{options:options[path]||[]});}
  let m;
  if(id==='Character Level')return data.adobe?.useExperience?computed(d.progression.targetLevel):edit('identity.level',identity.level,'number',20,{min:1});
  if(id==='Class and Levels')return computed((d.progression?.classLevels||[]).map(c=>(context.className?.(c.classId)||c.classId)+' '+c.level).join(' / '),{command:'classes'});
  if(id==='Race')return edit('build.race',data.build.race,'select',undefined,{options:options.races||[]});
  if(id==='Background')return edit('build.background',data.build.background,'select',undefined,{options:options.backgrounds||[]});
  if(Object.hasOwn(abilities,id))return computed(d.scores[abilities[id]],{command:'abilities'});
  if((m=/^(Str|Dex|Con|Int|Wis|Cha) Mod$/.exec(id)))return computed(sign(d.mods[abilities[m[1]]]));
  if((m=/^(Str|Dex|Con|Int|Wis|Cha) ST Mod$/.exec(id)))return computed(sign(d.saves[abilities[m[1]]]));
  if((m=/^(Str|Dex|Con|Int|Wis|Cha) ST Prof$/.exec(id))){const key=abilities[m[1]],automatic=d.effects.saves.includes(key);return automatic?computed(true,{kind:'checkbox',reason:'Granted by class or character choices.'}):edit('saves.'+key+'.proficient',data.saves[key].proficient,'checkbox');}
  if(Object.hasOwn(skills,id))return computed(sign(d.skills[skills[id]]));
  if((m=/^(Acr|Ani|Arc|Ath|Dec|His|Ins|Inti|Inv|Med|Nat|Perc|Perf|Pers|Rel|Sle|Ste|Sur) (Prof|Exp)$/.exec(id))){const key=skills[m[1]],auto=Math.max(d.effects.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0,d.classExpertise?.skills.includes(key)?2:0),rank=Math.max(data.skills[key].rank,auto),wanted=m[2]==='Exp'?2:1;return auto>=wanted?computed(true,{kind:'checkbox',reason:'Granted by class, feat or character choices.'}):edit('skills.'+key+'.rank',rank>=wanted,'checkbox',2,{rank:wanted,currentRank:data.skills[key].rank});}
  if(id==='HP Max')return computed(d.hpMax,{command:'hp'});
  if(id==='Proficiency Bonus')return computed(sign(d.pb));
  if(id==='AC')return computed(d.ac,{command:'equipment'});
  if(id==='Initiative bonus')return computed(sign(d.initiative));
  if(id==='Passive Perception')return computed(d.passive);
  if(id==='Speed')return computed((d.effects.speed||0)+' ft');
  if(id==='Vision')return computed([d.effects.darkvision?'Darkvision '+d.effects.darkvision+' ft':'',...(d.effects.specialSenses||[]).map(s=>s.name+': '+s.detail)].filter(Boolean).join('\n'),{kind:'textarea'});
  if(id==='Saving Throw advantages / disadvantages')return computed([data.conditions,...(d.saveTraining?.reports||[]).map(r=>r.detail)].filter(Boolean).join('\n'),{kind:'textarea',command:'conditions'});
  if(id==='Spell save DC 1')return computed(d.spellDC);
  if(id==='Spell DC 1 Mod')return edit('spellAbility',data.spellAbility,'select',undefined,{options:Object.entries(abilities).map(([name,value])=>({value,label:name}))});
  if((m=/^Death Save (Success|Fail)([123])$/.exec(id))){const path=m[1]==='Success'?'deathSuccess':'deathFailure',index=Number(m[2]);return edit(path,data[path]>=index,'checkbox',3,{count:index});}
  if((m=/^Resistance Damage Type ([1-6])$/.exec(id))){const auto=d.effects.resistances||[],i=Number(m[1])-1,manual=lines(data.resistances);return i<auto.length?computed(auto[i]):edit('resistances',manual[i-auto.length]||'','text',12000,{listIndex:i-auto.length});}
  if((m=/^(Language|Tool) ([1-6])$/.exec(id))){const automatic=m[1]==='Language'?d.effects.languages:(d.toolTraining?.tools||[]).map(t=>t.name),i=Number(m[2])-1,path=m[1]==='Language'?'languages':'proficiencies',manual=lines(data[path]);return i<automatic.length?computed(automatic[i]):edit(path,manual[i-automatic.length]||'','text',12000,{listIndex:i-automatic.length});}
  if(id==='Size Category')return computed(d.effects.race?.size||data.profile.size);
  if(id==='Class Features')return computed([...(d.progression.classLevels||[]).flatMap(c=>context.features?.(c)||[]),data.features].filter(Boolean).join('\n\n'),{kind:'textarea',command:'features'});
  if(id==='Racial Traits')return computed([...(d.effects.race?.traits||[]),...(d.effects.specialSenses||[]).map(s=>s.name+': '+s.detail)].join('\n\n'),{kind:'textarea'});
  if(id==='Background Feature')return computed(context.background?.feature?.name||context.background?.featureName||'',{command:'background'});
  if(id==='Background Feature Description')return computed(typeof context.background?.feature==='string'?context.background.feature:context.background?.feature?.description||'',{kind:'textarea'});
  if(id==='Notes.Left'||id==='Notes.Right'){const index=(context.notesOffset||0)+(id==='Notes.Right'?1:0),note=data.adobe?.journal?.[index];return {state:'editable',kind:'textarea',value:note?.text||'',journalIndex:index,max:20000};}
  if((m=/^HD([123]) (Level|Die)$/.exec(id))){const row=d.progression.classLevels[Number(m[1])-1];return computed(row?m[2]==='Level'?row.level:context.hitDie?.(row.classId)||'':'');}
  if((m=/^Limited Feature (?:Max Usages |Used |Recovery )?([1-8])$/.exec(id))){const row=d.classResources?.[Number(m[1])-1];return computed(!row?'':id.startsWith('Limited Feature Max')?row.unlimited?'∞':row.max:id.startsWith('Limited Feature Used')?row.used:id.startsWith('Limited Feature Recovery')?row.recovery:row.name,{command:'resources'});}
  if((m=/^Attack\.([1-5])\.(Weapon Selection|Range|To Hit|Damage|Damage Type|Description|Mod)$/.exec(id))){const rows=[...(d.gear.attacks||[]).filter(a=>a.equipped).map(a=>({name:a.name,range:a.range,hit:a.attack===null?'—':sign(a.attack),damage:a.damage,notes:a.notes})),...(d.actions||[])],row=rows[Number(m[1])-1],key={'Weapon Selection':'name','Range':'range','To Hit':'hit','Damage':'damage','Damage Type':'damageType','Description':'notes','Mod':'ability'}[m[2]];return computed(Array.isArray(row?.[key])?row[key].join('\n'):row?.[key]||'',{command:'attacks'});}
  if((m=/^(Adventuring Gear|Extra\.Gear) (Row|Amount|Weight) (\d+)$/.exec(id))){const offset=m[1]==='Extra.Gear'?54:0,row=context.inventory?.[offset+Number(m[3])-1];return computed(!row?'':m[2]==='Row'?row.name:m[2]==='Amount'?row.quantity:row.weight??'',{command:'equipment'});}
  return {state:'pending',value:'',kind:typeof field==='object'?field.kind:'text',reason:'This PDF field is still being connected.'};
 }
 function planEdit(field,value,context){
  const d=describe(field,context);if(d.state!=='editable')throw Error('This field is calculated or is not connected.');
  if(d.kind==='checkbox'){if(typeof value!=='boolean')throw Error('Choose checked or unchecked.');if(d.rank)return {...d,value:value?d.rank:0};if(d.count)return {...d,value:value?d.count:d.count-1};return {...d,value};}
  if(d.kind==='number'){if(String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<(d.min??0)||Number(value)>(d.max??1000000))throw Error('Enter a whole number from '+(d.min??0)+' to '+(d.max??1000000)+'.');return {...d,value:Number(value)};}
  value=String(value??'');if(value.length>(d.max??12000))throw Error('This text is too long.');
  if(d.kind==='select'&&value&&!d.options.some(o=>o.value===value&&!o.disabled))throw Error('Choose an available option.');
  if(d.listIndex!==undefined){const current=lines(get(context.data,d.path));current[d.listIndex]=value;value=current.filter(Boolean).join('; ');}
  return {...d,value};
 }
 return {describe,planEdit};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterAdobeFields=CharacterAdobeFields;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobeFields;
