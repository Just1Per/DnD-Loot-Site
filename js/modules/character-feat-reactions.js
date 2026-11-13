'use strict';
/* Reviewed direct reaction rules. Actor ownership and opportunity attacks are explicit. */
var CharacterFeatReactions=(()=>{
 const records={};
 const add=(source,name,owner,kind,detail,options={})=>{records[source+'|'+name]={source,name,owner,kind,detail,...options};};
 const pbLong={uses:'pb',resets:['long']},oneLong={uses:1,resets:['long']},oneRest={uses:1,resets:['short','long']};
 add('PHB','Sentinel','self','attack','Reaction: when a creature within 5 ft attacks someone else without Sentinel, make a melee weapon attack. This attack is not an opportunity attack. Your opportunity hits set Speed to 0 this turn, and Disengage does not prevent your opportunity attacks.',{attack:'meleeWeapon',triggerRange:'5 ft',scope:'meleeAttack'});
 add('XPHB','Sentinel','self','attack','Reaction: a creature within 5 ft Disengages or hits someone else; make an opportunity attack. An opportunity hit sets its Speed to 0 for this turn.',{attack:'melee',opportunity:true,triggerRange:'5 ft',scope:'meleeAttack'});
 add('PHB','Polearm Master','self','attack','Reaction: an enemy entering your glaive, halberd, pike, quarterstaff or spear reach provokes an opportunity attack.',{attack:'polearm',opportunity:true,scope:'polearm'});
 add('XPHB','Polearm Master','self','attack','Reaction: a creature enters your quarterstaff, spear or Heavy + Reach weapon’s reach; make one melee attack. Reactive Strike is not an opportunity attack.',{attack:'polearm',scope:'polearm'});
 add('PHB','Mage Slayer','self','attack','Reaction: when a creature within 5 ft casts a spell, make a melee weapon attack against it. This is not an opportunity attack.',{attack:'meleeWeapon',triggerRange:'5 ft',scope:'meleeAttack'});
 add('XPHB','Mage Slayer','none','changed-rule','The revised feat does not grant the legacy spellcasting-triggered reaction attack.');
 add('PHB','War Caster','self','spell','Reaction: replace an opportunity attack caused by hostile movement with a one-action spell targeting only that creature. Check spell access, components and slot cost.',{scope:'spell'});
 add('XPHB','War Caster','self','spell','Reaction: when a creature provokes an opportunity attack by leaving your reach, cast a one-action spell targeting only it instead. Check spell access, components and slot cost.',{scope:'spell'});
 add('PHB','Defensive Duelist','self','defense','Reaction on a melee hit against you: while wielding a proficient Finesse weapon, add {PB} AC against that attack only.');
 add('XPHB','Defensive Duelist','self','defense','Reaction on a melee hit against you while holding a Finesse weapon: add {PB} AC against melee attacks until your next turn.');
 add('PHB','Shield Master','self','defense','Reaction after a successful DEX save for half damage: while holding a shield, take no damage instead.');
 add('XPHB','Shield Master','self','defense','Reaction after a successful DEX save for half damage: while holding a shield, take no damage instead.');
 add('XPHB','Interception','self','defense','Reaction: a creature you see hits someone else within 5 ft; reduce that damage by 1d10 + {PB}. Hold a shield or Simple/Martial weapon.');
 add('XPHB','Protection','self','defense','Reaction: an enemy you see attacks someone else within 5 ft. With a shield, impose Disadvantage on that attack and further attacks against the target until your next turn while you stay within 5 ft.');
 add('XGE','Bountiful Luck','self','reroll','Reaction: an ally you see within 30 ft rolls a natural 1 on an attack, check or save; let it reroll and keep the new result. Your racial Lucky trait is unavailable before the end of your next turn.');
 add('XGE','Second Chance','self','reroll','Reaction: a creature you see hits you; force an attack reroll. Recover on initiative, Short Rest or Long Rest.',{uses:1,resets:['initiative','short','long']});
 add('XGE','Fade Away','self','defense','Reaction immediately after taking damage: become Invisible until your next turn ends or you attack, deal damage or force a save.',oneRest);
 add('XGE','Orcish Fury','self','attack','Reaction immediately after using Relentless Endurance: make one weapon attack. This does not grant another use of that racial trait.',{attack:'weapon',scope:'weapon'});
 add('FTD','Gift of the Chromatic Dragon','self','defense','Reaction on Acid, Cold, Fire, Lightning or Poison damage: gain Resistance to that damage instance. This reaction allowance is separate from the once-per-Long-Rest weapon infusion.',{...pbLong,poolLabel:'Reactive Resistance'});
 add('FTD','Gift of the Gem Dragon','self','damage','Reaction: take damage from a creature within 10 ft; STR DC {DC}. It takes 2d8 Force and a push up to 10 ft on failure; half damage and no push on success.',pbLong);
 add('FTD','Gift of the Metallic Dragon','self','defense','Reaction: you or someone you see within 5 ft is hit; add {PB} AC against that attack.',pbLong);
 add('BGG','Fury of the Frost Giant','self','damage','Reaction: a creature you see within 30 ft hits and damages you; CON DC {DC}. Failure deals 1d8 + {PB} Cold and sets Speed to 0 until its next turn ends.',pbLong);
 add('BGG','Guile of the Cloud Giant','self','defense','Reaction: a creature you see hits you; resist that attack’s damage, then teleport up to 30 ft to a visible empty space.',pbLong);
 add('BGG','Vigor of the Hill Giant','self','defense','Reaction: an effect would move you at least 5 ft or knock you Prone; prevent that movement and Prone.');
 add('DSotDQ','Adept of the White Robes','self','defense','Reaction: you or someone you see within 30 ft takes damage; spend a spell slot and reduce it by slot-level d6 + your spellcasting modifier. Apply the slot cost separately.');
 add('SatO','Righteous Heritor','self','defense','Reaction: you or a creature within 30 ft takes damage; reduce it by 1d10 + {PB}.',pbLong);
 add('EFA','Aberrant Dragonmark','self','save','Reaction on a failed CON save: add 1d4, possibly turning it into a success.',oneLong);
 add('AU','Arcane Omens','self','save','Reaction: you or a creature you see within 30 ft fails a save; add 1d4 to that save.',pbLong);
 add('AU','Divination Adept','self','reroll','Reaction: a creature you see within 60 ft makes a D20 Test; give that roll Advantage or Disadvantage.');
 add('AU','Transmuted Anatomy','self','save','Reaction on a failed CON save: add 1d4, possibly turning it into a success.',pbLong);
 add('XPHB','Boon of Energy Resistance','self','damage','Reaction on damage of either chosen resistance type: redirect toward a visible creature within 60 ft without Total Cover. DEX DC {CONDC}; failure deals 2d12 + {CON} of the triggering type.');
 add('FRHoF','Boon of Terror','self','control','Reaction: a Frightened creature you see starts its turn within 60 ft without Total Cover; WIS DC {CHADC}. Failure forces it to spend its turn moving away as fast as possible.',oneRest);
 add('FRHoF','Boon of the Soul Drinker','self','healing','Reaction: an enemy within 120 ft reaches 0 HP; regain 50 HP. Apply healing separately.',oneRest);
 add('ABH','Delicious Pain','self','defense','Reaction immediately after taking Bludgeoning, Piercing or Slashing damage: gain Resistance to those types until your next turn.',oneRest);
 add('ABH','Vampire Hunter','self','defense','Reaction on Necrotic damage: reduce it by {PB}d6.',oneRest);
 add('RHW','Gathered Whispers','self','defense','Reaction when an attack hits you: add {PB} AC against that attack.',pbLong);
 add('RHW','Mist Walker','self','movement','Reaction on damage or a failed save against Grappled/Restrained: teleport up to 15 ft to a visible empty space.',pbLong);
 add('RHW','Survivor','self','save','Reaction on a failed save against Charmed/Frightened: add {PB} to the save.',oneLong);
 add('RHW','Symbiotic Being','self','save','Reaction on a failed save: expend a Hit Die, roll it and add the result to that save. Record the spent Hit Die separately.');
 add('EFA','Mark of Sentinel','self','defense','Reaction: someone you see within 5 ft is hit; swap places and take the hit instead.',{...pbLong,poolLabel:'Vigilant Guardian'});
 add('EFA','Greater Mark of Sentinel','self','augment','When you use Mark of Sentinel’s Vigilant Guardian, one weapon attack or Unarmed Strike can join that same Reaction.',{base:'EFA|Mark of Sentinel',attack:'anyAttack',scope:'attack'});
 add('EFA','Greater Mark of Warding','self','defense','Reaction: an attack targets you or someone you see within 30 ft; impose Disadvantage on that roll.',pbLong);
 add('FRHoF','Mythal Touched','self','table','Reaction when a spell attack hits you or you fail a spell save: roll on the Mythal-Touched Magic table. Required saves use DC {DC}.',pbLong);
 add('FRHoF','Tyro of the Gauntlet','self','defense','Reaction: an ally within 5 ft would be pushed or pulled; prevent it, provided the ally is not Incapacitated.');
 add('FRHoF','Zhentarim Ruffian','self','modifier','Opportunity attack damage: roll the damage dice twice and choose either result. This changes damage; it does not grant an additional Reaction.',{scope:'attack'});
 add('FRHoF','Zhentarim Tactics','self','attack','Reaction immediately after a creature within 5 ft hits you with a melee attack: make an opportunity attack against it.',{attack:'melee',opportunity:true,triggerRange:'5 ft',scope:'meleeAttack'});
 add('AU','Elemental Familiar','familiar','command','Your Bonus Action commands a familiar within 120 ft to use its Reaction for Energy Pulse: a 5-ft Emanation, DEX save against your familiar spell DC, 2d4 chosen-type damage and Prone for Medium/smaller targets on failure.');
 add('AU','Warlike Familiar','familiar','defense','Your familiar uses its Reaction when someone within 5 ft is hit: add your PB to that target’s AC against the attack. This does not spend your Reaction.');
 add('EFA','Greater Mark of Handling','mount','command','While mounted, after your melee hit within 5 ft of the mount, the mount can use its Reaction to move its Speed or make one attack.');
 add('EFA','Greater Mark of Passage','allies','command','Your slot-free Magical Passage can let up to two willing visible creatures within 30 ft use their Reactions to teleport up to 30 ft to visible empty spaces.');
 add('DSotDQ','Knight of the Crown','ally','command','Your Bonus Action commands an ally within 30 ft that can see or hear you: it can use its Reaction for one weapon attack, adding 1d8 damage on a hit. Your command has a PB-per-Long-Rest allowance.');
 add('FRHoF','Lordly Resolve','targets','command','Your Bonus Action lets up to three targets within 60 ft that see you use their Reactions to stand if Speed is not 0. The ensuing protective benefits last up to 1 minute.');
 add('SCC','Strixhaven Mascot','familiar','command','During your Attack action, give up one attack so your mascot familiar can use its Reaction for one attack.');
 add('XPHB','Boon of the Night Spirit','none','restriction','Taking a Reaction ends the Invisibility granted by Merge with Shadows. This does not grant a new Reaction.');
 add('PHB','Mobile','none','avoidance','After your melee attack against a creature, it cannot make opportunity attacks against you for the rest of that turn.');
 add('XPHB','Speedy','none','avoidance','Opportunity attacks against you have Disadvantage. This does not grant you a Reaction.');
 add('FRHoF','Emerald Enclave Fledgling','none','avoidance','The Help-action position swap does not provoke opportunity attacks; it is not a Reaction.');
 const forFeat=def=>def&&!def.personal&&Object.hasOwn(records,def.source+'|'+def.name)?records[def.source+'|'+def.name]:null;
 const pb=level=>Math.ceil(Math.max(1,Math.min(20,Number(level)||1))/4)+1;
 function resource(def,level=1){const r=forFeat(def);return r?.owner==='self'&&r.uses?{label:r.poolLabel||r.name+' reaction',max:r.uses==='pb'?pb(level):r.uses,resets:[...r.resets]}:null;}
 function detail(record,report,derived){const mods=derived.mods||{},ability=report.choice?.abilities?.find(Boolean)||Object.keys(report.abilityIncreases||{})[0],bonus=derived.pb||2;return record.detail.replace(/\{(PB|CON|CONDC|CHADC|DC)\}/g,(_,key)=>({PB:bonus,CON:mods.con??0,CONDC:8+bonus+(mods.con||0),CHADC:8+bonus+(mods.cha||0),DC:ability?8+bonus+(mods[ability]||0):'8 + PB + chosen ability modifier'}[key]));}
 function rows(data,derived){const reports=(derived.feats?.reports||[]).filter(r=>r.eligible===true&&!r.warnings?.length),all=reports.flatMap(report=>{const r=forFeat(report.def);return r?.owner==='self'&&r.kind!=='augment'?[{...r,key:'feat:'+report.key,report,text:report.def.name+' ('+report.def.edition+')',detail:detail(r,report,derived)}]:[];});
  for(const report of reports){const r=forFeat(report.def);if(r?.kind!=='augment')continue;const base=all.find(row=>row.source+'|'+row.name===r.base);if(base){base.detail+=' '+detail(r,report,derived);base.augmentation={record:r,report};}}
  return all;
 }
 const hash=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0).toString(36);};
 function attacks(data,derived){const out=[],gear=(derived.gear?.attacks||[]).filter(w=>w.equipped&&w.attack!==null),entries=derived.gear?.entries||[];const eligible=(r,w)=>{const e=entries.find(e=>e.entry.id===w.id),p=e?.profile;if(!p)return false;const melee=p.rangeType==='melee'&&e.choice.mode!=='thrown';if(r.attack==='weapon'||r.attack==='anyAttack')return p.rangeType!=='gear';if(r.attack==='meleeWeapon'||r.attack==='melee')return melee;if(r.attack==='polearm')return melee&&(r.source==='PHB'?['glaive','halberd','pike','quarterstaff','spear'].includes(e.mechanics.base):['quarterstaff','spear'].includes(e.mechanics.base)||p.props.includes('heavy')&&p.props.includes('reach'));return false;};
  for(const row of rows(data,derived)){const r=row.augmentation?.record||row;if(!r.attack)continue;const report=row.augmentation?.report||row.report;const weapons=gear.filter(w=>eligible(r,w)).map(w=>({...w,hit:(w.attack>=0?'+':'')+w.attack,entryId:w.id}));if(['melee','anyAttack'].includes(r.attack)){const Actions=globalThis.CharacterActions||(typeof require==='function'?require('./character-actions'):null);if(Actions){const level=derived.progression?.targetLevel||data.adobe?.classLevels?.reduce((n,c)=>n+c.level,0)||1,w=Actions.resolve({kind:'unarmed'},data,level,derived);weapons.push({...w,id:'unarmed',sourceKind:'unarmed',damageType:w.damageType||String(w.damage).match(/\b(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)\b/i)?.[1]||'bludgeoning'});}}
   for(const weapon of weapons){const opportunity=r.opportunity===true,notes=[row.detail,opportunity?'Opportunity attack: spend your available Reaction; target, reach and trigger must qualify.':'This reaction attack is not an opportunity attack.'];for(const modifier of rows(data,derived).filter(m=>m.kind==='modifier'))if(opportunity)notes.push(modifier.detail);out.push({...weapon,key:'attack:reaction-'+report.key.replace(/[^A-Za-z0-9_-]/g,'').slice(0,40)+'-'+hash(weapon.id),name:weapon.name+' · '+report.def.name+' · Reaction',origin:'feat',range:r.triggerRange||weapon.range,featKey:report.key,default:true,available:true,opportunityAttack:opportunity,damageDice:weapon.damageDice??(weapon.damageType?String(weapon.damage).replace(' '+weapon.damageType,''):weapon.damage),notes:[...notes,...(weapon.notes||[])]});}
  }return out;
 }
 return{records,forFeat,resource,detail,rows,attacks};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterFeatReactions;
