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
 await page.evaluate(()=>{const sdk=__DND_VAULT_DEPS__,read=sdk.getDocs;window.recoveryReads=[];sdk.getDocs=async q=>{const p=typeof q==='string'?q:q.path;recoveryReads.push(p);if(window.failRecoveryRead===p){failRecoveryRead=null;throw Error('Network unavailable <img data-unsafe>')}if(window.delayRecoveryRead===p){delayRecoveryRead=null;await new Promise(resolve=>window.releaseRecoveryRead=resolve)}return read(q)};});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});

 await page.evaluate(()=>{auditSeed('player');for(const [collection,category] of [['playerInformation','Lore'],['playerNPCs','Story NPC'],['playerChapters','Completed']])testSheetDocs['campaigns/a/'+collection+'/entry']={title:'The Harbor',summary:'The party returns home',content:'A shared introduction.',category,order:1,revision:1,sourceRevision:1};});
 for(const [kind,tab,collection]of [['world','campaign-information','playerInformation'],['creature','campaign-npcs','playerNPCs'],['chapter','campaign-chapters','playerChapters']]){
  await page.evaluate(({tab,collection})=>{failRecoveryRead='campaigns/a/'+collection;showTab(tab)},{tab,collection});
  const panel=page.locator('#tab-'+tab),status=panel.locator('[data-information-status]');
  await page.waitForFunction(tab=>document.querySelector('#tab-'+tab+' [data-information-status]')?.textContent.includes('Could not load'),tab);
  assert.equal(await panel.locator('[data-information-search]').isDisabled(),true,'failed reads cannot be filtered into a misleading empty state');
  assert.equal(await panel.locator('[data-unsafe]').count(),0);
  const message=await status.textContent();await panel.locator('[data-information-search]').dispatchEvent('input');assert.equal(await status.textContent(),message);
  assert.equal(await panel.locator('[data-information-refresh]').textContent(),'Try again');
  await panel.locator('[data-information-refresh]').click();await page.waitForFunction(tab=>!document.querySelector('#tab-'+tab+' [data-information-search]').disabled,tab);
  assert.equal(await panel.locator('[data-information-id]').count(),1);
  await panel.locator('[data-information-search]').fill('Harbor');await panel.locator('[data-information-category]').selectOption(kind==='world'?'Lore':kind==='creature'?'Story NPC':'Completed');
  await page.evaluate(collection=>{delayRecoveryRead='campaigns/a/'+collection;recoveryReads.length=0},collection);await panel.locator('[data-information-refresh]').click();await page.waitForFunction(()=>!!window.releaseRecoveryRead);
  assert.equal(await panel.locator('[data-information-refresh]').isDisabled(),true);assert.equal(await panel.locator('[data-information-list]').getAttribute('aria-busy'),'true');
  await panel.locator('[data-information-refresh]').evaluate(n=>n.click());assert.equal(await page.evaluate(collection=>recoveryReads.filter(p=>p==='campaigns/a/'+collection).length,collection),1,'one pending request per refresh');
  await page.evaluate(()=>{releaseRecoveryRead();releaseRecoveryRead=null});await page.waitForFunction(tab=>!document.querySelector('#tab-'+tab+' [data-information-search]').disabled,tab);
  assert.equal(await panel.locator('[data-information-search]').inputValue(),'Harbor');assert.equal(await panel.locator('[data-information-id]').count(),1);
  await page.evaluate(collection=>{const watch=journalWatchers.findLast(w=>w.active&&w.path==='campaigns/a/'+collection);window.expiredRecoveryWatch=watch;watch.error(Error('Access unavailable'))},collection);
  assert.equal(await panel.locator('[data-information-id]').count(),0);assert.equal(await panel.locator('[data-information-search]').isDisabled(),true);
  const denied=await status.textContent();await panel.locator('[data-information-category]').dispatchEvent('change');assert.equal(await status.textContent(),denied);
  await page.evaluate(()=>expiredRecoveryWatch.next({docs:[{id:'stale',data:()=>({title:'Old unauthorized result',category:'Lore',content:'Stale content'})}]}));assert.equal(await panel.locator('[data-information-id]').count(),0);
  for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(await page.evaluate(async tab=>(await axe.run('#tab-'+tab,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id),tab),[]);if(kind==='world'&&width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/shared-page-retry-mobile.png',fullPage:true});}}
  await panel.locator('[data-information-refresh]').click();await page.waitForFunction(tab=>!document.querySelector('#tab-'+tab+' [data-information-search]').disabled,tab);assert.equal(await panel.locator('[data-information-id]').count(),1);
 }
 await page.evaluate(()=>{delayRecoveryRead='campaigns/a/playerInformation';showTab('campaign-information')});await page.waitForFunction(()=>!!window.releaseRecoveryRead);
 await page.evaluate(()=>{activeCampaign={id:'b',name:'Other campaign',ownerId:'dm'};showTab('campaign-information');releaseRecoveryRead();releaseRecoveryRead=null});await page.waitForFunction(()=>document.querySelector('[data-information-status]').textContent==='0 of 0 shared World posts.');assert.equal(await page.locator('[data-information-id]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS Shared World/NPC/chapter loading and retry: stable failures, escaped errors, disabled filtering, single pending request, preserved search, revoked access, stale results and desktop/mobile accessibility');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
