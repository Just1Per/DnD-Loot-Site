'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/character-sheet-model'),C=require('../js/modules/character-catalog');C.set(require('../data/rules/catalog.json'));
function setup(name,source='XPHB',wis=16){
 const spell=C.data.spells.find(s=>s.name===name&&s.source===source),data=M.normalize({hpMax:120,hpCurrent:70,hpTemp:8,spellAbility:'wis',abilities:{wis},build:{classId:'druid',edition:spell.edition,scoreMode:'final'},spells:[{...C.spellRow(spell),classId:'additional',prepared:true}]});data.adobe={classLevels:[{classId:'druid',level:20}]};
 const action=(effect='',slot=spell.level)=>{data.actions=[{kind:'spell',ref:spell.id+'::additional',effect,slot}];return M.derive(data,20).actions[0];};return{data,spell,action};
}
const compact=text=>String(text||'').replace(/\s/g,'').replaceAll('−','-');
test('Backlash reduction includes only its casting modifier, scales independently and never masquerades as damage or healing',()=>{
 for(const [wis,modifier]of [[8,'-1'],[10,''],[16,'+3']]){
  const {data,action}=setup('Backlash','FRHoF',wis),before=JSON.stringify({hp:data.hpCurrent,temp:data.hpTemp,slots:data.slots,conditions:data.conditions});
  for(const slot of [4,5,9]){const count=slot,reduce=action('reduce',slot),retaliate=action('retaliate',slot);assert.equal(reduce.available,true);assert.equal(compact(reduce.damageReductionReference),count+'d6'+modifier);assert.equal(reduce.damageDice,undefined);assert.equal(reduce.healingReference,undefined);assert.equal(reduce.damage,'See spell effect');assert.equal(reduce.paperHit,'Auto');assert.match(reduce.notes.join(' '),/not healing/);assert.equal(retaliate.damageDice,count+'d6');assert.equal(retaliate.damageReductionReference,undefined);assert.equal(retaliate.paperHit,'CON'+(8+6+Math.floor((wis-10)/2)));assert.match(retaliate.notes.join(' '),/creature within.*60-ft/);}
  assert.equal(JSON.stringify({hp:data.hpCurrent,temp:data.hpTemp,slots:data.slots,conditions:data.conditions}),before);
 }
});
test('Conjure Celestial keeps revised healing and radiant damage as independent modes without borrowing a legacy summon’s attack',()=>{
 const modern=setup('Conjure Celestial'),legacy=setup('Conjure Celestial','PHB');for(const [slot,damage,heal]of [[7,'6d12','4d12+3'],[9,'8d12','6d12+3']]){const hurt=modern.action('sear',slot),restore=modern.action('heal',slot);assert.equal(hurt.damageDice,damage);assert.equal(hurt.paperHit,'DEX17');assert.equal(hurt.healingReference,undefined);assert.equal(compact(restore.healingReference),heal);assert.equal(restore.temporaryHPReference,false);assert.equal(restore.damageDice,undefined);assert.equal(restore.paperDamageType,'');assert.match(restore.notes.join(' '),/at most once per turn/);}
 assert.equal(legacy.spell.combat?.effects?.some(e=>e.id==='sear'),undefined);assert.equal(legacy.action('sear').available,false);assert.equal(modern.action('').available,false);
});
test('Conjure Constructs ward gives non-stacking temporary HP, never healing or the same dice as its damaging mode',()=>{
 const {data,action}=setup('Conjure Constructs','FRHoF'),before=JSON.stringify({hp:data.hpCurrent,temp:data.hpTemp,slots:data.slots});for(const [slot,damage,ward]of [[3,'3d6','1d6+3'],[9,'9d6','7d6+3']]){const strike=action('force',slot),shield=action('ward',slot);assert.equal(strike.damageDice,damage);assert.equal(strike.paperHit,'DEX17');assert.equal(shield.damageDice,undefined);assert.equal(shield.temporaryHPReference,true);assert.equal(compact(shield.healingReference),ward);assert.match(shield.notes.join(' '),/never add the pools together/);assert.match(strike.notes.join(' '),/Magic action on later turns/);}
 assert.equal(JSON.stringify({hp:data.hpCurrent,temp:data.hpTemp,slots:data.slots}),before);
});
test('Moonlight and Death Armor keep actual hit/Reaction/recipient conditions and grant no automatic defenses',()=>{
 const {data,action}=setup('Fount of Moonlight'),before=JSON.stringify(M.derive(data,20).effects.resistances),hit=action('melee-hit',9),blind=action('blind',9);assert.equal(hit.damageDice,'2d6');assert.equal(hit.paperHit,'Auto');assert.match(hit.notes.join(' '),/including a melee spell attack/);assert.equal(blind.damageDice,undefined);assert.equal(blind.paperHit,'CON17');assert.match(blind.notes.join(' '),/immediately after taking damage/i);assert.equal(JSON.stringify(M.derive(data,20).effects.resistances),before);
 const armor=setup('Death Armor','FRHoF'),a=armor.action('',9);assert.equal(a.damageDice,'2d4');assert.equal(a.paperHit,'Auto');assert.equal(a.range,'5 ft from warded target');assert.match(a.notes.join(' '),/not automatically the caster/);assert.match(a.notes.join(' '),/once per turn/i);assert.equal(M.derive(armor.data,20).effects.deathSaveAdvantage,undefined);
});
test('Guardian keeps fixed damage and its real source trigger; emanation saves retain success/condition and per-creature limits',()=>{
 for(const source of ['PHB','XPHB']){const {action}=setup('Guardian of Faith',source),a=action('',9);assert.equal(a.damageDice,'20');assert.equal(a.paperHit,'DEX17');assert.match(a.notes.join(' '),/60 total damage|60 total/);assert.match(a.notes.join(' '),source==='PHB'?/does not add a start-turn trigger/:/starting its turn there/);}
 const shield=setup('Cacophonic Shield','FRHoF').action('',9);assert.equal(shield.damageDice,'9d6');assert.equal(shield.paperHit,'CON17');assert.match(shield.notes.join(' '),/once per creature per turn/);assert.match(shield.notes.join(' '),/Creatures designated when actually casting are unaffected/);
 const aura=setup("Yolande's Regal Presence").action('',9);assert.equal(aura.damageDice,'4d6');assert.equal(aura.paperHit,'WIS17');assert.match(aura.notes.join(' '),/up to 10 ft/);assert.match(aura.notes.join(' '),/success halves damage only/i);
});
test('the audit distinguishes conditional damage, healing/temporary HP and reduction formulas with no source prose',()=>{
 const {audit}=require('../scripts/audit-rule-automation.cjs'),report=audit();assert.equal(report.summary.spellActionFormulas,324);assert.equal(report.summary.manualDamageReferences,44);assert.equal(report.summary.spellHealingFormulas,18);assert.equal(report.summary.spellDamageReductionFormulas,1);
 const backlash=report.spells.find(s=>s.name==='Backlash');assert.deepEqual(backlash.effectChoices.find(e=>e.id==='reduce').damageReductionFormula,{dice:'4d6',upcast:'1d6',addAbility:true});for(const name of ['Conjure Celestial','Conjure Constructs'])assert.ok(report.spells.find(s=>s.name===name&&s.edition==='2024').effectChoices.some(e=>e.healingFormula));
});
