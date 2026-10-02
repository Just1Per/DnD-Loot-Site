'use strict';
/* Additional first-party D&D species/race entries that are absent from the base catalogue.
 * Conditional/source-specific features are summarized briefly and remain manual unless the shared engine already understands them. */
(()=>{
  const C=typeof CharacterRaceCatalog!=='undefined'?CharacterRaceCatalog:null;
  if(!C)return;
  Object.assign(C.sources,{
    FTD:'Fizban’s Treasury of Dragons',
    SCAG:'Sword Coast Adventurer’s Guide',
    EGW:'Explorer’s Guide to Wildemount',
    EFOTA:'Eberron: Forge of the Artificer',
    RTHW:'Ravenloft: The Horrors Within',
    LFL:'Lorwyn: First Light'
  });
  const baseExtend=C.extend;
  C.extend=function(races){
    baseExtend(races);
    const add=(id,name,edition,book,category,extra={})=>{
      races[id]={
        name,edition,book,source:C.sources[book]||book,category,
        asi:{},flexible:edition==='2014',languages:[],creatureType:'Humanoid',
        speed:30,size:'Medium',traits:[],partial:false,...extra
      };
    };

    // Monsters of the Multiverse options previously missing from the web catalogue.
    add('sea-elf-mpmm','Sea Elf','2014','MPMM','Exotic',{
      sizeChoice:true,darkvision:60,swim:30,resistances:['Cold'],skills:['perception'],
      traits:[
        'Child of the Sea: breathe air and water; swimming speed equals walking speed.',
        'Fey Ancestry and Trance use the normal elf rules.',
        'Friend of the Sea: communicate simple ideas with swimming beasts.'
      ]
    });
    add('shadar-kai-mpmm','Shadar-kai','2014','MPMM','Exotic',{
      sizeChoice:true,darkvision:60,resistances:['Necrotic'],skills:['perception'],
      traits:[
        'Blessing of the Raven Queen: bonus-action teleport up to 30 ft; uses scale with proficiency bonus and refresh on a long rest.',
        'From 3rd level, the teleport briefly grants resistance to damage.',
        'Fey Ancestry and Trance use the normal elf rules.'
      ]
    });

    // Sword Coast option.
    add('feral-tiefling-scag','Feral Tiefling','2014','SCAG','Setting specific',{
      asi:{dex:2,int:1},flexible:false,darkvision:60,resistances:['Fire'],languages:['Common','Infernal'],
      traits:['Hellish Resistance and Infernal Legacy use the legacy Tiefling rules.']
    });

    // Fizban's three dragonborn variants. Ancestry-specific details remain selectable/reference-driven.
    add('chromatic-dragonborn-ftd','Chromatic Dragonborn','2014','FTD','Exotic',{
      sizeChoice:true,
      optionChoices:Object.fromEntries(['black','blue','green','red','white'].map(name=>[name,{name:name[0].toUpperCase()+name.slice(1)+' ancestry'}])),
      traits:[
        'Choose a chromatic ancestry for breath damage and matching resistance.',
        'Breath Weapon can replace one attack in the Attack action and scales with level.',
        'Chromatic Warding at 5th level can grant temporary immunity to the ancestry damage type.'
      ]
    });
    add('gem-dragonborn-ftd','Gem Dragonborn','2014','FTD','Exotic',{
      sizeChoice:true,
      optionChoices:Object.fromEntries(['amethyst','crystal','emerald','sapphire','topaz'].map(name=>[name,{name:name[0].toUpperCase()+name.slice(1)+' ancestry'}])),
      traits:[
        'Choose a gem ancestry for breath damage and matching resistance.',
        'Psionic Mind permits limited telepathic communication.',
        'Gem Flight becomes available at 5th level.'
      ]
    });
    add('metallic-dragonborn-ftd','Metallic Dragonborn','2014','FTD','Exotic',{
      sizeChoice:true,
      optionChoices:Object.fromEntries(['brass','bronze','copper','gold','silver'].map(name=>[name,{name:name[0].toUpperCase()+name.slice(1)+' ancestry'}])),
      traits:[
        'Choose a metallic ancestry for breath damage and matching resistance.',
        'Breath Weapon can replace one attack in the Attack action and scales with level.',
        'Metallic Breath Weapon adds special breath options at 5th level.'
      ]
    });

    // Explorer's Guide to Wildemount setting variants.
    add('pallid-elf-egw','Pallid Elf','2014','EGW','Setting specific',{darkvision:60,skills:['insight','investigation'],traits:['Elf ancestry with Incisive Sense and lunar magic; source-specific spell details remain manual.'],partial:true});
    add('lotusden-halfling-egw','Lotusden Halfling','2014','EGW','Setting specific',{size:'Small',traits:['Halfling Luck, Brave and Nimbleness plus Child of the Wood magic; source-specific spell details remain manual.'],partial:true});
    add('draconblood-dragonborn-egw','Draconblood Dragonborn','2014','EGW','Setting specific',{traits:['Dragonborn ancestry with Forceful Presence; breath ancestry details remain manual.'],partial:true});
    add('ravenite-dragonborn-egw','Ravenite Dragonborn','2014','EGW','Setting specific',{darkvision:60,traits:['Dragonborn ancestry with Vengeful Assault; breath ancestry details remain manual.'],partial:true});
    add('orc-of-exandria-egw','Orc of Exandria','2014','EGW','Setting specific',{darkvision:60,traits:['Aggressive, Powerful Build and Primal Intuition; conditional details remain manual.'],partial:true});

    // Current Eberron options.
    add('changeling-efota','Changeling','2024','EFOTA','2024',{creatureType:'Fey',sizeChoice:true,traits:['Changeling Instincts and Shape-Shifter; Charisma checks benefit while shape-shifted.'],partial:true});
    add('kalashtar-efota','Kalashtar','2024','EFOTA','2024',{creatureType:'Aberration',traits:['Dual Mind, Mental Discipline, Mindlink and Severed from Dreams.'],partial:true});
    add('khoravar-efota','Khoravar','2024','EFOTA','2024',{darkvision:60,skillCount:2,skillPool:'any',traits:['Fey Ancestry, Fey Gift, Lethargy Resilience and Skill Versatility.'],partial:true});
    add('shifter-efota','Shifter','2024','EFOTA','2024',{sizeChoice:true,darkvision:60,traits:['Bestial Instincts and Shifting.'],partial:true});
    add('warforged-efota','Warforged','2024','EFOTA','2024',{creatureType:'Construct',acBonus:1,traits:['Construct Resilience, Integrated Protection, Sentry’s Rest, Specialized Design and Tireless.'],partial:true});

    // Current Ravenloft options.
    add('dhampir-rthw','Dhampir','2024','RTHW','2024',{darkvision:60,climb:30,traits:['Spider Climb, Trace of Undeath and Vampiric Bite.'],partial:true});
    add('hexblood-rthw','Hexblood','2024','RTHW','2024',{creatureType:'Fey',darkvision:60,traits:['Eerie Token, Distant Message and Remote Viewing.'],partial:true});
    add('lupin-rthw','Lupin','2024','RTHW','2024',{darkvision:60,traits:['Feral Pounce, Howl and Werewolf Instincts.'],partial:true});
    add('reborn-rthw','Reborn','2024','RTHW','2024',{traits:['Escaped Death, Everlasting, Knowledge from a Past Life and Strange Endurance.'],partial:true});

    // Lorwyn: First Light current species. These are selectable now; source-specific
    // conditional mechanics stay manual until their rules adapters are added.
    for(const row of [
      ['boggart-lfl','Boggart','Humanoid',['Goblinoid','Darkvision','Fey Ancestry','Fury of the Small','Nimble Escape']],
      ['faerie-lfl','Faerie','Fey',['Faerie Magic','Flight']],
      ['flamekin-lfl','Flamekin','Humanoid',['Darkvision','Fire Resistance','Reach to the Blaze']],
      ['kithkin-lfl','Kithkin','Humanoid',['Brave','Kithkin Nimbleness','Luck','Naturally Stealthy']],
      ['lorwyn-changeling-lfl','Lorwyn Changeling','Humanoid',['Shape Self','Darkvision','Delightful Imitator','Unpredictable Movement']],
      ['lorwyn-elf-lfl','Lorwyn-Shadowmoor Elf','Humanoid',['Darkvision','Elven Lineage','Fey Ancestry','Keen Senses','Trance']],
      ['rimekin-lfl','Rimekin','Humanoid',['Cold Fire Magic','Cold Resistance','Darkvision']]
    ]) add(row[0],row[1],'2024','LFL','2024',{creatureType:row[2],traits:[row[3].join(', ')+'. Source-specific conditional details remain manual.'],partial:true});

    return races;
  };
})();