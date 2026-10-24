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
  const artisanTools=['Alchemist’s supplies','Brewer’s supplies','Calligrapher’s supplies','Carpenter’s tools','Cartographer’s tools','Cobbler’s tools','Cook’s utensils','Glassblower’s tools','Jeweler’s tools','Leatherworker’s tools','Mason’s tools','Painter’s supplies','Potter’s tools','Smith’s tools','Weaver’s tools','Woodcarver’s tools'];
  for(const edition of ['2014','2024'])definitions[edition].artificer=[{id:'artisan-tool',name:'Artificer artisan tool',sourceLabel:'Legacy Artificer · Tasha’s',minLevel:1,count:()=>1,startingOnly:true,options:()=>artisanTools.map(name=>option(name,{proficiency:name,source:'TCE',edition:'2014',referenceComplete:true,automationComplete:true})),referenceComplete:true}];
  function artificerLevels(data,level=1){
    const stored=data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data?.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Number(level)||1)),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='artificer'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}
    return{level:actual,starting:entries[0]?.classId==='artificer'};
  }
  function artisanTool(data,level){
    const actual=artificerLevels(data,level);if(!actual.starting||!actual.level)return '';
    const edition=data.build?.edition||'2014',key=groupKey(edition,'artificer','artisan-tool'),id=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices)[key]?.[0];
    return artisanTools.find(name=>safe(name)===id)||'';
  }
  function toolTraining(data,{level=1,effects={},mods={},classExpertise={}}={}){
    level=Math.max(1,Math.min(20,Math.trunc(Number(level)||1)));
    const actual=artificerLevels(data,level);if(!actual.level)return{level:0,tools:[]};
    const rules=typeof CharacterRules!=='undefined'?CharacterRules:require('./character-rules'),choices=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices),proficiencies=[...(effects.proficiencies||[]),...String(data.proficiencies||'').split(/[,;\n]+/)];
    const pb=Math.ceil(level/4)+1,expertise=actual.level>=6;
    const tools=rules.tools.filter(name=>proficiencies.some(value=>safe(value)===safe(name))).map(name=>{const id=safe(name),key=groupKey(data.build?.edition||'2014','artificer','tool-check-'+id),raw=choices[key]?.[0],ability=['str','dex','con','int','wis','cha'].includes(raw)?raw:'',trainedExpertise=expertise||(classExpertise.tools||[]).some(tool=>safe(tool.name)===id),bonus=pb*(trainedExpertise?2:1);return{id,key,name,ability,bonus,expertise:trainedExpertise,total:ability?Number(mods[ability]||0)+bonus:null};});
    return{level:actual.level,tools};
  }
  function setToolAbility(data,id,ability,context){
    const tool=toolTraining(data,context).tools.find(tool=>tool.id===id);if(!tool||ability&&!['str','dex','con','int','wis','cha'].includes(ability))return false;
    data.adobe||={};data.adobe.classFeatureChoices={...normalize(data.adobe.classFeatureChoices),[tool.key]:[ability]};return true;
  }
  const flashKey=groupKey('2014','artificer','flash-of-genius-uses');
  function monkLevels(data,level=1){
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},entries=stored.classLevels?.length?stored.classLevels:[{classId:data.build?.classId,level}];let remaining=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0;const seen=new Set();
    for(const entry of entries){const count=Math.min(remaining,Math.max(0,Math.trunc(Number(entry.level)||0)));remaining-=count;if(entry.classId==='monk'&&!seen.has(entry.classId))actual=count;seen.add(entry.classId);}return actual;
  }
  function classResources(data,{level=1,mods={}}={}){
    const choices=normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices),spent=key=>{const raw=choices[key]?.[0];return /^\d{1,3}$/.test(raw||'')?Number(raw):0;},rows=[];
    const actual=artificerLevels(data,level);
    if(actual.level>=7){const used=spent(flashKey),bonus=Math.max(-5,Math.min(10,Math.trunc(Number(mods.int)||0))),max=Math.max(1,bonus);rows.push({id:'artificer-flash-of-genius',key:flashKey,name:'Flash of Genius',source:'Legacy Artificer · Tasha’s',className:'Artificer',level:actual.level,bonus,max,used,remaining:Math.max(0,max-used),resets:['long'],recovery:'Long Rest recovery',unit:'uses',useLabel:'Use reaction',undoLabel:'Undo use',description:'Reaction · 30 ft · Add your Intelligence modifier to one ability check or saving throw made by you or a creature you can see. Resolve the chosen roll at the table.'});}
    const monk=monkLevels(data,level),edition=data.build?.edition==='2024'?'2024':'2014';
    if(monk>=2){const name=edition==='2024'?'Focus Points':'Ki Points',key=groupKey(edition,'monk',edition==='2024'?'focus-points-spent':'ki-points-spent'),used=spent(key),dc=8+(Math.ceil(Math.max(1,Math.min(20,Number(level)||1))/4)+1)+Number(mods.wis||0);rows.push({id:'monk-points',key,name,source:edition+' Monk',className:'Monk',level:monk,max:monk,used,remaining:Math.max(0,monk-used),resets:['short','long'],recovery:'Short or Long Rest recovery',unit:'points',useLabel:'Spend 1 point',undoLabel:'Undo 1 point',dc,reroll:monk>=14,description:'Shared pool for Monk features; spend each feature’s point cost from this one pool. '+(edition==='2014'?'Rest recovery requires at least 30 minutes of meditation during the rest. ':'')+'Monk feature save DC '+dc+'.'+(monk>=14?' Failed save: spend 1 point to reroll; use the new roll.':'')});}
    return rows;
  }
  function changeClassResource(data,id,delta,context){
    if(![1,-1].includes(delta))return false;const resource=classResources(data,context).find(row=>row.id===id);if(!resource||delta===1&&!resource.remaining||delta===-1&&!resource.used)return false;
    const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{};data.adobe={...stored,classFeatureChoices:{...normalize(stored.classFeatureChoices),[resource.key]:[String(Math.max(0,resource.used+delta))]}};return true;
  }
  function resetClassResources(data,event){
    if(!['short','long'].includes(event))return;const stored=data.adobe||data.rulesChoices?.grants?.__adobe?.data||{},choices=normalize(stored.classFeatureChoices),edition=data.build?.edition==='2024'?'2024':'2014',monkKey=groupKey(edition,'monk',edition==='2024'?'focus-points-spent':'ki-points-spent'),entries=stored.classLevels||[],hasMonk=entries.length?monkLevels(data,Math.min(20,entries.reduce((total,entry)=>total+Math.max(0,Number(entry.level)||0),0)))>=2:data.build?.classId==='monk',keys=[];
    if(event==='long'&&choices[flashKey])keys.push(flashKey);if(hasMonk&&choices[monkKey])keys.push(monkKey);if(!keys.length)return;
    data.adobe={...stored,classFeatureChoices:{...choices,...Object.fromEntries(keys.map(key=>[key,['0']]))}};
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
    for(const [key,value] of Object.entries(raw).slice(0,60)){
      if(!/^[a-z0-9:-]{1,120}$/i.test(key)||!Array.isArray(value))continue;
      out[key]=value.slice(0,20).map(v=>safe(v));
    }
    return out;
  }
  function groups(entry,edition='2014',data){
    const base=(definitions[edition]?.[entry?.classId]||[]).map(g=>({...g,_scope:'class'}));
    const sub=(subclassDefinitions[edition]?.[(entry?.classId||'')+':'+(entry?.subclassId||'')]||[]).map(g=>({...g,_scope:'subclass'}));
    const rows=[...base,...sub];
    return rows.filter(g=>Number(entry?.level||0)>=g.minLevel&&(!g.startingOnly||!data||artificerLevels(data,20).starting)).map(g=>({...g,key:groupKey(edition,entry.classId,(g._scope==='subclass'?entry.subclassId+':':'')+g.id),allowed:Math.max(0,Math.min(20,Number(g.count(Number(entry.level)||0))||0)),options:g.options(entry,edition)}));
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
      if(edition==='2014'&&classId==='artificer'&&l>=6)reminders.push('Artificer Tool Expertise: proficient tool checks use double proficiency ('+(2*(Math.ceil(level/4)+1))+') plus the appropriate ability modifier. Choose the check ability in Artificer tool checks to calculate the complete bonus.');
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
  return{monkLevels,orders,saveTraining,cantripModifier,cantripModifierText,cantripInvocations,setCantripInvocation,invocationEffects,classResources,changeClassResource,resetClassResources,artisanTool,toolTraining,setToolAbility,artificerLevels,fightingStyleReason,fightingStyleState,weaponTraining,setWeaponTraining,masteryHelp,expertise,setExpertise,styles,invocationProgression,invocationLimit,definitions,subclassDefinitions,registerSubclass,normalize,groupKey,groups,selections,prerequisite,status,set};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassFeatureChoices;
