const test=require('node:test'),assert=require('node:assert/strict'),P=require('../js/modules/character-play-rules'),M=require('../js/modules/character-sheet-model'),catalog=require('../data/rules/catalog.json'),A=require('../data/rules/adobe-reference.json');
const build=(c='fighter',edition='2024')=>M.normalize({build:{classId:c,edition}});
test('Feat progression grants ordinary milestones and Fighter/Rogue extras',()=>{assert.equal(P.budget(build('wizard'),3,catalog.feats).remaining,0);assert.equal(P.budget(build('wizard'),4,catalog.feats).remaining,1);assert.equal(P.budget(build(),6,catalog.feats).remaining,2);assert.equal(P.budget(build('rogue'),10,catalog.feats).remaining,3);assert.equal(P.budget(build(),19,catalog.feats).remaining,7);});
test('Feat/ASI choices share a finite budget and saved excess is reported',()=>{const d=build('wizard');d.advancement.asiSpent=1;assert.equal(P.budget(d,4,catalog.feats).remaining,0);d.rulesChoices.feats=['old-custom'];assert.equal(P.budget(d,4,catalog.feats).over,1);assert.equal(d.rulesChoices.feats.length,1);});
test('Fighting Style cannot consume an unrestricted choice',()=>{const f=catalog.feats.find(f=>f.category==='FS');assert.equal(P.eligible(build(),1,f,catalog.feats),'');assert.ok(P.eligible(build('wizard'),20,f,catalog.feats));assert.equal(P.budget(build('paladin'),1,catalog.feats).style,0);assert.equal(P.budget(build('paladin'),2,catalog.feats).style,1);});
test('Warlock Origin choice requires the selected invocation and level two',()=>{const d=build('warlock');d.advancement.lessons=true;assert.equal(P.budget(d,1,catalog.feats).lessons,0);assert.equal(P.budget(d,2,catalog.feats).lessons,1);});
test('Variant Human 2014 starts with one eligible legacy feat',()=>{const d=build('wizard','2014'),feat=catalog.feats.find(f=>f.edition==='2014'&&f.name==='Alert');d.build.race='variant-human';assert.equal(P.eligible(d,1,feat,catalog.feats),'');d.build.raceFeat='Alert';assert.ok(P.eligible(d,1,feat,catalog.feats));});
test('Numeric prerequisites block selection before the feat grants its own increase',()=>{const f=catalog.feats.find(f=>f.edition==='2024'&&f.name==='Grappler');assert.ok(P.eligible(build(),4,f,catalog.feats,{str:12,dex:10}));assert.equal(P.eligible(build(),4,f,catalog.feats,{str:13,dex:10}),'');});
test('Profile normalizes and survives repeated normalization',()=>{const d=M.normalize({profile:{gender:'other',age:102,height:182,weight:76,size:'medium',hair:'Silver',skin:'Blue'},alignment:'Chaotic Good'});assert.deepEqual(M.normalize(d),d);assert.equal(d.profile.hair,'Silver');assert.equal(Object.keys(P.alignments).length,9);});
test('PDF gear and background pack data have unique identifiers and edition labels',()=>{assert.equal(A.gear.length,106);assert.equal(new Set(A.gear.map(g=>g.id)).size,106);assert.ok(A.packs.find(p=>p.id==='background-noble-2014'));assert.ok(A.packs.find(p=>p.id==='background-noble-2024'));assert.equal(A.story.acolyte.personality.length,8);});
test('Gear importer is create-only and safely repeatable',async()=>{const {gearTemplates,publishGear}=await import('../scripts/import-base-gear.mjs'),rows=gearTemplates(A),saved=new Map([[rows[0].id,{name:'DM customized'}]]);const db={doc:p=>p,runTransaction:fn=>fn({get:async p=>({exists:saved.has(p.split('/')[1])}),create:(p,v)=>saved.set(p.split('/')[1],v)})};assert.equal(rows.length,158);await publishGear(db,rows);await publishGear(db,rows);assert.equal(saved.size,158);assert.equal(saved.get(rows[0].id).name,'DM customized');assert.equal(rows.find(r=>r.name==='Shield').mechanics.kind,'shield');});

test('DM-approved bonus feat and ASI choices extend only their intended budgets',()=>{
 const d=build('wizard');d.rulesChoices.grants.__dm={bonusFeats:1,bonusAsis:1,usedAsis:0,approvedBy:'dm',updatedAt:1};
 let b=P.budget(d,4,catalog.feats);assert.equal(b.remaining,2);assert.equal(b.asiRemaining,2);assert.equal(b.bonusFeatRemaining,1);assert.equal(b.bonusAsiRemaining,1);
 const feat=catalog.feats.find(f=>f.edition==='2024'&&f.category==='G'&&f.minimumLevel<=4);d.rulesChoices.feats=[feat.id];b=P.budget(d,4,catalog.feats);assert.equal(b.normalRemaining,1,'bonus feat should be consumed before the normal advancement choice');
 d.rulesChoices.grants.__dm.usedAsis=1;b=P.budget(d,4,catalog.feats);assert.equal(b.bonusAsiRemaining,0);assert.equal(b.asiRemaining,1);
 d.advancement.asiSpent=1;b=P.budget(d,4,catalog.feats);assert.equal(b.asiRemaining,0);assert.equal(b.over,0);
});

test('DM bonus feat and ASI approvals extend progression without changing normal progression',()=>{
 const data=M.normalize({build:{edition:'2024',classId:'fighter'},rulesChoices:{feats:[],grants:{__dm:{bonusFeats:1,bonusAsis:1,usedAsis:0}}}});
 let b=R.budget(data,4,[]);
 assert.equal(b.normalRemaining,1);
 assert.equal(b.bonusFeatRemaining,1);
 assert.equal(b.bonusAsiRemaining,1);
 data.rulesChoices.grants.__dm.usedAsis=1;
 b=R.budget(data,4,[]);
 assert.equal(b.bonusAsiRemaining,0);
 data.rulesChoices.grants.__dm.bonusFeats=0;
 b=R.budget(data,4,[]);
 assert.equal(b.bonusFeatRemaining,0);
});
