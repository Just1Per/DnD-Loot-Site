// Count actual campaign collection requests through the Library UI and delayed writes.
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
 await page.evaluate(()=>{
  const sdk=__DND_VAULT_DEPS__,getDocs=sdk.getDocs,updateDoc=sdk.updateDoc;window.refreshReads=[];
  sdk.getDocs=async q=>{const path=typeof q==='string'?q:q.path;refreshReads.push(path);if(window.failItemRead&&path.endsWith('/items'))throw Error('Simulated item read failure');return getDocs(q)};
  sdk.updateDoc=async(path,data)=>{await updateDoc(path,data);if(window.pauseItemWrite)await new Promise(resolve=>window.releaseItemWrite=resolve);testSheetDocs[path]={...testSheetDocs[path],...data};};
 });
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);document.getElementById('siteBootPanel')?.remove()});await page.evaluate(()=>window.realItemLoaders={loadCampaignItems,loadCampaignInventory,loadCampaignSupply,loadSaves});await page.addScriptTag({path:root+'/tests/dom-state.js'});
 await page.evaluate(data=>{window.__testMonsters=data;window.fetch=async u=>({ok:true,json:async()=>String(u).includes('monsters.json')?__testMonsters:__testCatalog});window.auditSeed=role=>{closeCharacterSheet(true);CampaignWorkspace.clear(true);SiteHelp.onLogout();seed(role);document.getElementById('loginControls').style.display='none';document.getElementById('logoutButton').style.display='inline-block';document.getElementById('adminTab').style.display=role==='admin'?'inline-block':'none';document.getElementById('userDisplay').textContent='Sample '+role;document.getElementById('activeCampaignName').textContent=activeCampaign.name;renderDMTools();SiteHelp.onLogin();};},JSON.parse(fs.readFileSync(root+'/data/rules/monsters.json','utf8')));
 await page.addScriptTag({path:require.resolve(process.env.AXE_PATH||'axe-core/axe.min.js')});
 await page.evaluate(()=>{
  auditSeed('dm');
  for(const row of fixtureItems)testSheetDocs['campaigns/a/items/'+row.id]=structuredClone(row);
  for(const row of fixtureInventory)testSheetDocs['campaigns/a/inventory/'+row.id]=structuredClone(row);
  for(const [id,row]of Object.entries(fixtureSupply))testSheetDocs['campaigns/a/supply/'+id]=structuredClone(row);
  testSheetDocs['campaigns/a/saves/bookmark']={itemId:'potion',characterId:'c1',userId:'player'};saves=[{...testSheetDocs['campaigns/a/saves/bookmark'],id:'bookmark'}];
  ({loadCampaignItems,loadCampaignInventory,loadCampaignSupply,loadSaves}=realItemLoaders);
  window.beforeUnrelated=JSON.stringify({inventory,saves,campaignSupply});showTab('library');
 });
 const item=page.locator('#card-container [data-item-id=potion]');
 await page.evaluate(()=>refreshReads=[]);await item.locator('.highlight-button').click();await page.waitForFunction(()=>document.querySelector('#card-container [data-item-id=potion]').classList.contains('highlighted'));
 assert.deepEqual(await page.evaluate(()=>refreshReads),['campaigns/a/items']);assert.equal(await page.evaluate(()=>JSON.stringify({inventory,saves,campaignSupply})),await page.evaluate(()=>beforeUnrelated));
 await page.evaluate(()=>refreshReads=[]);await item.locator('.visibility-toggle-btn').click();await page.waitForFunction(()=>document.querySelector('#card-container [data-item-id=potion] .visibility-toggle-btn')?.textContent==='Hidden');assert.deepEqual(await page.evaluate(()=>refreshReads),['campaigns/a/items']);
 await page.evaluate(async()=>{refreshReads=[];await setVisibilityByRarity('Common',true)});assert.deepEqual(await page.evaluate(()=>refreshReads),['campaigns/a/items']);assert.equal(await page.locator('#card-container .visibility-toggle-btn').allTextContents().then(t=>t.every(v=>v==='Visible')),true);
 // A failed write does not trigger reads or change the visible saved state.
 await page.evaluate(()=>{refreshReads=[];testFailWrite=true});await item.locator('.highlight-button').click();await page.waitForFunction(()=>testAlerts.some(t=>t.includes('Simulated permission-denied')));assert.deepEqual(await page.evaluate(()=>refreshReads),[]);assert.ok(await item.locator('.highlight-button').isEnabled());await page.evaluate(()=>testFailWrite=false);
 // Explicit refresh still picks up independent changes made by other sessions.
 await page.evaluate(()=>{testSheetDocs['campaigns/a/inventory/e1'].quantity=4;testSheetDocs['campaigns/a/supply/potion'].capacity=12;testSheetDocs['campaigns/a/saves/new']={itemId:'hidden',characterId:'c1',userId:'player'};refreshReads=[]});
 await page.locator('#refreshCampaignItems').click();await page.waitForFunction(()=>inventory.find(e=>e.id==='e1')?.quantity===4&&saves.length===2);
 assert.deepEqual(await page.evaluate(()=>[...refreshReads].sort()),['campaigns/a/inventory','campaigns/a/items','campaigns/a/saves','campaigns/a/supply']);assert.equal(await page.evaluate(()=>campaignSupply.potion.capacity),12);
 // Rejected refresh is recoverable through the existing button and error feedback.
 await page.evaluate(()=>{failItemRead=true;refreshReads=[]});await item.locator('.highlight-button').click();await page.waitForFunction(()=>testAlerts.some(t=>t.includes('Simulated item read failure')));assert.ok(await item.locator('.highlight-button').isEnabled());await page.evaluate(()=>failItemRead=false);await page.locator('#refreshCampaignItems').click();await page.waitForFunction(()=>!document.getElementById('refreshCampaignItems').disabled);
 // Late writes cannot patch or start reads after account, campaign or navigation changes.
 for(const change of ['account','campaign','generation','role']){
  await page.evaluate(change=>{auth.currentUser={uid:'dm'};currentUser={id:'dm',role:['dm']};activeCampaign={id:'a',name:'Storm Coast',ownerId:'dm',inventoryVersion:2};activeMembershipRole='dm';window.pauseItemWrite=true;window.releaseItemWrite=null;refreshReads=[];window.pendingToggle=toggleItemVisibility('potion');window.beforeLate=JSON.stringify(items);},change);
  await page.waitForFunction(()=>typeof releaseItemWrite==='function');
  await page.evaluate(async change=>{if(change==='account')auth.currentUser={uid:'someone-else'};if(change==='campaign')activeCampaign={...activeCampaign,id:'b'};if(change==='generation')campaignLoadGeneration++;if(change==='role'){activeCampaign={...activeCampaign,ownerId:'someone-else'};activeMembershipRole='player';}pauseItemWrite=false;releaseItemWrite();await pendingToggle;},change);
  assert.deepEqual(await page.evaluate(()=>refreshReads),[],change+' must not trigger follow-up reads');assert.equal(await page.evaluate(()=>JSON.stringify(items)),await page.evaluate(()=>beforeLate),change+' must not patch a newer scope');
 }
 await page.evaluate(()=>{auth.currentUser={uid:'dm'};currentUser={id:'dm',role:['dm']};activeCampaign={id:'a',name:'Storm Coast',ownerId:'dm',inventoryVersion:2};activeMembershipRole='dm';pauseItemWrite=true;releaseItemWrite=null;refreshReads=[];window.beforeBulkWrites=testWrites.length;window.pendingBulk=setVisibilityByRarity('Common',false)});
 await page.waitForFunction(()=>typeof releaseItemWrite==='function');
 await page.evaluate(async()=>{auth.currentUser={uid:'other-dm'};pauseItemWrite=false;releaseItemWrite();await pendingBulk});
 assert.equal(await page.evaluate(()=>testWrites.length-beforeBulkWrites),1,'rarity batch stops after a scope change');assert.deepEqual(await page.evaluate(()=>refreshReads),[]);
 assert.deepEqual(errors,[]);console.log('PASS Real SDK item reads: Highlight/visibility/rarity use 1 collection instead of 4; unrelated state retained; explicit refresh reads all; write/read failures recover; late account/campaign/generation/role changes ignored');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
