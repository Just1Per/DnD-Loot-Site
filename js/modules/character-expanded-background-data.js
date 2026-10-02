'use strict';
/* Additional first-party D&D background catalogue.
 * Names, source labels, feature/feat names and skill relationships are factual metadata.
 * Source-specific prose, equipment and unverified choice details are intentionally not copied. */
(()=>{
  const D=typeof CharacterBackgroundData!=='undefined'?CharacterBackgroundData:null;
  if(!D)return;
  D.sourceNames=Object.freeze({
    ...(D.sourceNames||{}),
    XPHB:'Player’s Handbook (2024)',PHB:'Player’s Handbook (2014)',
    SCAG:'Sword Coast Adventurer’s Guide',TOA:'Tomb of Annihilation',
    GOS:'Ghosts of Saltmarsh',BGDIA:'Baldur’s Gate: Descent into Avernus',
    COS:'Curse of Strahd',VRGR:'Van Richten’s Guide to Ravenloft',
    WBTW:'The Wild Beyond the Witchlight',SAIS:'Spelljammer: Adventures in Space',
    MOT:'Mythic Odysseys of Theros',BGG:'Bigby Presents: Glory of the Giants',
    PAITM:'Planescape: Adventures in the Multiverse',BOMT:'The Book of Many Things',
    AI:'Acquisitions Incorporated',GGR:'Guildmasters’ Guide to Ravnica',
    SCC:'Strixhaven: A Curriculum of Chaos',DSOTDQ:'Dragonlance: Shadow of the Dragon Queen',
    FRHOF:'Forgotten Realms: Heroes of Faerûn',EFOTA:'Eberron: Forge of the Artificer',
    RTHW:'Ravenloft: The Horrors Within',WGTE:'Wayfinder’s Guide to Eberron',
    LFL:'Lorwyn: First Light'
  });
  const rows={};
  const add=(id,name,edition,source,skills,feature='',extra={})=>{
    rows[id]={
      name,edition,source,skills:skills||[],fixedTools:[],toolChoices:[],languages:0,
      feature,partial:true,...extra
    };
  };

  // Sword Coast Adventurer's Guide
  add('city-watch-scag','City Watch','2014','SCAG',['athletics','insight'],'Watcher’s Eye');
  add('investigator-scag','Investigator (City Watch variant)','2014','SCAG',['investigation','insight'],'Watcher’s Eye');
  add('clan-crafter-scag','Clan Crafter','2014','SCAG',['history','insight'],'Respect of the Stout Folk');
  add('cloistered-scholar-scag','Cloistered Scholar','2014','SCAG',['history'],'Library Access',{skillOptions:['arcana','nature','religion'],skillChoiceCount:1});
  add('courtier-scag','Courtier','2014','SCAG',['insight','persuasion'],'Court Functionary');
  add('faction-agent-scag','Faction Agent','2014','SCAG',['insight'],'Safe Haven',{skillOptions:['arcana','history','investigation','nature','religion','animalHandling','medicine','perception','survival','deception','intimidation','performance','persuasion'],skillChoiceCount:1});
  add('far-traveler-scag','Far Traveler','2014','SCAG',['insight','perception'],'All Eyes on You');
  add('inheritor-scag','Inheritor','2014','SCAG',['survival'],'Inheritance',{skillOptions:['arcana','history','religion'],skillChoiceCount:1});
  add('knight-of-the-order-scag','Knight of the Order','2014','SCAG',['persuasion'],'Knightly Regard',{skillOptions:['arcana','history','nature','religion'],skillChoiceCount:1});
  add('mercenary-veteran-scag','Mercenary Veteran','2014','SCAG',['athletics','persuasion'],'Mercenary Life');
  add('urban-bounty-hunter-scag','Urban Bounty Hunter','2014','SCAG',[],'Ear to the Ground',{skillOptions:['deception','insight','persuasion','stealth'],skillChoiceCount:2});
  add('uthgardt-tribe-member-scag','Uthgardt Tribe Member','2014','SCAG',['athletics','survival'],'Uthgardt Heritage');
  add('waterdhavian-noble-scag','Waterdhavian Noble','2014','SCAG',['history','persuasion'],'Kept in Style');

  // Adventure and setting books
  add('anthropologist-toa','Anthropologist','2014','TOA',['insight','religion'],'Adept Linguist');
  add('archaeologist-toa','Archaeologist','2014','TOA',['history','survival'],'Historical Knowledge');
  add('fisher-gos','Fisher','2014','GOS',['history','survival'],'Harvest the Water');
  add('marine-gos','Marine','2014','GOS',['athletics','survival'],'Steady');
  add('shipwright-gos','Shipwright','2014','GOS',['history','perception'],'I’ll Patch It!');
  add('smuggler-gos','Smuggler','2014','GOS',['athletics','deception'],'Down Low');
  add('faceless-bgdia','Faceless','2014','BGDIA',['deception','intimidation'],'Dual Personalities');
  add('haunted-one-cos','Haunted One','2014','COS',[],'Heart of Darkness',{skillOptions:['arcana','investigation','religion','survival'],skillChoiceCount:2});
  add('investigator-vrgr','Investigator','2014','VRGR',[],'Official Inquiry',{skillOptions:['investigation','insight','perception'],skillChoiceCount:2});
  add('feylost-wbtw','Feylost','2014','WBTW',['deception','survival'],'Feywild Connection');
  add('witchlight-hand-wbtw','Witchlight Hand','2014','WBTW',['performance','sleightOfHand'],'Carnival Fixture');
  add('astral-drifter-sais','Astral Drifter','2014','SAIS',['insight','religion'],'Divine Contact');
  add('wildspacer-sais','Wildspacer','2014','SAIS',['athletics','survival'],'Wildspace Adaptation');
  add('athlete-mot','Athlete','2014','MOT',['athletics','acrobatics'],'Echoes of Victory');
  add('giant-foundling-bgg','Giant Foundling','2014','BGG',['intimidation','survival'],'Strike of the Giants');
  add('rune-carver-bgg','Rune Carver','2014','BGG',['history','perception'],'Rune Shaper');
  add('gate-warden-paitm','Gate Warden','2014','PAITM',['persuasion','survival'],'Planar Infusion');
  add('planar-philosopher-paitm','Planar Philosopher','2014','PAITM',['arcana'],'Conviction');
  add('rewarded-bomt','Rewarded','2014','BOMT',['insight','persuasion'],'Fortune’s Favor');
  add('ruined-bomt','Ruined','2014','BOMT',['stealth','survival'],'Still Standing');

  // Acquisitions Incorporated
  add('celebrity-adventurers-scion-ai','Celebrity Adventurer’s Scion','2014','AI',['perception','performance'],'Name Dropping');
  add('failed-merchant-ai','Failed Merchant','2014','AI',['investigation','persuasion'],'Supply Chain');
  add('gambler-ai','Gambler','2014','AI',['deception','insight'],'Never Tell Me the Odds');
  add('plaintiff-ai','Plaintiff','2014','AI',['medicine','persuasion'],'Legalese');
  add('rival-intern-ai','Rival Intern','2014','AI',['history','investigation'],'Inside Informant');

  // Guildmasters' Guide to Ravnica
  add('azorius-functionary-ggr','Azorius Functionary','2014','GGR',['insight','intimidation'],'Legal Authority');
  add('boros-legionnaire-ggr','Boros Legionnaire','2014','GGR',['athletics','intimidation'],'Legion Station');
  add('dimir-operative-ggr','Dimir Operative','2014','GGR',['deception','stealth'],'False Identity');
  add('golgari-agent-ggr','Golgari Agent','2014','GGR',['nature','survival'],'Undercity Paths');
  add('gruul-anarch-ggr','Gruul Anarch','2014','GGR',['animalHandling','athletics'],'Rubblebelt Refuge');
  add('izzet-engineer-ggr','Izzet Engineer','2014','GGR',['arcana','investigation'],'Urban Infrastructure');
  add('orzhov-representative-ggr','Orzhov Representative','2014','GGR',['intimidation','religion'],'Leverage');
  add('rakdos-cultist-ggr','Rakdos Cultist','2014','GGR',['acrobatics','performance'],'Fearsome Reputation');
  add('selesnya-initiate-ggr','Selesnya Initiate','2014','GGR',['nature','persuasion'],'Conclave’s Shelter');
  add('simic-scientist-ggr','Simic Scientist','2014','GGR',['arcana','medicine'],'Researcher');

  // Strixhaven
  add('lorehold-student-scc','Lorehold Student','2014','SCC',['history','religion'],'Lorehold Initiate');
  add('prismari-student-scc','Prismari Student','2014','SCC',['acrobatics','performance'],'Prismari Initiate');
  add('quandrix-student-scc','Quandrix Student','2014','SCC',['arcana','nature'],'Quandrix Initiate');
  add('silverquill-student-scc','Silverquill Student','2014','SCC',['intimidation','persuasion'],'Silverquill Initiate');
  add('witherbloom-student-scc','Witherbloom Student','2014','SCC',['nature','survival'],'Witherbloom Initiate');

  // Dragonlance
  add('knight-of-solamnia-dsotdq','Knight of Solamnia','2014','DSOTDQ',['athletics','survival'],'Squire of Solamnia');
  add('mage-of-high-sorcery-dsotdq','Mage of High Sorcery','2014','DSOTDQ',['arcana','history'],'Initiate of High Sorcery');

  // 2025 Forgotten Realms: Heroes of Faerûn
  const fr=(id,name,skills,feat)=>add(id,name,'2024','FRHOF',skills,'',{feat,fixedFeat:true});
  fr('chondathan-freebooter-frhof','Chondathan Freebooter',['athletics','sleightOfHand'],'Skilled');
  fr('dead-magic-dweller-frhof','Dead Magic Dweller',['medicine','survival'],'Healer');
  fr('dragon-cultist-frhof','Dragon Cultist',['deception','stealth'],'Cult of the Dragon Initiate');
  fr('emerald-enclave-caretaker-frhof','Emerald Enclave Caretaker',['nature','survival'],'Emerald Enclave Fledgling');
  fr('flaming-fist-mercenary-frhof','Flaming Fist Mercenary',['intimidation','perception'],'Tough');
  fr('genie-touched-frhof','Genie Touched',['perception','persuasion'],'Magic Initiate (Wizard)');
  fr('harper-frhof','Harper',['performance','sleightOfHand'],'Harper Agent');
  fr('ice-fisher-frhof','Ice Fisher',['animalHandling','athletics'],'Alert');
  fr('knight-of-the-gauntlet-frhof','Knight of the Gauntlet',['athletics','medicine'],'Tyro of the Gauntlet');
  fr('lords-alliance-vassal-frhof','Lords’ Alliance Vassal',['insight','persuasion'],'Lords’ Alliance Agent');
  fr('moonwell-pilgrim-frhof','Moonwell Pilgrim',['nature','performance'],'Magic Initiate (Druid)');
  fr('mulhorandi-tomb-raider-frhof','Mulhorandi Tomb Raider',['investigation','religion'],'Lucky');
  fr('mythalkeeper-frhof','Mythalkeeper',['arcana','history'],'Crafter');
  fr('purple-dragon-squire-frhof','Purple Dragon Squire',['animalHandling','insight'],'Purple Dragon Rook');
  fr('rashemi-wanderer-frhof','Rashemi Wanderer',['intimidation','perception'],'Tough');
  fr('shadowmasters-exile-frhof','Shadowmasters Exile',['acrobatics','stealth'],'Savage Attacker');
  fr('spellfire-initiate-frhof','Spellfire Initiate',['arcana','perception'],'Spellfire Spark');
  fr('zhentarim-mercenary-frhof','Zhentarim Mercenary',['intimidation','perception'],'Zhentarim Ruffian');

  // 2025 Eberron: Forge of the Artificer
  const eb=(id,name,skills,feat)=>add(id,name,'2024','EFOTA',skills,'',{feat,fixedFeat:true});
  eb('aberrant-heir-efota','Aberrant Heir',['history','intimidation'],'Aberrant Dragonmark');
  eb('archaeologist-efota','Archaeologist',['history','survival'],'Skilled');
  eb('house-agent-efota','House Agent',['investigation','persuasion'],'Lucky');
  eb('inquisitive-efota','Inquisitive',['insight','investigation'],'Alert');
  for(const row of [
    ['cannith','Cannith','investigation','sleightOfHand','Mark of Making'],
    ['deneith','Deneith','insight','perception','Mark of Sentinel'],
    ['ghallanda','Ghallanda','insight','persuasion','Mark of Hospitality'],
    ['jorasco','Jorasco','medicine','stealth','Mark of Healing'],
    ['kundarak','Kundarak','arcana','investigation','Mark of Warding'],
    ['lyrandar','Lyrandar','acrobatics','nature','Mark of Storm'],
    ['medani','Medani','insight','investigation','Mark of Detection'],
    ['orien','Orien','acrobatics','athletics','Mark of Passage'],
    ['phiarlan','Phiarlan','deception','stealth','Mark of Shadow'],
    ['sivis','Sivis','history','perception','Mark of Scribing'],
    ['tharashk','Tharashk','perception','survival','Mark of Finding'],
    ['thuranni','Thuranni','performance','stealth','Mark of Shadow'],
    ['vadalis','Vadalis','animalHandling','nature','Mark of Handling']
  ]) eb('house-'+row[0]+'-heir-efota','House '+row[1]+' Heir',[row[2],row[3]],row[4]);

  // 2026 Ravenloft: The Horrors Within
  const rv=(id,name,skills,feat)=>add(id,name,'2024','RTHW',skills,'',{feat,fixedFeat:true});
  rv('haunted-one-rthw','Haunted One',['arcana','survival'],'Survivor or a Dark Gift feat');
  rv('investigator-rthw','Investigator',['insight','investigation'],'Sharp Eye or a Dark Gift feat');
  rv('mist-wanderer-rthw','Mist Wanderer',['survival','stealth'],'A Dark Gift feat');
  rv('spirit-medium-rthw','Spirit Medium',['insight','religion'],'A Dark Gift feat');


  // Baldur's Gate: Descent into Avernus background variants.
  for(const row of [
    ['acolyte-bgdia','Acolyte — Baldur’s Gate',['insight','religion'],'Shelter of the Faithful'],
    ['charlatan-bgdia','Charlatan — Baldur’s Gate',['deception','sleightOfHand'],'False Identity'],
    ['criminal-bgdia','Criminal — Baldur’s Gate',['deception','stealth'],'Criminal Contact'],
    ['entertainer-bgdia','Entertainer — Baldur’s Gate',['acrobatics','performance'],'By Popular Demand'],
    ['folk-hero-bgdia','Folk Hero — Baldur’s Gate',['animalHandling','survival'],'Rustic Hospitality'],
    ['guild-artisan-bgdia','Guild Artisan — Baldur’s Gate',['insight','persuasion'],'Guild Membership'],
    ['hermit-bgdia','Hermit — Baldur’s Gate',['medicine','religion'],'Discovery'],
    ['noble-bgdia','Noble — Baldur’s Gate',['history','persuasion'],'Position of Privilege'],
    ['outlander-bgdia','Outlander — Baldur’s Gate',['athletics','survival'],'Wanderer'],
    ['sage-bgdia','Sage — Baldur’s Gate',['arcana','history'],'Researcher'],
    ['sailor-bgdia','Sailor — Baldur’s Gate',['athletics','perception'],'Ship’s Passage'],
    ['soldier-bgdia','Soldier — Baldur’s Gate',['athletics','intimidation'],'Military Rank'],
    ['urchin-bgdia','Urchin — Baldur’s Gate',['sleightOfHand','stealth'],'City Secrets']
  ]) add(row[0],row[1],'2014','BGDIA',row[2],row[3]);

  // Wayfinder's Guide to Eberron legacy House Agent variants.
  for(const house of ['Cannith','Deneith','Ghallanda','Jorasco','Kundarak','Lyrandar','Medani','Orien','Phiarlan','Sivis','Tharashk','Thuranni','Vadalis'])
    add('house-agent-'+house.toLowerCase()+'-wgte','House Agent ('+house+')','2014','WGTE',['investigation','persuasion'],'House Connections');

  // Lorwyn: First Light current backgrounds.
  add('lorwyn-expert-lfl','Lorwyn Expert','2024','LFL',['athletics','nature'],'',{feat:'Child of the Sun',fixedFeat:true});
  add('shadowmoor-expert-lfl','Shadowmoor Expert','2024','LFL',['acrobatics','deception'],'',{feat:'Shadowmoor Hexer',fixedFeat:true});

  D.expanded=Object.freeze(rows);
})();