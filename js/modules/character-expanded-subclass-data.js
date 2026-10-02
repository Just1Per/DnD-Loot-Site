'use strict';
/* Expanded first-party D&D subclass catalogue.
 * Selection/source metadata is broader than automatic feature automation.
 * Existing Adobe baseline subclasses keep their current IDs for save compatibility. */
(()=>{
  const S=typeof CharacterSubclassData!=='undefined'?CharacterSubclassData:null;
  if(!S)return;
  const all=S.all;
  const sourceNames={
    PHB:'Player’s Handbook (2014)',PHB24:'Player’s Handbook (2024)',
    SCAG:'Sword Coast Adventurer’s Guide',XGE:'Xanathar’s Guide to Everything',
    TCE:'Tasha’s Cauldron of Everything',DMG:'Dungeon Master’s Guide',ERLW:'Eberron: Rising from the Last War',
    GGR:'Guildmasters’ Guide to Ravnica',EGW:'Explorer’s Guide to Wildemount',
    MOT:'Mythic Odysseys of Theros',FTD:'Fizban’s Treasury of Dragons',
    DSOTDQ:'Dragonlance: Shadow of the Dragon Queen',BGG:'Bigby Presents: Glory of the Giants',
    VRGR:'Van Richten’s Guide to Ravenloft',FRHOF:'Forgotten Realms: Heroes of Faerûn',
    RTHW:'Ravenloft: The Horrors Within',EFOTA:'Eberron: Forge of the Artificer'
  };
  const add=(id,classId,name,minimumLevel,edition,source,extra={})=>{
    if(all[id])return;
    all[id]={id,classId,name,minimumLevel,edition,source,sourceName:sourceNames[source]||source,automated:false,...extra};
  };

  // Remaining 2014 Player's Handbook subclasses not already in the Adobe baseline.
  for(const row of [
    ['totem-warrior','barbarian','Path of the Totem Warrior',3],
    ['valor','bard','College of Valor',3],
    ['knowledge-domain','cleric','Knowledge Domain',1],['light-domain','cleric','Light Domain',1],
    ['nature-domain','cleric','Nature Domain',1],['tempest-domain','cleric','Tempest Domain',1],
    ['trickery-domain','cleric','Trickery Domain',1],['war-domain','cleric','War Domain',1],
    ['moon','druid','Circle of the Moon',2],
    ['battle-master','fighter','Battle Master',3],['eldritch-knight','fighter','Eldritch Knight',3],
    ['shadow','monk','Way of Shadow',3],['four-elements','monk','Way of the Four Elements',3],
    ['ancients','paladin','Oath of the Ancients',3],['vengeance','paladin','Oath of Vengeance',3],
    ['beast-master','ranger','Beast Master',3],
    ['arcane-trickster','rogue','Arcane Trickster',3],['assassin','rogue','Assassin',3],
    ['wild-magic','sorcerer','Wild Magic',1],
    ['archfey','warlock','The Archfey',1],['great-old-one','warlock','The Great Old One',1],
    ['abjuration','wizard','School of Abjuration',2],['conjuration','wizard','School of Conjuration',2],
    ['divination','wizard','School of Divination',2],['enchantment','wizard','School of Enchantment',2],
    ['illusion','wizard','School of Illusion',2],['necromancy','wizard','School of Necromancy',2],
    ['transmutation','wizard','School of Transmutation',2]
  ]) add(...row,'2014','PHB');

  // Dungeon Master's Guide villainous options.
  add('death-domain','cleric','Death Domain',1,'2014','DMG');
  add('oathbreaker','paladin','Oathbreaker',3,'2014','DMG');

  // Legacy Artificer subclasses are catalogued for completeness; the base Artificer
  // class still needs its own web-engine implementation before these can be selected.
  add('alchemist-legacy','artificer','Alchemist',3,'2014','ERLW',{classPending:true});
  add('artillerist-legacy','artificer','Artillerist',3,'2014','ERLW',{classPending:true});
  add('battle-smith-legacy','artificer','Battle Smith',3,'2014','ERLW',{classPending:true});
  add('armorer-legacy','artificer','Armorer',3,'2014','TCE',{classPending:true});

  // Sword Coast Adventurer's Guide
  for(const row of [
    ['battlerager','barbarian','Path of the Battlerager',3],
    ['arcana-domain','cleric','Arcana Domain',1],
    ['purple-dragon-knight','fighter','Purple Dragon Knight',3],
    ['long-death','monk','Way of the Long Death',3],['sun-soul','monk','Way of the Sun Soul',3],
    ['crown','paladin','Oath of the Crown',3],
    ['mastermind','rogue','Mastermind',3],['swashbuckler','rogue','Swashbuckler',3],
    ['storm-sorcery','sorcerer','Storm Sorcery',1],
    ['undying','warlock','The Undying',1],['bladesinging','wizard','Bladesinging',2]
  ]) add(...row,'2014','SCAG');

  // Xanathar's Guide to Everything
  for(const row of [
    ['ancestral-guardian','barbarian','Path of the Ancestral Guardian',3],['storm-herald','barbarian','Path of the Storm Herald',3],['zealot','barbarian','Path of the Zealot',3],
    ['glamour','bard','College of Glamour',3],['swords','bard','College of Swords',3],['whispers','bard','College of Whispers',3],
    ['forge-domain','cleric','Forge Domain',1],['grave-domain','cleric','Grave Domain',1],
    ['dreams','druid','Circle of Dreams',2],['shepherd','druid','Circle of the Shepherd',2],
    ['arcane-archer','fighter','Arcane Archer',3],['cavalier','fighter','Cavalier',3],['samurai','fighter','Samurai',3],
    ['drunken-master','monk','Way of the Drunken Master',3],['kensei','monk','Way of the Kensei',3],
    ['conquest','paladin','Oath of Conquest',3],['redemption','paladin','Oath of Redemption',3],
    ['gloom-stalker','ranger','Gloom Stalker',3],['horizon-walker','ranger','Horizon Walker',3],['monster-slayer','ranger','Monster Slayer',3],
    ['inquisitive','rogue','Inquisitive',3],['scout','rogue','Scout',3],
    ['divine-soul','sorcerer','Divine Soul',1],['shadow-magic','sorcerer','Shadow Magic',1],
    ['celestial','warlock','The Celestial',1],['hexblade','warlock','The Hexblade',1],
    ['war-magic','wizard','War Magic',2]
  ]) add(...row,'2014','XGE');

  // Tasha's Cauldron of Everything
  for(const row of [
    ['beast','barbarian','Path of the Beast',3],['wild-magic-barbarian','barbarian','Path of Wild Magic',3],
    ['creation','bard','College of Creation',3],['eloquence','bard','College of Eloquence',3],
    ['order-domain','cleric','Order Domain',1],['peace-domain','cleric','Peace Domain',1],['twilight-domain','cleric','Twilight Domain',1],
    ['spores','druid','Circle of Spores',2],['stars','druid','Circle of Stars',2],['wildfire','druid','Circle of Wildfire',2],
    ['psi-warrior','fighter','Psi Warrior',3],['rune-knight','fighter','Rune Knight',3],
    ['astral-self','monk','Way of the Astral Self',3],['mercy','monk','Way of Mercy',3],
    ['glory','paladin','Oath of Glory',3],['watchers','paladin','Oath of the Watchers',3],
    ['fey-wanderer','ranger','Fey Wanderer',3],['swarmkeeper','ranger','Swarmkeeper',3],
    ['phantom','rogue','Phantom',3],['soulknife','rogue','Soulknife',3],
    ['aberrant-mind','sorcerer','Aberrant Mind',1],['clockwork-soul','sorcerer','Clockwork Soul',1],
    ['fathomless','warlock','The Fathomless',1],['genie','warlock','The Genie',1],
    ['scribes','wizard','Order of Scribes',2]
  ]) add(...row,'2014','TCE');

  // Other first-party 5e books.
  add('echo-knight','fighter','Echo Knight',3,'2014','EGW');
  add('chronurgy','wizard','Chronurgy Magic',2,'2014','EGW');
  add('graviturgy','wizard','Graviturgy Magic',2,'2014','EGW');
  add('spirits','bard','College of Spirits',3,'2014','VRGR');
  add('undead','warlock','The Undead',1,'2014','VRGR');
  add('ascendant-dragon','monk','Way of the Ascendant Dragon',3,'2014','FTD');
  add('drakewarden','ranger','Drakewarden',3,'2014','FTD');
  add('lunar-sorcery','sorcerer','Lunar Sorcery',1,'2014','DSOTDQ');
  add('giant','barbarian','Path of the Giant',3,'2014','BGG');

  // 2024 Player's Handbook: all 48 subclasses begin at class level 3.
  const p24={
    barbarian:[['berserker-2024','Path of the Berserker'],['wild-heart-2024','Path of the Wild Heart'],['world-tree-2024','Path of the World Tree'],['zealot-2024','Path of the Zealot']],
    bard:[['dance-2024','College of Dance'],['glamour-2024','College of Glamour'],['lore-2024','College of Lore'],['valor-2024','College of Valor']],
    cleric:[['life-domain-2024','Life Domain'],['light-domain-2024','Light Domain'],['trickery-domain-2024','Trickery Domain'],['war-domain-2024','War Domain']],
    druid:[['land-2024','Circle of the Land'],['moon-2024','Circle of the Moon'],['sea-2024','Circle of the Sea'],['stars-2024','Circle of the Stars']],
    fighter:[['battle-master-2024','Battle Master'],['champion-2024','Champion'],['eldritch-knight-2024','Eldritch Knight'],['psi-warrior-2024','Psi Warrior']],
    monk:[['mercy-2024','Warrior of Mercy'],['shadow-2024','Warrior of Shadow'],['elements-2024','Warrior of the Elements'],['open-hand-2024','Warrior of the Open Hand']],
    paladin:[['devotion-2024','Oath of Devotion'],['glory-2024','Oath of Glory'],['ancients-2024','Oath of the Ancients'],['vengeance-2024','Oath of Vengeance']],
    ranger:[['beast-master-2024','Beast Master'],['fey-wanderer-2024','Fey Wanderer'],['gloom-stalker-2024','Gloom Stalker'],['hunter-2024','Hunter']],
    rogue:[['arcane-trickster-2024','Arcane Trickster'],['assassin-2024','Assassin'],['soulknife-2024','Soulknife'],['thief-2024','Thief']],
    sorcerer:[['aberrant-sorcery-2024','Aberrant Sorcery'],['clockwork-sorcery-2024','Clockwork Sorcery'],['draconic-sorcery-2024','Draconic Sorcery'],['wild-magic-sorcery-2024','Wild Magic Sorcery']],
    warlock:[['archfey-patron-2024','Archfey Patron'],['celestial-patron-2024','Celestial Patron'],['fiend-patron-2024','Fiend Patron'],['great-old-one-patron-2024','Great Old One Patron']],
    wizard:[['abjurer-2024','Abjurer'],['diviner-2024','Diviner'],['evoker-2024','Evoker'],['illusionist-2024','Illusionist']]
  };
  for(const [classId,rows] of Object.entries(p24))for(const [id,name] of rows)add(id,classId,name,3,'2024','PHB24',{current:true});

  // 2025 Forgotten Realms: Heroes of Faerûn.
  for(const row of [
    ['college-of-the-moon-frhof','bard','College of the Moon'],
    ['knowledge-domain-frhof','cleric','Knowledge Domain'],
    ['banneret-frhof','fighter','Banneret'],
    ['noble-genies-frhof','paladin','Oath of the Noble Genies'],
    ['winter-walker-frhof','ranger','Winter Walker'],
    ['scion-of-the-three-frhof','rogue','Scion of the Three'],
    ['spellfire-sorcery-frhof','sorcerer','Spellfire Sorcery'],
    ['bladesinger-frhof','wizard','Bladesinger']
  ]) add(row[0],row[1],row[2],3,'2024','FRHOF',{current:true});

  // 2026 Ravenloft: The Horrors Within.
  for(const row of [
    ['spirits-rthw','bard','College of Spirits'],['grave-domain-rthw','cleric','Grave Domain'],
    ['hollow-warden-rthw','ranger','Hollow Warden'],['phantom-rthw','rogue','Phantom'],
    ['shadow-sorcery-rthw','sorcerer','Shadow Sorcery'],['undead-patron-rthw','warlock','Undead Patron']
  ]) add(row[0],row[1],row[2],3,'2024','RTHW',{current:true});
  // Stored for catalogue completeness; Artificer itself is not yet a selectable base class in the web engine.
  add('reanimator-rthw','artificer','Reanimator',3,'2024','RTHW',{current:true,classPending:true});
  for(const row of [['alchemist-efota','Alchemist'],['armorer-efota','Armorer'],['artillerist-efota','Artillerist'],['battle-smith-efota','Battle Smith'],['cartographer-efota','Cartographer']])
    add(row[0],'artificer',row[1],3,'2024','EFOTA',{current:true,classPending:true});

  // Older subclasses remain selectable as explicitly labelled legacy options on a 2024 class.
  // The 2024 class chassis standardizes subclass selection at class level 3.
  const effectiveMinimum=(row,edition)=>edition==='2024'&&row.edition==='2014'?Math.max(3,row.minimumLevel):row.minimumLevel;
  const compatible=(row,edition)=>{
    if(!row)return false;
    return edition==='2014' ? row.edition==='2014' : (row.edition==='2014'||row.edition==='2024');
  };
  const optionsFor=(classId,level,edition)=>Object.values(all)
    .filter(row=>row.classId===classId&&compatible(row,edition)&&Number(level||0)>=effectiveMinimum(row,edition))
    .sort((a,b)=>{
      const core=edition==='2024'?'PHB24':'PHB';
      const priority=row=>row.source===core?0:row.edition===edition?1:2;
      return priority(a)-priority(b)||a.source.localeCompare(b.source)||a.name.localeCompare(b.name);
    });
  const sourceLabel=row=>row?.sourceName||sourceNames[row?.source]||row?.source||'D&D';

  Object.assign(S,{sourceNames,effectiveMinimum,compatible,optionsFor,sourceLabel});
})();