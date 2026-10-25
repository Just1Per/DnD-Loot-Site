'use strict';
/* Data-driven choices unlocked by class/subclass features.
 * Structured option names, levels and prerequisites only; long source prose stays in source books. */
var CharacterClassFeatureChoices=(()=>{
  const safe=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
  const option=(name,extra={})=>({id:safe(name),name,...extra});
  const groupKey=(edition,classId,id)=>[edition,classId,id].map(safe).join(':');
  const pickTable=(rows,level)=>{let n=0;for(const [at,count] of rows)if(level>=at)n=count;return n};
  const invocationProgression=Object.freeze({
    '2014':Object.freeze([0,0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8]),
    '2024':Object.freeze([0,1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10])
  });
  const invocationLimit=(level,edition='2014')=>invocationProgression[edition==='2024'?'2024':'2014'][Math.max(0,Math.min(20,Math.trunc(Number(level)||0)))];

  const fighter2014=[
    'Archery','Defense','Dueling','Great Weapon Fighting','Protection','Two-Weapon Fighting'
  ].map(name=>option(name,{source:'PHB 2014',referenceComplete:true,automationComplete:['Archery','Defense','Dueling','Two-Weapon Fighting'].includes(name)}));
  function fighter2024(){
    const defs=globalThis.CharacterFeatData||(typeof require==='function'?require('./character-feat-data'):{}),refs=(globalThis.CharacterFeatReference||(typeof require==='function'?require('./character-feat-reference'):{})).records||{};
    const rows=Object.entries(defs).filter(([id,def])=>{
      const ref=refs[(def.source||'')+'|'+(def.name||'')];
      return def?.edition==='2024'&&ref?.category==='FS';
    }).map(([id,def])=>option(def.name,{source:def.source||'2024',featId:id,referenceComplete:true,automationComplete:['Archery','Defense','Dueling','Two-Weapon Fighting'].includes(def.name)}));
    const seen=new Set();
    return rows.filter(row=>!seen.has(row.id)&&seen.add(row.id)).sort((a,b)=>a.name.localeCompare(b.name));
  }

  const inv2014=[
    option('Agonizing Blast',{requiresSpell:'eldritch blast'}),
    option('Armor of Shadows'),
    option('Ascendant Step',{minLevel:9}),
    option('Beast Speech'),
    option('Beguiling Influence'),
    option('Bewitching Whispers',{minLevel:7}),
    option('Book of Ancient Secrets',{requiresGroup:'pact-boon',requiresChoice:'pact-of-the-tome'}),
    option('Chains of Carceri',{minLevel:15,requiresGroup:'pact-boon',requiresChoice:'pact-of-the-chain'}),
    option("Devil's Sight"),
    option('Dreadful Word',{minLevel:7}),
    option('Eldritch Sight'),
    option('Eldritch Spear',{requiresSpell:'eldritch blast'}),
    option('Eyes of the Rune Keeper'),
    option('Fiendish Vigor'),
    option('Gaze of Two Minds'),
    option('Lifedrinker',{minLevel:12,requiresGroup:'pact-boon',requiresChoice:'pact-of-the-blade'}),
    option('Mask of Many Faces'),
    option('Master of Myriad Forms',{minLevel:15}),
    option('Minions of Chaos',{minLevel:9}),
    option('Mire the Mind',{minLevel:5}),
    option('Misty Visions'),
    option('One with Shadows',{minLevel:5}),
    option('Otherworldly Leap',{minLevel:9}),
    option('Repelling Blast',{requiresSpell:'eldritch blast'}),
    option('Sculptor of Flesh',{minLevel:7}),
    option('Sign of Ill Omen',{minLevel:5}),
    option('Thief of Five Fates'),
    option('Thirsting Blade',{minLevel:5,requiresGroup:'pact-boon',requiresChoice:'pact-of-the-blade'}),
    option('Visions of Distant Realms',{minLevel:15}),
    option('Voice of the Chain Master',{requiresGroup:'pact-boon',requiresChoice:'pact-of-the-chain'}),
    option('Whispers of the Grave',{minLevel:9}),
    option('Witch Sight',{minLevel:15})
  ].map(row=>({...row,source:'PHB 2014',referenceComplete:true,automationComplete:['agonizing-blast','eldritch-spear','devil-s-sight','witch-sight','eyes-of-the-rune-keeper','beguiling-influence'].includes(row.id)}));

  const inv2024=[
    option('Agonizing Blast',{minLevel:2,repeatable:true}),
    option('Armor of Shadows'),
    option('Ascendant Step',{minLevel:5}),
    option("Devil's Sight",{minLevel:2}),
    option('Devouring Blade',{minLevel:12,requiresInvocation:'thirsting-blade'}),
    option('Eldritch Mind'),
    option('Eldritch Smite',{minLevel:5,requiresInvocation:'pact-of-the-blade'}),
    option('Eldritch Spear',{minLevel:2,repeatable:true}),
    option('Fiendish Vigor',{minLevel:2}),
    option('Gaze of Two Minds',{minLevel:5}),
    option('Gift of the Depths',{minLevel:5}),
    option('Gift of the Protectors',{minLevel:9,requiresInvocation:'pact-of-the-tome'}),
    option('Investment of the Chain Master',{minLevel:5,requiresInvocation:'pact-of-the-chain'}),
    option('Lessons of the First Ones',{minLevel:2,manualPrereq:'choose an eligible Origin feat',repeatable:true}),
    option('Lifedrinker',{minLevel:9,requiresInvocation:'pact-of-the-blade'}),
    option('Mask of Many Faces',{minLevel:2}),
    option('Master of Myriad Forms',{minLevel:5}),
    option('Misty Visions',{minLevel:2}),
    option('One with Shadows',{minLevel:5}),
    option('Otherworldly Leap',{minLevel:2}),
    option('Pact of the Blade'),
    option('Pact of the Chain'),
    option('Pact of the Tome'),
    option('Repelling Blast',{minLevel:2,repeatable:true}),
    option('Thirsting Blade',{minLevel:5,requiresInvocation:'pact-of-the-blade'}),
    option('Visions of Distant Realms',{minLevel:9}),
    option('Whispers of the Grave',{minLevel:7}),
    option('Witch Sight',{minLevel:15})
  ].map(row=>({...row,source:'SRD 5.2.1',referenceComplete:true,automationComplete:['agonizing-blast','eldritch-spear','devil-s-sight','witch-sight','eldritch-mind'].includes(row.id)}));

  const subclassDefinitions={
    '2014':{
      'fighter:battle-master':[{
        id:'maneuvers',name:'Battle Master Maneuvers',minLevel:3,
        count:l=>pickTable([[3,3],[7,5],[10,7],[15,9]],l),
        options:()=>[
          "Commander's Strike",'Disarming Attack','Distracting Strike','Evasive Footwork','Feinting Attack','Goading Attack','Lunging Attack','Maneuvering Attack','Menacing Attack','Parry','Precision Attack','Pushing Attack','Rally','Riposte','Sweeping Attack','Trip Attack'
        ].map(name=>option(name,{source:'PHB 2014',referenceComplete:true,automationComplete:false})),
        referenceComplete:true
      }]
    },
    '2024':{}
  };

  const definitions={
    '2014':{
      fighter:[{id:'fighting-style',name:'Fighting Style',minLevel:1,count:()=>1,options:()=>fighter2014,referenceComplete:true}],
      warlock:[
        {id:'eldritch-invocations',name:'Eldritch Invocations',minLevel:2,count:l=>invocationLimit(l,'2014'),options:()=>inv2014,referenceComplete:true},
        {id:'pact-boon',name:'Pact Boon',minLevel:3,count:()=>1,options:()=>[
          option('Pact of the Blade',{source:'PHB 2014',referenceComplete:true,automationComplete:false}),
          option('Pact of the Chain',{source:'PHB 2014',referenceComplete:true,automationComplete:false}),
          option('Pact of the Tome',{source:'PHB 2014',referenceComplete:true,automationComplete:false})
        ],referenceComplete:true}
      ]
    },
    '2024':{
      fighter:[{id:'fighting-style',name:'Fighting Style',minLevel:1,count:()=>1,options:fighter2024,referenceComplete:true}],
      warlock:[{id:'eldritch-invocations',name:'Eldritch Invocations',minLevel:1,count:l=>invocationLimit(l,'2024'),options:()=>inv2024,referenceComplete:true}]
    }
  };

  const metamagicOptions=Object.freeze({
    'careful-spell':['Careful Spell',1,'Choose creatures up to Charisma (minimum one) to succeed on the spell’s save.'],
    'distant-spell':['Distant Spell',1,'Double a range of at least 5 feet; a Touch spell reaches 30 feet.'],
    'empowered-spell':['Empowered Spell',1,'Reroll damage dice up to Charisma (minimum one); keep the new rolls. Can combine with another Metamagic.'],
    'extended-spell':['Extended Spell',1,'Double a duration of at least 1 minute, to a maximum of 24 hours.'],
    'heightened-spell':['Heightened Spell',3,'One target has disadvantage on its first save against this spell.'],
    'quickened-spell':['Quickened Spell',2,'Change an Action casting time to a Bonus Action. Other spells this turn must be cantrips with an Action casting time.'],
    'subtle-spell':['Subtle Spell',1,'Cast without Verbal or Somatic components. Material components still apply.'],
    'twinned-spell':['Twinned Spell',null,'One eligible single-target spell targets a second creature. Cost equals spell level, minimum one.'],
    'seeking-spell':['Seeking Spell',2,'Reroll a missed spell attack; keep the new roll. Can combine with another Metamagic.'],
    'transmuted-spell':['Transmuted Spell',1,'Change Acid, Cold, Fire, Lightning, Poison or Thunder spell damage to another of those types.']
  });
  function metamagicChoices(edition){return Object.entries(metamagicOptions).map(([id,[name,cost,detail]])=>{
    if(edition==='2024'){
      if(id==='careful-spell')detail+=' Protected creatures take no damage if the successful save would normally halve it.';
      if(id==='extended-spell')detail+=' Gain advantage on saves to maintain this spell’s Concentration.';
      if(id==='heightened-spell'){cost=2;detail='One target has disadvantage on saves against this spell.';}
      if(id==='seeking-spell')cost=1;
      if(id==='quickened-spell')detail='Change an Action casting time to a Bonus Action. Cannot use this after casting a level 1+ spell this turn, and cannot cast one after using it until the turn ends.';
      if(id==='subtle-spell')detail='Ignore Verbal, Somatic and Material components, except consumed components or those with a listed cost.';
      if(id==='twinned-spell'){cost=1;detail='An eligible spell that can target additional creatures at higher slot levels gains one effective spell level. The slot itself is unchanged.';}
    }
    return option(name,{id,cost,detail,source:edition==='2024'?'XPHB':['seeking-spell','transmuted-spell'].includes(id)?'TCE':'PHB',edition,referenceComplete:true,automationComplete:false});
  });}
  for(const edition of ['2014','2024'])definitions[edition].sorcerer=[{id:'metamagic',name:'Metamagic',minLevel:edition==='2024'?2:3,count:l=>l>=17?(edition==='2024'?6:4):l>=10?(edition==='2024'?4:3):2,options:()=>metamagicChoices(edition),referenceComplete:true}];
  const restorationSpent=(choices,key)=>!!choices[key]?.[0]&&choices[key][0]!=='0';
  function sorcererLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='sorcerer'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function metamagic(data,{level=1,mods={}}={}){
    const actual=sorcererLevels(data,level),edition=data.build?.edition==='2024'?'2024':'2014',entry={classId:'sorcerer',level:actual},stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},group=status({...data,adobe:stored},entry,edition).find(row=>row.id==='metamagic');
    return(group?.valid||[]).map(id=>{const row=group.options.find(row=>row.id===id),limit=Number.isFinite(mods.cha)&&['careful-spell','empowered-spell'].includes(id)?Math.max(1,Math.trunc(mods.cha)):null;return{...row,...(limit!==null?{limit,detail:row.detail+' Current limit: '+limit+(id==='careful-spell'?' creatures.':' damage dice.')}: {})};});
  }
  function spendMetamagic(data,id,spellLevel,context={}){
    const choice=metamagic(data,context).find(row=>row.id===id),resource=classResources(data,context).find(row=>row.id==='sorcery-points');if(!choice||!resource)return false;
    if(choice.cost===null&&(!Number.isInteger(spellLevel)||spellLevel<0||spellLevel>9))return false;
    const cost=choice.cost===null?Math.max(1,spellLevel):choice.cost;if(resource.remaining<cost)return false;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{};data.adobe={...stored,classFeatureChoices:{...normalize(stored.classFeatureChoices),[resource.key]:[String(Math.min(resource.used,resource.max)+cost)]}};return true;
  }

  definitions['2024'].cleric=[{id:'divine-order',name:'Divine Order',minLevel:1,count:()=>1,referenceComplete:true,options:()=>[
    option('Protector',{source:'SRD 5.2.1',referenceComplete:true,automationComplete:true,detail:'Martial weapon proficiency and Heavy armor training.'}),
    option('Thaumaturge',{source:'SRD 5.2.1',referenceComplete:true,automationComplete:true,detail:'One extra Cleric cantrip. Add Wisdom (minimum +1) to Intelligence (Arcana and Religion) checks.'})
  ]}];
  definitions['2024'].druid=[{id:'primal-order',name:'Primal Order',minLevel:1,count:()=>1,referenceComplete:true,options:()=>[
    option('Magician',{source:'SRD 5.2.1',referenceComplete:true,automationComplete:true,detail:'One extra Druid cantrip. Add Wisdom (minimum +1) to Intelligence (Arcana and Nature) checks.'}),
    option('Warden',{source:'SRD 5.2.1',referenceComplete:true,automationComplete:true,detail:'Martial weapon proficiency and Medium armor training.'})
  ]}];
  function orders(data,{level=1}={}){
    const result={reports:[],proficiencies:[],cantrips:{}};if(data.build?.edition!=='2024')return result;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}],choices=normalize(stored.classFeatureChoices),seen=new Set();let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    for(const entry of entries){const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=actual;if(!actual||seen.has(entry.classId))continue;seen.add(entry.classId);
      const classId=entry.classId,id=classId==='cleric'?'divine-order':classId==='druid'?'primal-order':'';if(!id)continue;
      const key=groupKey('2024',classId,id),def=definitions['2024'][classId][0],selected=choices[key]?.[0],choice=def.options().find(row=>row.id===selected);if(!choice)continue;
      const magical=selected==='thaumaturge'||selected==='magician',skills=magical?['arcana',classId==='cleric'?'religion':'nature']:[];
      if(magical)result.cantrips[classId]=1;else result.proficiencies.push('Martial weapons',classId==='cleric'?'Heavy armor':'Medium armor');
      result.reports.push({id,key,classId,name:def.name,choice:choice.name,detail:choice.detail,skills});
    }
    result.proficiencies=[...new Set(result.proficiencies)];return result;
  }

  for(const edition of ['2014','2024'])for(const classId of ['paladin','ranger']){
    const names=classId==='paladin'?['Defense','Dueling','Great Weapon Fighting','Protection']:['Archery','Defense','Dueling','Two-Weapon Fighting'];
    definitions[edition][classId]=[{id:'fighting-style',name:'Fighting Style',minLevel:2,count:()=>1,options:()=>edition==='2024'?fighter2024():fighter2014.filter(o=>names.includes(o.name)),referenceComplete:true}];
  }
  // Class controls and the legacy Feats picker spend one shared allowance.
  // Reading this state never migrates or deletes saved selections.
  function fightingStyleState(data,{level,catalog}={}){
    const edition=data?.build?.edition||'2014',stored=data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{};
    const raw=stored.classLevels?.length?stored.classLevels:[{classId:data?.build?.classId,level:level||1}];
    let remaining=level===undefined?20:Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    const seenClasses=new Set(),seenStyles=new Set(),rows=[],slots=[];let total=0;
    const choices=normalize(stored.classFeatureChoices);
    for(const entry of raw){
      const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=actual;
      if(!actual||seenClasses.has(entry.classId))continue;seenClasses.add(entry.classId);
      for(const group of groups({...entry,level:actual},edition).filter(g=>g.id==='fighting-style')){
        total+=group.allowed;slots.push(group);
        for(const id of (choices[group.key]||[]).slice(0,group.allowed)){
          const option=group.options.find(o=>o.id===id);
          if(option&&!seenStyles.has(option.id)){seenStyles.add(option.id);rows.push({key:group.key,option});}
        }
      }
    }
    catalog||=globalThis.CharacterCatalog?.rawData?.feats||(typeof require==='function'?require('../../data/rules/catalog.json').feats:[]);
    const legacy=[],aliases=[];
    for(const id of data?.rulesChoices?.feats||[]){
      const feat=catalog.find(f=>f.id===id);if(feat?.category!=='FS')continue;
      const identity=safe(feat.name);
      if(seenStyles.has(identity)){aliases.push(id);continue;}
      seenStyles.add(identity);legacy.push(id);
    }
    const used=rows.length+legacy.length,legacyGroups={};
    for(const id of legacy){const slot=slots.find(group=>!legacyGroups[group.key]&&!(choices[group.key]||[]).some(Boolean)&&group.options.some(option=>option.featId===id));if(slot)legacyGroups[slot.key]=id;}
    return{total,rows,legacy,aliases,legacyGroups,remaining:Math.max(0,total-used),excess:Math.max(0,used-total)};
  }
  const artificerSourceKey=groupKey('2014','artificer','class-source');
  const artificerVersions=Object.freeze({
    tce:Object.freeze({id:'tce',name:'Artificer · Tasha’s Cauldron of Everything',label:'Legacy Artificer · Tasha’s',source:'TCE',sourceEdition:'2014'}),
    efa:Object.freeze({id:'efa',name:'Artificer · Eberron: Forge of the Artificer',label:'Artificer · Eberron: Forge of the Artificer',source:'EFOTA',sourceEdition:'2024'})
  });
  const artificerEfaSpellNames=new Set(["acid splash","aid","air bubble","alarm","alter self","animate objects","arcane eye","arcane lock","arcane vigor","bigby's hand","blink","blur","booming blade","catnap","circle of power","continual flame","create food and water","create spelljamming helm","creation","cure wounds","dancing lights","darkvision","detect magic","disguise self","dispel magic","distorted distance","dragon's breath","dueling ground","elemental weapon","elementalism","enhance ability","enlarge/reduce","expeditious retreat","fabricate","faerie fire","false life","feather fall","fire bolt","fly","freedom of movement","glyph of warding","grease","greater restoration","green-flame blade","guidance","haste","heat metal","homunculus servant","identify","intellect fortress","invisibility","jump","kinetic jaunt","leomund's secret chest","lesser restoration","levitate","light","lightning lure","linked glyphs","longstrider","mage hand","magic mouth","magic weapon","message","mordenkainen's faithful hound","mordenkainen's private sanctum","otiluke's resilient sphere","poison spray","prestidigitation","protection from energy","protection from poison","purify food and drink","ray of frost","resistance","revivify","rope trick","sanctuary","see invisibility","shocking grasp","spare the dying","spider climb","spirit lantern","stone shape","stoneskin","summon construct","sword burst","tasha's caustic brew","thorn whip","thunderclap","true strike","uncertain footing","vortex warp","wall of stone","water breathing","water walk","web"].map(safe)),artificerSpellCache=new WeakMap();
  function artificerSource(data){
    const stored=data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{},raw=normalize(stored.classFeatureChoices)[artificerSourceKey]?.[0],id=raw||'tce',source=Object.hasOwn(artificerVersions,id)?artificerVersions[id]:null;
    return source?{...source,eligible:id==='tce'||data.build?.edition==='2024',implicit:!raw}:{id,name:'Unavailable Artificer version',label:'Unavailable Artificer version',source:'',sourceEdition:'',eligible:false,implicit:false};
  }
  function setArtificerSource(data,id){
    const source=Object.hasOwn(artificerVersions,id)?artificerVersions[id]:null;if(!source||id==='efa'&&data.build?.edition!=='2024'||typeof CampaignRules!=='undefined'&&!CampaignRules.allowed({edition:source.sourceEdition,source:source.source}))return false;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},old=artificerSource(data),choices=normalize(stored.classFeatureChoices),entries=(stored.classLevels||[]).map(entry=>({...entry})),entry=entries.find(entry=>entry.classId==='artificer');
    if(entry?.subclassId){const row=globalThis.CharacterSubclassData?.find?.(entry.subclassId),owner=row?.edition==='2024'||/-efota$|-rthw$/.test(entry.subclassId)?'efa':row?.edition==='2014'||/-legacy$/.test(entry.subclassId)?'tce':old.id;choices[groupKey(owner==='efa'?'2024':'2014','artificer',owner+'-subclass')]=[entry.subclassId];}
    if(entry)entry.subclassId=choices[groupKey(id==='efa'?'2024':'2014','artificer',id+'-subclass')]?.[0]||'';
    const next={...choices,[artificerSourceKey]:[id]};if(Object.keys(next).length>100)return false;
    data.adobe={...stored,classLevels:entries,classFeatureChoices:next};return true;
  }
  function artificerSpellAllowed(spell,source,catalogue=[],edition=spell?.edition){
    if(!spell||!Object.hasOwn(artificerVersions,source))return false;const name=safe(spell.name);
    let cache=artificerSpellCache.get(catalogue);if(!cache){cache={legacy:new Set(),modern:new Set()};for(const row of catalogue){if(row.edition==='2014'&&(row.classesByEdition?.['2014']||row.classes||[]).includes('artificer'))cache.legacy.add(safe(row.name));if(row.edition==='2024')cache.modern.add(safe(row.name));}artificerSpellCache.set(catalogue,cache);}
    return (source==='tce'?cache.legacy:artificerEfaSpellNames).has(name)&&!(edition==='2024'&&spell.edition==='2014'&&cache.modern.has(name));
  }
  const artisanTools=['Alchemist’s supplies','Brewer’s supplies','Calligrapher’s supplies','Carpenter’s tools','Cartographer’s tools','Cobbler’s tools','Cook’s utensils','Glassblower’s tools','Jeweler’s tools','Leatherworker’s tools','Mason’s tools','Painter’s supplies','Potter’s tools','Smith’s tools','Weaver’s tools','Woodcarver’s tools'];
  for(const edition of ['2014','2024'])definitions[edition].artificer=[{id:'artisan-tool',name:'Artificer artisan tool',sourceLabel:'Legacy Artificer · Tasha’s',minLevel:1,count:()=>1,startingOnly:true,options:()=>artisanTools.map(name=>option(name,{proficiency:name,source:'TCE',edition:'2014',referenceComplete:true,automationComplete:true})),referenceComplete:true}];
  function artificerLevels(data,level=1){
    const stored=data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data?.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Number(level)||1)),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='artificer'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}
    return{level:actual,starting:entries[0]?.classId==='artificer'};
  }
  const artificerSkills={arcana:'Arcana',history:'History',investigation:'Investigation',medicine:'Medicine',nature:'Nature',perception:'Perception',sleightOfHand:'Sleight of Hand'};
  definitions['2024'].artificer.push({id:'multiclass-skill',name:'Artificer multiclass skill',minLevel:1,count:()=>1,multiclassOnly:true,artificerVersion:'efa',referenceComplete:true,options:()=>Object.entries(artificerSkills).map(([skill,name])=>option(name,{skill,source:'EFOTA',edition:'2024',referenceComplete:true,automationComplete:true}))});
  function artificerFeatures(data,{level=1,attunedCount=0}={}){
    const source=artificerSource(data),actual=artificerLevels(data,level),active=source.eligible&&actual.level>0,attuned=Math.max(0,Math.min(6,Math.trunc(Number(attunedCount)||0))),key=groupKey('2024','artificer','multiclass-skill'),value=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices)[key]?.[0],skill=Object.keys(artificerSkills).find(skill=>safe(artificerSkills[skill])===value);
    return{source,level:actual.level,active,starting:actual.starting,attuned,skills:active&&source.id==='efa'&&!actual.starting&&skill?[skill]:[],saveBonus:active&&source.id==='tce'&&actual.level>=20?attuned:0,soulOfArtifice:active&&source.id==='tce'&&actual.level>=20,flashShortRecovery:active&&source.id==='efa'?(actual.level>=20&&attuned>0?'all':actual.level>=14?1:0):0};
  }
  function artisanTool(data,level){
    const actual=artificerLevels(data,level);if(!actual.starting||!actual.level||!artificerSource(data).eligible)return '';
    const edition=data.build?.edition||'2014',key=groupKey(edition,'artificer','artisan-tool'),id=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices)[key]?.[0];
    return artisanTools.find(name=>safe(name)===id)||'';
  }
  function toolTraining(data,{level=1,effects={},mods={},classExpertise={}}={}){
    level=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    const actual=artificerLevels(data,level),source=artificerSource(data);if(!actual.level||!source.eligible)return{level:0,tools:[]};
    const rules=typeof CharacterRules!=='undefined'?CharacterRules:require('./character-rules'),choices=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices),proficiencies=[...(effects.proficiencies||[]),...String(data.proficiencies||'').split(/[,;\n]+/)];
    const pb=Math.ceil(level/4)+1,expertise=source.id==='tce'&&actual.level>=6;
    const tools=rules.tools.filter(name=>proficiencies.some(value=>safe(value)===safe(name))).map(name=>{const id=safe(name),key=groupKey(data.build?.edition||'2014','artificer','tool-check-'+id),raw=choices[key]?.[0],ability=['str','dex','con','int','wis','cha'].includes(raw)?raw:'',trainedExpertise=expertise||(classExpertise.tools||[]).some(tool=>safe(tool.name)===id),bonus=pb*(trainedExpertise?2:1);return{id,key,name,ability,bonus,expertise:trainedExpertise,total:ability?Number(mods[ability]||0)+bonus:null};});
    return{level:actual.level,tools};
  }
  function setToolAbility(data,id,ability,context){
    const tool=toolTraining(data,context).tools.find(tool=>tool.id===id);if(!tool||ability&&!['str','dex','con','int','wis','cha'].includes(ability))return false;
    data.adobe||={};data.adobe.classFeatureChoices={...normalize(data.adobe.classFeatureChoices),[tool.key]:[ability]};return true;
  }
  const flashKey=groupKey('2014','artificer','flash-of-genius-uses');
  function abilityFeatures(data,{level=1}={}){
    const edition=data.build?.edition==='2024'?'2024':'2014',stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}],reports=[],seen=new Set();let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    for(const entry of entries){const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=actual;if(!actual||seen.has(entry.classId))continue;seen.add(entry.classId);
      if(actual===20&&entry.classId==='barbarian')reports.push({id:'primal-champion',name:'Primal Champion',classId:'barbarian',edition,abilities:['str','con'],increase:4,max:edition==='2024'?25:24});
      if(actual===20&&entry.classId==='monk'&&edition==='2024')reports.push({id:'body-and-mind',name:'Body and Mind',classId:'monk',edition,abilities:['dex','wis'],increase:4,max:25});
    }
    return reports;
  }
  function monkLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='monk'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function fighterLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='fighter'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function bardLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='bard'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function rangerLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='ranger'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function paladinLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='paladin'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function wizardLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='wizard'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function arcaneRecovery(data,context={}){
    const level=context.level||1,actual=wizardLevels(data,level);if(!actual)return null;
    const edition=data.build?.edition==='2024'?'2024':'2014',stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},key=groupKey(edition,'wizard','arcane-recovery-used'),used=normalize(stored.classFeatureChoices)[key]?.[0];
    const model=globalThis.CharacterSheetModel||(typeof require==='function'?require('./character-sheet-model'):null),derived=context.slotMax?null:model?.derive(data,level,context.loot||[]),maxima=context.slotMax||derived?.effects.slotMax||[],pact=context.pact||derived?.progression?.pact,slots=[];
    for(let i=0;i<5;i++){const max=Math.max(0,Math.min(99,Math.trunc(Number(maxima[i])||0))),spent=Math.min(max,Math.max(0,Math.trunc(Number(data.slots?.[i]?.used)||0)));if(spent)slots.push({id:String(i+1),level:i+1,max,used:spent,label:'Level '+(i+1)+' · '+spent+' spent'});}
    if(pact?.count&&Number.isInteger(pact.slotLevel)&&pact.slotLevel>=1&&pact.slotLevel<=5){const max=Math.max(0,Math.min(4,Math.trunc(Number(pact.count)||0))),spent=Math.min(max,Math.max(0,Math.trunc(Number(stored.pactSlotsUsed)||0)));if(spent)slots.push({id:'pact',level:pact.slotLevel,max,used:spent,label:'Pact level '+pact.slotLevel+' · '+spent+' spent'});}
    return{level:actual,budget:Math.ceil(actual/2),edition,key,used:/^\d{1,3}$/.test(used||'')&&Number(used)>0,slots};
  }
  function restoreArcaneSlots(data,plan,context={}){
    const recovery=arcaneRecovery(data,context);if(!recovery||recovery.used||!plan||typeof plan!=='object'||Array.isArray(plan)||![Object.prototype,null].includes(Object.getPrototypeOf(plan)))return false;
    const selected=[];let cost=0;
    for(const [id,count]of Object.entries(plan)){const row=recovery.slots.find(row=>row.id===id);if(!Number.isInteger(count)||count<0||count>99||!row)return false;if(count){if(count>row.used)return false;cost+=count*row.level;selected.push({...row,count});}}
    if(!cost||cost>recovery.budget)return false;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},next={...stored,classFeatureChoices:{...normalize(stored.classFeatureChoices),[recovery.key]:['1']}};
    for(const row of selected){if(row.id==='pact')next.pactSlotsUsed=row.used-row.count;else{const index=Number(row.id)-1;data.slots[index]={...data.slots[index],max:row.max,used:row.used-row.count};}}
    data.adobe=next;return true;
  }
  function resetArcaneDay(data,context={}){
    if(data.build?.edition==='2024'||!wizardLevels(data,context.level||1))return false;const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},choices=normalize(stored.classFeatureChoices),key=groupKey('2014','wizard','arcane-recovery-used');if(!/^\d{1,3}$/.test(choices[key]?.[0]||'')||!Number(choices[key][0]))return false;data.adobe={...stored,classFeatureChoices:{...choices,[key]:['0']}};return true;
  }
  function rangerFeatures(data,{level=1,mods={}}={}){
    const actual=rangerLevels(data,level),modern=data.build?.edition==='2024',wis=Math.max(-5,Math.min(10,Math.trunc(Number(mods.wis)||0))),reports=[],senses=[];
    const die=modern&&actual>=20?'1d10':'1d6';
    if(modern&&actual>=13)reports.push({id:'relentless-hunter',name:'Relentless Hunter',detail:'Damage cannot break Concentration on your Hunter’s Mark. Other causes of losing Concentration still apply.'});
    if(modern&&actual>=17)reports.push({id:'precise-hunter',name:'Precise Hunter',detail:'Advantage on attack rolls against the creature currently marked by your Hunter’s Mark; other targets are unchanged.'});
    if(modern&&actual>=20)reports.push({id:'foe-slayer',name:'Foe Slayer',detail:'Your Hunter’s Mark damage die is 1d10 instead of 1d6.'});
    if(actual>=18)senses.push({id:'ranger-feral-senses',name:'Feral Senses',range:30,blindsight:modern,detail:modern?'Blindsight · 30 ft':'Attacking an unseen creature does not impose disadvantage for that reason. While you are not blinded or deafened, you know the location of non-hidden invisible creatures within 30 ft. This is not Blindsight.'});
    return{level:actual,edition:modern?'2024':'2014',active:actual>0,wis,huntersMarkDie:die,freeHunterMarks:modern&&actual?Math.ceil(actual/4)+1:0,blindsight:modern&&actual>=18?30:0,ignoreUnseenAttackDisadvantage:!modern&&actual>=18,reports,senses};
  }
  function huntersMarkEffect(data,spell,{level=1,features,slot=1}={}){
    if(!spell||String(spell.name||'').toLowerCase().replace(/[’‘]/g,"'").trim()!=="hunter's mark")return null;
    const ranger=features||rangerFeatures(data,{level}),die=ranger.edition==='2024'&&ranger.level>=20?'1d10':'1d6',modern=spell.edition==='2024',trigger=modern?'hit with an attack roll':'hit with a weapon attack',damage=die+(modern?' Force':' extra damage')+' per '+trigger;
    const notes=ranger.reports.map(row=>row.name+': '+row.detail);
    const duration=slot>=5?'Concentration, up to 24 hours':slot>=3?'Concentration, up to 8 hours':'Concentration, up to 1 hour';
    return{die,damage,duration,detail:'Hunter’s Mark deals '+damage+' against the marked target. Casting the spell makes no attack roll.',notes};
  }
  function classResources(data,{level=1,mods={},attunedCount=0}={}){
    const choices=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices),spent=key=>{const raw=choices[key]?.[0];return /^\d{1,3}$/.test(raw||'')?Number(raw):0;},rows=[];
    const artificer=artificerFeatures(data,{level,attunedCount}),actual=artificer.level,source=artificer.source;
    if(artificer.active&&actual>=7){const key=source.id==='efa'?groupKey('2024','artificer','flash-of-genius-uses'):flashKey,used=spent(key),modifier=Math.max(-5,Math.min(10,Math.trunc(Number(mods.int)||0))),bonus=source.id==='efa'?Math.max(1,modifier):modifier,max=Math.max(1,modifier),short=artificer.flashShortRecovery;rows.push({id:'artificer-flash-of-genius',key,name:'Flash of Genius',source:source.label,className:'Artificer',level:actual,bonus,max,used,remaining:Math.max(0,max-used),resets:short?['short','long']:['long'],recovery:short==='all'?'Short or Long Rest recovery':short?'Short Rest: regain 1 use · Long Rest: all uses':'Long Rest recovery',shortRecovery:short,unit:'uses',useLabel:'Use reaction',undoLabel:'Undo use',description:'Reaction · 30 ft · '+(source.id==='efa'?'After you or a creature you can see fails an ability check or saving throw, add your Intelligence modifier (minimum +1).':'Add your Intelligence modifier to one ability check or saving throw made by you or a creature you can see.')+' Resolve the chosen roll at the table.'});}
    const monk=monkLevels(data,level),edition=data.build?.edition==='2024'?'2024':'2014';
    const wizard=wizardLevels(data,level);if(wizard){const key=groupKey(edition,'wizard','arcane-recovery-used'),used=spent(key)?1:0;rows.push({id:'wizard-arcane-recovery',key,name:'Arcane Recovery',source:edition+' Wizard',className:'Wizard',level:wizard,max:1,used,remaining:1-used,resets:edition==='2024'?['long']:[],recovery:edition==='2024'?'Long Rest recovery':'Once per day · reset when a new day begins',unit:'uses',managedSlots:true,description:'After a Short Rest, recover up to '+Math.ceil(wizard/2)+' combined spell-slot levels. Slots of level 6 or higher are ineligible. Choose the entire recovery together; unused budget does not carry to another rest.'});}
    const paladin=paladinLevels(data,level);if(paladin){const key=groupKey(edition,'paladin','lay-on-hands-spent'),used=spent(key),max=paladin*5,modern=edition==='2024';rows.push({id:'paladin-lay-on-hands',key,name:'Lay on Hands',source:edition+' Paladin',className:'Paladin',level:paladin,max,used,remaining:Math.max(0,max-used),resets:['long'],recovery:'Long Rest recovery',unit:'healing points',variableCost:true,useLabel:'Spend points',undoLabel:'Undo points',description:(modern?'Bonus Action':'Action')+' · Touch a creature. Choose healing points to spend; 1 point restores 1 HP. Update the recipient’s HP separately.',rulesLabel:'Lay on Hands options',additionalRules:[{name:modern?'Remove Poisoned':'Disease or poison',detail:modern?'Spend 5 points to remove Poisoned instead of healing.':'Spend 5 points for each disease cured or poison neutralized instead of healing. No effect on Undead or Constructs.'},...(modern&&paladin>=14?[{name:'Restoring Touch',detail:'When using Lay on Hands, spend 5 points per condition to remove Blinded, Charmed, Deafened, Frightened, Paralyzed or Stunned instead of healing.'}]:[])]});}
    const ranger=rangerFeatures(data,{level,mods}),rangerRow=(id,name,max,description,extra={})=>{const key=groupKey(edition,'ranger',id+'-uses'),used=spent(key);rows.push({id:'ranger-'+id,key,name,source:edition+' Ranger',className:'Ranger',level:ranger.level,max,used,remaining:Math.max(0,max-used),resets:['long'],recovery:'Long Rest recovery',unit:'uses',useLabel:'Use feature',undoLabel:'Undo use',description,...extra});};
    if(edition==='2024'&&ranger.level){
      rangerRow('hunters-mark','Hunter’s Mark · Favored Enemy',ranger.freeHunterMarks,'Cast Hunter’s Mark without a slot. Normal slot casts do not spend this pool. Extra damage: '+ranger.huntersMarkDie+' Force per eligible marked hit; Concentration applies.',{unit:'free casts',useLabel:'Use free casting',additionalRules:ranger.reports});
      if(ranger.level>=10)rangerRow('tireless','Tireless',Math.max(1,ranger.wis),'Magic action · gain 1d8 '+(ranger.wis<0?'− '+Math.abs(ranger.wis):'+ '+ranger.wis)+' temporary HP, minimum 1 total. Apply the roll in Temporary HP; temporary HP do not stack. A Short Rest also reduces Exhaustion by 1; update that condition separately.',{die:'1d8',bonus:ranger.wis,useLabel:'Use Tireless'});
      if(ranger.level>=14)rangerRow('natures-veil','Nature’s Veil',Math.max(1,ranger.wis),'Bonus Action · Invisible until the end of your next turn. Resolve the condition and duration at the table.',{useLabel:'Use Nature’s Veil'});
    }
    if(edition==='2014'&&ranger.level>=20)rangerRow('foe-slayer','Foe Slayer',1,'Once on each of your turns, add your Wisdom modifier to one attack roll or damage roll against a favored enemy. Choose the eligible roll at the table; other targets are unchanged.',{bonus:ranger.wis,resets:['turn'],recovery:'Start of your turn',useLabel:'Use Foe Slayer'});

    const sorcerer=sorcererLevels(data,level);if(sorcerer>=2){const key=groupKey(edition,'sorcerer','sorcery-points-spent'),used=spent(key),short=edition==='2024'?sorcerer>=5:sorcerer>=20,restKey=groupKey(edition,'sorcerer','restoration-used'),restUsed=restorationSpent(choices,restKey),chosen=metamagic(data,{level,mods});rows.push({id:'sorcery-points',key,name:'Sorcery Points',source:edition+' Sorcerer',className:'Sorcerer',level:sorcerer,max:sorcerer,used,remaining:Math.max(0,sorcerer-used),resets:short?['short','long']:['long'],recovery:short?(edition==='2024'?'Long Rest: all points · Short Rest: up to '+Math.floor(sorcerer/2)+' once per Long Rest'+(restUsed?' (already used)':''):'Long Rest: all points · Short Rest: regain 4'):'Long Rest recovery',unit:'points',useLabel:'Spend 1 point',undoLabel:'Undo 1 point',metamagic:chosen,description:chosen.length?'Chosen Metamagic: '+chosen.map(row=>row.name+' ('+(row.cost===null?'spell level, minimum 1':row.cost)+' point'+(row.cost===1?'':'s')+')').join('; ')+'. Spell changes apply to this cast.':'Choose Metamagic in Character Builder. Spend this class pool when a Sorcerer feature calls for points.'});}

    if(monk>=2){const name=edition==='2024'?'Focus Points':'Ki Points',key=groupKey(edition,'monk',edition==='2024'?'focus-points-spent':'ki-points-spent'),used=spent(key),dc=8+(Math.ceil(Math.max(1,Math.min(20,Number(level)||1))/4)+1)+Number(mods.wis||0);rows.push({id:'monk-points',key,name,source:edition+' Monk',className:'Monk',level:monk,max:monk,used,remaining:Math.max(0,monk-used),resets:['short','long'],recovery:'Short or Long Rest recovery',unit:'points',useLabel:'Spend 1 point',undoLabel:'Undo 1 point',dc,reroll:monk>=14,description:'Shared pool for Monk features; spend each feature’s point cost from this one pool. '+(edition==='2014'?'Rest recovery requires at least 30 minutes of meditation during the rest. ':'')+'Monk feature save DC '+dc+'.'+(monk>=14?' Failed save: spend 1 point to reroll; use the new roll.':'')});}
    const fighter=fighterLevels(data,level),fighterRow=(id,name,max,resets,description,extra={})=>{const key=groupKey(edition,'fighter',id+'-uses'),used=spent(key);rows.push({id:'fighter-'+id,key,name,source:edition+' Fighter',className:'Fighter',level:fighter,max,used,remaining:Math.max(0,max-used),resets,recovery:resets.includes('short')?'Short or Long Rest recovery':'Long Rest recovery',unit:'uses',useLabel:'Use '+name,undoLabel:'Undo use',description,...extra});};
    if(fighter){
      const max=edition==='2014'?1:fighter>=10?4:fighter>=4?3:2;
      fighterRow('second-wind','Second Wind',max,['short','long'],'Bonus Action · Regain 1d10 + '+fighter+' HP. Resolve healing at the table.'+(edition==='2024'&&fighter>=2?' Tactical Mind: after a failed ability check, add 1d10; spend this same pool only if the check succeeds.':'')+(edition==='2024'&&fighter>=5?' Tactical Shift: when using Second Wind as a Bonus Action, move up to half your Speed without provoking Opportunity Attacks.':''),{...(edition==='2024'?{shortRecovery:1,recovery:'Short Rest: regain 1 use · Long Rest: all uses'}:{}),...(edition==='2024'&&fighter>=2?{extraAction:{id:'tactical-mind',label:'Tactical Mind success · 1 use',message:'Spent 1 Second Wind use for Tactical Mind. If the check still fails, undo this spend. Save to keep the change.'}}:{})});
      if(fighter>=2)fighterRow('action-surge','Action Surge',fighter>=17?2:1,['short','long'],'On your turn, take one additional action'+(edition==='2024'?' except the Magic action':'')+'. Use at most once per turn.');
      if(fighter>=9)fighterRow('indomitable','Indomitable',fighter>=17?3:fighter>=13?2:1,['long'],'Reroll a failed saving throw'+(edition==='2024'?' and add '+fighter+' to the new roll':'')+'; use the new result.',{useLabel:'Reroll failed save',...(edition==='2024'?{bonus:fighter}:{})});
    }
    const bard=bardLevels(data,level);
    if(bard){const key=groupKey(edition,'bard','bardic-inspiration-uses'),used=spent(key),max=Math.max(1,Math.min(10,Math.trunc(Number(mods.cha)||0))),die='1d'+(bard>=15?12:bard>=10?10:bard>=5?8:6),superior=bard>=(edition==='2024'?18:20),resets=['long',...(bard>=5?['short']:[]),...(superior?['initiative']:[])];rows.push({id:'bard-inspiration',key,name:'Bardic Inspiration',source:edition+' Bard',className:'Bard',level:bard,max,used,remaining:Math.max(0,max-used),die,slotRecovery:edition==='2024'&&bard>=5,resets,recovery:(bard>=5?'Short or Long Rest recovery':'Long Rest recovery')+(superior?(edition==='2024'?' · Initiative: regain to 2 uses':' · Initiative: regain 1 if empty'):''),unit:'uses',useLabel:'Give inspiration',undoLabel:'Undo use',description:'Bonus Action · Give one creature other than yourself within 60 ft an inspiration die ('+die+'). '+(edition==='2024'?'Within 1 hour, the recipient can add the die after failing a d20 Test. It must be able to see or hear you.':'Within 10 minutes, the recipient can add the die to one ability check, attack roll or saving throw, after the d20 but before the outcome. It must be able to hear you.')+' A creature can hold only one Bardic Inspiration die at a time.'});}
    const divine=globalThis.CharacterDivineChannel||(typeof require==='function'?require('./character-divine-channel'):null);rows.push(...(divine?.resources(data,{level,mods})||[]));
    return rows;
  }
  function useChannelDivinity(data,id,effectId,context={}){
    const row=classResources(data,context).find(row=>row.id===id);if(!row?.channelEffects?.some(effect=>effect.id===effectId)||!row.remaining)return false;const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{};data.adobe={...stored,classFeatureChoices:{...normalize(stored.classFeatureChoices),[row.key]:[String(row.used+1)],[row.effectKey]:[effectId]}};return true;
  }
  function bardSlotRecovery(data,context={}){
    const resource=classResources(data,context).find(row=>row.id==='bard-inspiration');if(!resource?.slotRecovery)return[];
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},maxima=context.slotMax||data.slots?.map(row=>row.max)||[],rows=[];
    for(let i=0;i<9;i++){const max=Math.max(0,Math.min(99,Math.trunc(Number(maxima[i])||0))),used=Math.max(0,Math.trunc(Number(data.slots?.[i]?.used)||0));if(max)rows.push({value:String(i+1),label:'Level '+(i+1)+' · '+Math.max(0,max-used)+' available',max,used,available:Math.max(0,max-used)});}
    if(context.pact?.count){const max=Math.max(0,Math.min(4,Math.trunc(Number(context.pact.count)||0))),used=Math.max(0,Math.trunc(Number(stored.pactSlotsUsed)||0));rows.push({value:'pact',label:'Pact level '+context.pact.slotLevel+' · '+Math.max(0,max-used)+' available',max,used,available:Math.max(0,max-used)});}
    return rows;
  }
  function restoreBardFromSlot(data,value,context={}){
    const resource=classResources(data,context).find(row=>row.id==='bard-inspiration'),slot=bardSlotRecovery(data,context).find(row=>row.value===value);if(!resource?.slotRecovery||!resource.used||!slot?.available)return false;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},next={...stored,classFeatureChoices:{...normalize(stored.classFeatureChoices),[resource.key]:[String(Math.max(0,Math.min(resource.used,resource.max)-1))]}};
    if(value==='pact')next.pactSlotsUsed=slot.used+1;else{const index=Number(value)-1;data.slots||=Array.from({length:9},()=>({max:0,used:0}));data.slots[index]={...data.slots[index],max:slot.max,used:slot.used+1};}
    data.adobe=next;return true;
  }
  function changeClassResource(data,id,delta,context){
    const resource=classResources(data,context).find(row=>row.id===id);if(!resource||resource.managedSlots||resource.channelEffects&&delta>0||!Number.isInteger(delta)||delta===0||Math.abs(delta)>100||!resource.variableCost&&![1,-1].includes(delta)||delta>0&&delta>resource.remaining||delta<0&&-delta>resource.used)return false;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{};data.adobe={...stored,classFeatureChoices:{...normalize(stored.classFeatureChoices),[resource.key]:[String(Math.max(0,resource.used+delta))]}};return true;
  }
  function resetClassResources(data,event,context={}){
    if(!['short','long','initiative','turn'].includes(event))return;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},choices=normalize(stored.classFeatureChoices),edition=data.build?.edition==='2024'?'2024':'2014',entries=stored.classLevels||[],total=Number(context.level)||(entries.length?Math.min(20,entries.reduce((sum,entry)=>sum+Math.max(0,Number(entry.level)||0),0)):1),rest=event==='short'||event==='long',updates={};
    const monkKey=groupKey(edition,'monk',edition==='2024'?'focus-points-spent':'ki-points-spent'),hasMonk=entries.length?monkLevels(data,total)>=2:data.build?.classId==='monk';
    const source=artificerSource(data),artificer=artificerLevels(data,total),currentFlashKey=source.id==='efa'?groupKey('2024','artificer','flash-of-genius-uses'):flashKey;
    if(source.eligible&&artificer.level>=7&&choices[currentFlashKey]){const raw=choices[currentFlashKey][0];if(event==='long')updates[currentFlashKey]=['0'];else if(event==='short'&&source.id==='efa'&&artificer.level>=14&&/^\d{1,3}$/.test(raw||'')){const model=globalThis.CharacterSheetModel||(typeof require==='function'?require('./character-sheet-model'):null),row=context.classResources?.find(row=>row.id==='artificer-flash-of-genius')||model?.derive(data,total,context.loot||[]).classResources?.find(row=>row.id==='artificer-flash-of-genius'),max=row?.max||Math.max(1,Math.trunc(Number(context.mods?.int)||1));updates[currentFlashKey]=[String(row?.shortRecovery==='all'?0:Math.max(0,Math.min(Number(raw),max)-1))];}}if(rest&&hasMonk&&choices[monkKey])updates[monkKey]=['0'];
    const sorcerer=sorcererLevels(data,total),sorceryKey=groupKey(edition,'sorcerer','sorcery-points-spent'),restorationKey=groupKey(edition,'sorcerer','restoration-used'),sorceryRaw=choices[sorceryKey]?.[0];
    if(event==='long'&&sorcerer>=2){if(choices[sorceryKey])updates[sorceryKey]=['0'];if(choices[restorationKey])updates[restorationKey]=['0'];}
    if(event==='short'&&/^\d{1,3}$/.test(sorceryRaw||'')&&Number(sorceryRaw)>0){const amount=Math.min(Number(sorceryRaw),sorcerer);if(edition==='2014'&&sorcerer>=20)updates[sorceryKey]=[String(Math.max(0,amount-4))];if(edition==='2024'&&sorcerer>=5&&!restorationSpent(choices,restorationKey)){updates[sorceryKey]=[String(Math.max(0,amount-Math.floor(sorcerer/2)))];updates[restorationKey]=['1'];}}
    const divine=globalThis.CharacterDivineChannel||(typeof require==='function'?require('./character-divine-channel'):null);for(const row of divine?.resources(data,{level:total,mods:context.mods||{}})||[]){const raw=choices[row.key]?.[0];if(!row.resets.includes(event)||!/^\d{1,3}$/.test(raw||''))continue;updates[row.key]=[String(event==='short'&&row.shortRecovery?Math.max(0,Math.min(Number(raw),row.max)-row.shortRecovery):0)];}
    const wizard=wizardLevels(data,total),arcaneKey=groupKey(edition,'wizard','arcane-recovery-used');if(event==='long'&&edition==='2024'&&wizard&&choices[arcaneKey])updates[arcaneKey]=['0'];
    const paladin=paladinLevels(data,total),layKey=groupKey(edition,'paladin','lay-on-hands-spent');if(event==='long'&&paladin&&choices[layKey])updates[layKey]=['0'];
    const ranger=rangerLevels(data,total);
    if(event==='long'&&edition==='2024')for(const [id,minimum]of [['hunters-mark',1],['tireless',10],['natures-veil',14]]){const key=groupKey(edition,'ranger',id+'-uses');if(ranger>=minimum&&choices[key])updates[key]=['0'];}
    const foeKey=groupKey('2014','ranger','foe-slayer-uses');if(event==='turn'&&edition==='2014'&&ranger>=20&&choices[foeKey])updates[foeKey]=['0'];
    const fighter=fighterLevels(data,total);
    for(const [id,min] of [['second-wind',1],['action-surge',2],['indomitable',9]]){if(!rest||fighter<min||event==='short'&&id==='indomitable')continue;const key=groupKey(edition,'fighter',id+'-uses'),raw=choices[key]?.[0];if(!/^\d{1,3}$/.test(raw||''))continue;updates[key]=[String(event==='short'&&edition==='2024'&&id==='second-wind'?Math.max(0,Math.min(Number(raw),fighter>=10?4:fighter>=4?3:2)-1):0)];}
    const bard=bardLevels(data,total),bardKey=groupKey(edition,'bard','bardic-inspiration-uses'),raw=choices[bardKey]?.[0];
    if(bard&&/^\d{1,3}$/.test(raw||'')){
      if(event==='long'||event==='short'&&bard>=5)updates[bardKey]=['0'];
      if(event==='initiative'&&bard>=(edition==='2024'?18:20)){
        const model=globalThis.CharacterSheetModel||(typeof require==='function'?require('./character-sheet-model'):null),mods=context.mods||model?.derive(data,total).mods||{},max=Math.max(1,Math.min(10,Math.trunc(Number(mods.cha)||0))),target=edition==='2024'?Math.min(2,max):1,used=Number(raw),available=Math.max(0,max-used);
        if(available<target)updates[bardKey]=[String(Math.max(0,max-target))];
      }
    }
    if(!Object.keys(updates).length)return;data.adobe={...stored,classFeatureChoices:{...choices,...updates}};
  }
  function saveTraining(data,{level=1}={}){
    level=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    const edition=data.build?.edition==='2024'?'2024':'2014',stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];
    const result={abilities:[],deathSaveProficiency:false,reports:[]},seen=new Set();let remaining=level;
    for(const entry of entries){
      const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=actual;
      if(!actual||seen.has(entry.classId))continue;seen.add(entry.classId);
      if(entry.classId==='rogue'&&actual>=15){
        const abilities=edition==='2024'?['wis','cha']:['wis'];result.abilities.push(...abilities);
        result.reports.push({id:'slippery-mind',name:'Slippery Mind',classId:'rogue',level:actual,abilities,detail:(edition==='2024'?'Wisdom and Charisma':'Wisdom')+' saving throw proficiency is included automatically.'});
      }
      if(entry.classId==='monk'&&actual>=14){
        const abilities=['str','dex','con','int','wis','cha'],name=edition==='2024'?'Disciplined Survivor':'Diamond Soul';result.abilities.push(...abilities);result.deathSaveProficiency=true;
        result.reports.push({id:edition==='2024'?'disciplined-survivor':'diamond-soul',name,classId:'monk',level:actual,abilities,detail:'Proficiency in all saving throws, including death saves. A failed save can be rerolled by spending 1 '+(edition==='2024'?'Focus':'Ki')+' point; use the new roll.'});
      }
    }
    result.abilities=[...new Set(result.abilities)];return result;
  }
  function invocationEffects(data,{level=1}={}){
    level=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));const edition=data.build?.edition==='2024'?'2024':'2014',stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}],local={...data,adobe:{...stored,classFeatureChoices:normalize(stored.classFeatureChoices)}};
    const result={skills:[],senses:[],reports:[],truesight:0,concentrationAdvantage:false};let remaining=level;const seen=new Set();
    for(const entry of entries){const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=actual;if(entry.classId!=='warlock'||!actual||seen.has(entry.classId))continue;seen.add(entry.classId);
      const invocation=status(local,{...entry,level:actual},edition).find(group=>group.id==='eldritch-invocations');
      for(const id of invocation?.valid||[]){
        const name=invocation.options.find(option=>option.id===id).name;let detail='';
        if(id==='devil-s-sight'){detail='Normal sight through '+(edition==='2024'?'dim light and ':'')+'darkness, including magical darkness · 120 ft';result.senses.push({id,name,range:120,magicalDarkness:true,dimLight:edition==='2024',detail});}
        if(id==='witch-sight'){if(edition==='2024'){result.truesight=30;detail='Truesight · 30 ft';}else detail='See true forms of creatures affected by shapechanging, illusion or transmutation · 30 ft · requires line of sight';result.senses.push({id,name,range:30,truesight:edition==='2024',detail});}
        if(id==='beguiling-influence'&&edition==='2014'){result.skills.push('deception','persuasion');detail='Proficiency in Deception and Persuasion; adds proficiency once.';}
        if(id==='eyes-of-the-rune-keeper'&&edition==='2014')detail='Read all writing. Spoken language proficiencies are separate.';
        if(id==='eldritch-mind'&&edition==='2024'){result.concentrationAdvantage=true;detail='Advantage on Constitution saving throws to maintain Concentration.';}
        if(detail)result.reports.push({id,name,detail,edition,warlockLevel:actual});
      }
    }
    return result;
  }
  const spellIndexCache=new WeakMap(),emptySpellCatalogue=Object.freeze([]);
  function spellIndex(catalog){
    if(spellIndexCache.has(catalog))return spellIndexCache.get(catalog);
    const index={byId:new Map(),byNameEdition:new Map()};for(const spell of catalog){index.byId.set(spell.id,spell);const key=spell.edition+'|'+String(spell.name||'').toLowerCase();if(!index.byNameEdition.has(key))index.byNameEdition.set(key,spell);}spellIndexCache.set(catalog,index);return index;
  }
  function spellCatalogue(){return globalThis.CharacterCatalog?.rawData?.spells||(typeof require==='function'?require('../../data/rules/catalog.json').spells:emptySpellCatalogue);}
  function cantripInvocations(data,{level=1,mods={},catalog}={}){
    level=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));const catalogReady=Array.isArray(catalog)||!!globalThis.CharacterCatalog?.rawData||typeof require==='function';catalog||=spellCatalogue();if(!Array.isArray(catalog))catalog=[];const edition=data.build?.edition==='2024'?'2024':'2014',stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}],local={...data,adobe:{...stored,classFeatureChoices:normalize(stored.classFeatureChoices)}},choices=local.adobe.classFeatureChoices;
    let remaining=level,warlock=null;for(const entry of entries){const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=actual;if(entry.classId==='warlock'&&actual){warlock={...entry,level:actual};break;}}
    const result={reports:[],modifiers:Object.create(null),catalogReady};if(!warlock)return result;
    const group=status(local,warlock,edition).find(row=>row.id==='eldritch-invocations');if(!group)return result;
    const casterIds=new Set(entries.filter(entry=>['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'].includes(entry.classId)||entry.level>=3&&/^(eldritch-knight|arcane-trickster)/.test(entry.subclassId||'')).map(entry=>entry.classId));
    const index=spellIndex(catalog),known=[],seenSpells=new Map();for(const selected of data.spells||[]){const spell=index.byId.get(selected.catalogId)||index.byNameEdition.get(edition+'|'+String(selected.name||'').toLowerCase().replace(/\s*\[[^\]]+\]\s*$/,''));if(!spell||spell.level!==0)continue;const native=spell.classes||[],warlockSpell=selected.classId==='warlock'||!selected.classId&&native.includes('warlock')&&(native.length===1||casterIds.size===1&&casterIds.has('warlock'));if(seenSpells.has(spell.id)){seenSpells.get(spell.id).warlockSpell||=warlockSpell;continue;}const option={id:safe(spell.id),spellId:spell.id,name:String(spell.name||''),edition:spell.edition,spell,warlockSpell};seenSpells.set(spell.id,option);known.push(option);}
    const validCounts=new Map();for(const id of group.valid)validCounts.set(id,(validCounts.get(id)||0)+1);const used={};
    for(const [slot,id] of group.picked.entries()){
      if(!(validCounts.get(id)>0))continue;validCounts.set(id,validCounts.get(id)-1);if(!['agonizing-blast','eldritch-spear'].includes(id))continue;
      const name=group.options.find(option=>option.id===id).name,key=groupKey(edition,'warlock',id+'-cantrips'),pool=known.filter(option=>edition==='2014'?option.name==='Eldritch Blast':option.warlockSpell).filter(option=>{const combat=option.spell.combat||{},damaging=!!combat.damage||Object.keys(combat.scaling||{}).length>0||combat.types?.length>0;return damaging&&(id!=='eldritch-spear'||edition==='2014'||/^([0-9]+)\s*(feet|ft)\b/i.test(option.spell.range)&&Number.parseInt(option.spell.range)>=10);});
      const value=edition==='2014'?(pool[0]?.id||''):(choices[key]?.[slot]||''),selected=pool.find(option=>option.id===value),identity=selected?.name.toLowerCase(),valid=!!selected&&!(used[id]||=[]).includes(identity);if(valid)used[id].push(identity);
      const bonus=id==='agonizing-blast'?Math.max(-5,Math.min(10,Math.trunc(Number(mods.cha)||0))):0,baseRange=selected?Number.parseInt(selected.spell.range):0,range=id==='eldritch-spear'&&valid?(edition==='2014'?300:baseRange+30*warlock.level):null;
      const detail=valid?(id==='agonizing-blast'?'Damage bonus '+(bonus>=0?'+':'')+bonus+' on '+selected.name:range+' ft range for '+selected.name):'Choose an eligible known Warlock cantrip';
      result.reports.push({id,name,key,slot,value,valid,required:edition==='2024',spellId:selected?.spellId||'',spellName:selected?.name||'',bonus,range,detail,options:pool.map(option=>({id:option.id,spellId:option.spellId,name:option.name,edition:option.edition,source:option.spell.source}))});
      if(valid){const modifier=result.modifiers[selected.spellId]||={sourceClass:edition==='2024'?'warlock':''};if(id==='agonizing-blast'){modifier.damageBonus=bonus;modifier.damageSource=name;}else{modifier.range=range+' feet';modifier.rangeSource=name;}}
    }
    // Prevent repeated copies of the same invocation choosing the same named cantrip twice.
    for(const report of result.reports)for(const option of report.options){const duplicate=result.reports.some(other=>other!==report&&other.id===report.id&&other.valid&&other.spellName.toLowerCase()===option.name.toLowerCase());const permitted=typeof CampaignRules==='undefined'||CampaignRules.allowed(option);option.eligible=!duplicate&&permitted;option.reason=duplicate?'Already chosen for another '+report.name:!permitted?'Outside campaign rules':'';}
    return result;
  }
  function cantripModifier(data,training,spellId,classId=''){
    const modifier=training?.modifiers?.[spellId];if(!modifier)return null;if(!modifier.sourceClass)return modifier;
    if(classId)return classId===modifier.sourceClass?modifier:null;
    if((data.spells||[]).some(row=>row.catalogId===spellId&&row.classId&&row.classId!==modifier.sourceClass))return null;
    return modifier;
  }
  function cantripModifierText(modifier={}){return[modifier.damageSource?modifier.damageSource+' '+(modifier.damageBonus>=0?'+':'')+modifier.damageBonus+' damage':'',modifier.rangeSource?modifier.rangeSource+' '+modifier.range:''].filter(Boolean).join(' · ');}
  function setCantripInvocation(data,key,slot,value,context){
    const before=cantripInvocations(data,context),report=before.reports.find(row=>row.key===key&&row.slot===slot&&row.required);if(!report)return false;value=safe(value);if(value&&!report.options.some(option=>option.id===value&&option.eligible))return false;
    const choices=normalize(data.adobe?.classFeatureChoices),next=[...(choices[key]||[])];while(next.length<=slot)next.push('');next[slot]=value;const candidate={...data,adobe:{...data.adobe,classFeatureChoices:{...choices,[key]:next}}},after=cantripInvocations(candidate,context);if(value&&!after.reports.find(row=>row.key===key&&row.slot===slot)?.valid)return false;
    if(before.reports.some(row=>row.valid&&!(row.key===key&&row.slot===slot)&&!after.reports.find(other=>other.key===row.key&&other.slot===row.slot)?.valid))return false;
    data.adobe||={};data.adobe.classFeatureChoices={...choices,[key]:next};return true;
  }
  function styles(data,level){return fightingStyleState(data,{level}).rows.map(row=>row.option);}
  function fightingStyleReason(data,entry,id){
    if(!id)return '';
    const group=groups(entry,data?.build?.edition||'2014').find(g=>g.id==='fighting-style');if(!group)return 'Fighting Style is not unlocked';
    const before=fightingStyleState(data),choices=normalize(data?.adobe?.classFeatureChoices);
    if((choices[group.key]||[]).includes(id)&&before.rows.some(row=>row.key===group.key&&row.option.id===id))return '';
    if(before.rows.some(row=>row.key!==group.key&&row.option.id===id)||before.legacy.some(featId=>group.options.some(o=>o.id===id&&o.featId===featId)))return 'Already selected in another class or on Feats';
    const candidate={...data,adobe:{...data.adobe,classFeatureChoices:{...choices,[group.key]:[id]}}};
    return fightingStyleState(candidate).excess>before.excess?'No unused Fighting Style choice; remove the saved style on Feats first':'';
  }
  function normalize(raw={}){
    const out={};
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
    for(const [key,value] of Object.entries(raw).slice(0,100)){
      if(!/^[a-z0-9:-]{1,120}$/i.test(key)||!Array.isArray(value))continue;
      out[key]=value.slice(0,20).map(v=>safe(v));
    }
    return out;
  }
  function groups(entry,edition='2014',data){
    const base=(definitions[edition]?.[entry?.classId]||[]).map(g=>({...g,_scope:'class'}));
    const sub=(subclassDefinitions[edition]?.[(entry?.classId||'')+':'+(entry?.subclassId||'')]||[]).map(g=>({...g,_scope:'subclass'}));
    const rows=[...base,...sub];if(entry?.classId==='artificer'&&data&&!artificerSource(data).eligible)return[];
    return rows.filter(g=>Number(entry?.level||0)>=g.minLevel&&(!g.startingOnly||!data||artificerLevels(data,20).starting)&&(!g.multiclassOnly||data&&!artificerLevels(data,20).starting)&&(!g.artificerVersion||data&&artificerSource(data).eligible&&artificerSource(data).id===g.artificerVersion)).map(g=>{const source=entry.classId==='artificer'&&data?artificerSource(data):null;return{...g,...(source?{sourceLabel:source.label}:{}),key:groupKey(edition,entry.classId,(g._scope==='subclass'?entry.subclassId+':':'')+g.id),allowed:Math.max(0,Math.min(20,Number(g.count(Number(entry.level)||0))||0)),options:g.options(entry,edition).map(option=>source&&g.id==='artisan-tool'?{...option,source:source.source,edition:source.sourceEdition}:option)};});
  }
  function registerSubclass(edition,classId,subclassId,definition){
    edition=edition==='2024'?'2024':'2014';const key=safe(classId)+':'+safe(subclassId);
    (subclassDefinitions[edition][key]||=[]).push(definition);
  }
  const selections=(data,group)=>(normalize(data?.adobe?.classFeatureChoices)[group.key]||[]).slice(0,group.allowed);
  function hasSpell(data,name){return (data?.spells||[]).some(s=>String(spellIndex(spellCatalogue()).byId.get(s.catalogId)?.name||s.name||'').toLowerCase().replace(/\s*\[[^\]]+\]\s*$/,'')===String(name).toLowerCase());}
  function prerequisite(option,group,data,entry){
    const reasons=[];
    if((option.minLevel||0)>entry.level)reasons.push('Warlock level '+option.minLevel+'+');
    const selected=selections(data,group);
    if(option.requiresInvocation&&!selected.includes(option.requiresInvocation))reasons.push('requires '+option.requiresInvocation.replaceAll('-',' '));
    if(option.requiresGroup){
      const other=groups(entry,data?.build?.edition||'2014').find(g=>g.id===option.requiresGroup);
      if(!other||!selections(data,other).includes(option.requiresChoice))reasons.push('requires '+String(option.requiresChoice||'').replaceAll('-',' '));
    }
    if(option.requiresSpell&&!hasSpell(data,option.requiresSpell))reasons.push('requires '+option.requiresSpell);
    if(option.manualPrereq)reasons.push(option.manualPrereq+' (verify)');
    return{eligible:!reasons.some(r=>!r.endsWith('(verify)')),reasons,manual:reasons.some(r=>r.endsWith('(verify)'))};
  }
  function status(data,entry,edition='2014'){
    return groups(entry,edition,data).map(group=>{
      const picked=selections(data,group).slice(0,group.allowed);
      const seen=new Set(),valid=picked.filter(id=>{const opt=group.options.find(o=>o.id===id);if(!opt||seen.has(id)&&!opt.repeatable||!prerequisite(opt,group,data,entry).eligible)return false;seen.add(id);return true;});
      if(group.id==='fighting-style'){const active=fightingStyleState(data).rows.filter(row=>row.key===group.key).map(row=>row.option.id);for(let i=valid.length-1;i>=0;i--)if(!active.includes(valid[i]))valid.splice(i,1);}
      const overflow=(normalize(data?.adobe?.classFeatureChoices)[group.key]||[]).slice(group.allowed).filter(Boolean);
      const legacyFeat=group.id==='fighting-style'?fightingStyleState(data).legacyGroups[group.key]:null,filled=valid.length+(legacyFeat?1:0);
      return{...group,picked,valid,overflow,legacyFeat,missing:Math.max(0,group.allowed-filled),complete:filled===group.allowed&&!overflow.length};
    });
  }
  function set(data,entry,groupId,index,value){
    // Recompute the allowance from class level and edition at the mutation boundary.
    // A stale DOM group or a disabled option must never bypass the core rules.
    const stored=(data?.adobe?.classLevels||[]).find(e=>e.classId===entry?.classId);
    if(!stored)return false;
    entry=stored;
    const group=groups(entry,data?.build?.edition||'2014',data).find(g=>g.id===groupId);
    if(!group||!Number.isInteger(index)||index<0||index>=group.allowed)return false;
    data.adobe||={};data.adobe.classFeatureChoices=normalize(data.adobe.classFeatureChoices);
    const current=[...selections(data,group)],id=safe(value),option=group.options.find(o=>o.id===id);
    if(id&&typeof CampaignRules!=='undefined'&&!CampaignRules.allowed(option))return false;
    if(id&&option?.featId&&typeof CampaignRules!=='undefined'&&!CampaignRules.selectableFeat(option.featId,globalThis.CharacterCatalog?.rawData?.feats||[]))return false;
    if(id&&(!option||!prerequisite(option,group,data,entry).eligible||!option.repeatable&&current.some((v,i)=>i!==index&&v===id)))return false;
    const next=[...current];while(next.length<=index)next.push('');next[index]=id;
    const candidate={...data,adobe:{...data.adobe,classFeatureChoices:{...data.adobe.classFeatureChoices,[group.key]:next}}};
    if(group.id==='fighting-style'&&fightingStyleReason(data,entry,id))return false;
    if(current.some((v,i)=>i!==index&&v&&prerequisite(group.options.find(o=>o.id===v)||{},group,data,entry).eligible&&!prerequisite(group.options.find(o=>o.id===v)||{},group,candidate,entry).eligible))return false;
    while(next.length&&!next[next.length-1])next.pop();
    data.adobe.classFeatureChoices[group.key]=next;
    return true;
  }
  // Expertise choices use the existing classFeatureChoices save envelope. No manual ranks are rewritten.
  const expertiseSkills=['acrobatics','animalHandling','arcana','athletics','deception','history','insight','intimidation','investigation','medicine','nature','perception','performance','persuasion','religion','sleightOfHand','stealth','survival'];
  const expertiseNames={rogue:'Rogue',bard:'Bard',ranger:'Ranger',wizard:'Wizard'};
  function expertise(data,{level=1,effects={},feats={}}={}){
    level=Math.max(1,Math.min(20,Number(level)||1));const edition=data.build?.edition==='2024'?'2024':'2014';
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},raw=Array.isArray(stored.classLevels)?stored.classLevels:[],entries=raw.length?raw:[{classId:data.build?.classId,level}],choices=normalize(stored.classFeatureChoices);
    const used=new Set(feats.expertise||[]),skills=[],tools=[],reports=[],reminders=[],seenClasses=new Set();let remaining=level;
    const proficient=key=>Number(data.skills?.[key]?.rank||0)>=1||(effects.skills||[]).includes(key);
    for(const entry of entries){
      const classId=entry.classId,l=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=l;
      if(!l||seenClasses.has(classId))continue;seenClasses.add(classId);
      if(classId==='artificer'&&artificerSource(data).id==='tce'&&artificerSource(data).eligible&&l>=6)reminders.push('Artificer Tool Expertise: proficient tool checks use double proficiency ('+(2*(Math.ceil(level/4)+1))+') plus the appropriate ability modifier. Choose the check ability in Artificer tool checks to calculate the complete bonus.');
      if(edition==='2014'&&classId==='ranger')reminders.push('If your campaign uses the optional Deft Explorer / Canny feature, mark its chosen skill with the Expertise circle below. The optional feature is not assumed.');
      if(edition==='2014'&&classId==='cleric'&&entry.subclassId?.includes('knowledge'))reminders.push('Knowledge Domain: Blessings of Knowledge grants expertise in two of Arcana, History, Nature and Religion. Mark those skills with the Expertise circles below.');
      if(classId==='rogue'&&entry.subclassId==='scout'&&l>=3)reminders.push('Scout Survivalist: mark Nature and Survival with the Expertise circles below, in addition to your separate Rogue Expertise choices.');
      const allowed=classId==='rogue'?(l>=6?4:2):classId==='bard'?(l>=(edition==='2024'?9:10)?4:l>=(edition==='2024'?2:3)?2:0):edition==='2024'&&classId==='ranger'?(l>=9?3:l>=2?1:0):edition==='2024'&&classId==='wizard'&&l>=2?1:0;
      if(!allowed)continue;
      const key=groupKey(edition,classId,'expertise'),name=classId==='wizard'?'Scholar':classId==='ranger'?'Deft Explorer / Expertise':'Expertise';
      const pool=classId==='wizard'?['arcana','history','investigation','medicine','nature','religion']:expertiseSkills;
      const options=pool.map(skill=>({id:safe(skill),skill,eligible:proficient(skill),reason:proficient(skill)?'':'Requires proficiency'}));
      if(edition==='2014'&&classId==='rogue')options.push({id:'thieves-tools',tool:'Thieves’ tools',eligible:(effects.proficiencies||[]).some(value=>safe(value)==='thieves-tools')});
      const picked=(choices[key]||[]).slice(0,allowed),slots=Array.from({length:allowed},(_,index)=>{const value=picked[index]||'',option=options.find(o=>o.id===value),identity=option?.skill||option?.id,valid=!!option&&option.eligible&&!used.has(identity);if(valid){used.add(identity);if(option.skill)skills.push(option.skill);else tools.push({name:option.tool,bonus:2*(Math.ceil(level/4)+1),source:'Rogue Expertise'});}return{value,valid};});
      reports.push({key,classId,className:expertiseNames[classId],level:l,name,allowed,options,slots,missing:slots.filter(slot=>!slot.valid).length,overflow:(choices[key]||[]).slice(allowed).filter(Boolean).length});
    }
    // Disable choices already granted by feats or another class. The same manual rank never stacks.
    for(const report of reports)for(const option of report.options){const identity=option.skill||option.id;const feat=(feats.expertise||[]).includes(identity),other=reports.some(other=>other!==report&&other.slots.some(slot=>slot.valid&&slot.value===option.id));option.reason=feat?'Expertise already granted by a feat':other?'Chosen by another class':option.reason||(!option.eligible?'Requires proficiency':'');option.eligible=option.eligible&&!feat&&!other;}
    return{skills,tools,reports,reminders};
  }
  function setExpertise(data,key,index,value,context){
    const before=expertise(data,context),report=before.reports.find(r=>r.key===key);if(!report||!Number.isInteger(index)||index<0||index>=report.allowed)return false;
    value=safe(value);const option=report.options.find(o=>o.id===value);if(value&&(!option?.eligible||report.slots.some((s,i)=>i!==index&&s.valid&&s.value===value)))return false;
    const choices=normalize((data.adobe||{}).classFeatureChoices),next=(choices[key]||[]).slice(0,report.allowed);while(next.length<=index)next.push('');next[index]=value;
    const candidate={...data,adobe:{...data.adobe,classFeatureChoices:{...choices,[key]:next}}},after=expertise(candidate,context);if(value&&!after.reports.find(r=>r.key===key)?.slots[index]?.valid)return false;
    // A new choice may not invalidate another already valid slot.
    if(before.reports.some(r=>r.slots.some((slot,i)=>slot.valid&&!(r.key===key&&i===index)&&!after.reports.find(v=>v.key===r.key)?.slots[i]?.valid)))return false;
    data.adobe||={};data.adobe.classFeatureChoices={...choices,[key]:next};return true;
  }
  const masteryHelp={
    Cleave:'After a melee hit, you can attack a nearby second creature. Check the range, damage and once-per-turn limits.',
    Graze:'A missed attack can still deal ability-modifier damage. Apply the property’s limits.',
    Nick:'The extra Light-weapon attack can be part of your Attack action, once per turn.',
    Push:'On a hit, push a Large or smaller target up to 10 feet straight away.',
    Sap:'A hit gives the target disadvantage on its next attack roll before your next turn.',
    Slow:'A hit reduces Speed by 10 feet until your next turn. Multiple Slow hits do not stack.',
    Topple:'A hit can force a Constitution save or knock the target Prone. DC: 8 + proficiency + the attack’s ability modifier.',
    Vex:'A damaging hit gives advantage on your next attack against that creature before the end of your next turn.'
  };
  function weaponTraining(data,{level=1,effects={},feats={}}={}){
    const E=typeof CharacterEquipment!=='undefined'?CharacterEquipment:require('./character-equipment');
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},choices=normalize(stored.classFeatureChoices),reports=[],proficiencies=[],masteries=[],used=new Set();
    const weaponRows=Object.entries(E.weapons).filter(([,w])=>['simple','martial'].includes(w.group));
    const manual=String(data.proficiencies||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
    const profs=()=>[...(effects.proficiencies||[]),...manual,...proficiencies];
    const add=(key,name,allowed,pool,kind)=>{
      const options=pool.map(([id,w])=>({id,name:w.name,property:kind==='mastery'?w.mastery:'',eligible:kind==='proficiency'||E.trained(w,profs()),reason:''}));
      const values=choices[key]||[],local=new Set(),slots=Array.from({length:allowed},(_,index)=>{
        const value=values[index]||'',option=options.find(o=>o.id===value),valid=!!option&&option.eligible&&!local.has(value)&&(kind!=='mastery'||!used.has(value));
        if(valid){local.add(value);if(kind==='proficiency')proficiencies.push(option.name);else{used.add(value);masteries.push({base:value,name:option.name,property:option.property,source:name});}}
        return{value,valid};
      });
      reports.push({key,name,allowed,kind,options,slots,missing:slots.filter(s=>!s.valid).length,overflow:values.slice(allowed).filter(Boolean).length});
    };
    const weaponFeats=(feats.reports||[]).filter(r=>r.def?.name==='Weapon Master'&&r.eligible);
    // The 2014 feat grants weapon proficiency, not mastery, even on a 2024 character.
    for(const feat of weaponFeats.filter(r=>r.def.edition==='2014'))add(groupKey('2014','feat-weapon-master','weapon-training'),'Weapon Master feat · 2014',4,weaponRows,'proficiency');
    if(data.build?.edition==='2024'){
      const assigned=Array.isArray(stored.classLevels)?stored.classLevels:[],entries=assigned.length?assigned:[{classId:data.build?.classId,level}],seen=new Set();let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
      for(const entry of entries){
        const actual=Math.min(remaining,Math.max(0,Math.trunc(Number(entry?.level)||0)));remaining-=actual;
        const id=entry?.classId;if(!actual||seen.has(id))continue;seen.add(id);
        const allowed=id==='fighter'?(actual>=16?6:actual>=10?5:actual>=4?4:3):id==='barbarian'?(actual>=10?4:actual>=4?3:2):['paladin','ranger','rogue'].includes(id)?2:0;
        if(!allowed)continue;
        const pool=weaponRows.filter(([,w])=>w.mastery&&(id!=='barbarian'||w.rangeType==='melee'));
        add(groupKey('2024',id,'weapon-mastery'),id.charAt(0).toUpperCase()+id.slice(1)+' · Weapon Mastery',allowed,pool,'mastery');
      }
      for(const feat of weaponFeats.filter(r=>r.def.edition==='2024'))add(groupKey('2024','feat-weapon-master','weapon-mastery'),'Weapon Master feat · 2024',1,weaponRows.filter(([,w])=>w.mastery),'mastery');
    }
    for(const report of reports)for(const option of report.options){
      const other=report.kind==='mastery'&&reports.some(r=>r!==report&&r.kind==='mastery'&&r.slots.some(s=>s.valid&&s.value===option.id));
      option.reason=other?'Chosen by another source':!option.eligible?'Requires weapon proficiency':'';option.eligible=option.eligible&&!other;
    }
    return{reports,baseProficiencies:[...(effects.proficiencies||[])],proficiencies:[...new Set(proficiencies)],masteries};
  }
  function setWeaponTraining(data,key,index,value,context){
    const before=weaponTraining(data,context),group=before.reports.find(r=>r.key===key);
    if(!group||!Number.isInteger(index)||index<0||index>=group.allowed)return false;
    value=safe(value);const option=group.options.find(o=>o.id===value);
    if(value&&(!option?.eligible||group.slots.some((s,i)=>i!==index&&s.valid&&s.value===value)))return false;
    const choices=normalize((data.adobe||{}).classFeatureChoices),next=(choices[key]||[]).slice(0,group.allowed);while(next.length<=index)next.push('');next[index]=value;
    const candidate={...data,adobe:{...data.adobe,classFeatureChoices:{...choices,[key]:next}}},after=weaponTraining(candidate,context);
    if(value&&!after.reports.find(r=>r.key===key)?.slots[index]?.valid)return false;
    if(before.reports.some(r=>r.slots.some((s,i)=>s.valid&&!(r.key===key&&i===index)&&!after.reports.find(v=>v.key===r.key)?.slots[i]?.valid)))return false;
    data.adobe||={};data.adobe.classFeatureChoices={...choices,[key]:next};return true;
  }
  return{useChannelDivinity,wizardLevels,arcaneRecovery,restoreArcaneSlots,resetArcaneDay,paladinLevels,huntersMarkEffect,rangerLevels,rangerFeatures,sorcererLevels,metamagic,spendMetamagic,artificerFeatures,artificerSourceKey,artificerVersions,artificerSource,setArtificerSource,artificerSpellAllowed,bardSlotRecovery,restoreBardFromSlot,abilityFeatures,monkLevels,orders,saveTraining,cantripModifier,cantripModifierText,cantripInvocations,setCantripInvocation,invocationEffects,classResources,changeClassResource,resetClassResources,artisanTool,toolTraining,setToolAbility,artificerLevels,fightingStyleReason,fightingStyleState,weaponTraining,setWeaponTraining,masteryHelp,expertise,setExpertise,styles,invocationProgression,invocationLimit,definitions,subclassDefinitions,registerSubclass,normalize,groupKey,groups,selections,prerequisite,status,set};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassFeatureChoices;
