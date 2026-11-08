/* Framework-independent character sheet data and calculations. */
var CharacterSheetModel = (() => {
  const ClassChoices=typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices:require('./character-class-feature-choices');
  const AttackProgression=typeof CharacterAttackProgression!=='undefined'?CharacterAttackProgression:require('./character-attack-progression');
  const Actions=typeof CharacterActions!=='undefined'?CharacterActions:require('./character-actions');
  const Play=typeof CharacterPlayRules!=='undefined'?CharacterPlayRules:require('./character-play-rules');
  const Rules = typeof CharacterRules !== 'undefined' ? CharacterRules : require('./character-rules');
  const Catalog = typeof CharacterCatalog !== 'undefined' ? CharacterCatalog : require('./character-catalog');
  const Feats=typeof CharacterFeatRules!=='undefined'?CharacterFeatRules:require('./character-feat-rules');
  const ItemChoices=typeof CharacterMagicItemChoices!=='undefined'?CharacterMagicItemChoices:require('./character-magic-item-choices');
  const Equipment=typeof CharacterEquipment!=='undefined'?CharacterEquipment:require('./character-equipment');
  const Magic=typeof CharacterMagicItems!=='undefined'?CharacterMagicItems:null;
  const abilities = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma'
  };
  const skills = {
    acrobatics: [
      'Acrobatics',
      'dex'
    ],
    animalHandling: [
      'Animal Handling',
      'wis'
    ],
    arcana: [
      'Arcana',
      'int'
    ],
    athletics: [
      'Athletics',
      'str'
    ],
    deception: [
      'Deception',
      'cha'
    ],
    history: [
      'History',
      'int'
    ],
    insight: [
      'Insight',
      'wis'
    ],
    intimidation: [
      'Intimidation',
      'cha'
    ],
    investigation: [
      'Investigation',
      'int'
    ],
    medicine: [
      'Medicine',
      'wis'
    ],
    nature: [
      'Nature',
      'int'
    ],
    perception: [
      'Perception',
      'wis'
    ],
    performance: [
      'Performance',
      'cha'
    ],
    persuasion: [
      'Persuasion',
      'cha'
    ],
    religion: [
      'Religion',
      'int'
    ],
    sleightOfHand: [
      'Sleight of Hand',
      'dex'
    ],
    stealth: [
      'Stealth',
      'dex'
    ],
    survival: [
      'Survival',
      'wis'
    ]
  };
  const text = value => String(value ?? '').slice(0, 12000);
  const number = (value, fallback = 0, min = -1000, max = 1000000) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.trunc(Number(value)))) : fallback;
  const mod = value => Math.floor((number(value, 10, 1, 30) - 10) / 2);
  const proficiency = level => 2 + Math.floor((number(level, 1, 1, 20) - 1) / 4);
  const signed = value => (value >= 0 ? '+' : '') + value;
  const textFields = [
    'species',
    'background',
    'alignment',
    'experience',
    'appearance',
    'personality',
    'ideals',
    'bonds',
    'flaws',
    'backstory',
    'allies',
    'enemies',
    'notes',
    'features',
    'languages',
    'proficiencies',
    'resistances',
    'conditions',
    'equipment',
    'hitDice',
    'resources'
  ];
  const numberFields = {
    ac: 10,
    speed: 30,
    hpMax: 0,
    hpCurrent: 0,
    hpTemp: 0,
    initiativeBonus: 0,
    spellAttackBonus: 0,
    spellDCBonus: 0,
    deathSuccess: 0,
    deathFailure: 0,
    passiveBonus: 0
  };
  function normalize(raw = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const result = {
      personalGear: (Array.isArray(raw.personalGear)?raw.personalGear:[]).filter(g=>g&&typeof g==='object').slice(0,200).map((g,i)=>({
        id: 'personal-'+String(g.id||i).replace(/^personal-/, '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80),
        name: String(g.name||'Item').slice(0,160), quantity: number(g.quantity,1,0,9999),
        weight: Math.max(0,Math.min(99999,Number(g.weight)||0)), location: String(g.location||'Backpack').slice(0,80),
        ...(['left','right'].includes(g.inventorySide)?{inventorySide:g.inventorySide}:{}),
        carried: g.carried!==false, notes: String(g.notes||'').slice(0,500),
        edition: g.edition==='2024'?'2024':'2014'
      })).filter((g,i,a)=>a.findIndex(x=>x.id===g.id)===i),
      actions: Actions.normalize(raw.actions),
      profile: Play.normalizeProfile(raw.profile),
      advancement: Play.normalizeAdvancement(raw.advancement),
      equipmentState: Equipment.choices(raw.equipmentState),
      build: Rules.normalize(raw.build),
      rulesChoices: Catalog.normalize(raw.rulesChoices),
      abilities: {},
      saves: {},
      skills: {},
      coins: {},
      slots: [],
      attacks: [],
      spells: [],
      inspiration: !!raw.inspiration,
      spellAbility: abilities[raw.spellAbility] ? raw.spellAbility : 'int'
    };
    // Older Feats controls stored Origin Skilled training on the feat effect.
    // Read it into the existing build fields only when no new choices are present.
    if(result.build.edition==='2024')for(const [field,key] of [['humanFeatChoices','origin-human'],['backgroundFeatChoices','origin-background']]){
      if(!result.build[field].some(Boolean)){
        const legacy=Feats.choice(result.rulesChoices.effects?.[key]).training;
        if(legacy.some(Boolean))result.build[field]=legacy;
      }
    }
    for (const key of textFields)
      result[key] = text(raw[key]);
    for (const [key, defaultValue] of Object.entries(numberFields))
      result[key] = number(raw[key] ?? defaultValue, defaultValue, key.endsWith('Bonus') ? -1000 : 0, key.startsWith('death') ? 3 : 1000000);
    for (const key of Object.keys(abilities)) {
      result.abilities[key] = number(raw.abilities?.[key] ?? 10, 10, 1, 30);
      result.saves[key] = {
        proficient: !!raw.saves?.[key]?.proficient,
        bonus: number(raw.saves?.[key]?.bonus)
      };
    }
    for (const key of Object.keys(skills)) {
      const rank = Number(raw.skills?.[key]?.rank ?? 0);
      result.skills[key] = {
        rank: [
          0,
          0.5,
          1,
          2
        ].includes(rank) ? rank : 0,
        bonus: number(raw.skills?.[key]?.bonus)
      };
    }
    for (const key of [
        'cp',
        'sp',
        'ep',
        'gp',
        'pp'
      ])
      result.coins[key] = number(raw.coins?.[key], 0, 0);
    for (let i = 0; i < 9; i++) {
      const max = number(raw.slots?.[i]?.max, 0, 0, 99);
      result.slots.push({
        max,
        used: number(raw.slots?.[i]?.used, 0, 0, max)
      });
    }
    result.attacks = (Array.isArray(raw.attacks) ? raw.attacks : []).slice(0, 30).map(a => ({
      ...(typeof a?.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(a.id)?{id:a.id}:{}),
      name: text(a?.name),
      ability: abilities[a?.ability] ? a.ability : 'str',
      proficient: !!a?.proficient,
      rangedWeapon: !!a?.rangedWeapon,
      bonus: number(a?.bonus),
      damage: text(a?.damage),
      range: text(a?.range),
      notes: text(a?.notes)
    }));
    result.spells = (Array.isArray(raw.spells) ? raw.spells : []).slice(0, 150).map(s => ({
      name: text(s?.name),
      catalogId: text(s?.catalogId),
      classId: String(s?.classId||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,60),
      level: number(s?.level, 0, 0, 9),
      prepared: !!s?.prepared,
      casting: text(s?.casting),
      range: text(s?.range),
      duration: text(s?.duration),
      components: text(s?.components),
      // Catalogue data is only a starting point. These source columns belong to
      // the character row so a player can annotate or replace every text field
      // on the printable spell sheet without losing the selected catalogue ID.
      save: text(s?.save),
      school: text(s?.school),
      book: text(s?.book),
      page: text(s?.page),
      notes: text(s?.notes)
    }));
    return result;
  }
  const pointBuyPresets=Object.freeze([
    {id:'focused',name:'Three strong scores',scores:[15,15,15,8,8,8],description:'Three strong abilities and three weaknesses.'},
    {id:'standard',name:'Standard array',scores:[15,14,13,12,10,8],description:'The classic spread, also legal with Point Buy.'},
    {id:'balanced',name:'Balanced spread',scores:[14,14,14,10,10,10],description:'Three strong abilities with no negative base modifiers.'}
  ].map(row=>Object.freeze({...row,scores:Object.freeze(row.scores)})));
  function pointBuy(abilities={}) {
    const costs={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
    const rows=Object.keys(CharacterSheetModel.abilities).map(key=>({key,score:Number(abilities[key]),cost:costs[abilities[key]]??null}));
    const invalid=rows.filter(r=>r.cost===null).map(r=>r.key),spent=rows.reduce((n,r)=>n+(r.cost||0),0);
    return {rows,invalid,spent,remaining:27-spent,budget:27,valid:!invalid.length&&spent<=27};
  }
  function derive(data, level, loot = []) {
    const Override=globalThis.CharacterModifiers||(typeof require==='function'?require('./character-modifiers'):null),d=normalize(data),pb=Override?Override.proficiency(data,proficiency(level)):proficiency(level),mods={},saves={},checks={};
    loot=ItemChoices.project(loot,d.equipmentState.loadout);
    const modifierExpressions=(data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).modifiers,modifierReport=[],bonus=(key,base=0)=>Override?Override.value(modifierExpressions,key,base,{mods,pb},modifierReport):base;
    // Keep class assignments available to core rules before feats/equipment are calculated.
    const assigned=(data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classLevels;
    if(Array.isArray(assigned))d.adobe={classLevels:assigned.filter(entry=>entry&&typeof entry.classId==='string').slice(0,8).map(entry=>({classId:entry.classId,level:number(entry.level,1,1,20),subclassId:String(entry.subclassId||'')})),classFeatureChoices:ClassChoices.normalize((data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).classFeatureChoices)};
    const backgroundFeatures=(data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}).backgroundFeatures;if(backgroundFeatures)d.adobe={...d.adobe,backgroundFeatures};
    const PersonalFeats=globalThis.CharacterPersonalFeats||(typeof require==='function'?require('./character-personal-feats'):null),personalFeats=PersonalFeats?.records(data)||{};if(Object.keys(personalFeats).length)d.adobe={...d.adobe,personalFeats};
    const effects = Rules.evaluate(d, level, Object.keys(skills));
    const languageTraining=(globalThis.CharacterLanguages||(typeof require==='function'?require('./character-languages'):null))?.apply(effects,d,{level});
    const classOrders=ClassChoices.orders(d,{level});
    effects.proficiencies=[...new Set([...effects.proficiencies,...classOrders.proficiencies])];
    const artificerFeatures=ClassChoices.artificerFeatures(d,{level,attunedCount:Equipment.attunementState(d,loot,level).active.size});
    effects.skills=[...new Set([...effects.skills,...artificerFeatures.skills])];
    const Colleges=globalThis.CharacterBardSubclasses||(typeof require==='function'?require('./character-bard-subclasses'):null),bardTraining=Colleges.derive(d,{level});
    effects.skills=[...new Set([...effects.skills,...bardTraining.skills])];effects.proficiencies=[...new Set([...effects.proficiencies,...bardTraining.proficiencies])];effects.languages=[...new Set([...(effects.languages||[]),...bardTraining.languages])];
    const saveTraining=ClassChoices.saveTraining(d,{level});
    if(artificerFeatures.soulOfArtifice)saveTraining.reports.push({id:'soul-of-artifice',name:'Soul of Artifice',classId:'artificer',abilities:[],detail:'All saving throws, including death saves, gain +'+artificerFeatures.saveBonus+' from '+artificerFeatures.attuned+' attuned magic items.'});
    effects.saves=[...new Set([...effects.saves,...saveTraining.abilities])];
    const invocationEffects=ClassChoices.invocationEffects(d,{level});
    effects.skills=[...new Set([...effects.skills,...invocationEffects.skills])];
    effects.specialSenses=[...(effects.specialSenses||[]),...invocationEffects.senses];
    if(invocationEffects.truesight)effects.truesight=Math.max(effects.truesight||0,invocationEffects.truesight);
    effects.concentrationAdvantage=!!effects.concentrationAdvantage||invocationEffects.concentrationAdvantage;
    const Domains=globalThis.CharacterClericSubclasses||(typeof require==='function'?require('./character-cleric-subclasses'):null),domainTraining=Domains.derive(d,{level,saves:effects.saves});
    effects.skills=[...new Set([...effects.skills,...domainTraining.skills])];effects.proficiencies=[...new Set([...effects.proficiencies,...domainTraining.proficiencies])];effects.saves=[...new Set([...effects.saves,...domainTraining.saves])];effects.languages=[...new Set([...(effects.languages||[]),...domainTraining.languages])];
    const artisanTool=ClassChoices.artisanTool(d,level);
    if(ClassChoices.artificerLevels(d,level).starting)effects.proficiencies=effects.proficiencies.filter(name=>name!=='Choose one artisan tool');
    if(artisanTool&&!effects.proficiencies.includes(artisanTool))effects.proficiencies.push(artisanTool);
    const scores = {};
    for (const key of Object.keys(abilities)) {
      scores[key] = Math.min(30, d.abilities[key] + (d.build.scoreMode === 'base' ? Math.min(effects.asi[key] || 0, Math.max(0, 20 - d.abilities[key])) : 0));
    }
    const originCon = scores.con;
    const feats=Feats.apply(d,level,effects,scores,Object.keys(skills),Rules.tools);
    const classAbilityFeatures=ClassChoices.abilityFeatures(d,{level}).map(feature=>{
      const appliedAbilityIncreases={};for(const key of feature.abilities){const increase=d.build.scoreMode==='base'?Math.max(0,Math.min(feature.increase,feature.max-scores[key])):0;appliedAbilityIncreases[key]=increase;scores[key]+=increase;}
      return{...feature,appliedAbilityIncreases,automatic:d.build.scoreMode==='base'};
    });
    const classExpertise=ClassChoices.expertise(d,{level,effects,feats});
    classExpertise.skills=[...new Set([...classExpertise.skills,...domainTraining.expertise])];
    const weaponTraining=ClassChoices.weaponTraining(d,{level,effects,feats});
    effects.proficiencies=[...new Set([...effects.proficiencies,...weaponTraining.proficiencies])];
    const baseWalkingSpeed=Number(effects.speed)||0;
    const magicItems=Magic?Magic.apply(d,scores,effects,loot,level):{active:[],reports:[],warnings:[]};
    if(d.build.scoreMode==='base')effects.hpBonus+=Math.max(1,Math.min(20,Number(level)||1))*(mod(scores.con)-mod(originCon));
    for(const key of Object.keys(abilities))mods[key]=mod(scores[key]);
    const saveAll=bonus('save.all'),skillAll=bonus('skill.all');
    for (const key of Object.keys(abilities)) {
      mods[key] = mod(scores[key]);
      saves[key] = mods[key] + (d.saves[key].proficient || effects.saves.includes(key) ? pb : 0) + bonus('save.'+key,d.saves[key].bonus)+saveAll + artificerFeatures.saveBonus;
    }
    const Aura=globalThis.CharacterPaladinAuras||(typeof require==='function'?require('./character-paladin-auras'):null),paladinAuras=Aura.derive(d,{level,mods});for(const key of Object.keys(saves))saves[key]+=paladinAuras.bonus;
    classOrders.skillBonuses={};for(const report of classOrders.reports){report.bonus=report.skills.length?Math.max(1,mods.wis):0;for(const key of report.skills)classOrders.skillBonuses[key]=(classOrders.skillBonuses[key]||0)+report.bonus;}
    const Check=globalThis.CharacterToolChecks||(typeof require==='function'?require('./character-tool-checks'):null);
    const PathSkills=globalThis.CharacterBarbarianSubclasses||(typeof require==='function'?require('./character-barbarian-subclasses'):null);effects.skills=[...new Set([...effects.skills,...PathSkills.derive(d,{level,mods}).skills])];
    for (const [key, [, ability]] of Object.entries(skills)){
      const rank=Math.max(d.skills[key].rank,effects.skills.includes(key)?1:0,feats.expertise.includes(key)?2:0,classExpertise.skills.includes(key)?2:0);
      checks[key]=mods[ability]+Math.max(Math.floor(pb*rank),rank>=1?0:Check.untrained(pb,effects,ability,'skill'))+bonus('skill.'+key,d.skills[key].bonus)+skillAll+(classOrders.skillBonuses[key]||0);
    }
    const toolTraining=ClassChoices.toolTraining(d,{level,effects,mods,classExpertise});
    const rangerFeatures=ClassChoices.rangerFeatures(d,{level,mods});
    effects.specialSenses=[...(effects.specialSenses||[]),...rangerFeatures.senses];
    if(rangerFeatures.blindsight)effects.blindsight=Math.max(effects.blindsight||0,rangerFeatures.blindsight);
    effects.ignoreUnseenAttackDisadvantage=!!effects.ignoreUnseenAttackDisadvantage||rangerFeatures.ignoreUnseenAttackDisadvantage;
    const Paths=globalThis.CharacterBarbarianSubclasses||(typeof require==='function'?require('./character-barbarian-subclasses'):null),barbarianSubclass=Paths.derive(d,{level,mods,languages:effects.languages});
    effects.languages=[...new Set([...(effects.languages||[]),...barbarianSubclass.languages])];
    effects.resistances=[...new Set([...(effects.resistances||[]),...barbarianSubclass.resistances])];
    for(const sense of barbarianSubclass.senses)effects[sense.type]=(effects[sense.type]||0)+sense.increase;
    effects.traits=[...(effects.traits||[]),...barbarianSubclass.reports.map(row=>row.name+' · '+row.detail),...barbarianSubclass.spells.map(row=>row.name+' · '+row.casting+(row.ability?' · '+row.ability.toUpperCase():''))];
    const bardSubclass=Colleges.derive(d,{level,mods});effects.traits=[...(effects.traits||[]),...bardSubclass.reports.map(row=>row.name+' · '+row.detail)];
    const clericSubclass=Domains.derive(d,{level,mods,saves:effects.saves});effects.resistances=[...new Set([...(effects.resistances||[]),...clericSubclass.resistances])];effects.immunities=[...new Set([...(effects.immunities||[]),...clericSubclass.immunities])];if(clericSubclass.darkvision)effects.darkvision=Math.max(effects.darkvision||0,clericSubclass.darkvision);effects.traits=[...(effects.traits||[]),...clericSubclass.reports.map(row=>row.name+' · '+row.detail)];
    const Circles=globalThis.CharacterDruidSubclasses||(typeof require==='function'?require('./character-druid-subclasses'):null),druidSubclass=Circles.derive(d,{level,mods});effects.languages=[...new Set([...(effects.languages||[]),...druidSubclass.languages])];effects.resistances=[...new Set([...(effects.resistances||[]),...druidSubclass.resistances])];effects.immunities=[...new Set([...(effects.immunities||[]),...druidSubclass.immunities])];effects.traits=[...(effects.traits||[]),...druidSubclass.reports.map(row=>row.name+' · '+row.detail)];
    const berserker=ClassChoices.berserker(d,{level,mods});
    const warDomain=ClassChoices.warDomain(d,{level,mods});
    const lifeDomain=ClassChoices.lifeDomain(d,{level});
    const lightDomain=ClassChoices.lightDomain(d,{level,mods});
    const tempestDomain=ClassChoices.tempestDomain(d,{level,mods});
    const natureDomain=ClassChoices.natureDomain(d,{level});
    const knowledgeDomain=ClassChoices.knowledgeDomain(d,{level,mods});
    const trickeryDomain=ClassChoices.trickeryDomain(d,{level});

    if(clericSubclass.pick('legacy-blessing')==='blessed-strikes'){for(const row of [warDomain,lifeDomain,tempestDomain,natureDomain,trickeryDomain])row.divineStrike=null;lightDomain.potentSpellcasting=null;knowledgeDomain.potentSpellcasting=null;}
    if(warDomain.avatar){effects.resistances=[...new Set([...(effects.resistances||[]),'Bludgeoning, Piercing, and Slashing (nonmagical attacks)'])];effects.traits=[...(effects.traits||[]),warDomain.avatar.detail];}
    if(warDomain.divineStrike)effects.traits=[...(effects.traits||[]),warDomain.divineStrike.detail];
    for(const detail of [lifeDomain.disciple,lifeDomain.blessedHealer,lifeDomain.divineStrike?.detail,lifeDomain.supremeHealing])if(detail)effects.traits=[...(effects.traits||[]),detail];
    for(const detail of [lightDomain.bonusCantrip,lightDomain.improvedFlare,lightDomain.potentSpellcasting,lightDomain.corona])if(detail)effects.traits=[...(effects.traits||[]),detail];
    for(const detail of [tempestDomain.wrath,tempestDomain.thunderbolt,tempestDomain.divineStrike?.detail,tempestDomain.stormborn])if(detail)effects.traits=[...(effects.traits||[]),detail];
    for(const detail of [natureDomain.acolyte,natureDomain.dampen,natureDomain.divineStrike?.detail,natureDomain.master])if(detail)effects.traits=[...(effects.traits||[]),detail];
    for(const detail of [knowledgeDomain.blessings,knowledgeDomain.potentSpellcasting,knowledgeDomain.visions])if(detail)effects.traits=[...(effects.traits||[]),detail];
    for(const detail of [trickeryDomain.blessing,trickeryDomain.divineStrike?.detail,trickeryDomain.improved])if(detail)effects.traits=[...(effects.traits||[]),detail];
    if(tempestDomain.stormborn)effects.conditionalSpeeds=[...(effects.conditionalSpeeds||[]),{type:'fly',speed:effects.speed||30,condition:'While not underground or indoors'}];
    const result = {
      effects,
      languageTraining,
      rangerFeatures,
      druidElementalFury:ClassChoices.elementalFury(d,{level,mods}),
      clericBlessedStrikes:ClassChoices.blessedStrikes(d,{level,mods}),
      berserker,
      barbarianSubclass,
      bardSubclass,
      clericSubclass,
      druidSubclass,
      warDomain,
      lifeDomain,
      lightDomain,
      tempestDomain,
      natureDomain,
      knowledgeDomain,
      trickeryDomain,
      clericIntervention:(globalThis.CharacterClericIntervention||(typeof require==='function'?require('./character-cleric-intervention'):null))?.summary(d,{level})||'',
      paladinAuras,
      attackAction:AttackProgression.derive(d,level),
      toolTraining,
      artificerFeatures,
      classAbilityFeatures,
      classOrders,
      saveTraining,
      deathSaveBonus:(saveTraining.deathSaveProficiency?pb:0)+artificerFeatures.saveBonus+paladinAuras.bonus,
      invocationEffects,
      cantripInvocations:ClassChoices.cantripInvocations(d,{level,mods}),
      classResources:ClassChoices.classResources(d,{level,mods,attunedCount:artificerFeatures.attuned}),
      classExpertise,
      weaponTraining,
      feats,
      ac: d.ac + feats.acBonus,
      scores,
      hpMax: d.hpMax + (d.build.scoreMode === 'base' ? effects.hpBonus : 0),
      pb,
      mods,
      saves,
      skills: checks,
      initiative: mods.dex + bonus('initiative',d.initiativeBonus) + (effects.initiativeBonus || 0) + (!effects.initiativeProficiency?Check.untrained(pb,effects,'dex','initiative'):0),
      passive: 10 + checks.perception + bonus('passive',d.passiveBonus) + feats.passiveBonus,
      spellAttack: mods[d.spellAbility] + pb + bonus('spell.attack',d.spellAttackBonus),
      spellDC: 8 + mods[d.spellAbility] + pb + bonus('dc.primary',d.spellDCBonus),
      attacks: d.attacks.map(a => mods[a.ability] + (a.proficient ? pb : 0) + a.bonus + (a.rangedWeapon ? feats.rangedBonus : 0))
    };
    result.magicItems=magicItems;
    const Carry=globalThis.CharacterCarrying||(typeof require==='function'?require('./character-carrying'):null);
    result.carrying=Carry.limits(data,{scores,effects});
    if(barbarianSubclass.carryMultiplier)for(const key of ['capacity','pushDragLift'])result.carrying[key]*=barbarianSubclass.carryMultiplier;
    result.gear=Equipment.derive(d,result,loot,level);
    if(Magic)result.gear=Magic.augmentGear(d,result.gear,magicItems);
    const acModifiers={magic:bonus('ac.magic'),misc1:bonus('ac.misc1'),misc2:bonus('ac.misc2')},extraAC=acModifiers.magic+acModifiers.misc1+acModifiers.misc2;result.gear.adjustment+=extraAC;result.gear.ac+=extraAC;result.ac=result.gear.ac;
    result.modifiers={ac:acModifiers,expressions:Override?Override.normalize(modifierExpressions):{},report:modifierReport,allSkills:skillAll,allSaves:saveAll,spellAttackBonus:bonus('spell.attack',d.spellAttackBonus),spellDCBonus:bonus('dc.primary',d.spellDCBonus)};
    const ItemResources=globalThis.CharacterItemResources||(typeof require==='function'?require('./character-item-resources'):null);
    result.itemResources=ItemResources?ItemResources.project(data,result.gear):[];
    const Movement=globalThis.CharacterClassMovement||(typeof require==='function'?require('./character-class-movement'):null);
    result.classMovement=Movement.apply(d,{level,effects,gear:result.gear,baseSpeed:baseWalkingSpeed,magicItems});
    for(const speed of barbarianSubclass.speeds)effects[speed.type]=Math.max(effects[speed.type]||0,speed.walking?effects.speed:speed.speed);
    for(const speed of druidSubclass.speeds)effects[speed.type]=Math.max(effects[speed.type]||0,speed.walking?effects.speed:speed.speed);
    result.druidCombat=Circles.apply(d,result,{level});
    result.clericCombat=Domains.apply(d,result,{level});
    result.bardCombat=Colleges.apply(d,result,{level});
    result.barbarianCombat=Paths.apply(d,result,{level});
    if(result.barbarianCombat.size)result.carrying=Carry.limits(data,{scores,effects});
    result.actions=Actions.derive(d,level,result,loot,Catalog.data?.spells||[]);
    if(Override){result.gear.attacks=result.gear.attacks.map(row=>Override.attack(row,'attack:gear:'+row.id,modifierExpressions,{mods,pb},level));result.manualAttacks=d.attacks.map((row,i)=>Override.attack({...row,hit:result.attacks[i]},'attack:attack:'+row.id,modifierExpressions,{mods,pb},level));result.attacks=result.manualAttacks.map((row,i)=>row.attack??result.attacks[i]);result.actions=result.actions.map((row,i)=>Override.attack(row,'attack:attack:'+d.actions[i]?.id,modifierExpressions,{mods,pb},level));}

    result.inventoryWeight=Carry.weight(data,result.gear.entries.map(row=>row.entry));
    result.weight=result.inventoryWeight;
    const PaperWeight=globalThis.CharacterPaperWeight||(typeof require==='function'?require('./character-paper-weight'):null);
    if(PaperWeight?.normalize(data.adobe?.paperWeight||data.rulesChoices?.grants?.__adobe?.data?.paperWeight).mode==='adobe'){
      const Fields=globalThis.CharacterPaperWeightFields||(typeof require==='function'?require('./character-paper-weight-fields'):null);
      result.paperWeight=PaperWeight.calculate(data.adobe?.paperWeight||data.rulesChoices?.grants?.__adobe?.data?.paperWeight,Fields.collect(data,result));result.weight=result.paperWeight.weight;
    }
    result.movement=Carry.movement(data,{limits:result.carrying,weight:result.weight,scores,effects,gear:result.gear,magicItems});
    Object.assign(effects,result.movement.speeds);
    if(Override)Override.dice({...d,adobe:data.adobe||data.rulesChoices?.grants?.__adobe?.data||{}},result);
    return result;
  }
  function damage(data, amount) {
    const d = normalize(data), n = number(amount, 0, 0);
    const absorbed = Math.min(n, d.hpTemp);
    d.hpTemp -= absorbed;
    d.hpCurrent = Math.max(0, d.hpCurrent - (n - absorbed));
    if(d.hpCurrent===0){const Paths=globalThis.CharacterBarbarianSubclasses||(typeof require==='function'?require('./character-barbarian-subclasses'):null);Paths.endDivineForm(d,{level:20});}
    return d;
  }
  function heal(data, amount, level = 1) {
    const d = normalize(data);
    if(d.hpCurrent===0){const Paths=globalThis.CharacterBarbarianSubclasses||(typeof require==='function'?require('./character-barbarian-subclasses'):null);Paths.endDivineForm(d,{level});}
    d.hpCurrent = Math.min(derive(d, level).hpMax, d.hpCurrent + number(amount, 0, 0));
    return d;
  }
  return {
    abilities,
    skills,
    textFields,
    numberFields,
    normalize,
    derive,
    mod,
    proficiency,
    pointBuy,
    pointBuyPresets,
    signed,
    damage,
    heal
  };
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = CharacterSheetModel;
