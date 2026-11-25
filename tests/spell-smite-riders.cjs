'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-catalog');
C.set(require('../data/rules/catalog.json'));
const find=(name,source)=>C.data.spells.find(row=>row.name===name&&row.source===source);
function setup(name,source){
 const spell=find(name,source),data=M.normalize({hpMax:140,hpCurrent:100,hpTemp:7,spellAbility:'cha',abilities:{str:16,dex:10,con:14,int:8,wis:10,cha:16},build:{classId:'paladin',edition:spell.edition,scoreMode:'final'},adobe:{classLevels:[{classId:'paladin',level:20}]},spells:[{...C.spellRow(spell),classId:'additional',prepared:true}]});
 data.adobe={classLevels:[{classId:'paladin',level:20}]};
 const action=(effect,slot=spell.level)=>{data.actions=[{kind:'spell',ref:spell.id+'::additional',effect,slot}];return M.derive(data,20).actions[0];};return{spell,data,action};
}
test('Smite hit references use the existing hit instead of a spell attack or rider save, with source-specific slot scaling',()=>{
 for(const [name,base,modern]of [['Banishing Smite','5d10','5d10'],['Blinding Smite','3d8','9d8'],['Staggering Smite','4d6','9d6'],['Thunderous Smite','2d6','10d6'],['Wrathful Smite','1d6','9d6']])for(const source of ['PHB','XPHB']){
  const {data,action}=setup(name,source),before=JSON.stringify({hp:data.hpCurrent,temp:data.hpTemp,slots:data.slots,conditions:data.conditions,coins:data.coins,spells:data.spells}),a=action('hit',9);
  assert.equal(a.available,true,name+' '+source);assert.equal(a.damageDice,source==='PHB'?base:modern);assert.equal(a.paperHit,'Auto');assert.equal(a.proficient,false);assert.doesNotMatch(a.damage,/\+3/);
  assert.match(a.notes.join(' '),source==='PHB'?/Bonus Action before/:/immediately after/);
  assert.equal(JSON.stringify({hp:data.hpCurrent,temp:data.hpTemp,slots:data.slots,conditions:data.conditions,coins:data.coins,spells:data.spells}),before);
  if(name!=='Banishing Smite')assert.match(a.notes.join(' '),source==='PHB'?/Concentration up to/:/No Concentration/);
 }
 const brand=setup('Branding Smite','PHB').action('',9);assert.equal(brand.damageDice,'9d6');assert.equal(brand.paperHit,'Auto');assert.match(brand.notes.join(' '),/ranged attack/);
});
test('Banishing Smite retains the actual HP threshold and revised-only Charisma save without turning banishment into damage',()=>{
 for(const source of ['PHB','XPHB']){
  const {spell,action}=setup('Banishing Smite',source),a=action('rider');assert.equal(a.available,true);assert.equal(a.damageDice,undefined);assert.equal(a.damage,'See spell effect');assert.equal(a.paperDamageType,'');assert.match(a.notes.join(' '),/50 HP or fewer/);
  if(source==='PHB'){assert.equal(a.paperHit,'Auto');assert.equal(spell.save,'');assert.match(a.notes.join(' '),/without a save/);assert.match(a.notes.join(' '),/home plane/);}
  else{assert.equal(a.paperHit,'CHA17');assert.equal(spell.save,'CHARISMA');assert.match(a.notes.join(' '),/failed Charisma save/);assert.doesNotMatch(a.notes.join(' '),/home plane/);}
 }
});
test('Blinding, staggering and thunder riders preserve their distinct save timing, conditions, target and expiry',()=>{
 for(const source of ['PHB','XPHB']){
  let a=setup('Blinding Smite',source).action('rider');assert.equal(a.paperHit,'CON17');assert.equal(a.damageDice,undefined);assert.match(a.notes.join(' '),source==='PHB'?/failed Constitution save Blinds/:/Blinds automatically/);
  a=setup('Staggering Smite',source).action('rider');assert.equal(a.paperHit,'WIS17');assert.equal(a.damageDice,undefined);assert.match(a.notes.join(' '),source==='PHB'?/prevents Reactions until the end of its next turn/:/Stuns the target until the end of the caster/);
  a=setup('Thunderous Smite',source).action('rider');assert.equal(a.paperHit,'STR17');assert.equal(a.damageDice,undefined);assert.match(a.notes.join(' '),/Only a creature/);assert.match(a.notes.join(' '),/not an area-damage attack/);
 }
});
test('Wrathful Smite keeps Psychic versus Necrotic and legacy Action checks versus revised turn-end saves',()=>{
 const legacy=setup('Wrathful Smite','PHB'),modern=setup('Wrathful Smite','XPHB');assert.equal(legacy.action('hit').damageType,'psychic');assert.equal(modern.action('hit').damageType,'necrotic');
 const escape=legacy.action('escape');assert.equal(escape.paperHit,'Effect');assert.equal(escape.damageDice,undefined);assert.match(escape.notes.join(' '),/Action Wisdom escape check: DC 17/);assert.match(escape.notes.join(' '),/not.*saving throw/);
 assert.match(modern.action('rider').notes.join(' '),/each target turn end/);assert.equal(modern.action('escape').available,false);
});
test('Searing Smite separates a scaling hit from fixed legacy burning and revised damage-before-save burning',()=>{
 for(const source of ['PHB','XPHB']){
  const {action}=setup('Searing Smite',source),hit=action('hit',9),ongoing=action('ongoing',9);assert.equal(hit.damageDice,'9d6');assert.equal(hit.paperHit,'Auto');assert.equal(ongoing.damageDice,source==='PHB'?'1d6':'9d6');
  assert.equal(ongoing.paperHit,source==='PHB'?'CON17':'Auto');assert.match(ongoing.notes.join(' '),source==='PHB'?/success ends the spell with no damage/:/Success ends the spell after this damage/);
  if(source==='XPHB')assert.match(ongoing.notes.join(' '),/After damage, Constitution save to end burning: DC 17/);
 }
});
test('Smite effect choices stay source-bound and lower actual class levels cannot use high-level class references',()=>{
 const {spell,data,action}=setup('Banishing Smite','XPHB');assert.equal(action('').available,false);assert.equal(action('not-a-real-effect').available,false);
 data.spells[0].classId='paladin';data.actions=[{kind:'spell',ref:spell.id+'::paladin',effect:'hit',slot:5}];data.adobe.classLevels=[{classId:'paladin',level:5},{classId:'wizard',level:15}];assert.equal(M.derive(data,20).actions[0].available,false,'total level does not teach a Paladin 5 a level-5 spell');
 const legacy=setup('Wrathful Smite','PHB');legacy.action('escape');legacy.data.spells=[];assert.equal(M.derive(legacy.data,20).actions[0].available,false);
});
