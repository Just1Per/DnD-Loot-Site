const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../js/modules/character-catalog'),M=require('../js/modules/character-sheet-model');
const data=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/rules/catalog.json'),'utf8'));C.set(data);
test('published index includes both complete PHBs and every indexed supplement',()=>{
 assert.equal(data.spells.filter(s=>s.source==='PHB').length,361);assert.equal(data.spells.filter(s=>s.source==='XPHB').length,391);
 assert.equal(data.spells.length,969);assert.equal(new Set([...data.spells,...data.feats].map(s=>s.id)).size,data.spells.length+data.feats.length);
 for(const s of [...data.spells,...data.feats])assert.ok(!s.description||s.licensedText);
});
test('2014 and 2024 versions retain different licensed spell descriptions',()=>{
 const a=C.spells({edition:'2014',search:'Cure Wounds'}).find(s=>s.source==='PHB'),b=C.spells({edition:'2024',search:'Cure Wounds'}).find(s=>s.source==='XPHB');
 assert.notEqual(a.id,b.id);assert.match(a.description,/1d8/);assert.match(b.description,/2d8/);
});
test('Magic Initiate enforces class, edition, spell levels and distinct cantrips',()=>{
 const g={edition:'2024',fixedClass:'wizard'},spells=C.spells({edition:'2024',classId:'wizard'});
 const choices={ability:'wis',spells:[...spells.filter(s=>s.level===0).slice(0,2),spells.find(s=>s.level===1)].map(s=>s.id)};
 assert.equal(C.validateGrant(g,choices).errors.length,0);assert.equal(C.validateGrant(g,choices).ability,'wis');
 choices.spells[1]=choices.spells[0];assert.match(C.validateGrant(g,choices).errors.join(' '),/different/);
 choices.spells[2]=C.spells({edition:'2014',classId:'wizard',level:1})[0].id;assert.match(C.validateGrant(g,choices).errors.join(' '),/level 1/);
 assert.equal(C.validateGrant({edition:'2014'},{classId:'cleric'}).ability,'wis');
 assert.ok(C.validateGrant({edition:'2024'},{classId:'warlock'}).errors.length);
});
test('spell snapshots and independent feat resources survive normalization and rest',()=>{
 const d=M.normalize({rulesChoices:{feats:[data.feats[0].id,data.feats[0].id],grants:{human:{classId:'wizard',ability:'wis',spells:['a','b','c'],used:1},background:{used:1}}},spells:[C.spellRow(data.spells[0])],slots:[{max:2,used:2}],hpCurrent:3});
 assert.equal(d.rulesChoices.feats.length,1);assert.equal(d.spells[0].catalogId,data.spells[0].id);assert.equal(d.rulesChoices.grants.human.used,1);assert.deepEqual(M.normalize(d),d);
 C.longRest(d);assert.equal(d.rulesChoices.grants.human.used,0);assert.equal(d.rulesChoices.grants.background.used,0);assert.equal(d.slots[0].used,0);assert.equal(d.hpCurrent,3);
});
test('import dry run validates, content addresses and atomically publishes only after all parts',async()=>{
 const {prepareCatalog,publishCatalog}=await import('../scripts/import-rules.mjs');const text=JSON.stringify(data),p=prepareCatalog(text);
 assert.equal(p.parts.join(''),text);assert.equal(prepareCatalog(text).release,p.release);
 let calls=[];const db={doc:path=>({path,set:async()=>calls.push('publish')}),batch:()=>({set:()=>calls.push('part'),commit:async()=>calls.push('commit')})};
 await publishCatalog(db,p);assert.equal(calls.at(-1),'publish');assert.equal(calls.filter(x=>x==='part').length,p.parts.length);
 calls=[];db.batch=()=>({set:()=>{},commit:async()=>{throw Error('network');}});await assert.rejects(publishCatalog(db,p),/network/);assert.ok(!calls.includes('publish'));
});
test('background and Human Magic Initiate retain distinct grants and reject repeated lists',()=>{
 const d=M.normalize({build:{edition:'2024',race:'human-2024',background:'sage-2024',humanOriginFeat:'Magic Initiate (Wizard)'}});
 const gs=C.grants(d);assert.equal(gs.length,2);assert.ok(gs.some(g=>g.key==='background'));assert.match(C.validateGrant(gs[0],{},d).errors.join(' '),/different spell class/);
});
test('browser loader verifies database catalogue and falls back on corrupted releases',async()=>{
 const vm=require('node:vm'),{webcrypto}=require('node:crypto'),text=fs.readFileSync(require('node:path').join(__dirname,'../data/rules/catalog.json'),'utf8'),{prepareCatalog}=await import('../scripts/import-rules.mjs'),p=prepareCatalog(text);
 async function load(corrupt){let fetched=false;const context={CharacterFeatRules:require('../js/modules/character-feat-rules'),console:{warn:()=>{}},crypto:webcrypto,TextEncoder,fetch:async()=>{fetched=true;return {ok:true,text:async()=>text,json:async()=>data}},window:{__DND_VAULT_DEPS__:{auth:{currentUser:{uid:'player'}},db:{},doc:(_, ...p)=>p.join('/'),getDoc:async path=>({exists:()=>true,data:()=>path==='rulesCatalog/current'?p.manifest:{text:corrupt?'broken':p.parts[Number(path.split('/').at(-1))]}})}}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/modules/character-catalog.js'),'utf8'),context);const result=await context.CharacterCatalog.load();return {result,fetched};}
 const good=await load(false);assert.equal(good.fetched,false);assert.equal(good.result.loadedFrom,'Firestore catalogue');
 const bad=await load(true);assert.equal(bad.fetched,true);assert.match(bad.result.loadedFrom,/unavailable/);
});
test('site catalogue release pin matches the generated manifest and bundled bytes',()=>{
 const {createHash}=require('node:crypto'),raw=fs.readFileSync(require('node:path').join(__dirname,'../data/rules/catalog.json'),'utf8'),manifest=require('../data/rules/manifest.json'),loader=fs.readFileSync(require('node:path').join(__dirname,'../js/modules/character-catalog.js'),'utf8');assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.release);assert.ok(loader.includes("const bundledRelease='"+manifest.release+"';"));
});
test('a valid but older Firestore release cannot mask this site’s spell mechanics or trigger needless part reads',async()=>{
 const vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto'),raw=fs.readFileSync(require('node:path').join(__dirname,'../data/rules/catalog.json'),'utf8'),stale=JSON.parse(raw);for(const spell of stale.spells){delete spell.combat;spell.classes=[];spell.classesByEdition={};}const oldText=JSON.stringify(stale),release=createHash('sha256').update(oldText).digest('hex'),calls=[],urls=[];
 const context={CharacterFeatRules:require('../js/modules/character-feat-rules'),console:{warn:()=>{}},crypto:webcrypto,TextEncoder,fetch:async url=>{urls.push(url);return {ok:true,text:async()=>raw};},window:{__DND_VAULT_DEPS__:{auth:{currentUser:{uid:'player'}},db:{},doc:(_, ...p)=>p.join('/'),getDoc:async path=>{calls.push(path);return{exists:()=>true,data:()=>({metadataVersion:3,format:1,release,parts:1})};}}}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/modules/character-catalog.js'),'utf8'),context);const loaded=await context.CharacterCatalog.load();assert.deepEqual(calls,['rulesCatalog/current']);assert.match(loaded.loadedFrom,/database release differs/);assert.equal(urls[0],'data/rules/catalog.json?v='+require('../data/rules/manifest.json').release);assert.equal(loaded.spells.find(s=>s.name==='Witch Bolt'&&s.source==='XPHB').combat.effects[1].combat.damage,'1d12');assert.ok(loaded.spells.find(s=>s.name==='Ice Knife').classesByEdition['2014'].includes('wizard'));
});
test('a mismatched cached bundle fails clearly and a subsequent load can retry without retaining the wrong catalogue',async()=>{
 const vm=require('node:vm'),{webcrypto}=require('node:crypto'),raw=fs.readFileSync(require('node:path').join(__dirname,'../data/rules/catalog.json'),'utf8');let correct=false,calls=0;const context={CharacterFeatRules:require('../js/modules/character-feat-rules'),crypto:webcrypto,TextEncoder,console,fetch:async()=>{calls++;return{ok:true,text:async()=>correct?raw:'{"format":1,"spells":[],"feats":[]}'};}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/modules/character-catalog.js'),'utf8'),context);await assert.rejects(context.CharacterCatalog.load(),/does not match this site version/);assert.equal(context.CharacterCatalog.rawData,null);correct=true;assert.equal((await context.CharacterCatalog.load()).spells.length,969);assert.equal(calls,2);
});

test('DM bonus advancement metadata survives normalization and long rest unchanged',()=>{
 const d=M.normalize({rulesChoices:{grants:{__dm:{bonusFeats:2,bonusAsis:1,usedAsis:1,approvedBy:'dm',updatedAt:123}}}});
 assert.deepEqual(d.rulesChoices.grants.__dm,{bonusFeats:2,bonusAsis:1,usedAsis:1,approvedBy:'dm',updatedAt:123});
 C.longRest(d);
 assert.deepEqual(d.rulesChoices.grants.__dm,{bonusFeats:2,bonusAsis:1,usedAsis:1,approvedBy:'dm',updatedAt:123});
 assert.deepEqual(M.normalize(d).rulesChoices.grants.__dm,d.rulesChoices.grants.__dm);
});
