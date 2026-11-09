'use strict';
// Original mechanical summaries checked against 5etools revision b906158.
// Conditional combat events remain explicit: a spent Rage is not an active Rage.
var CharacterBarbarianSubclasses=(()=>{
  const C=globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null);
  const ids={'2014':['berserker','totem-warrior','battlerager','ancestral-guardian','storm-herald','zealot','beast','wild-magic-barbarian','giant'],'2024':['berserker-2024','wild-heart-2024','world-tree-2024','zealot-2024']};
  const store=d=>d.adobe||d.rulesChoices?.grants?.__adobe?.data||{};
  function context(d,{level=1,mods={}}={}){
    const edition=d.build?.edition==='2024'?'2024':'2014',s=store(d),choices=C.normalize(s.classFeatureChoices);
    let left=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0,id='';const seen=new Set();
    for(const e of s.classLevels?.length?s.classLevels:[{classId:d.build?.classId,subclassId:d.build?.subclassId,level}]){
      const n=Math.min(left,Math.max(0,Math.trunc(Number(e.level)||0)));left-=n;
      if(e.classId==='barbarian'&&!seen.has(e.classId)){actual=n;id=e.subclassId||'';}seen.add(e.classId);
    }
    const key=name=>C.groupKey(edition,'barbarian',id+':'+name);
    const stateKey=edition+':barbarian:rage-state',raging=actual>0&&choices[stateKey]?.[0]===(id||'base');
    return{stateKey,raging,edition,modern:edition==='2024',id,level:actual,active:actual>=3&&ids[edition].includes(id),pb:Math.ceil(Math.max(1,Math.min(20,Number(level)||1))/4)+1,mods,choices,key,pick:name=>{const g=definitions.find(g=>g.edition===edition&&g.id===id&&g.definition.id===name)?.definition,v=choices[key(name)]?.[0];return g&&actual>=g.minLevel&&g.options().some(o=>o.id===v)?v:''},rage:actual>=16?4:actual>=9?3:2};
  }
  const slug=name=>String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const definitions=[];
  function choice(edition,id,name,minLevel,options,count=1){
    const definition={id:name,name:name.replaceAll('-',' '),minLevel,count:()=>count,referenceComplete:true,options:()=>(typeof options==='function'?options():options).map(name=>({id:slug(name),name,source:edition+' Barbarian',referenceComplete:true,automationComplete:false}))};
    definitions.push({edition,id,definition});C.registerSubclass(edition,'barbarian',id,definition);
  }
  for(const [name,at]of [['totem-spirit',3],['aspect-of-the-beast',6],['totemic-attunement',14]])choice('2014','totem-warrior',name,at,['Bear','Eagle','Elk','Tiger','Wolf']);
  choice('2014','totem-warrior','tiger-skills',6,['Athletics','Acrobatics','Stealth','Survival'],2);
  choice('2014','storm-herald','environment',3,['Desert','Sea','Tundra']);
  choice('2014','zealot','divine-fury',3,['Necrotic','Radiant']);
  choice('2014','wild-magic-barbarian','wild-surge',3,['1','2','3','4','5','6','7','8']);
  choice('2014','beast','form-of-the-beast',3,['Bite','Claws','Tail']);
  choice('2014','beast','bestial-soul',6,['Swim','Climb','Jump']);
  choice('2014','giant','giant-language',3,()=>{const R=globalThis.CharacterRules||(typeof require==='function'?require('./character-rules'):null);return(R?.languages||[]).filter(name=>!["Thieves’ Cant","Thieves' Cant",'Druidic','Giant'].includes(name));});
  choice('2014','giant','giant-cantrip',3,['Druidcraft','Thaumaturgy']);
  choice('2014','giant','giant-growth',3,['Room available','No space']);
  choice('2014','giant','giant-size',14,['Large','Huge']);
  choice('2014','giant','cleaver-weapon',6,()=>{const E=globalThis.CharacterEquipment||(typeof require==='function'?require('./character-equipment'):null);return Object.values(E?.weapons||{}).map(w=>w.name);});
  choice('2014','giant','elemental-cleaver',6,['Acid','Cold','Fire','Lightning','Thunder']);
  choice('2024','wild-heart-2024','rage-of-the-wilds',3,['Bear','Eagle','Wolf']);
  choice('2024','wild-heart-2024','aspect-of-the-wilds',6,['Owl','Panther','Salmon']);
  choice('2024','wild-heart-2024','power-of-the-wilds',14,['Falcon','Lion','Ram']);
  function derive(d,opts={}){
    const c=context(d,opts),n=c.level,p=c.pb,m=c.mods,r=c.rage;
    const out={...c,reports:[],resources:[],resistances:[],skills:[],languages:[],spells:[],senses:[],speeds:[],combat:[]};if(!c.active)return out;
    const report=(at,name,detail,extra={})=>{if(n>=at)out.reports.push({level:at,name,detail,...extra});};
    const combat=(at,name,detail,extra={})=>{if(n>=at){out.combat.push({name,detail,...extra});report(at,name,detail);}};
    const resource=(at,id,name,max,resets,description,extra={})=>{
      if(n<at)return;const key=c.key(id+'-uses'),raw=c.choices[key]?.[0],used=/^\d{1,3}$/.test(raw||'')?Number(raw):0;
      out.resources.push({id:'barbarian-'+id,key,name,source:c.edition+' '+c.id,className:'Barbarian',level:n,max,used,remaining:Math.max(0,max-used),unit:'uses',resets,recovery:resets.includes('rage')?'Once per Rage · reset when a new Rage begins':resets.includes('short')?'Short or Long Rest recovery':'Long Rest recovery',useLabel:'Use '+name,undoLabel:'Undo use',description,...extra});report(at,name,description);
    };
    const spell=(at,name,ability,casting)=>{if(n>=at)out.spells.push({name,ability,casting,classId:'barbarian',subclassId:c.id,edition:c.edition});};
    const dc=ability=>8+p+(Number(m[ability])||0);
    if(c.id==='berserker-2024'){
      combat(3,'Frenzy','While raging and using Reckless Attack, the first Strength-based hit on your turn adds '+r+'d6 of the attack’s damage type.',{dice:r+'d6',once:'turn',requires:['rage','reckless-attack','strength-attack']});
      combat(6,'Mindless Rage','While raging, immune to Charmed and Frightened; entering Rage ends either condition.',{conditionImmunities:['Charmed','Frightened'],requires:['rage']});
      combat(10,'Retaliation','Reaction after a creature within 5 ft damages you: one melee weapon attack or Unarmed Strike against it.');
      resource(14,'intimidating-presence','Intimidating Presence',1,['long'],'Bonus Action: chosen creatures within 30 ft make Wisdom save DC '+dc('str')+'. Failure: Frightened for 1 minute; repeat at each turn end. Spend one Rage use to restore this feature.',{dc:dc('str'),rageRecharge:true});
    }
    if(c.id==='berserker'){
      combat(3,'Frenzy','Choose on entering Rage: from your following turns, a Bonus Action melee weapon attack. Gain one Exhaustion when this Rage ends.');
      combat(6,'Mindless Rage','While raging, immune to Charmed and Frightened; pre-existing effects are suspended until Rage ends.',{conditionImmunities:['Charmed','Frightened'],requires:['rage']});
      combat(10,'Intimidating Presence','Action: one creature within 30 ft that sees or hears you makes Wisdom save DC '+dc('cha')+'. Failure: Frightened until your next turn ends. Extend with an Action each turn, at most 1 minute. Ends if out of sight or over 60 ft away at its turn end. A successful save grants 24-hour immunity.',{dc:dc('cha')});
      combat(14,'Retaliation','Reaction after a creature within 5 ft damages you: one melee weapon attack against it.');
    }
    if(c.id==='battlerager'){
      report(3,'Restriction—Dwarves Only','Requires a dwarf unless the DM waives the setting restriction.');
      combat(3,'Battlerager Armor','With spiked armor and Rage: Bonus Action spike attack, Strength, 1d4 piercing. An Attack-action successful grapple deals 3 piercing.',{dice:'1d4',ability:'str',requires:['rage','spiked-armor']});
      combat(6,'Reckless Abandon','When using Reckless Attack during Rage, gain '+Math.max(1,Number(m.con)||0)+' temporary HP; leftovers expire when Rage ends.',{temporaryHP:Math.max(1,Number(m.con)||0)});
      combat(10,'Battlerager Charge','While raging, Dash as a Bonus Action.');
      combat(14,'Spiked Retribution','While raging, not Incapacitated, and wearing spiked armor: a melee attacker within 5 ft takes 3 piercing when it hits you.');
    }
    if(c.id==='ancestral-guardian'){
      combat(3,'Ancestral Protectors','During Rage, your first attack hit each turn marks its target until your next turn or Rage ends: disadvantage attacking others; others resist damage from its attacks.');
      combat(6,'Spirit Shield','While raging, Reaction when another visible creature within 30 ft takes damage: reduce it by '+(n>=14?4:n>=10?3:2)+'d6.',{dice:(n>=14?4:n>=10?3:2)+'d6'});
      resource(10,'consult-spirits','Consult the Spirits',1,['short','long'],'Cast Augury or Clairvoyance without a slot or material components; Wisdom. Clairvoyance uses an invisible ancestor.');
      spell(10,'Augury','wis','Consult the Spirits');spell(10,'Clairvoyance','wis','Consult the Spirits');
      combat(14,'Vengeful Ancestors','When Spirit Shield reduces attack damage, the attacker takes Force damage equal to the damage actually prevented.');
    }
    if(c.id==='zealot'||c.id==='zealot-2024'){
      combat(3,'Divine Fury','During Rage, the first '+(c.modern?'weapon or Unarmed Strike':'weapon attack')+' hit on your turn adds 1d6 + '+Math.floor(n/2)+' '+(c.modern?'Necrotic or Radiant (choose on hit)':c.pick('divine-fury')||'(choose Necrotic or Radiant in Builder)')+' damage.',{dice:'1d6',bonus:Math.floor(n/2),once:'turn',requires:['rage']});
      if(c.modern)resource(3,'warrior-gods','Warrior of the Gods',n>=17?7:n>=12?6:n>=6?5:4,['long'],'Bonus Action: spend any number of pool dice, regain their d12 total HP; record healing separately.',{unit:'d12s',die:'1d12',variableCost:true});
      else report(3,'Warrior of the Gods','Spells whose sole effect restores you to life need no material components for you.');
      resource(6,'fanatical-focus','Fanatical Focus',1,['rage','long'],'Once during each Rage after failing a save: reroll'+(c.modern?' with +'+r:'')+'; use the new result.',{bonus:c.modern?r:0});
      resource(10,'zealous-presence','Zealous Presence',1,['long'],'Bonus Action: up to ten others within 60 ft'+(c.modern?'':' who hear you')+' gain advantage on attacks and saves until your next turn starts.'+(c.modern?' Spend a Rage use to restore this feature.':''),{rageRecharge:c.modern});
      if(c.modern)resource(14,'rage-gods','Rage of the Gods',1,['long'],'On entering Rage, assume divine form for 1 minute, ending at 0 HP: hovering fly speed equals walking; resist Necrotic, Psychic and Radiant. Reaction when a creature within 30 ft would reach 0 HP: spend a Rage use to set its HP to '+n+' instead.');
      else combat(14,'Rage beyond Death','During Rage, 0 HP does not knock you Unconscious. Make death saves and suffer damage as usual. Death from failed saves waits until Rage ends and occurs only if you still have 0 HP.');
    }
    if(c.id==='beast'){
      const form=c.pick('form-of-the-beast');
      combat(3,'Form of the Beast','Choose on entering Rage; simple melee natural weapons use Strength. Bite: 1d8 piercing, once/turn heal '+p+' HP on damaging hit if below half HP. Claws: empty hand, 1d6 slashing, one extra claw attack per Attack action on your turn. Tail: 1d8 piercing, 10-ft reach; Reaction to a visible attacker within 10 ft hitting you: +1d8 AC against that attack.',{form,ability:'str',magical:n>=6});
      report(6,'Bestial Soul','Natural weapons overcome nonmagical resistance/immunity. After each Short or Long Rest choose Swim (walking speed, breathe underwater), Climb (walking speed, ceilings without a check), or Jump (once/turn add an Athletics check to jump distance).');
      if(n>=6&&['swim','climb'].includes(c.pick('bestial-soul')))out.speeds.push({type:c.pick('bestial-soul'),walking:true});
      resource(10,'infectious-fury','Infectious Fury',p,['long'],'On a raging natural-weapon hit: Wisdom save DC '+dc('con')+'. Failure: choose 2d12 Psychic damage or force its Reaction melee attack on another visible creature.',{dc:dc('con')});
      resource(14,'call-hunt','Call the Hunt',p,['long'],'On entering Rage choose up to '+Math.max(1,Number(m.con)||0)+' willing others visible within 30 ft. Gain 5 temporary HP per participant; each adds 1d6 damage once on each own turn until Rage ends.');
    }
    if(c.id==='wild-magic-barbarian'){
      resource(3,'magic-awareness','Magic Awareness',p,['long'],'Action: until your next turn ends, locate spells and magic items within 60 ft except behind total cover; learn each sensed spell’s school.');
      combat(3,'Wild Surge','On entering Rage roll d8; save DC '+dc('con')+'. 1: chosen visible creatures within 30 ft Con save or 1d12 Necrotic; gain 1d12 temporary HP. 2: teleport 30 ft, repeat as Bonus Action. 3: spirit within 5 ft of a visible creature within 30 ft; turn-end explosion, Dex save or 1d6 Force within 5 ft, repeat as Bonus Action. 4: held weapon becomes Force, Light, Thrown 20/60, returns at turn end. 5: attackers hitting you take 1d6 Force. 6: you and allies within 10 ft gain +1 AC. 7: enemies treat ground within 15 ft as difficult terrain. 8: another visible creature within 30 ft Con save or 1d6 Radiant and Blinded until your next turn starts, repeat as Bonus Action. Effects last until Rage ends.',{dc:dc('con')});
      resource(6,'bolstering-magic','Bolstering Magic',p,['long'],'Action, touch: either +1d3 to attacks/checks for 10 minutes, or restore one slot of level 1d3 or lower. A recipient can receive slot recovery only once per Long Rest.');
      combat(10,'Unstable Backlash','While raging, Reaction immediately after taking damage or failing a save: roll a new surge, replacing your current effect.');
      report(14,'Controlled Surge','Roll twice for each surge and choose either; doubles permit any table result.');
    }
    if(c.id==='giant'){
      const known=[...(opts.languages||[]),...String(d.languages||'').split(/[,;\n]/)].map(name=>String(name).trim().toLowerCase()),R=globalThis.CharacterRules||(typeof require==='function'?require('./character-rules'):null),alternative=R?.languages.find(name=>slug(name)===c.pick('giant-language'));
      if(!known.includes('giant'))out.languages.push('Giant');else if(alternative&&!known.includes(alternative.toLowerCase()))out.languages.push(alternative);
      report(3,'Giant Power','Learn Giant, or another language if already known; choose Druidcraft or Thaumaturgy (Wisdom) in Builder.');
      if(c.pick('giant-cantrip'))spell(3,c.pick('giant-cantrip'),'wis','cantrip');
      combat(3,"Giant's Havoc",'During Rage: +'+(n>=14?10:5)+' ft reach, grow to '+(n>=14?'Large or Huge':'Large if smaller')+' if space permits; Strength ranged thrown attacks add Rage damage +'+r+'.',{reachBonus:n>=14?10:5,thrownDamageBonus:r,requires:['rage']});
      combat(6,'Elemental Cleaver','On entering Rage infuse one held weapon: Acid, Cold, Fire, Lightning or Thunder replaces its damage type and adds '+(n>=14?2:1)+'d6 per hit. Thrown 20/60, returns immediately after hit/miss; suppressed for other wielders. Bonus Action while holding it during Rage changes element.',{dice:(n>=14?2:1)+'d6',damageType:c.pick('elemental-cleaver'),requires:['rage','infused-weapon']});
      combat(10,'Mighty Impel','Bonus Action during Rage: move a '+(n>=14?'Large':'Medium')+' or smaller creature within reach to a visible empty space within 30 ft. Unwilling target: Strength save DC '+dc('str')+' avoids it. Unsupported targets fall normally.',{dc:dc('str')});
      report(14,'Demiurgic Colossus','Giant’s Havoc reach becomes +10 ft, Large/Huge choice; Mighty Impel accepts Large targets; Elemental Cleaver becomes 2d6.');
    }
    if(c.id==='storm-herald'){
      const env=c.pick('environment'),amount=n>=20?6:n>=15?5:n>=10?4:n>=5?3:2,die=(n>=20?4:n>=15?3:n>=10?2:1)+'d6';
      combat(3,'Storm Aura','Choose Desert, Sea or Tundra in Builder; change when gaining a Barbarian level. During Rage: 10-ft aura blocked by total cover. Activate on entering Rage or as a Bonus Action: '+({desert:'all others take '+amount+' Fire.',sea:'one other visible target makes Dex save DC '+dc('con')+' or takes '+die+' Lightning, half on success.',tundra:'chosen creatures gain '+amount+' temporary HP.'}[env]||'choose an environment.'),{environment:env,dc:dc('con'),amount,dice:die});
      if(n>=6&&env){out.resistances.push({desert:'Fire',sea:'Lightning',tundra:'Cold'}[env]);if(env==='sea')out.speeds.push({type:'swim',speed:30});}
      report(6,'Storm Soul',({desert:'Resist Fire; ignore extreme heat; Action ignite an unattended flammable object by touch.',sea:'Resist Lightning; swim 30 ft and breathe underwater.',tundra:'Resist Cold; ignore extreme cold; Action freeze an unoccupied 5-ft cube of touched water for 1 minute.'}[env]||'Choose an environment.'));
      combat(10,'Shielding Storm','Chosen creatures in your active Storm Aura share your Storm Soul resistance.');
      combat(14,'Raging Storm',({desert:'Reaction after an aura creature hits you: Dex save DC '+dc('con')+' or '+Math.floor(n/2)+' Fire.',sea:'Reaction when you hit an aura creature: Strength save DC '+dc('con')+' or Prone.',tundra:'On aura activation choose a visible aura creature: Strength save DC '+dc('con')+' or speed 0 until your next turn starts.'}[env]||'Choose an environment.'));
    }
    if(c.id==='world-tree-2024'){
      combat(3,'Vitality of the Tree','Entering Rage grants '+n+' temporary HP. At each own turn start during Rage, another creature within 10 ft may gain '+r+'d6 temporary HP; those expire when your Rage ends.',{temporaryHP:n,allyDice:r+'d6'});
      combat(6,'Branches of the Tree','During Rage, Reaction when a visible creature within 30 ft starts its turn: Strength save DC '+dc('str')+' or teleport to a visible empty space within 5 ft of you (nearest available if needed). You may set its speed to 0 for that turn.',{dc:dc('str')});
      combat(10,'Battering Roots','On your turn, Heavy or Versatile melee weapons gain 10 ft reach. Their hits may use Push or Topple alongside a different mastery.',{reachBonus:10,requires:['own-turn','heavy-or-versatile-melee-weapon']});
      combat(14,'Travel Along the Tree','On Rage activation or a Bonus Action during Rage: teleport 60 ft to a visible empty space. Once per Rage extend to 150 ft, bringing up to six willing creatures within 10 ft to empty spaces within 10 ft of your destination.');
      resource(14,'tree-travel','Travel Along the Tree · group',1,['rage','long'],'Use the 150-ft group teleport once per active Rage.');
    }
    if(c.id==='totem-warrior'||c.id==='wild-heart-2024'){
      const wild=c.modern,a=c.pick(wild?'rage-of-the-wilds':'totem-spirit'),b=c.pick(wild?'aspect-of-the-wilds':'aspect-of-the-beast'),z=c.pick(wild?'power-of-the-wilds':'totemic-attunement');
      spell(3,'Beast Sense',wild?'wis':null,'ritual only');spell(3,'Speak with Animals',wild?'wis':null,'ritual only');spell(10,'Commune with Nature',wild?'wis':null,'ritual only');
      report(3,wild?'Animal Speaker':'Spirit Seeker','Beast Sense and Speak with Animals as rituals only.');
      combat(3,wild?'Rage of the Wilds':'Totem Spirit','During Rage '+(wild?'choose each activation: ':'use your chosen totem: ')+({bear:wild?'resist all except Force, Necrotic, Psychic and Radiant.':'resist all except Psychic.',eagle:wild?'Dash and Disengage together on Rage activation or as a Bonus Action.':'Without Heavy armor, opportunity attacks against you have disadvantage and you may Bonus Action Dash.',wolf:wild?'allies have advantage attacking your enemies within 5 ft.':'friends have advantage on melee attacks against hostile creatures within 5 ft.',elk:'Without Heavy armor, walking speed +15 ft.',tiger:'Long jumps +10 ft and high jumps +3 ft.'}[a]||'choose an animal in Builder.'));
      report(6,wild?'Aspect of the Wilds':'Aspect of the Beast',wild?'Choose after each Long Rest: Owl adds 60 ft Darkvision (or grants 60 ft); Panther climbs at walking speed; Salmon swims at walking speed.':({bear:'Double carrying capacity and maximum lift; advantage on Strength checks to push, pull, lift or break objects.',eagle:'See fine detail up to 1 mile away as at 100 ft; dim light does not hinder Perception.',elk:'Double travel pace for you and up to ten companions within 60 ft while not Incapacitated.',tiger:'Choose two skills from Athletics, Acrobatics, Stealth and Survival.',wolf:'Track at fast pace and travel stealthily at normal pace.'}[b]||'Choose an animal in Builder.'));
      if(n>=6){if(wild&&b==='owl')out.senses.push({type:'darkvision',increase:60});if(wild&&['panther','salmon'].includes(b))out.speeds.push({type:b==='panther'?'climb':'swim',walking:true});if(!wild&&b==='tiger')out.skills=(c.choices[c.key('tiger-skills')]||[]).filter(s=>['athletics','acrobatics','stealth','survival'].includes(s)).slice(0,2);if(!wild&&b==='bear')out.carryMultiplier=2;}
      report(10,wild?'Nature Speaker':'Spirit Walker','Commune with Nature as a ritual only.');
      combat(14,wild?'Power of the Wilds':'Totemic Attunement','During Rage '+({falcon:'While unarmored, fly speed equals walking.',lion:'Enemies within 5 ft have disadvantage attacking others except another Barbarian using this option.',ram:'Melee hits may knock Large or smaller targets Prone.',bear:'Hostiles within 5 ft have disadvantage attacking others except another character with this feature; requires seeing/hearing you and susceptibility to Frightened.',eagle:'Fly speed equals walking; fall if still airborne at turn end without other support.',elk:'Bonus Action during movement: pass through a Large or smaller creature; Strength save DC '+dc('str')+' or Prone and 1d12 + '+(Number(m.str)||0)+' Bludgeoning.',tiger:'After moving straight toward a Large or smaller target at least 20 ft and making a melee weapon attack, Bonus Action another melee weapon attack against it.',wolf:'Bonus Action after a melee weapon hit: knock a Large or smaller target Prone.'}[z]||'choose an animal in Builder.'));
    }
    return out;
  }
  function enterRage(d,opts={}){
    const Rage=globalThis.CharacterBarbarianRage||(typeof require==='function'?require('./character-barbarian-rage'):null),row=Rage.resource(d,opts),c=context(d,opts);
    if(!row||!row.unlimited&&!row.remaining)return false;
    const choices={...c.choices,[c.stateKey]:[c.id||'base'],[c.key('first-hit-used')]:['0'],[c.key('divine-form')]:[]};if(!row.unlimited)choices[row.key]=[String(row.used+1)];
    for(const pool of derive(d,opts).resources)if(pool.resets.includes('rage'))choices[pool.key]=['0'];
    if(Object.keys(choices).length>100)return false;
    d.adobe={...store(d),classFeatureChoices:choices};if(c.active&&c.id==='world-tree-2024')d.hpTemp=Math.max(Number(d.hpTemp)||0,c.level);return true;
  }
  function endRage(d,opts={}){
    const c=context(d,opts);if(!c.raging)return false;
    d.adobe={...store(d),classFeatureChoices:{...c.choices,[c.stateKey]:[],[c.key('divine-form')]:[]}};return true;
  }
  function apply(d,stats,{level=1}={}){
    const c=context(d,{level,mods:stats.mods}),e=stats.effects,armor=stats.gear?.entries?.find(r=>r.active&&r.mechanics.kind==='armor'),heavy=armor?.profile?.group==='heavy',raging=c.raging&&!(c.modern&&heavy);
    const out={requested:c.raging,raging,blocked:c.modern&&!!heavy,immunities:[],resistances:[],speedBonus:0,fly:0,ac:0};
    if(!raging)return out;
    if(!heavy)out.resistances.push('Bludgeoning','Piercing','Slashing');
    if(c.active){
      if(c.id==='giant'&&c.pick('giant-growth')!=='no-space'){const sizes=['Tiny','Small','Medium','Large','Huge','Gargantuan'],current=sizes.indexOf(e.size||'Medium'),chosen=c.level>=14&&c.pick('giant-size')==='huge'?'Huge':'Large';if(current<sizes.indexOf(chosen)){out.size=chosen;e.size=chosen;}}
      if(['berserker','berserker-2024'].includes(c.id)&&c.level>=6)out.immunities.push('Charmed','Frightened');
      if(c.id==='totem-warrior'){
        if(c.pick('totem-spirit')==='bear')out.resistances.push('Acid','Bludgeoning','Cold','Fire','Force','Lightning','Necrotic','Piercing','Poison','Radiant','Slashing','Thunder');
        if(c.pick('totem-spirit')==='elk'&&!heavy)out.speedBonus=15;
        if(c.level>=14&&c.pick('totemic-attunement')==='eagle')out.fly=e.speed+out.speedBonus;
      }
      if(c.id==='wild-heart-2024'){
        if(c.pick('rage-of-the-wilds')==='bear')out.resistances.push('Acid','Cold','Fire','Lightning','Poison','Thunder');
        if(c.level>=14&&c.pick('power-of-the-wilds')==='falcon'&&!armor)out.fly=e.speed;
      }
      if(c.id==='wild-magic-barbarian'&&c.pick('wild-surge')==='6')out.ac=1;
      if(c.id==='zealot-2024'&&c.level>=14&&c.choices[c.key('divine-form')]?.[0]==='active'&&Number(d.hpCurrent)>0){
        out.fly=e.speed;out.hover=true;e.hover=true;out.resistances.push('Necrotic','Psychic','Radiant');
      }
    }
    e.resistances=[...new Set([...(e.resistances||[]),...out.resistances])];e.immunities=[...new Set([...(e.immunities||[]),...out.immunities])];
    e.speed+=out.speedBonus;if(out.fly)e.fly=Math.max(e.fly||0,out.fly);
    if(out.ac){stats.ac+=out.ac;stats.gear.ac+=out.ac;stats.gear.adjustment+=out.ac;}
    return out;
  }
  function endDivineForm(d,opts={}){
    const c=context(d,opts);if(c.choices[c.key('divine-form')]?.[0]!=='active')return false;
    d.adobe={...store(d),classFeatureChoices:{...c.choices,[c.key('divine-form')]:[]}};return true;
  }
  function activateDivineForm(d,opts={}){
    const c=context(d,opts),pool=derive(d,opts).resources.find(r=>r.id==='barbarian-rage-gods');
    if(!c.raging||!pool?.remaining||Number(d.hpCurrent)<=0||c.choices[c.key('divine-form')]?.[0]==='active')return false;
    d.adobe={...store(d),classFeatureChoices:{...c.choices,[pool.key]:[String(pool.used+1)],[c.key('divine-form')]:['active']}};return true;
  }
  function resolveHit(d,{level=1,mods={},diceTotal,reckless=false,strength=false,weapon=true,unarmed=false}={}){
    const c=context(d,{level,mods});if(!c.active||!c.raging||c.choices[c.key('first-hit-used')]?.[0]==='1')return null;
    let dice=0,bonus=0,types=[];
    if(c.id==='berserker-2024'&&reckless===true&&strength===true&&(weapon===true||unarmed===true)){dice=c.rage;types=['attack'];}
    if(['zealot','zealot-2024'].includes(c.id)&&(weapon===true||c.modern&&unarmed===true)){dice=1;bonus=Math.floor(c.level/2);types=c.modern?['Necrotic','Radiant']:[c.pick('divine-fury')].filter(Boolean);}
    if(!dice||!types.length||!Number.isInteger(diceTotal)||diceTotal<dice||diceTotal>dice*6)return null;
    d.adobe={...store(d),classFeatureChoices:{...c.choices,[c.key('first-hit-used')]:['1']}};
    return{dice:dice+'d6',rolled:diceTotal,bonus,total:diceTotal+bonus,types};
  }
  function onEvent(d,event,{level=1}={}){
    const c=context(d,{level}),choices={...c.choices};let changed=false;
    if(event==='turn'&&c.raging){choices[c.key('first-hit-used')]=['0'];changed=true;}
    if(['short','long'].includes(event)){for(const edition of ['2014','2024']){const key=edition+':barbarian:rage-state';if(choices[key]?.length){choices[key]=[];changed=true;}}}
    if(changed)d.adobe={...store(d),classFeatureChoices:choices};
  }
  function recharge(d,id,opts={}){
    const row=derive(d,opts).resources.find(r=>r.id===id),Rage=globalThis.CharacterBarbarianRage||(typeof require==='function'?require('./character-barbarian-rage'):null),rage=Rage.resource(d,opts);
    if(!row?.rageRecharge||!row.used||!rage?.remaining)return false;
    d.adobe={...store(d),classFeatureChoices:{...C.normalize(store(d).classFeatureChoices),[row.key]:['0'],[rage.key]:[String(rage.used+1)]}};return true;
  }
  function attackReferences(d,opts={}){
    const c=context(d,opts);if(!c.active)return[];
    if(c.id==='beast'){const form=c.pick('form-of-the-beast');return ['bite','claws','tail'].includes(form)?[{ref:'barbarian-beast-'+form,name:'Beast '+form+' · during Rage'}]:[];}
    if(c.id==='battlerager')return[{ref:'barbarian-armor-spikes',name:'Armor spikes · spiked armor and Rage'}];
    if(c.id==='giant'&&c.level>=6&&c.pick('cleaver-weapon')&&c.pick('elemental-cleaver')){const E=globalThis.CharacterEquipment||(typeof require==='function'?require('./character-equipment'):null);return[{ref:'barbarian-elemental-cleaver',name:'Elemental Cleaver · standard weapon reference'},...(opts.loot||[]).filter(e=>e.quantity>0&&E.infer(e.item).base===c.pick('cleaver-weapon')).map(e=>({ref:'barbarian-cleaver-owned:'+e.id,name:'Elemental Cleaver · '+e.item.name+' (owned)'}))];}
    return[];
  }
  function resolveAttack(ref,d,stats,opts={}){
    const c=context(d,{...opts,mods:stats.mods}),available=attackReferences(d,opts).some(r=>r.ref===ref),sign=n=>(n>=0?'+':'')+n;
    if(!available)return{name:'Unavailable subclass weapon',hit:'—',damage:'—',range:'—',available:false,notes:['Choose the matching Barbarian subclass and weapon form in Character Builder.']};
    const str=Number(stats.mods?.str)||0,notes=['Use only during an active Rage. Adding this reference does not start Rage or create inventory.'],base={available:true,ability:'str',proficient:true,hit:sign(str+stats.pb),range:'5 ft',notes};
    if(ref==='barbarian-elemental-cleaver'||ref.startsWith('barbarian-cleaver-owned:')){
      const E=globalThis.CharacterEquipment||(typeof require==='function'?require('./character-equipment'):null),weapon=c.pick('cleaver-weapon'),profile=E.weapons[weapon];if(!profile)return{...base,available:false,name:'Unavailable infused weapon',damage:'—'};
      const owned=ref.startsWith('barbarian-cleaver-owned:')?(opts.loot||[]).find(e=>e.id===ref.slice('barbarian-cleaver-owned:'.length)):null,entry=owned||{id:'barbarian-cleaver-reference',quantity:1,item:{name:profile.name}},loadout=E.choices(d.equipmentState).loadout,temp={...d,equipmentState:{...d.equipmentState,loadout:[...loadout.filter(e=>e.id!==entry.id),{...loadout.find(e=>e.id===entry.id),id:entry.id,equipped:true,ability:opts.ability||'auto',proficiency:'auto',mode:opts.mode==='thrown'?'normal':opts.mode||'normal'}]}};
      const row=E.derive(temp,stats,owned?opts.loot:[entry],opts.level).attacks.find(a=>a.id===entry.id),dice=c.level>=14?'2d6':'1d6',type=c.pick('elemental-cleaver');
      if(!row)return{...base,available:false,name:'Unavailable infused weapon',damage:'—'};
      const rageBonus=row.ability==='str'&&(profile.rangeType==='melee'||opts.mode==='thrown')?c.rage:0,damage=/^\d+d\d+/.test(row.damage)?row.damage.replace(new RegExp('\\s*'+row.damageType+'(?=\\s*(?:\\+|$))','i'),'')+(rageBonus?' + '+rageBonus:'')+' + '+dice+' '+type:row.damage;
      return{...base,name:'Elemental Cleaver · '+entry.item.name,ability:row.ability,proficient:row.proficient,hit:sign(row.attack),damage,damageDice:row.damage.match(/^\d+d\d+/)?.[0]||'',damageType:type,range:opts.mode==='thrown'?'20/60 ft':profile.rangeType==='melee'?(parseInt(row.range,10)+(c.level>=14?10:5))+' ft':row.range,notes:[...notes,...row.notes,(owned?'Owned weapon bonuses and current attunement are retained. ':'Standard reference; choose an owned infusion reference to retain magic-item bonuses. ')+'Thrown range 20/60; returns immediately. A Bonus Action can change the element. '+(rageBonus?'Rage damage is included.':'Rage damage requires a qualifying Strength attack.') ]};
    }
    const tail=ref==='barbarian-beast-tail',claws=ref==='barbarian-beast-claws',spikes=ref==='barbarian-armor-spikes',die=spikes?'1d4':claws?'1d6':'1d8',type=claws?'slashing':'piercing';
    if(spikes)notes.push('Requires worn spiked armor. Bonus Action spike attack; a successful Attack-action grapple deals 3 piercing separately.');
    else if(claws)notes.push('Requires an empty hand. Once on your turn, one extra claw attack as part of the Attack action.');
    else if(tail)notes.push('Reaction against a visible attacker within 10 ft that hits you: +1d8 AC against that attack.');
    else notes.push('Once on your turn, a damaging bite hit heals '+c.pb+' HP if you were below half HP when it hit; apply healing separately.');
    if(!spikes&&c.level>=6)notes.push('Counts as magical against nonmagical resistance and immunity.');
    return{...base,name:spikes?'Battlerager armor spikes':'Beast '+c.pick('form-of-the-beast'),damage:die+' '+sign(str+c.rage)+' '+type,damageDice:die,damageType:type,range:tail?'10 ft':'5 ft',notes:[...notes,'Rage damage +'+c.rage+' is included.']};
  }
  return{ids,definitions,context,derive,enterRage,endRage,apply,activateDivineForm,endDivineForm,resolveHit,onEvent,recharge,attackReferences,resolveAttack};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterBarbarianSubclasses;
