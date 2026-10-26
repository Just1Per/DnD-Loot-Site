const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),errors=[];
const app=fs.readFileSync(root+'/js/app.js','utf8');
const mandatory=JSON.parse(app.match(/const FEATURE_FILES = (\[[\s\S]*?\]);/)[1]);
assert.ok(!mandatory.includes('./modules/character-sheet-print.js'),'Print must not load/preload at startup');
const loader=app.slice(app.indexOf('/** Load one shared-scope'),app.indexOf('// Preload downloads')).replaceAll('import.meta.url',JSON.stringify('https://fixture.example.test/js/app.js'));
async function boot(browser){
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>errors.push(error.message));
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style data-audit-file="'+href.split('?')[0]+'">'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n/*# sourceURL='+href.split('?')[0]+' */</style>':tag);
 await page.route('https://fixture.example.test/**',route=>{const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel);return route.fulfill(rel&&fs.existsSync(file)&&fs.statSync(file).isFile()?{path:file}:{contentType:'text/html',body:html})});await page.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=text=>{window.auditAlerts||=[];auditAlerts.push(text)};window.confirm=()=>true;window.prompt=()=> 'Sample note'},JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,original=sdk.runTransaction;window.journalWatchers=[];window.failJournalWrite=false;sdk.runTransaction=async(...args)=>{if(window.failJournalWrite)throw Error('Simulated save failure');return original(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};journalWatchers.push(watch);return()=>{watch.active=false}};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules.filter(name=>mandatory.includes('./modules/'+name+'.js')))await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({content:'(()=>{const ASSET_VERSION="print-test";'+loader+'})()'});
 await page.evaluate(()=>{auditSeed('player');testSheetDocs['campaigns/a/characters/c1']=structuredClone(characters.find(c=>c.id==='c1'));window.print=()=>{};delete window.__DND_VAULT_DEPS__});
 assert.equal(await page.evaluate(()=>typeof CharacterSheetPrint),'undefined');return page;
}
// Exercise the actual deferred wrapper chain, including a failure after one script installed.
const catalogue=['character-creature-data',...Array.from({length:4},(_,i)=>'character-creature-data-'+(i+1))];
const deferred=[...catalogue,'character-adobe-builder-ui','character-adobe-pages','character-creature-ui','character-wild-shape-ui','character-wild-companion-ui','character-druid-conversions-ui','character-spellcasting-ui','character-cleric-blessed-strikes-ui'];
for(const name of deferred)assert.ok(!mandatory.includes('./modules/'+name+'.js'),'Sheet tools must not load/preload at startup');
(async()=>{const browser=await chromium.launch();try{
 const page=await boot(browser),counts={};let fail=true;
 await page.route('**/js/modules/*.js*',route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);counts[name]=(counts[name]||0)+1;return fail&&name==='character-adobe-pages.js'?route.abort('failed'):route.fulfill({path:root+'/js/modules/'+name,contentType:'text/javascript'})});
 assert.deepEqual(counts,{});assert.equal(await page.evaluate(()=>typeof CharacterCreatureData),'undefined','Companion catalogue must not execute at startup');
 const initialRead=await page.evaluate(()=>{window.initialRead=readSheetForm;return typeof renderCompanionCreaturePickers});assert.equal(initialRead,'undefined');
 await page.evaluate(()=>openCharacterSheet('c1'));assert.match(await page.locator('#sheetStatus').textContent(),/Character tools could not load/);assert.equal(await page.evaluate(()=>sheetSession),null);
 assert.equal(await page.evaluate(()=>CharacterCreatureData.rows.length),127);
 for(const name of catalogue)assert.equal(counts[name+'.js'],1);
 assert.equal(counts['character-adobe-builder-ui.js'],1);assert.equal(counts['character-adobe-pages.js'],1);assert.equal(counts['character-creature-ui.js'],undefined);
 await page.evaluate(()=>{window.installedRead=readSheetForm});assert.equal(await page.evaluate(()=>readSheetForm===initialRead),false);
 fail=false;await page.evaluate(()=>openCharacterSheet('c1'));await page.waitForSelector('#characterSheetForm');
 assert.equal(await page.evaluate(()=>readSheetForm===installedRead),true,'Retry must not install the successful builder wrapper twice');
 for(const name of deferred)assert.equal(counts[name+'.js'],name==='character-adobe-pages'?2:1);
 assert.equal(await page.evaluate(()=>new Set(CharacterCreatureData.rows.map(row=>row.id)).size),127,'Retry preserves all creature identities without resetting or duplicating the catalogue');
 for(const selector of ['#sheetAdobeProgression','#sheetPageManager','#sheetSpellGeneration','#sheetSpellGenerator'])assert.equal(await page.locator(selector).count(),1);
 // Exercise builder progression, optional companion page and real spell generation after SDK cleanup.
 await page.evaluate(()=>{sheetSession.data.build.classId='wizard';sheetSession.data.build.edition='2024';sheetSession.data.adobe.classLevels=[{classId:'wizard',level:7,subclassId:''}];renderCharacterSheet();selectSheetTab('builder')});
 assert.match(await page.locator('#sheetAdobeClasses').textContent(),/Wizard/);
 await page.evaluate(()=>{sheetSession.data.adobe.pages.companion=true;selectSheetTab('companion');updateSheetCalculations()});assert.ok(await page.locator('[data-creature-select]').count()>0);
 await page.locator('[data-creature-select]').first().selectOption('brown-bear');assert.equal(await page.evaluate(()=>sheetSession.data.adobe.companions[0].hpMax),34);assert.equal(await page.locator('[data-companion-field=hpMax]').first().inputValue(),'34');assert.deepEqual(await page.evaluate(()=>sheetSession.data.adobe.companions[0].abilities),{str:19,dex:10,con:16,int:2,wis:13,cha:7});
 await page.evaluate(()=>selectSheetTab('spells'));await page.locator('#sheetGenerateSpells').click();assert.equal(await page.locator('#sheetSpellGenerator').evaluate(d=>d.open),true);
 const pick=page.locator('[data-spell-pick]:not(:disabled)').first();await pick.check();await page.locator('#spellGeneratorApply').click();assert.ok(await page.evaluate(()=>sheetSession.data.spells.length>0));
 const selected=await page.evaluate(()=>sheetSession.data.spells.map(s=>s.catalogId));await page.evaluate(()=>prepareSheetPrint());assert.ok(await page.locator('.sheet-paper-page').count()>0);await page.evaluate(()=>clearSheetPrintSelection());
 await page.evaluate(()=>{readSheetForm();window.beforeSaveSpells=sheetSession.data.spells.map(s=>s.catalogId);return saveCharacterSheet({reportValidation:false})});assert.equal(await page.evaluate(()=>sheetSession.dirty),false,await page.locator('#sheetStatus').textContent());assert.deepEqual(await page.evaluate(()=>sheetSession.data.spells.map(s=>s.catalogId)),selected);
 const savedCounts={...counts};await page.evaluate(()=>{closeCharacterSheet(true);return openCharacterSheet('c1')});assert.equal(await page.evaluate(()=>sheetSession.data.adobe.companions[0].creature),'Brown Bear');assert.equal(await page.evaluate(()=>sheetSession.data.adobe.companions[0].hpMax),34);assert.equal(await page.evaluate(()=>sheetSession.data.adobe.companions[0].abilities.str),19);assert.deepEqual(counts,savedCounts);assert.deepEqual(await page.evaluate(()=>sheetSession.data.spells.map(s=>s.catalogId)),selected);
 await page.evaluate(()=>{sheetSession.data.build.classId='druid';sheetSession.data.adobe.classLevels=[{classId:'druid',level:4}];sheetSession.data.adobe.useExperience=true;sheetSession.data.experience=2700;renderCharacterSheet();selectSheetTab('combat')});assert.equal(await page.locator('[data-open-wild-shape]').count(),1);assert.equal(await page.evaluate(()=>CharacterWildShape.limits(sheetSession.data,1).level),4);
 await page.close();
 // A failed data batch retains the same catalogue and already loaded batches on retry.
 const partial=await boot(browser),partialCounts={};let failBatch=true;
 await partial.route('**/js/modules/*.js*',route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);partialCounts[name]=(partialCounts[name]||0)+1;return failBatch&&name==='character-creature-data-2.js'?route.abort('failed'):route.fulfill({path:root+'/js/modules/'+name,contentType:'text/javascript'})});
 await partial.evaluate(()=>openCharacterSheet('c1'));assert.equal(await partial.evaluate(()=>sheetSession),null);
 const partialRows=await partial.evaluate(()=>CharacterCreatureData.rows.length);assert.ok(partialRows>0&&partialRows<127);assert.equal(partialCounts['character-adobe-builder-ui.js'],undefined);
 failBatch=false;await partial.evaluate(()=>openCharacterSheet('c1'));await partial.waitForSelector('#characterSheetForm');
 for(const name of deferred)assert.equal(partialCounts[name+'.js'],name==='character-creature-data-2'?2:1);
 assert.equal(await partial.evaluate(()=>CharacterCreatureData.rows.length),127);assert.equal(await partial.evaluate(()=>new Set(CharacterCreatureData.rows.map(row=>row.id)).size),127);await partial.close();
 // Concurrent opens share each script; the wrapper chain keeps its original order.
 const concurrent=await boot(browser),order=[];let release,started;const ready=new Promise(resolve=>started=resolve);
 await concurrent.route('**/js/modules/*.js*',async route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);if(deferred.some(n=>name===n+'.js')){order.push(name);if(name===deferred[0]+'.js')await new Promise(resolve=>{release=resolve;started()});}await route.fulfill({path:root+'/js/modules/'+name,contentType:'text/javascript'})});
 await concurrent.evaluate(()=>{window.firstOpen=openCharacterSheet('c1');window.secondOpen=openCharacterSheet('c1')});await ready;release();await concurrent.evaluate(()=>Promise.all([firstOpen,secondOpen]));assert.deepEqual(order,deferred.map(n=>n+'.js'));assert.equal(await concurrent.locator('#sheetAdobeProgression').count(),1);await concurrent.close();
 for(const change of ['account','campaign','close']){
  const delayed=await boot(browser);let resume,started;const ready=new Promise(resolve=>started=resolve);
  await delayed.route('**/character-creature-data-2.js*',async route=>{await new Promise(resolve=>{resume=resolve;started()});await route.fulfill({path:root+'/js/modules/character-creature-data-2.js',contentType:'text/javascript'})});
  await delayed.evaluate(()=>{window.opening=openCharacterSheet('c1')});await ready;await delayed.evaluate(change=>{if(change==='account')auth.currentUser={uid:'other'};else if(change==='campaign')activeCampaign={id:'b'};else closeCharacterSheet(true)},change);resume();await delayed.evaluate(()=>opening);assert.equal(await delayed.evaluate(()=>sheetSession),null);assert.equal(await delayed.locator('#characterSheetForm').count(),0);await delayed.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS Sheet tools excluded from startup; ordered real scripts after SDK cleanup, partial failure/retry without double wrappers, builder/companion/spell generation/save/reopen/print, all 127 companion records, cache reuse, concurrent openings and stale account/campaign/closed-sheet protection');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
