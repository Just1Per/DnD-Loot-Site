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
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});


 await page.evaluate(()=>{auditSeed('dm');showTab('library')});
 const panel=page.locator('#libraryDMTools'),summary=panel.locator(':scope > summary');
 assert.ok(await panel.isVisible());assert.equal(await panel.evaluate(n=>n.open),false);
 for(const selector of ['#addFromRoot','#addItemBtn','.campaign-bulk-controls','.visibility-bulk'])assert.equal(await page.locator(selector).isVisible(),false);
 assert.ok(await page.locator('#search').isVisible());assert.ok(await page.locator('#refreshCampaignItems').isVisible());
 await summary.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>localStorage.getItem('campaignatlas.library.dm-tools.v1.dm')==='open');
 for(const selector of ['#addFromRoot','#addItemBtn','.campaign-bulk-controls','.visibility-bulk'])assert.ok(await panel.locator(selector).isVisible());
 assert.equal(await panel.locator('[data-bulk-item-policy]').count(),3);
 await page.evaluate(()=>{renderCampaignToolbar();renderVisibilityControls()});assert.equal(await panel.evaluate(n=>n.open),true);
 await page.locator('#addFromRoot').click();await page.waitForSelector('#rootPickerSearch');await page.locator('#closeRootPicker').click();
 await page.locator('#addItemBtn').click();await page.waitForSelector('#modal-name');await page.evaluate(()=>closeItemModal());
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('#libraryDMTools',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
  if(width===390)await page.screenshot({path:out+'/library-dm-tools-mobile.png',fullPage:true});
 }
 await summary.click();await page.waitForFunction(()=>localStorage.getItem('campaignatlas.library.dm-tools.v1.dm')==='closed');
 await page.evaluate(()=>{showTab('campaign-home');showTab('library');renderCampaignToolbar()});assert.equal(await panel.evaluate(n=>n.open),false);
 await page.evaluate(()=>{auditSeed('player');showTab('library')});assert.equal(await panel.isVisible(),false);assert.equal(await page.locator('[data-bulk-item-policy]').count(),0);assert.equal(await page.locator('.vis-show-btn').count(),0);
 await page.evaluate(()=>{auditSeed('admin');activeMembershipRole='player';renderCampaignToolbar();showTab('library')});assert.equal(await panel.isVisible(),false);
 await page.evaluate(()=>{auditSeed('other');activeMembershipRole='dm';renderCampaignToolbar();showTab('library')});assert.equal(await panel.evaluate(n=>n.open),false);
 await summary.click();await page.waitForFunction(()=>localStorage.getItem('campaignatlas.library.dm-tools.v1.other')==='open');
 await page.evaluate(()=>{auditSeed('dm');showTab('library')});assert.equal(await panel.evaluate(n=>n.open),false);
 await page.evaluate(()=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=()=>{throw Error('Storage blocked')};renderLibraryDMPanel();Storage.prototype.getItem=original});assert.equal(await panel.evaluate(n=>n.open),false);
 assert.deepEqual(errors,[]);console.log('PASS DM-only collapsed tools, working catalogue/create actions, keyboard, persistent independent preferences, refresh, permission transitions, blocked storage, mobile and WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
