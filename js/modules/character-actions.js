/* Saved references, live formulas. Never executes item or spell text. */
var CharacterActions = (()=>{
 const E=typeof CharacterEquipment!=='undefined'?CharacterEquipment:require('./character-equipment');
 const ab=['str','dex','con','int','wis','cha'],text=v=>String(v||'').slice(0,200),sign=n=>(n>=0?'+':'')+n;
 function normalize(rows){return (Array.isArray(rows)?rows:[]).slice(0,60).map(r=>({kind:['loot','weapon','spell','racial','improvised','unarmed'].includes(r?.kind)?r.kind:'improvised',ref:text(r?.ref),mode:['twoHanded','thrown','offhand','mounted'].includes(r?.mode)?r.mode:'normal',ability:ab.includes(r?.ability)?r.ability:'auto',slot:Math.max(0,Math.min(9,Math.trunc(Number(r?.slot)||0))),name:text(r?.name)}));}
 const add=(dice,n)=>dice+(n?' '+(n<0?'−':'+')+' '+Math.abs(n):'');
 function diceAt(scales,level,fallback){const keys=Object.keys(scales||{}).map(Number).filter(k=>k<=level).sort((a,b)=>b-a);return keys.length?scales[keys[0]]:fallback;}
 function increase(base,extra,times){const a=/^(\d+)d(\d+)$/.exec(base),b=/^(\d+)d(\d+)$/.exec(extra||'');return a&&b&&a[2]===b[2]?`${Number(a[1])+Number(b[1])*times}d${a[2]}`:base;}
 function spellReference(ref){const value=text(ref),match=/^(.*)::([a-z0-9-]{1,60})$/.exec(value);return{spellId:match?match[1]:value,classId:match?match[2]:''};}
 function resolve(raw,data,level,stats,loot=[],spells=[]){
  const a=normalize([raw])[0],row={name:a.name||a.ref||a.kind,hit:'—',damage:'—',range:'—',notes:[],available:true,ability:''};
  const unavailable=reason=>({...row,available:false,notes:[reason]});
  if(a.kind==='weapon'||a.kind==='loot'){
   const item=a.kind==='loot'?loot.find(e=>e.id===a.ref&&e.quantity>0):null;
   if(a.kind==='loot'&&!item)return unavailable('This item is no longer in this character’s inventory.');
   if(a.kind==='weapon'&&!Object.hasOwn(E.weapons,a.ref))return unavailable('Unknown weapon.');
   const entry=item||{id:'action-reference',quantity:1,item:{name:E.weapons[a.ref].name}},m=E.infer(entry.item),profile=E.profile(m,data.build.edition);
   if(m.kind!=='weapon')return resolve({...a,kind:'improvised',name:entry.item.name},data,level,stats,loot,spells);
   if(a.mode==='twoHanded'&&!profile?.versatile&&!profile?.props.includes('twoHanded'))return unavailable('This weapon has no two-handed damage mode.');
   if(a.mode==='thrown'&&!profile?.props.includes('thrown'))return unavailable('No thrown property: use an improvised attack instead.');
   const loadout=E.choices(data.equipmentState).loadout,existing=loadout.find(c=>c.id===entry.id);
   const temp={...data,equipmentState:{...data.equipmentState,loadout:[...loadout.filter(c=>c.id!==entry.id),{...existing,id:entry.id,equipped:!!existing?.equipped,attuned:!!existing?.attuned,ability:a.ability==='auto'?(existing?.ability||'auto'):a.ability,proficiency:existing?.proficiency||'auto',mode:a.mode}]}};
   const result=E.derive(temp,stats,item?loot:[...loot,entry],level).attacks.find(r=>r.id===entry.id);
   if(!result)return unavailable('This item needs weapon mechanics configured by the DM.');
   const out={...row,name:entry.item.name+(a.mode==='twoHanded'?' (two hands)':a.mode==='thrown'?' (thrown)':a.mode==='offhand'?' (extra attack)':''),hit:result.attack===null?'—':sign(result.attack),damage:result.damage,range:result.range,ability:result.ability,notes:result.notes};
   if(m.base==='net'&&result.edition==='2024'){out.hit='DEX DC '+(8+stats.pb+stats.mods.dex);out.ability='dex';out.damage='Restrained; no damage';out.notes.push('Large or smaller target; an attack replacement.');}
   if(item&&!existing?.equipped)out.notes.push('In backpack: ready this item before using it.');
   if(!item)out.notes.push('Reference weapon; this does not add equipment to inventory.');
   if(stats.clericBlessedStrikes?.choice==='divine-strike'&&!(m.base==='net'&&result.edition==='2024'))out.notes.push(stats.clericBlessedStrikes.detail);
   if(stats.druidElementalFury?.choice==='primal-strike'&&!(m.base==='net'&&result.edition==='2024'))out.notes.push(stats.druidElementalFury.detail);
   return out;
  }
  if(a.kind==='racial'){
   const breath=stats.effects.breath;if(a.ref!=='breath'||!breath)return unavailable('This species no longer grants this breath weapon.');
   return {...row,name:'Breath weapon',hit:breath.save.toUpperCase()+' DC '+(8+stats.pb+stats.mods.con),damage:`${breath.dice}d${breath.die||6} ${breath.type}`,range:breath.area,ability:'con',notes:[breath.usage||'Action; once per short or long rest.','Successful save: half damage. Track uses separately.']};
  }
  if(a.kind==='spell'){
   const source=spellReference(a.ref),spell=spells.find(s=>s.id===source.spellId);if(!spell)return unavailable('Spell catalogue unavailable.');
   const known=data.spells.filter(row=>row.catalogId===source.spellId),selected=source.classId?known.find(row=>row.classId===source.classId):known[0];
   if(!selected)return unavailable('This spellcasting source is no longer selected in your spellbook.');
   const classes=[...new Set(known.map(row=>row.classId).filter(Boolean))],ambiguous=!source.classId&&classes.length>1;
   const CFC=typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices:require('./character-class-feature-choices'),invocation=CFC.cantripModifier(data,stats.cantripInvocations,spell.id,source.classId||(!ambiguous?selected.classId:''));
   const classAbilities={artificer:'int',bard:'cha',cleric:'wis',druid:'wis',fighter:'int',paladin:'cha',ranger:'wis',rogue:'int',sorcerer:'cha',warlock:'cha',wizard:'int'},owner=source.classId||(!ambiguous?(selected.classId||classes[0]||''):'')||(invocation?.sourceClass||''),ability=a.ability==='auto'?(classAbilities[owner]||data.spellAbility):a.ability,mod=stats.mods[ability],c=spell.combat||{},slot=spell.level?Math.max(spell.level,a.slot):0;
   const beast=(globalThis.CharacterDruidSpellcasting||(typeof require==='function'?require('./character-druid-spellcasting'):null))?.assess(data,spell,{level,classId:owner});
   const mark=CFC.huntersMarkEffect(data,spell,{level,classId:owner,features:stats.rangerFeatures,slot});
   if(mark)return {...row,name:spell.name+' · '+spell.edition+(owner?' · '+(classAbilities[owner]?owner[0].toUpperCase()+owner.slice(1):owner):'')+(slot?' (level '+slot+')':''),ability,hit:'No attack roll',damage:mark.damage,range:spell.range,notes:[mark.detail,'Bonus Action · '+mark.duration+'. Resolve marked target and eligible hits at the table.',...mark.notes,...(beast?.relevant?[beast.label+': '+beast.detail]:[])]};
   let damage=spell.level===0?diceAt(c.scaling,level,c.damage||''):c.damage||'';
   if(slot>spell.level&&c.upcast)damage=increase(damage,c.upcast,Math.floor((slot-spell.level)/(c.step||1)));
   let count=1,unit='';
   if(spell.name==='Eldritch Blast'){count=level>=17?4:level>=11?3:level>=5?2:1;unit='beam';}
   if(spell.name==='Scorching Ray'){count=3+Math.max(0,slot-2);unit='ray';}
   if(spell.name==='Magic Missile'){count=3+Math.max(0,slot-1);unit='dart';}
   const notes=['Base effect shown. Resolve conditions, riders and resource use from the spell.'];
   if(beast?.relevant)notes.push(beast.label+': '+beast.detail);
   if(ambiguous)notes.push('Known from multiple classes: edit this action and choose its casting class.');
   if(slot>spell.level&&!c.upcast&&!['Scorching Ray','Magic Missile'].includes(spell.name))notes.push('Upcast effects are not automated for this spell.');
   if(!damage)notes.push('Damage or weapon-dependent effect needs manual resolution; see spell information.');
   if(damage&&c.addAbility)damage=add(damage,mod);
   if(invocation?.damageBonus!==undefined){if(damage)damage=add(damage,invocation.damageBonus);notes.push(invocation.damageSource+': '+sign(invocation.damageBonus)+' to this cantrip’s damage rolls.');}
   if(spell.level===0&&source.classId==='cleric'&&invocation?.sourceClass==='cleric'&&stats.clericBlessedStrikes?.vitalityAvailable)notes.push('Improved Blessed Strikes: after dealing damage to a creature, grant '+stats.clericBlessedStrikes.amount+' temporary HP to yourself or another creature within 60 ft. Resolve the trigger in Combat.');
   if(invocation?.range)notes.push(invocation.rangeSource+': range '+invocation.range+'.');
   const types=(c.types||[]).join(' / ');if(damage)damage+=(types?' '+types:'')+(unit?` per ${unit} × ${count}`:'');
   return {...row,name:spell.name+' · '+spell.edition+(source.classId?' · '+source.classId.replace(/(^|-)([a-z])/g,(_,separator,letter)=>(separator?' ':'')+letter.toUpperCase()):'')+(slot?' (level '+slot+')':''),ability,hit:c.attack?sign(mod+stats.pb+data.spellAttackBonus):spell.save?spell.save+' DC '+(8+stats.pb+mod+data.spellDCBonus):'Effect',damage:damage||'See spell effect',range:invocation?.range||CFC.cantripRange(spell,level),notes};
  }
  const unarmed=a.kind==='unarmed',Martial=globalThis.CharacterMonkMartialArts||(typeof require==='function'?require('./character-monk-martial-arts'):null),martial=unarmed?(stats.gear?.martialArts||E.derive(data,stats,loot,level).martialArts):null,ability=a.ability==='auto'?(unarmed&&martial?.active?Martial.ability(stats.mods):!unarmed&&a.mode==='thrown'?'dex':'str'):a.ability;
  const tavern=(stats.effects.originFeats||[]).includes('Tavern Brawler')||stats.feats.reports.some(r=>r.def.name==='Tavern Brawler'&&!r.warnings.length);
  const proficient=unarmed||tavern,mod=stats.mods[ability];
  const baseDamage=unarmed&&!tavern?'1':'1d4',damageDie=unarmed&&martial?.active?Martial.dice(baseDamage,martial.die):baseDamage;
  const notes=unarmed?martial?.active?[Martial.note(martial,damageDie),martial.edition==='2024'?'One Unarmed Strike may use your Bonus Action. Grapple/Shove save DC: '+(8+stats.pb+stats.mods.str)+' (Strength) or '+(8+stats.pb+stats.mods.dex)+' (Dexterity). Resolve targets at the table.':'One Bonus Action Unarmed Strike after an Attack action with an Unarmed Strike or Monk weapon.']:['Basic unarmed strike; other race/subclass overrides remain manual.',...(martial?.reason?[martial.reason]:[])]:['Improvised weapon: no proficiency unless granted. The DM can instead treat it as a standard weapon.'];
  return {...row,name:a.name||(unarmed?'Unarmed strike':'Improvised weapon'),ability,hit:sign(mod+(proficient?stats.pb:0)),damage:damageDie==='1'?Math.max(0,1+mod)+' bludgeoning':add(damageDie,mod)+(unarmed?' bludgeoning':' (DM chooses type)'),range:!unarmed&&a.mode==='thrown'?'20/60 ft':'5 ft',notes};
 }
 function derive(data,level,stats,loot,spells){return normalize(data.actions).map(a=>resolve(a,data,level,stats,loot,spells));}
 return {spellReference,normalize,resolve,derive};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterActions;
