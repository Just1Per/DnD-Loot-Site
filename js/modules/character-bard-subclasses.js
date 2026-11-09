'use strict';
// Original summaries checked against pinned 5etools class-bard.json (b906158).
var CharacterBardSubclasses=(()=>{
 const R=globalThis.CharacterSubclassMechanics||(typeof require==='function'?require('./character-subclass-mechanics'):null);
 const ids={'2014':['lore','valor','glamour','swords','whispers','creation','eloquence','spirits'],'2024':['dance-2024','glamour-2024','lore-2024','valor-2024','college-of-the-moon-frhof','spirits-rthw']};
 const skills=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
 for(const [edition,id]of [['2014','lore'],['2024','lore-2024']]){R.group(edition,'bard',id,'bonus-skills',3,skills,3);R.group(edition,'bard',id,'magical-secrets',6,(e)=>R.spellOptions(e,edition,{classes:edition==='2024'?['cleric','druid','wizard']:null}),2);}
 R.group('2014','bard','swords','fighting-style',3,['Dueling','Two-Weapon Fighting']);
 R.group('2024','bard','college-of-the-moon-frhof','primal-skill',3,['Animal Handling','Insight','Medicine','Nature','Perception','Survival']);
 R.group('2024','bard','college-of-the-moon-frhof','primal-cantrip',3,(e)=>R.spellOptions(e,'2024',{classes:['druid'],cantrip:true}));
 R.group('2014','bard','spirits','session-participants',6,['1','2','3','4','5','6']);
 R.group('2014','bard','spirits','spirit-session',6,(e)=>R.spellOptions(e,'2014',{schools:['divination','necromancy','d','n'],maxLevel:Math.min(6,Math.ceil(e.level/2))}));
 const tales={
  '2014':[
   ['Clever Animal','10 minutes: add an Inspiration-sized die to Intelligence, Wisdom and Charisma checks.'],
   ['Renowned Duelist','Melee spell attack: 2 Inspiration dice + CHA Force on hit.'],
   ['Beloved Friends','Target and one visible creature within 5 ft gain one Inspiration die + CHA temporary HP.'],
   ['Runaway','Target may Reaction-teleport 30 ft; up to CHA (minimum 0) visible creatures within 30 ft of it may do likewise.'],
   ['Avenger','1 minute: creatures hitting target with melee attacks take one Inspiration die Force.'],
   ['Traveler','One Inspiration die + Bard level temporary HP; while they remain, +10 ft walking speed and +1 AC.'],
   ['Beguiler','Wisdom save: failure takes 2 Inspiration dice Psychic and is Incapacitated until its next turn ends.'],
   ['Phantom','Invisible until next turn ends or it hits; a hit during this invisibility adds one Inspiration die Necrotic and Frightens victim until its next turn ends.'],
   ['Brute','Chosen visible creatures within 30 ft of target: Strength save or 3 Inspiration dice Thunder and Prone; success half damage only.'],
   ['Dragon','30-ft cone from target: Dexterity save or 4 Inspiration dice Fire; success half.'],
   ['Angel','Heal 2 Inspiration dice + CHA; end one of Blinded, Deafened, Paralyzed, Petrified or Poisoned.'],
   ['Mind-Bender','Intelligence save or 3 Inspiration dice Psychic and Stunned until its next turn ends.']
  ],
  '2024':[
   ['Beloved','Heal one Inspiration die + CHA HP.'],['Sharpshooter','One Inspiration die + CHA Force damage.'],
   ['Avenger','Until your next turn ends, melee attackers hitting target take one Inspiration die Force.'],
   ['Renegade','Target may Reaction-teleport to a visible empty space within 30 ft.'],
   ['Fortune Teller','Advantage on d20 Tests until your next turn starts.'],
   ['Wayfarer','One Inspiration die + Bard level temporary HP; +10 ft speed while they remain.'],
   ['Trickster','Wisdom save: 2 Inspiration dice Psychic and Charmed until your next turn starts; success half damage only.'],
   ['Shade','Invisible until next turn ends or it attacks, deals damage or casts; when invisibility ends, creatures within 5 ft Con-save or take 2 Inspiration dice Necrotic.'],
   ['Arsonist','Dexterity save: 4 Inspiration dice Fire; success half.'],
   ['Coward','Target and chosen creatures within 30 ft: Wisdom save or Frightened until your next turn starts; speed halved, either action or Bonus Action.'],
   ['Brute','Chosen creatures within 30 ft: Strength save or 3 Inspiration dice Thunder and Prone; success half damage only.'],
   ['Priest','Heal 2 Inspiration dice; end one of Blinded, Charmed, Deafened, Paralyzed, Poisoned or Stunned.']
  ]
 };
 function derive(d,opts={}){
  const c=R.context(d,'bard',opts),n=c.level,cha=c.mod('cha'),die=n>=15?12:n>=10?10:n>=5?8:6,active=n>=3&&ids[c.edition].includes(c.id),out={...c,active,die,skills:[],proficiencies:[],languages:[],spells:[],reports:[],resources:[],actions:[]};if(!active)return out;
  const note=(at,name,detail,extra={})=>{if(n>=at)out.reports.push({level:at,name,detail,...extra});};
  const pool=(at,id,name,max,resets,detail,extra={})=>{if(n>=at){out.resources.push(R.resource(c,id,name,max,resets,detail,extra));note(at,name,detail);}};
  const action=(at,id,name,detail,extra={})=>{if(n>=at){out.actions.push({id,name,detail,...extra});note(at,name,detail);}};
  const grant=(at,name,restriction='always prepared',extra={})=>{if(n>=at){const spell=R.catalogue().find(s=>s.name.toLowerCase()===name.toLowerCase()&&s.edition===c.edition);if(spell)out.spells.push({...spell,grantSource:'bard / '+c.id,castingRestriction:restriction,...extra});}};
  if(['lore','lore-2024'].includes(c.id)){
   out.skills=[...new Set(c.picks('bonus-skills').filter(s=>skills.some(name=>R.slug(name)===s)).slice(0,3))].map(s=>s==='animal-handling'?'animalHandling':s==='sleight-of-hand'?'sleightOfHand':s);
   note(3,'Bonus Proficiencies','Choose three skill proficiencies in Builder.');
   action(3,'cutting-words','Cutting Words','Reaction, visible creature within 60 ft: spend Inspiration and subtract 1d'+die+' from '+(c.modern?'damage or a successful attack/check.':'an attack, check or damage roll before the outcome; must hear you and not be immune to Charmed.'),{cost:1,modifier:-1});
   note(6,c.modern?'Magical Discoveries':'Additional Magical Secrets','Choose two reachable spells/cantrips '+(c.modern?'from Cleric, Druid or Wizard; always prepared.':'from any class; additional to spells known.')+' They use Bard casting.');
   if(n>=6)out.spells.push(...R.selectedSpells(c,'magical-secrets',R.spellOptions({level:n},c.edition,{classes:c.modern?['cleric','druid','wizard']:null}),2));
   action(14,'peerless-skill','Peerless Skill',c.modern?'After a failed check or attack, add an Inspiration die. Spend the use only if the new result succeeds.':'After an ability-check roll, before the outcome, spend Inspiration and add its die.',{cost:1,modifier:1,refundOnFailure:c.modern});
  }
  if(['valor','valor-2024'].includes(c.id)){
   out.proficiencies.push('Medium armor','Shields','Martial weapons');note(3,c.modern?'Martial Training':'Bonus Proficiencies','Medium armor, Shields and Martial weapons.'+(c.modern?' Simple/Martial weapons may be Bard spellcasting focuses.':''));
   note(3,'Combat Inspiration','A recipient may use your die for '+(c.modern?'attack damage after a hit, or Reaction AC after being hit.':'weapon damage, or Reaction AC after the attack roll but before its outcome.')+' No second Inspiration use is spent.');
   note(6,'Extra Attack','Two attacks with your Attack action.'+(c.modern?' Replace one with an action-casting-time cantrip.':''));
   note(14,'Battle Magic','After '+(c.modern?'casting an action-casting-time spell':'using your action to cast a Bard spell')+', Bonus Action one weapon attack.');
  }
  if(['glamour','glamour-2024'].includes(c.id)){
   if(c.modern){grant(3,'Charm Person');grant(3,'Mirror Image');pool(3,'beguiling-magic','Beguiling Magic',1,['long'],'After a slotted Enchantment/Illusion spell, visible creature within 60 ft: Wisdom save DC '+c.dc('cha')+' or Charmed/Frightened for 1 minute, repeat each turn end. One Inspiration restores this use.',{inspirationRecharge:true});}
   else pool(3,'enthralling-performance','Enthralling Performance',1,['short','long'],'After a 1-minute performance, up to '+Math.max(1,cha)+' humanoids within 60 ft who watched/heard it: Wisdom save DC '+c.dc('cha')+' or Charmed for 1 hour. Ends on damage, your attack, or witnessing you harm an ally; success reveals no attempt.');
   action(3,'mantle-inspiration','Mantle of Inspiration','Bonus Action: spend Inspiration. Up to '+Math.max(1,cha)+(c.modern?' other creatures':' visible creatures who can see you')+' within 60 ft gain '+(c.modern?'twice the die roll':n>=15?14:n>=10?11:n>=5?8:5)+' temporary HP; each may Reaction-move its speed without opportunity attacks.',{cost:1,temporaryHP:c.modern?null:n>=15?14:n>=10?11:n>=5?8:5});
   pool(6,'mantle-majesty','Mantle of Majesty',1,['long'],'Bonus Action Command without a slot; for 1 minute with Concentration repeat it as a Bonus Action each turn. Targets Charmed by you fail automatically.'+(c.modern?' A level 3+ slot restores the use.':''),{slotRecharge:c.modern?3:0});grant(6,'Command',c.modern?'always prepared; Mantle of Majesty free casts':'Mantle of Majesty free casts only');
   pool(14,'unbreakable-majesty','Unbreakable Majesty',1,['short','long'],'Bonus Action: 1 minute, ends if Incapacitated. '+(c.modern?'First attack hit against you on each turn: attacker Charisma save DC '+c.dc('cha')+' or the hit misses.':'First attempt to attack you on each turn: Charisma save DC '+c.dc('cha')+' or choose another target/waste attack; on success, disadvantage on saves against your spells next turn.'));
  }
  if(c.id==='swords'){
   out.proficiencies.push('Medium armor','Scimitar');note(3,'Bonus Proficiencies','Medium armor and Scimitar; trained melee weapons can be Bard focuses.');note(3,'Fighting Style','Choose Dueling or Two-Weapon Fighting in Builder.');
   for(const [id,name]of [['defensive-flourish','Defensive Flourish'],['slashing-flourish','Slashing Flourish'],['mobile-flourish','Mobile Flourish']])action(3,id,name,'Once on your turn, an Attack-action weapon hit: spend Inspiration; add its roll to damage. '+(id==='defensive-flourish'?'Also add the roll to AC until your next turn.':id==='slashing-flourish'?'Also deal that extra damage to one other visible creature within 5 ft of you.':'Push up to 5 + roll ft; you may Reaction-move your speed to a space within 5 ft of the target.'),{cost:1,once:true});
   note(3,'Blade Flourish','Taking the Attack action adds 10 ft walking speed for the rest of that turn.');note(6,'Extra Attack','Two attacks with your Attack action.');note(14,"Master's Flourish",'Use 1d6 instead of spending an Inspiration use for any flourish.');
  }
  if(c.id==='whispers'){
   action(3,'psychic-blades','Psychic Blades','Once per round on your turn, a weapon hit can spend Inspiration for '+(n>=15?8:n>=10?5:n>=5?3:2)+'d6 Psychic damage.',{cost:1,once:true,damageDice:n>=15?8:n>=10?5:n>=5?3:2});
   pool(3,'words-terror','Words of Terror',1,['short','long'],'Speak alone with a humanoid for 1 minute: Wisdom save DC '+c.dc('cha')+' or Frightened of your chosen creature for 1 hour. Ends on attack/damage to target or witnessed harm to allies; successful target notices no attempt.');
   pool(6,'mantle-whispers','Mantle of Whispers',1,['short','long'],'Reaction when a humanoid dies within 30 ft: capture its shadow until used or Long Rest. Action to disguise as it for 1 hour, end as Bonus Action. Learn casual memories, not secrets; +5 Deception in the contested Insight check.');
   pool(14,'shadow-lore','Shadow Lore',1,['long'],'Action, one creature within 30 ft: Wisdom save DC '+c.dc('cha')+'; auto-success if it cannot hear or share a language. Failure: Charmed for 8 hours; ends if you/allies attack, damage, or force its save. Obeys safe requests; no forced combat or self-endangerment.');
  }
  if(c.id==='creation'){
   note(3,'Mote of Potential','When your Inspiration is used: check may reroll the Inspiration die and choose; attack causes chosen creatures within 5 ft of target to Con-save DC '+c.dc('cha')+' or take the die roll as Thunder; save grants die roll + '+cha+' temporary HP (minimum 1).');
   pool(3,'performance-creation','Performance of Creation',1,['long'],'Action, empty supported space within 10 ft: create nonmagical '+(n>=14?'Huge':n>=6?'Large':'Medium')+' or smaller item, lasting '+c.pb+' hours. '+(n>=14?'Up to '+Math.max(2,cha)+' items, only one maximum-sized and others Small/Tiny; no value cap.':'Value cap '+20*n+' gp; only one item at a time.')+' May spend a level 2+ slot instead.',{slotAlternative:2});
   pool(6,'animating-performance','Animating Performance',1,['long'],'Action, unattended Large-or-smaller nonmagical item within 30 ft: Dancing Item for 1 hour, until 0 HP or your death. Acts after you, Dodges unless Bonus Action commanded; Inspiration Bonus Action can also command. Level 3+ slot can replace the free use.',{slotAlternative:3});note(14,'Creative Crescendo','Performance of Creation gains multiple objects and loses its value cap.');
  }
  if(c.id==='eloquence'){
   out.minimumCheckRoll={deception:10,persuasion:10};note(3,'Silver Tongue','For Charisma Deception/Persuasion checks, treat raw d20 results below 10 as 10.');
   action(3,'unsettling-words','Unsettling Words','Bonus Action, visible creature within 60 ft: spend Inspiration and subtract its roll from its next save before your next turn starts.',{cost:1,modifier:-1});
   note(6,'Unfailing Inspiration','A failed check, attack or save retains your Inspiration die.');pool(6,'universal-speech','Universal Speech',1,['long'],'Action: up to '+Math.max(1,cha)+' creatures within 60 ft understand your speech for 1 hour. A spell slot can replace the free use.',{slotAlternative:1});
   pool(14,'infectious-inspiration','Infectious Inspiration',Math.max(1,cha),['long'],'Reaction after a creature within 60 ft succeeds using your Inspiration: give a free die to a different other creature within 60 ft that hears you. Does not spend the Inspiration pool.');
  }
  if(c.id==='dance-2024'){
   note(3,'Dazzling Footwork','While wearing no armor and wielding no shield: dancing Performance advantage, AC 10 + DEX + CHA, agile strikes, and unarmed Bardic damage.');note(3,'Agile Strikes','After spending Inspiration as part of an action, Bonus Action or Reaction, one Unarmed Strike as part of it.');note(3,'Bardic Damage','Unarmed attacks may use Dexterity; damage may be 1d'+die+' + DEX without spending Inspiration.');note(3,'Unarmored Defense','Base AC 10 + Dexterity + Charisma; use one eligible armor formula.');note(3,'Dance Virtuoso','Advantage on Charisma Performance involving dancing, while unarmored and without a shield.');
   action(6,'inspiring-movement','Inspiring Movement','Reaction when a visible enemy ends its turn within 5 ft: spend Inspiration, move half speed; one ally within 30 ft may Reaction-move half speed. Neither provokes opportunity attacks.',{cost:1});
   action(6,'tandem-footwork','Tandem Footwork','On Initiative, while not Incapacitated: spend Inspiration and add its roll to your Initiative and allies within 30 ft who see/hear you.',{cost:1,modifier:1});note(14,'Leading Evasion','Dexterity half-damage saves: no damage on success, half on failure. May share with creatures within 5 ft making the same save. Unavailable while Incapacitated.');
  }
  if(c.id==='college-of-the-moon-frhof'){
   out.languages.push('Druidic');out.skills=c.picks('primal-skill').filter(id=>['animal-handling','insight','medicine','nature','perception','survival'].includes(id)).slice(0,1).map(id=>id==='animal-handling'?'animalHandling':id);out.spells.push(...R.selectedSpells(c,'primal-cantrip',R.spellOptions({level:n},c.edition,{classes:['druid'],cantrip:true}),1));note(3,'Primal Lore','Druidic, one chosen Druid cantrip as a Bard cantrip, and one chosen Primal Lore skill proficiency.');
   note(3,"Moon's Inspiration",'Giving Inspiration may also teleport you 30 ft and turn you Invisible until your next turn starts; ends early after an attack roll, damage or spell.');action(3,'lunar-vitality','Lunar Vitality','Once per turn when a spell heals a creature: spend Inspiration to add its die to healing and grant +10 ft speed until its next turn ends.'+(n>=14?' You may use a free d6 instead.':''),{cost:1,once:true});grant(6,'Moonbeam');pool(6,'blessing-moonlight','Blessing of Moonlight',1,['long'],'Modify a Moonbeam casting: glow dimly 5 ft; whenever a creature fails its save, heal another visible creature within 60 ft by 2d4.');note(14,"Eventide's Splendor",'Inspired Eclipse can also turn the Inspiration recipient Invisible until its next turn and let it Reaction-teleport 30 ft. Lunar Vitality gains the free d6 option.');
  }
  if(['spirits','spirits-rthw'].includes(c.id)){
   grant(3,'Guidance','cantrip; 60-ft range',{range:'60 feet'});note(3,c.modern?'Channeler':'Guiding Whispers','Guidance is a Bard cantrip with 60-ft range, additional to your cantrip allowance.');
   if(c.modern)out.proficiencies.push('Playing cards');note(3,'Spiritual Focus',c.modern?'Playing-card Gaming Set proficiency; cards, crystal/orb, candle or ink pen can focus Bard spells.':'Candle, crystal ball, skull, spirit board or Tarokka deck can focus Bard spells. At Bard 6, +1d6 to one damage/healing roll of a Bard spell cast through it.');
   action(3,'channel-spirit',c.modern?'Spirits from Beyond':'Tales from Beyond',c.modern?'Giving Inspiration also channels a random spirit using that die; alternatively Bonus Action spend Inspiration to choose a reachable spirit. Magic action unleashes at a visible target within 30 ft. Spirit expires on Short/Long Rest.':'Bonus Action with focus: spend Inspiration and roll a tale; Action releases it at a visible creature within 30 ft, possibly yourself. One held tale, replacing ends old effects; expires on Short/Long Rest.',{cost:1});
   if(c.modern){note(6,'Empowered Channeling','Once per turn, a slotted Bard spell gains 1d6 to one damage roll or total healing.');grant(6,'Spirit Guardians');pool(6,'spirit-guardians','Spiritual Manifestation · free cast',1,['long'],'Cast Spirit Guardians without a slot.');pool(6,'spirit-cover','Spiritual Manifestation · cover',1,['short','long'],'Modify a Spirit Guardians cast: you and allies in its emanation have Half Cover.');}
   else {pool(6,'spirit-session','Spirit Session',1,['long'],'After the hour-long ritual, activate the selected temporary spell; it expires on Long Rest. Verify participant count in Builder.');note(6,'Spirit Session','1-hour focus ritual with up to '+c.pb+' willing participants including you: temporarily learn one Divination/Necromancy spell of level no higher than participant count and your Bard slots. Known until starting Long Rest; once until then. Select the spell in Builder and verify participants.');}
   if(!c.modern&&n>=6&&c.used('spirit-session-uses')>0&&Number(c.pick('session-participants'))>=1&&Number(c.pick('session-participants'))<=c.pb)out.spells.push(...R.selectedSpells(c,'spirit-session',R.spellOptions({level:n},c.edition,{schools:['divination','necromancy','d','n'],maxLevel:Math.min(c.pb,Number(c.pick('session-participants')),Math.ceil(n/2))}),1));
   if(n>=6)action(6,'spirit-power','Spiritual spell bonus',c.modern?'Once per turn, a slotted Bard spell adds 1d6 to one damage roll or total healing.':'A Bard spell cast through your Spiritual Focus adds 1d6 to one damage or healing roll.',{cost:0,faces:6,once:c.modern});
   note(14,'Mystical Connection','Roll twice when channeling and choose either; doubles allow any spirit/tale on the table.');
  }
  if(['spirits','spirits-rthw'].includes(c.id)){const value=Number(c.pick('channeled-spirit')),tale=tales[c.edition][value-1];if(tale)out.channeledSpirit={value,name:tale[0],detail:tale[1],die:'1d'+die,dc:c.dc('cha')};}
  return out;
 }
 function use(d,id,{level=1,mods={},roll,master=false,success=true,mysticDouble=false}={}){
  const r=derive(d,{level,mods}),a=r.actions.find(a=>a.id===id);if(!a)return null;
  const free=master===true&&r.level>=14&&(['defensive-flourish','slashing-flourish','mobile-flourish'].includes(id)||id==='lunar-vitality'),faces=a.faces|| (id==='channel-spirit'&&r.level>=14&&mysticDouble===true?12:id==='psychic-blades'?6:free?6:r.die),dice=a.damageDice||1;
  if(!Number.isInteger(roll)||roll<dice||roll>dice*faces)return null;const turnKey=['defensive-flourish','slashing-flourish','mobile-flourish'].includes(id)?'flourish-turn':id+'-turn';if(a.once&&r.used(turnKey))return null;
  const C=globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null),pool=C.classResources(d,{level,mods}).find(r=>r.id==='bard-inspiration'),spend=a.cost!==0&&!free&&!(a.refundOnFailure&&success===false);if(spend&&!pool?.remaining)return null;
  const updates={};if(spend)updates[pool.key]=[String(pool.used+1)];if(a.once)updates[r.key(turnKey)]=['1'];if(id==='defensive-flourish')updates[r.key('flourish-ac')]=[String(roll)];if(id==='channel-spirit')updates[r.key('channeled-spirit')]=[String(roll)];
  if(!R.save(d,updates))return null;return{id,rolled:roll,modifier:roll*(a.modifier||1),temporaryHP:a.temporaryHP??(id==='mantle-inspiration'?roll*2:0),push:id==='mobile-flourish'?roll+5:0,spent:spend?1:0,detail:a.detail};
 }
 function releaseSpirit(d,opts={}){const r=derive(d,opts);if(!r.channeledSpirit)return null;return R.save(d,{[r.key('channeled-spirit')]:[]})?r.channeledSpirit:null;}
 function onEvent(d,event,opts={}){const r=derive(d,opts),updates={};if(!r.active)return;for(const row of r.resources)if(row.resets.includes(event)&&r.choices[row.key])updates[row.key]=['0'];if(['turn','short','long'].includes(event)){for(const action of r.actions){const key=r.key(['defensive-flourish','slashing-flourish','mobile-flourish'].includes(action.id)?'flourish-turn':action.id+'-turn');if(r.choices[key])updates[key]=['0'];}if(r.choices[r.key('flourish-ac')])updates[r.key('flourish-ac')]=['0'];}if(['short','long'].includes(event)&&r.choices[r.key('channeled-spirit')])updates[r.key('channeled-spirit')]=[];R.save(d,updates);}
 function paymentSlots(d,opts={}){return R.paymentSlots(d,opts);}
 function pay(d,id,source,opts={}){return R.payResource(d,derive(d,opts).resources.find(row=>row.id===id),source,opts);}
 function apply(d,stats,{level=1}={}){
  const r=derive(d,{level,mods:stats.mods}),physical=stats.gear.entries.filter(e=>e.active),unarmored=!physical.some(e=>['armor','shield'].includes(e.mechanics.kind)),out={dance:r.active&&r.id==='dance-2024'&&unarmored,die:r.die,minimumChecks:{}};
  if(out.dance){const base=10+stats.mods.dex+stats.mods.cha;if(base>stats.gear.base){const increase=base-stats.gear.base;stats.gear.base=base;stats.gear.baseLabel='Dance: 10 + DEX + CHA';stats.gear.baseParts={armor:10,dex:stats.mods.dex,other:stats.mods.cha,otherLabel:'CHA'};stats.gear.ac+=increase;stats.ac+=increase;}}
  if(r.active&&r.id==='swords'){const ac=Math.min(r.die,r.used('flourish-ac'));stats.ac+=ac;stats.gear.ac+=ac;stats.gear.adjustment+=ac;}
  if(r.minimumCheckRoll)for(const key of Object.keys(r.minimumCheckRoll))out.minimumChecks[key]=10+stats.skills[key];
  return out;
 }
 return{ids,tales,derive,use,releaseSpirit,onEvent,paymentSlots,pay,apply};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBardSubclasses;
