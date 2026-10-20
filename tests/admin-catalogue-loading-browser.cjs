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
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.evaluate(()=>window.realCatalogueLoader=loadItemsFromFirestore);await page.addScriptTag({path:root+'/tests/dom-state.js'});await page.evaluate(()=>loadItemsFromFirestore=window.realCatalogueLoader);
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});



 await page.evaluate(()=>{
  auditSeed('admin');const approved=rootItems[0];testSheetDocs['items/approved']={...approved,id:undefined,name:'Approved potion',catalogueStatus:'approved-v1'};testSheetDocs['items/draft']={...approved,id:undefined,name:'Draft staff',catalogueStatus:'draft'};testSheetDocs['items/catalog_meta']={version:1};rootItems=[];itemsLoadPromise=Promise.resolve();

 });
 await page.evaluate(()=>openRootCatalogue());await page.waitForSelector('#rootCards .item-card');
 assert.equal(await page.locator('#rootCards .item-card').count(),2);assert.equal(await page.evaluate(()=>catalogueReads),1);
 assert.equal(await page.locator('[data-catalogue-count]').textContent(),'2 of 2 items shown');
 await page.locator('#rootSearch').fill('staff');assert.equal(await page.locator('#rootCards .item-card').count(),1);
 await page.evaluate(()=>{failCatalogue=true;return openRootCatalogue()});assert.match(await page.locator('#rootCatalogueScreen [role=status]').textContent(),/Could not load catalogue/);
 await page.evaluate(()=>failCatalogue=false);await page.locator('[data-retry-root]').click();await page.waitForSelector('#rootCards .item-card');assert.equal(await page.locator('#rootCards .item-card').count(),2);
 await page.evaluate(()=>{delete testSheetDocs['items/approved'];delete testSheetDocs['items/draft'];return openRootCatalogue()});assert.match(await page.locator('[data-catalogue-count]').textContent(),/catalogue is empty/);
 await page.evaluate(()=>{testSheetDocs['items/private']={name:'Old admin private item'};pauseCatalogue=true;window.pendingCatalogue=openRootCatalogue()});await page.waitForFunction(()=>!!window.releaseCatalogue);
 await page.evaluate(()=>{auth.currentUser={uid:'player'};currentUser={id:'player',uid:'player',role:['player']};hideAllScreens();rootItems=[];releaseCatalogue();});await page.evaluate(()=>pendingCatalogue);
 assert.equal(await page.locator('#rootCatalogueScreen').isVisible(),false);assert.deepEqual(await page.evaluate(()=>rootItems),[]);
 assert.deepEqual(errors,[]);console.log('PASS Fresh-login catalogue loads all admin items, search, failure/retry, true empty state and account-isolated delayed responses');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
