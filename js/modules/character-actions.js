/* Saved references, live formulas. Never executes item or spell text. */
var CharacterActions = (()=>{
 const E=typeof CharacterEquipment!=='undefined'?CharacterEquipment:require('./character-equipment');
 const ab=['str','dex','con','int','wis','cha'],text=v=>String(v||'').slice(0,200),sign=n=>(n>=0?'+':'')+n;
 function normalize(rows){return (Array.isArray(rows)?rows:[]).slice(0,60).map(r=>({kind:['loot','weapon','spell','racial','improvised','unarmed'].includes(r?.kind)?r.kind:'improvised',ref:text(r?.ref),mode:['twoHanded','thrown','offhand','mounted'].includes(r?.mode)?r.mode:'normal',ability:ab.includes(r?.ability)?r.ability:'auto',slot:Math.max(0,Math.min(9,Math.trunc(Number(r?.slot)||0))),name:text(r?.name)}));}
 const add=(dice,n)=>dice+(n?' '+(n<0?'−':'+')+' '+Math.abs(n):'');
 function diceAt(scales,level,fallback){const keys=Object.keys(scales||{}).map(Number).filter(k=>k<=level).sort((a,b)=>b-a);return keys.length?scales[keys[0]]:fallback;}
 function increase(base,extra,times){const a=/^(\d+)d(\d+)$/.exec(base),b=/^(\d+)d(\d+)$/.exec(extra||'');return a&&b&&a[2]===b[2]?`${Number(a[1])+Number(b[1])*times}d${a[2]}`:base;}
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
   const result=E.derive(temp,stats,item?loot:[...loot,entry]).attacks.find(r=>r.id===entry.id);
   if(!result)return unavailable('This item needs weapon mechanics configured by the DM.');
   const out={...row,name:entry.item.name+(a.mode==='twoHanded'?' (two hands)':a.mode==='thrown'?' (thrown)':a.mode==='offhand'?' (extra attack)':''),hit:result.attack===null?'—':sign(result.attack),damage:result.damage,range:result.range,ability:result.ability,notes:result.notes};
   if(m.base==='net'&&result.edition==='2024'){out.hit='DEX DC '+(8+stats.pb+stats.mods.dex);out.ability='dex';out.damage='Restrained; no damage';out.notes.push('Large or smaller target; an attack replacement.');}
   if(item&&!existing?.equipped)out.notes.push('In backpack: ready this item before using it.');
   if(!item)out.notes.push('Reference weapon; this does not add equipment to inventory.');
   return out;
  }
  if(a.kind==='racial'){
   const breath=stats.effects.breath;if(a.ref!=='breath'||!breath)return unavailable('This species no longer grants this breath weapon.');
   return {...row,name:'Breath weapon',hit:breath.save.toUpperCase()+' DC '+(8+stats.pb+stats.mods.con),damage:`${breath.dice}d${breath.die||6} ${breath.type}`,range:breath.area,ability:'con',notes:[breath.usage||'Action; once per short or long rest.','Successful save: half damage. Track uses separately.']};
  }
  if(a.kind==='spell'){
   const spell=spells.find(s=>s.id===a.ref);if(!spell)return unavailable('Spell catalogue unavailable.');
   if(!data.spells.some(s=>s.catalogId===a.ref))return unavailable('This spell is no longer selected in your spellbook.');
   const ability=a.ability==='auto'?data.spellAbility:a.ability,mod=stats.mods[ability],c=spell.combat||{},slot=spell.level?Math.max(spell.level,a.slot):0;
   let damage=spell.level===0?diceAt(c.scaling,level,c.damage||''):c.damage||'';
   if(slot>spell.level&&c.upcast)damage=increase(damage,c.upcast,Math.floor((slot-spell.level)/(c.step||1)));
   let count=1,unit='';
   if(spell.name==='Eldritch Blast'){count=level>=17?4:level>=11?3:level>=5?2:1;unit='beam';}
   if(spell.name==='Scorching Ray'){count=3+Math.max(0,slot-2);unit='ray';}
   if(spell.name==='Magic Missile'){count=3+Math.max(0,slot-1);unit='dart';}
   const notes=['Base effect shown. Resolve conditions, riders and resource use from the spell.'];
   if(slot>spell.level&&!c.upcast&&!['Scorching Ray','Magic Missile'].includes(spell.name))notes.push('Upcast effects are not automated for this spell.');
   if(!damage)notes.push('Damage or weapon-dependent effect needs manual resolution; see spell information.');
   if(damage&&c.addAbility)damage=add(damage,mod);
   const types=(c.types||[]).join(' / ');if(damage)damage+=(types?' '+types:'')+(unit?` per ${unit} × ${count}`:'');
   return {...row,name:spell.name+' · '+spell.edition+(slot?' (level '+slot+')':''),ability,hit:c.attack?sign(mod+stats.pb+data.spellAttackBonus):spell.save?spell.save+' DC '+(8+stats.pb+mod+data.spellDCBonus):'Effect',damage:damage||'See spell effect',range:spell.range,notes};
  }
  const unarmed=a.kind==='unarmed',ability=a.ability==='auto'?(a.mode==='thrown'?'dex':'str'):a.ability;
  const tavern=(stats.effects.originFeats||[]).includes('Tavern Brawler')||stats.feats.reports.some(r=>r.def.name==='Tavern Brawler'&&!r.warnings.length);
  const proficient=unarmed||tavern,mod=stats.mods[ability];
  return {...row,name:a.name||(unarmed?'Unarmed strike':'Improvised weapon'),ability,hit:sign(mod+(proficient?stats.pb:0)),damage:unarmed&&!tavern?Math.max(0,1+mod)+' bludgeoning':add('1d4',mod)+(unarmed?' bludgeoning':' (DM chooses type)'),range:a.mode==='thrown'?'20/60 ft':'5 ft',notes:[unarmed?'Basic unarmed strike; class-specific Martial Arts and other overrides remain manual.':'Improvised weapon: no proficiency unless granted. The DM can instead treat it as a standard weapon.']};
 }
 function derive(data,level,stats,loot,spells){return normalize(data.actions).map(a=>resolve(a,data,level,stats,loot,spells));}
 return {normalize,resolve,derive};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterActions;
