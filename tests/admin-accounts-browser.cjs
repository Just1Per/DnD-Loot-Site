// Shared journal, author-owned recaps and notebook reading against an isolated Firebase fixture.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.UI_OUTPUT_DIR||require('node:os').tmpdir()+'/campaignatlas-ui-checks';fs.mkdirSync(out,{recursive:true});
const assert=require('node:assert/strict');
const errors=[];
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(7000);
 page.on('pageerror',error=>errors.push(error.message));
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style data-audit-file="'+href.split('?')[0]+'">'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'\n/*# sourceURL='+href.split('?')[0]+' */</style>':tag);
 await page.route('https://fixture.example.test/**',route=>{const rel=new URL(route.request().url()).pathname.slice(1),file=path.join(root,rel);return route.fulfill(rel&&fs.existsSync(file)&&fs.statSync(file).isFile()?{path:file}:{contentType:'text/html',body:html})});await page.goto('https://fixture.example.test/',{waitUntil:'domcontentloaded'});
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=text=>{window.auditAlerts||=[];auditAlerts.push(text)};window.confirm=()=>true;window.prompt=()=> 'Sample note'},JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
 await page.evaluate(()=>{const d=window.__DND_VAULT_DEPS__;d.where=(field,op,value)=>({field,op,value});d.query=(path,...filters)=>({path,filters});d.getDocs=async q=>{const p=typeof q==='string'?q:q.path,f=q.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&f.every(f=>{const v=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?v?.includes(f.value):v===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};d.ref=(_,p)=>p;d.getBlob=async()=>new Blob();d.uploadBytes=async()=>{};});
 await page.evaluate(()=>{const sdk=window.__DND_VAULT_DEPS__,original=sdk.runTransaction;window.journalWatchers=[];window.failJournalWrite=false;sdk.runTransaction=async(...args)=>{if(window.failJournalWrite)throw Error('Simulated save failure');return original(...args)};sdk.onSnapshot=(path,next,error)=>{const watch={path,next,error,active:true};journalWatchers.push(watch);return()=>{watch.active=false}};});
 await page.evaluate(()=>{  const sdk=__DND_VAULT_DEPS__,get=sdk.getDocs;window.catalogueReads=0;window.failCatalogue=false;window.pauseCatalogue=false;
  sdk.getDocs=async q=>{const path=typeof q==='string'?q:q.path;if(path==='items'){catalogueReads++;if(failCatalogue)throw Error('Catalogue access unavailable');if(pauseCatalogue)await new Promise(resolve=>window.releaseCatalogue=resolve);}return get(q);};
 });
 await page.evaluate(()=>{
  const sdk=__DND_VAULT_DEPS__,get=sdk.getDocs;window.adminReads=[];window.pauseAdmin=false;window.failAdmin=false;window.releaseAdmin=[];
  sdk.getDocs=async q=>{const path=typeof q==='string'?q:q.path;if(!['users','dmRequests'].includes(path))return get(q);
   adminReads.push(path);const result=await get(q);if(pauseAdmin)await new Promise(resolve=>releaseAdmin.push(resolve));if(failAdmin)throw Error('Admin accounts unavailable');return result;};
 });
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.evaluate(()=>window.realCatalogueLoader=loadItemsFromFirestore);await page.addScriptTag({path:root+'/tests/dom-state.js'});await page.evaluate(()=>loadItemsFromFirestore=window.realCatalogueLoader);
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});




 await page.evaluate(async()=>{
  auditSeed('admin');AdminAccounts.clear();AppNavigation.clear();
  testSheetDocs['users/admin']={name:'Admin',email:'admin@example.test',role:['admin']};
  testSheetDocs['users/player']={name:'Alice',email:'player@example.test',role:['player']};
  testSheetDocs['dmRequests/player']={userId:'player',name:'Alice',status:'pending',submittedAt:1};
  await testAuthCallback(auth.currentUser);
 });
 assert.deepEqual(await page.evaluate(()=>adminReads),[],'Dashboard login fetched global admin data');
 assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true);
 assert.equal(await page.evaluate(()=>testWrites.some(w=>w.path==='userDirectory/player')),false,'Login backfilled another account');
 await page.evaluate(()=>{pauseAdmin=true;openAdminView();window.adminPending=AdminAccounts.load();openAdminView()});
 await page.waitForFunction(()=>releaseAdmin.length===2);
 assert.deepEqual((await page.evaluate(()=>adminReads)).sort(),['dmRequests','users']);
 assert.match(await page.locator('[data-admin-accounts-status]').textContent(),/Loading/);
 assert.match(await page.locator('#userTableBody').textContent(),/Loading/);
 assert.equal(await page.locator('[data-edit-user]').count(),0);
 await page.evaluate(()=>{pauseAdmin=false;releaseAdmin.splice(0).forEach(resolve=>resolve())});
 await page.waitForFunction(()=>document.querySelector('[data-admin-accounts-status]')?.textContent.includes('loaded.'));
 assert.match(await page.locator('#userTableBody').textContent(),/Alice/);
 assert.match(await page.locator('#adminDMRequestsList').textContent(),/Alice/);
 assert.equal(await page.evaluate(()=>testWrites.some(w=>w.path==='userDirectory/player')),true,'Explicit Admin opening lost directory compatibility');
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('#tab-admin',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));assert.deepEqual(violations,[]);
  await page.screenshot({path:out+'/admin-accounts-'+width+'.png',fullPage:false});
 }
 await page.evaluate(()=>{failAdmin=true;openAdminView()});await page.waitForSelector('[data-retry-admin-accounts]');
 assert.equal(await page.locator('[data-edit-user]').count(),0);assert.match(await page.locator('#userTableBody').textContent(),/could not be loaded/);
 await page.evaluate(()=>failAdmin=false);await page.locator('[data-retry-admin-accounts]').click();await page.waitForSelector('[data-edit-user=player]');
 // A failed request must not poison later attempts, and leaving the screen invalidates late reads.
 await page.evaluate(()=>{pauseAdmin=true;openAdminView();window.adminPending=AdminAccounts.load()});await page.waitForFunction(()=>releaseAdmin.length===2);
 await page.evaluate(()=>{closeAdminView();pauseAdmin=false;releaseAdmin.splice(0).forEach(resolve=>resolve())});
 await page.evaluate(()=>adminPending);assert.deepEqual(await page.evaluate(()=>users),[]);assert.deepEqual(await page.evaluate(()=>dmRequests),[]);
 await page.evaluate(()=>{pauseAdmin=true;openAdminView();window.adminPending=AdminAccounts.load()});await page.waitForFunction(()=>releaseAdmin.length===2);
 await page.evaluate(async()=>{auth.currentUser={uid:'player',email:'player@example.test'};await testAuthCallback(auth.currentUser);pauseAdmin=false;releaseAdmin.splice(0).forEach(resolve=>resolve())});
 await page.evaluate(()=>adminPending);assert.deepEqual(await page.evaluate(()=>users),[]);assert.deepEqual(await page.evaluate(()=>dmRequests),[]);
 assert.equal(await page.locator('#tab-admin').isVisible(),false);assert.equal(await page.locator('#userTableBody [data-edit-user]').count(),0);
 const before=await page.evaluate(()=>adminReads.length);await page.evaluate(()=>openAdminView());assert.equal(await page.evaluate(()=>adminReads.length),before);
 assert.deepEqual(errors,[]);console.log('PASS Admin login avoids global reads/backfill; explicit loading, in-flight reuse, directory compatibility, failure/retry, navigation/account invalidation, player denial and desktop/mobile WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
