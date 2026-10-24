const assert = require('node:assert/strict');
const P = require('../js/modules/character-class-progression');

assert.equal(Object.keys(P.classes).length, 13, 'Class catalogue includes the 12 SRD classes plus legacy Artificer');
assert.equal(Object.keys(P.subclasses).length, 12, 'Adobe baseline should include 12 base subclasses');

const fighter3 = P.unlocked('fighter',3,'champion').map(x=>x.name);
for (const name of ['Fighting Style','Second Wind','Action Surge','Martial Archetype','Improved Critical'])
  assert.ok(fighter3.includes(name), 'Fighter 3 / Champion should include '+name);

const sorcerer1 = P.unlocked('sorcerer',1,'draconic-bloodline').map(x=>x.name);
for (const name of ['Spellcasting','Sorcerous Origin','Dragon Ancestor','Draconic Resilience'])
  assert.ok(sorcerer1.includes(name), 'Sorcerer 1 / Draconic Bloodline should include '+name);

assert.equal(P.subclassLevel('life-domain'),1);
assert.equal(P.subclassLevel('champion'),3);

console.log('SUCCESS character class progression: 13 classes, 12 base subclasses and unlock levels');

const entry={classId:'fighter',level:6,subclassId:'champion'};
const action=P.unlocked('fighter',6,'champion','2014').find(row=>row.name==='Action Surge');
const subclass=P.unlocked('fighter',6,'champion','2014').find(row=>row.name==='Improved Critical');
const key=P.overviewKey(entry,action,'2014'),subKey=P.overviewKey(entry,subclass,'2014');
const data={build:{edition:'2014'},adobe:{overviewFeatures:{
 [key]:{enabled:true,showName:false,showDescription:true},
 [subKey]:{enabled:true,showName:true,showDescription:false},
 '2014:forged:class:1:unknown':{enabled:true,showName:true}
}}};
assert.equal(P.overviewFeatures(data,[entry]).length,2);
assert.equal(P.overviewFeatures(data,[{...entry,level:1}]).length,0,'locked features must disappear');
assert.equal(P.overviewFeatures(data,[{...entry,subclassId:''}]).length,1,'old subclass features must disappear');
assert.equal(P.overviewFeatures({...data,build:{edition:'2024'}},[entry]).length,0,'edition-specific pins must not leak');
assert.equal(P.overviewFeatures(data,[entry,entry]).length,2,'duplicate class rows do not duplicate reminders');
assert.equal(P.overviewFeatures(data,[entry])[0].showName,false);
assert.equal(P.overviewFeatures(data,[entry])[0].showDescription,true);
assert.deepEqual(P.normalizeOverview(P.normalizeOverview(data.adobe.overviewFeatures)),P.normalizeOverview(data.adobe.overviewFeatures));
assert.deepEqual(P.normalizeOverview({'<script>':{enabled:true},'2014:test':null}),{});
console.log('SUCCESS Overview feature preferences: level, class, subclass, edition and normalization');

for(let level=1;level<=20;level++){const rows=P.unlocked('artificer',level,'','2014');assert.ok(rows.every(row=>row.level<=level));assert.equal(rows.some(row=>row.name==='Tool Expertise'),level>=6);assert.equal(rows.some(row=>row.name==='Flash of Genius'),level>=7);assert.equal(rows.some(row=>row.name==='Soul of Artifice'),level>=20);}
assert.deepEqual(P.classFeatures('artificer','2024'),P.classFeatures('artificer','2014'),'compatible core edition uses the explicitly labelled legacy source');
