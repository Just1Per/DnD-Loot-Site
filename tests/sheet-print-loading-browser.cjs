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
 await page.evaluate(()=>{auditSeed('player');window.print=()=>{};delete window.__DND_VAULT_DEPS__});
 assert.equal(await page.evaluate(()=>typeof CharacterSheetPrint),'undefined');return page;
}
(async()=>{const browser=await chromium.launch();try{
 const page=await boot(browser);let requests=0,fail=true;
 await page.route('**/character-sheet-print.js*',route=>{requests++;return fail?route.abort('failed'):route.fulfill({path:root+'/js/modules/character-sheet-print.js',contentType:'text/javascript'})});
 assert.equal(requests,0);
 await page.evaluate(()=>openCharacterSheet('c1'));assert.match(await page.locator('#sheetStatus').textContent(),/Character tools could not load/);
 assert.equal(requests,1);assert.equal(await page.evaluate(()=>sheetSession),null);
 assert.equal(await page.locator('script[data-dnd-vault-module="./modules/character-sheet-print.js"]').count(),0);
 fail=false;await page.evaluate(()=>openCharacterSheet('c1'));await page.waitForSelector('#characterSheetForm');assert.equal(requests,2);
 const writes=await page.evaluate(()=>testWrites.length);await page.evaluate(()=>prepareSheetPrint());
 assert.ok(await page.locator('.sheet-paper-page').count()>0);assert.equal(await page.evaluate(()=>testWrites.length),writes);
 await page.evaluate(()=>{clearSheetPrintSelection();closeCharacterSheet(true);return openCharacterSheet('c1')});assert.equal(requests,2,'Reopening must reuse the loaded public code');
 await page.close();
 // Concurrent opens share one network load; only the newest sheet generation wins.
 const concurrent=await boot(browser);let shared=0,release,sharedReady;const sharedRequest=new Promise(resolve=>sharedReady=resolve);
 await concurrent.route('**/character-sheet-print.js*',async route=>{shared++;await new Promise(resolve=>{release=resolve;sharedReady()});await route.fulfill({path:root+'/js/modules/character-sheet-print.js',contentType:'text/javascript'})});
 await concurrent.evaluate(()=>{window.openOne=openCharacterSheet('c1');window.openTwo=openCharacterSheet('c1')});
 await sharedRequest;
 assert.equal(shared,1);assert.equal(await concurrent.evaluate(()=>sheetSession),null);release();
 await concurrent.evaluate(()=>Promise.all([openOne,openTwo]));await concurrent.waitForSelector('#characterSheetForm');assert.equal(shared,1);assert.equal(await concurrent.evaluate(()=>sheetSession.characterId),'c1');await concurrent.close();
 for(const change of ['account','campaign','close']){
  const delayed=await boot(browser);let resume,ready;const requested=new Promise(resolve=>ready=resolve);
  await delayed.route('**/character-sheet-print.js*',async route=>{await new Promise(resolve=>{resume=resolve;ready()});await route.fulfill({path:root+'/js/modules/character-sheet-print.js',contentType:'text/javascript'})});
  await delayed.evaluate(()=>{window.openingSheet=openCharacterSheet('c1')});await requested;
  await delayed.evaluate(change=>{if(change==='account')auth.currentUser={uid:'other'};else if(change==='campaign')activeCampaign={id:'b'};else closeCharacterSheet(true)},change);
  resume();await delayed.evaluate(()=>openingSheet);assert.equal(await delayed.evaluate(()=>sheetSession),null);assert.equal(await delayed.locator('#characterSheetForm').count(),0);await delayed.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS Print excluded from initial features; real deferred script, failure/retry, print output without writes, reuse, concurrent opens and late account/campaign/closed-sheet protection');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
