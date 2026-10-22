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



 await page.evaluate(()=>{auditSeed('dm');testSheetDocs['campaigns/a']={name:'Storm Coast',ownerId:'dm',dmId:'dm',inventoryVersion:2};renderCampaignSelector();showTab('campaign-home')});
 assert.equal(await page.locator('#campaignSelectorList [data-delete-campaign], #tab-campaign-home [data-delete-campaign]').count(),0);
 await page.evaluate(()=>showTab('dm-settings'));
 assert.equal(await page.evaluate(()=>document.getElementById('campaignSettingsPanel').lastElementChild.id),'campaignDeletionSettings');
 assert.equal(await page.locator('#campaignDeletionSettings [data-delete-campaign=a]').count(),1);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  await page.locator('#campaignDeletionSettings').scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('#campaignDeletionSettings',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);
  await page.screenshot({path:out+'/campaign-delete-settings-'+width+'.png'});
 }

 await page.locator('#campaignDeletionSettings [data-delete-campaign=a]').click();assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-site-cancel')),true);assert.ok((await page.locator('#siteConfirmationDialog').innerText()).includes('Stored campaign records and files are retained for recovery'));assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].deletedAt),undefined);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].deletedAt),undefined);
 await page.locator('#campaignDeletionSettings [data-delete-campaign=a]').click();await page.locator('[data-site-confirm]').click();await page.waitForFunction(()=>activeCampaign===null);
 await page.evaluate(()=>enterCampaign({id:'a',name:'Stale campaign shortcut'}));assert.equal(await page.evaluate(()=>activeCampaign),null);
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].deletedBy),'dm');assert.equal(await page.locator('[data-campaign-id=a]').count(),0);
 await page.evaluate(()=>{auditSeed('dm');activeCampaign.ownerId='other';testSheetDocs['campaigns/a']={name:'Delegated campaign',ownerId:'other',dmId:'other'};showTab('dm-settings')});assert.equal(await page.locator('[data-delete-campaign]').count(),0);
 await page.evaluate(()=>{auditSeed('admin');testSheetDocs['users/admin']={role:['admin']};testSheetDocs['campaigns/a']={name:'Campaign A',ownerId:'someone',dmId:'someone'};testSheetDocs['campaigns/b']={name:'Campaign B',ownerId:'someoneelse',dmId:'someoneelse'};openAdminView()});
 await page.waitForSelector('#adminCampaignManagement [data-delete-campaign=b]');assert.equal(await page.locator('#adminCampaignManagement [data-delete-campaign]').count(),2);
 await page.locator('#adminCampaignManagement [data-delete-campaign=b]').click();await page.locator('[data-site-confirm]').click();await page.waitForFunction(()=>!!testSheetDocs['campaigns/b'].deletedAt);assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/b'].deletedBy),'admin');
 await page.waitForFunction(()=>document.querySelectorAll('#adminCampaignManagement [data-delete-campaign]').length===1);
 await page.locator('#adminCampaignManagement [data-delete-campaign=a]').click();await page.evaluate(()=>{auth.currentUser={uid:'other'};currentUser={id:'other',role:['player']};});await page.locator('[data-site-confirm]').click();assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].deletedAt),undefined);
 await page.evaluate(()=>{auditSeed('player');showTab('campaign-home')});assert.equal(await page.locator('[data-delete-campaign]:visible').count(),0);
 for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>{auditSeed('admin');openAdminView()});await page.waitForSelector('#adminCampaignManagement [data-delete-campaign=a]');await page.locator('#adminCampaignManagement [data-delete-campaign=a]').click();const violations=await page.evaluate(async()=>(await axe.run('#siteConfirmationDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-site-cancel]').click();}
 assert.deepEqual(errors,[]);console.log('PASS Owner/admin deletion entry points, delegated-DM/player denial, cancellation, current-campaign cleanup, foreign campaign management, account changes, desktop/mobile and dialog accessibility');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
