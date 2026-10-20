const {expandWorldTools}=require('./app-navigation-fixture.cjs');
// Real browser integration against a deterministic Firebase fixture; never touches production.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error('Browser error:',error.message)});
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style>'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'</style>':'');
 await page.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://fixture.example.test/');
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=()=>{};window.confirm=()=>true;window.prompt=()=> 'Old Bridge'},JSON.parse(fs.readFileSync(path.join(root,'data/rules/catalog.json'),'utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:path.join(__dirname,file)});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__;deps.where=(field,op,value)=>({field,op,value});deps.query=(path,...filters)=>({path,filters});deps.getDocs=async query=>{const p=typeof query==='string'?query:query.path,filters=query.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&key.slice(p.length+1).indexOf('/')<0&&filters.every(f=>{const value=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?value?.includes(f.value):value===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};deps.ref=(_,p)=>p;deps.uploadBytes=async(p)=>{window.lastUpload=p};deps.getBlob=async()=>new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0))],{type:'image/png'})});
 await page.evaluate(()=>{
  window.informationListeners=new Map();
  const deps=window.__DND_VAULT_DEPS__, original=deps.getDocs;
  window.emitInformationSnapshot=()=>{for(const [path,listener]of informationListeners)listener.next({docs:Object.entries(testSheetDocs).filter(([key])=>key.startsWith(path+'/')&&key.slice(path.length+1).indexOf('/')<0).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))})};
  deps.onSnapshot=(path,next,error)=>{informationListeners.set(path,{next,error});queueMicrotask(emitInformationSnapshot);return()=>informationListeners.delete(path)};
  deps.getDocs=async query=>{const path=typeof query==='string'?query:query.path;if(path.endsWith('/playerInformation')&&window.pauseInformation)await new Promise(resolve=>window.finishInformation=resolve);return original(query)};
 });
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=fs.readFileSync(path.join(__dirname,'dom.cjs'),'utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1];
 for(const name of JSON.parse(modules.replaceAll("'",'"')))await page.addScriptTag({path:path.join(root,'js/modules',name+'.js')});
 await page.evaluate(()=>CharacterCatalog.set(window.__testCatalog));await page.addScriptTag({path:path.join(__dirname,'dom-state.js')});
 await page.evaluate(monsters=>{window.__testMonsters=monsters;window.fetch=async url=>({ok:true,json:async()=>String(url).includes('monsters.json')?window.__testMonsters:window.__testCatalog})},JSON.parse(fs.readFileSync(path.join(root,'data/rules/monsters.json'),'utf8')));
 await page.evaluate(()=>{seed('dm');showTab('dm-world')});
 await page.evaluate(()=>{document.getElementById('siteBootPanel')?.remove();document.getElementById('loginControls').style.display='none';document.getElementById('userDisplay').textContent='Campaign DM';document.getElementById('activeCampaignName').textContent=activeCampaign.name});
 await page.waitForFunction(()=>!document.querySelector('[data-world-visibility]').disabled);
 if(await page.locator('[data-workspace-kind]:visible').count())throw Error('World Builder still contains nested creature/encounter navigation');
 await page.waitForSelector('[data-new-record]');await page.locator('[data-new-record]').click();


 const assert=require('node:assert/strict');
 await page.locator('[name=title]').fill('Harbor <script>plain text</script>');await page.locator('[name=content]').fill('The coast is quiet.');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===1);
 const id=await page.evaluate(()=>CampaignWorkspace.session.record.id);
 await page.evaluate(()=>document.querySelector('[data-world-advanced]').open=true);await page.waitForFunction(()=>!document.querySelector('[data-publish-world]').disabled);await page.locator('[data-publish-world]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Released to players'));
 const writes=await page.evaluate(()=>testWrites.length);
 await page.evaluate(()=>{const details=document.querySelector('[data-world-advanced]');if(details)details.open=true;});await page.locator('[data-archive-record]').click();
 const dialog=page.locator('#siteConfirmationDialog');
 assert.equal(await dialog.isVisible(),true);assert.equal(await dialog.locator('script').count(),0);
 assert.equal(await dialog.locator('[data-site-cancel]').evaluate(node=>node===document.activeElement),true);
 assert.match(await dialog.textContent(),/archived list/);assert.match(await dialog.textContent(),/player journal/);assert.match(await dialog.textContent(),/does not delete/);
 assert.equal(await page.evaluate(()=>testWrites.length),writes);
 await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.archived),false);
 assert.equal(await page.locator('[data-archive-record]').evaluate(node=>node===document.activeElement),true);
 console.log('PASS Archive explains consequences, defaults to Cancel, escapes text and preserves focus/data on Escape');
 await page.locator('[name=content]').fill('A new private draft.');await page.evaluate(()=>{const details=document.querySelector('[data-world-advanced]');if(details)details.open=true;});await page.locator('[data-archive-record]').click();assert.match(await dialog.textContent(),/unsaved changes will also be saved/);
 await dialog.locator('[data-site-confirm]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.archived&&!CampaignWorkspace.session.busy);
 assert.equal(await page.evaluate(id=>!!testSheetDocs['campaigns/a/playerInformation/'+id],id),false);
 assert.equal(await page.evaluate(id=>testSheetDocs['campaigns/a/worldEntries/'+id].content,id),'A new private draft.');
 await page.evaluate(()=>{const details=document.querySelector('[data-world-advanced]');if(details)details.open=true;});await page.locator('[data-archive-record]').click();assert.match(await dialog.textContent(),/does not share it with players/);await dialog.locator('[data-site-confirm]').click();await page.waitForFunction(()=>!CampaignWorkspace.session.record.archived&&!CampaignWorkspace.session.busy);
 assert.equal(await page.evaluate(id=>!!testSheetDocs['campaigns/a/playerInformation/'+id],id),false);
 console.log('PASS Confirmed archive saves the draft and unpublishes; Restore retains the entry without republishing');
 await page.evaluate(()=>{window.originalArchiveSave=CampaignWorkspace.store.save;CampaignWorkspace.store.save=async()=>{throw Error('Simulated save failure')}});
 await page.evaluate(()=>{const details=document.querySelector('[data-world-advanced]');if(details)details.open=true;});await page.locator('[data-archive-record]').click();await dialog.locator('[data-site-confirm]').click();await page.waitForFunction(()=>document.querySelector('[data-workspace-status]').textContent.includes('Simulated save failure'));
 assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.archived),false);await page.evaluate(()=>CampaignWorkspace.store.save=window.originalArchiveSave);
 await page.evaluate(()=>{const details=document.querySelector('[data-world-advanced]');if(details)details.open=true;});await page.locator('[data-archive-record]').click();const beforeStale=await page.evaluate(()=>testWrites.length);
 await page.evaluate(()=>auth.currentUser={uid:'other'});await dialog.locator('[data-site-confirm]').click();assert.equal(await page.evaluate(()=>testWrites.length),beforeStale);
 await page.evaluate(()=>{auth.currentUser={uid:'dm'};CampaignWorkspace.clear(true);seed('player');showTab('player')});
 await page.locator('.btn-archive-char[data-char-id=c1]').click();assert.match(await dialog.textContent(),/equipment, existing inventory and saved items are kept/);
 const charCalls=await page.evaluate(()=>callLog.length);await dialog.locator('[data-site-cancel]').click();assert.equal(await page.evaluate(()=>callLog.length),charCalls);
 await page.locator('.btn-archive-char[data-char-id=c1]').click();await page.setViewportSize({width:390,height:844});await page.addScriptTag({content:require('axe-core').source});
 assert.equal(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth),true);
 const violations=await page.evaluate(async()=>(await axe.run('#siteConfirmationDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);
 assert.deepEqual(violations.map(v=>v.id),[]);await dialog.locator('[data-site-cancel]').click();assert.deepEqual(errors,[]);
 console.log('PASS Failed saves and actor changes cannot archive; character explanations are cancellable, mobile and accessible');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
