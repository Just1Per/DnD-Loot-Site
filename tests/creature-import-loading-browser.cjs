const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),errors=[];
const app=fs.readFileSync(root+'/js/app.js','utf8');
const mandatory=JSON.parse(app.match(/const FEATURE_FILES = (\[[\s\S]*?\]);/)[1]);
for(const name of ['campaign-monster-import','campaign-monster-catalog-ui'])assert.ok(!mandatory.includes('./modules/'+name+'.js'),name+' must not load or preload at startup');
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
 await page.evaluate(()=>{auditSeed('dm');showTab('dm-creatures')});await page.waitForFunction(()=>CampaignWorkspace.session?.rowsLoaded);
 assert.equal(await page.evaluate(()=>typeof CampaignMonsterCatalog),'undefined');assert.equal(await page.evaluate(()=>typeof CampaignMonsterImport),'undefined');return page;
}
(async()=>{const browser=await chromium.launch();try{
 const page=await boot(browser);let requests=0,fail=true;const timings=[];
 await page.route('**/campaign-monster-catalog-ui.js*',route=>{requests++;return fail?route.abort('failed'):route.fulfill({path:root+'/js/modules/campaign-monster-catalog-ui.js',contentType:'text/javascript'})});
 assert.equal(requests,0);assert.equal(await page.evaluate(()=>document.querySelectorAll('script[src*="campaign-monster-catalog"],link[href*="campaign-monster-catalog"]').length),0);
 await page.locator('[data-workspace-catalog]').click();await page.waitForFunction(()=>[...document.querySelectorAll('[data-creature-catalog-feedback]')].some(n=>n.textContent.includes('try again')));
 assert.equal(requests,1);assert.ok(await page.locator('[data-workspace-catalog]').isEnabled());assert.equal(await page.locator('#workspaceMonsterCatalog').count(),0);
 fail=false;let started=Date.now();await page.locator('[data-workspace-catalog]').click();await page.waitForSelector('[data-select-monster]');timings.push({opening:'first-success',fixtureMs:Date.now()-started});assert.equal(requests,2);
 // Real draft import, scoped rules and privacy still work after bootstrap SDK cleanup.
 await page.locator('[data-catalog-search]').fill('Goblin');const draft=page.locator('[data-import-monster="srd-2014-goblin"]');await draft.click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.title==='Goblin');
 await page.locator('[name=title]').fill('A private goblin');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===1);
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).some(key=>key.includes('/playerNPCs/'))),false);
 started=Date.now();await page.locator('[data-creature-catalog]').click();await page.waitForSelector('[data-select-monster]');timings.push({opening:'reopen',fixtureMs:Date.now()-started});assert.equal(requests,2);assert.equal(await page.evaluate(()=>typeof CampaignMonsterImport),'undefined','Offline conversion code is never fetched by the browser');
 await page.addScriptTag({content:require('axe-core').source});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(await page.evaluate(async()=>(await axe.run('#workspaceMonsterCatalog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
 await page.locator('[data-close-catalog]').click();await page.setViewportSize({width:1440,height:1000});await page.close();
 // Two visible entry points share the pending code load and open one dialog.
 const concurrent=await boot(browser);await concurrent.locator('[data-new-record]').click();let resume,ready;const pending=new Promise(resolve=>ready=resolve);let shared=0;
 await concurrent.route('**/campaign-monster-catalog-ui.js*',async route=>{shared++;await new Promise(resolve=>{resume=resolve;ready()});await route.fulfill({path:root+'/js/modules/campaign-monster-catalog-ui.js',contentType:'text/javascript'})});
 await concurrent.locator('[data-workspace-catalog]').click();await pending;await concurrent.locator('[data-creature-catalog]').click();assert.equal(shared,1);assert.equal(await concurrent.locator('#workspaceMonsterCatalog').count(),0);assert.ok(await concurrent.locator('[data-workspace-catalog]').isDisabled());
 resume();await concurrent.waitForSelector('[data-select-monster]');assert.equal(await concurrent.locator('#workspaceMonsterCatalog').count(),1);assert.ok(await concurrent.locator('[data-workspace-catalog]').isEnabled());await concurrent.close();
 // A late public script must not open private-workspace UI in a changed context.
 for(const change of ['account','campaign','navigation','record','role']){
  const delayed=await boot(browser);let resume,ready;const pending=new Promise(resolve=>ready=resolve);
  await delayed.route('**/campaign-monster-catalog-ui.js*',async route=>{await new Promise(resolve=>{resume=resolve;ready()});await route.fulfill({path:root+'/js/modules/campaign-monster-catalog-ui.js',contentType:'text/javascript'})});
  await delayed.locator('[data-workspace-catalog]').click();await pending;
  await delayed.evaluate(change=>{if(change==='account')auth.currentUser={uid:'other'};if(change==='campaign')activeCampaign={...activeCampaign,id:'b'};if(change==='navigation')showTab('campaign-home');if(change==='record')CampaignWorkspace.newRecord();if(change==='role'){activeCampaign={...activeCampaign,ownerId:'other'};activeMembershipRole='player';}},change);
  resume();await delayed.waitForFunction(()=>typeof CampaignMonsterCatalog!=='undefined');await delayed.waitForFunction(()=>!document.querySelector('[data-workspace-catalog]')?.disabled);
  assert.equal(await delayed.locator('#workspaceMonsterCatalog').count(),0,change+' cancels stale open');assert.equal(await delayed.evaluate(()=>Object.keys(testSheetDocs).some(key=>/\/creatures\//.test(key))),false);await delayed.close();
 }
 const player=await boot(browser);await player.evaluate(()=>{auditSeed('player');showTab('campaign-home')});assert.equal(await player.locator('[data-workspace-catalog],[data-creature-catalog]').count(),0);assert.equal(await player.evaluate(()=>typeof CampaignMonsterCatalog),'undefined');await player.close();
 assert.deepEqual(errors,[]);console.log('PASS Creature import excluded from boot; real lazy code after SDK cleanup; failure/retry, draft save/privacy, both entry points, shared loads, stale account/campaign/route/record/role guards and mobile/WCAG');console.log('Synthetic local opening timings (not production):',JSON.stringify(timings));
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
