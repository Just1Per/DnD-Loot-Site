const {test}=require('node:test'),assert=require('node:assert/strict');
const source=require('../js/modules/character-srd-class-data'),P=require('../js/modules/character-class-progression');
test('revised Monk gets Deflect Attacks at 3 and Stunning Strike once from 5 at every level',()=>{
 for(let level=1;level<=20;level++){const rows=P.unlocked('monk',level,'','2024');assert.equal(rows.filter(r=>r.name==='Deflect Attacks').length,level>=3?1:0);assert.equal(rows.filter(r=>r.name==='Stunning Strike').length,level>=5?1:0);assert.equal(rows.some(r=>r.name==='Unarmored Movement'),level>=2);assert.ok(!rows.some(r=>r.name==='Unarmoed Movement'));}
 assert.equal(P.unlocked('monk',4,'','2014').some(r=>r.name==='Stunning Strike'),false);assert.equal(P.unlocked('monk',5,'','2014').filter(r=>r.name==='Stunning Strike').length,1);assert.ok(!P.classFeatures('monk','2014').some(r=>r.name==='Deflect Attacks'));
 assert.deepEqual(source.editions['2024'].classes.monk.features.filter(r=>r.name==='Stunning Strike').map(r=>r.level),[5]);assert.equal(source.editions['2024'].classes.monk.features.find(r=>r.name==='Deflect Attacks').level,3);
});
test('Fighter reference uses Studied Attacks at actual class level 13',()=>{
 for(let level=1;level<=20;level++){const rows=P.unlocked('fighter',level,'','2024');assert.equal(rows.some(r=>r.name==='Studied Attacks'),level>=13);assert.ok(!rows.some(r=>r.name==='Studdied Attacks'));}
});
test('each Warlock arcanum describes its own spell level rather than repeating level 6',()=>{
 for(const edition of ['2014','2024'])for(const [level,spell] of [[11,6],[13,7],[15,8],[17,9]]){const row=P.gainedAt('warlock',level,'',edition).find(r=>r.name==='Mystic Arcanum');assert.match(row.summary,new RegExp('level '+spell+' Warlock spell'));assert.match(row.summary,/once without a spell slot/);assert.match(row.summary,/Long Rest/);}
});
test('older remote imports receive the same corrections without mutation; valid unrelated records and saved pins remain intact',()=>{
 const remote={classes:{monk:{features:[{name:'Stunning Strike',level:3,summary:'wrong entry'},{name:'Stunning Strike',level:5,summary:'proper entry'},{name:'Unarmoed Movement',level:2},{name:'Custom training',level:8}]},fighter:{features:[{name:'Studdied Attacks',level:13}]},warlock:{features:[{name:'Mystic Arcanum',level:15,summary:'Choose a level 6 spell'}]}}},before=JSON.stringify(remote);P.installReference('2024',remote);
 try{assert.ok(P.classFeatures('monk','2024').some(r=>r.name==='Custom training'));assert.equal(P.unlocked('monk',3,'','2024').some(r=>r.name==='Stunning Strike'),false);assert.match(P.classFeatures('monk','2024').find(r=>r.name==='Deflect Attacks').summary,/Dexterity modifier and Monk level/);assert.ok(P.classFeatures('fighter','2024').some(r=>r.name==='Studied Attacks'));assert.match(P.classFeatures('warlock','2024')[0].summary,/level 8/);assert.equal(JSON.stringify(remote),before);
 const entry={classId:'monk',level:3},data={build:{edition:'2024'},adobe:{overviewFeatures:{'2024:monk:class:3:stunning-strike':{enabled:true,showName:true},'2024:monk:class:5:stunning-strike':{enabled:true,showName:true}}}};assert.equal(P.overviewFeatures(data,[entry]).length,0);assert.equal(P.overviewFeatures(data,[{...entry,level:5}]).length,1);assert.ok(data.adobe.overviewFeatures['2024:monk:class:3:stunning-strike'],'legacy preferences are retained rather than deleted');
 }finally{P.installReference('2024',null);}
});
