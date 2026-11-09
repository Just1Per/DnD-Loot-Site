'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../js/modules/character-sheet-model'),P=require('../js/modules/character-personal-feats'),F=require('../js/modules/character-feat-rules');
const id='personal-feat-private-example',sheet=()=>({...M.normalize({build:{classId:'wizard',edition:'2014',scoreMode:'base'},adobe:{classLevels:[{classId:'wizard',level:3}]},hpCurrent:3,hpTemp:2,coins:{gp:42}}),adobe:{classLevels:[{classId:'wizard',level:3}]}});
test('personal homebrew persists privately and applies only its explicit supported mechanics',()=>{
 const d=sheet(),before=M.derive(d,3),resources=JSON.stringify([d.hpCurrent,d.hpTemp,d.coins,d.rulesChoices.grants]);
 const feat=P.set(d,id,{name:'Tough',description:'My own feat, not the published Tough.',edition:'2014',hpPerLevel:1,speedBonus:10,armorTraining:['medium']});F.addManual(d,feat);
 const r=M.derive(d,3);assert.equal(r.hpMax,before.hpMax+3);assert.equal(r.effects.speed,before.effects.speed+10);assert.ok(r.effects.proficiencies.includes('Medium armor'));assert.equal(r.feats.reports[0].def.source,'Personal homebrew');assert.equal(JSON.stringify([d.hpCurrent,d.hpTemp,d.coins,d.rulesChoices.grants]),resources);
 const raw=JSON.parse(JSON.stringify(d)),reopened={...M.normalize(raw),adobe:{...raw.adobe,personalFeats:P.normalize(raw.adobe.personalFeats)}};assert.equal(P.find(reopened,id).description,feat.description);assert.equal(M.derive(reopened,3).hpMax,r.hpMax);assert.equal(F.resource({...P.definition(d,id),name:'Lucky'},3),null);
 assert.throws(()=>P.remove(d,id),/Remove this feat/);F.remove(d,id);P.remove(d,id);assert.equal(d.adobe.personalFeats,undefined);
});
test('personal normalization rejects unsafe IDs and bounds definitions without changing legacy sheets',()=>{
 const legacy=sheet();assert.equal(Object.hasOwn(legacy.adobe,'personalFeats'),false);
 const rows=P.normalize({'__proto__':{},'not-personal':{name:'Bad'},[id]:{name:'A'.repeat(200),description:'x'.repeat(7000),hpPerLevel:99,speedBonus:-5,armorTraining:['medium','medium','forged']}});
 assert.deepEqual(Object.keys(rows),[id]);assert.equal(rows[id].name.length,160);assert.equal(rows[id].description.length,6000);assert.equal(rows[id].hpPerLevel,10);assert.equal(rows[id].speedBonus,0);assert.deepEqual(rows[id].armorTraining,['medium']);
 assert.throws(()=>P.set(legacy,id,{name:'',hpPerLevel:0}),/name/);assert.throws(()=>P.set(legacy,id,{name:'Fine',hpPerLevel:1.5}),/whole/);assert.equal(legacy.adobe.personalFeats,undefined);
});
test('DM blocks on personal IDs preserve chosen mechanics and never publish the private definition',()=>{
 const old=global.CampaignRules;try{let blocked=false;global.CampaignRules={records:()=>blocked?[{id,name:'Restricted personal feat',hidden:true,custom:true}]:[],allowed:()=>true,definition:(_id,base)=>base};const d=sheet(),base=M.derive(d,3);F.addManual(d,P.set(d,id,{name:'Secret player feat',description:'Private background details',edition:'2014',hpPerLevel:2}));assert.equal(P.selectable(d,id),true);blocked=true;assert.equal(P.catalogue(d).length,0);assert.equal(M.derive(d,3).hpMax,base.hpMax+6);assert.equal(global.CampaignRules.records()[0].description,undefined);assert.equal(P.find(d,id).name,'Secret player feat');}finally{if(old===undefined)delete global.CampaignRules;else global.CampaignRules=old;}
});
