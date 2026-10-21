const {navigate:navigateJournal}=require('./app-navigation-fixture.cjs');
const {navigate,archiveEntry}=require('./app-navigation-fixture.cjs');
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
 await page.waitForSelector('#dmPlanningTab-creatures',{state:'attached'});await navigate(page,'dm-creatures');await page.waitForSelector('[data-new-record]');await page.locator('[data-new-record]').click();
 await page.locator('[name=title]').fill('Captain Elowen');await page.locator('[name=summary]').fill('Harbor captain');await page.locator('[name=content]').fill('Elowen welcomes travellers. <img src=x onerror=unsafe()>');await page.locator('[name=privateNotes]').fill('Secret betrayal');await page.locator('[data-record-field=goals]').fill('Overthrow the king');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record.revision===1);await page.waitForFunction(()=>!document.querySelector('[data-publish-npc]').disabled);
 const recordId=await page.evaluate(()=>CampaignWorkspace.session.record.id);
 if(await page.evaluate(()=>Object.keys(testSheetDocs).some(path=>path.includes('/playerNPCs/'))))throw Error('Creating NPC reveals it automatically');
 await page.locator('[data-publish-npc]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Published to players'));
 const published=await page.evaluate(id=>testSheetDocs['campaigns/a/playerNPCs/'+id],recordId);
 if(published.data||published.privateNotes||JSON.stringify(published).includes('betrayal')||JSON.stringify(published).includes('Overthrow'))throw Error('NPC publication leaked preparation');
 await page.locator('[name=content]').fill('Elowen asks the party to inspect a ship.');
 if(await page.evaluate(id=>testSheetDocs['campaigns/a/playerNPCs/'+id].content,recordId)!==published.content)throw Error('Editing silently published the NPC');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record.revision===2);
 if(await page.evaluate(id=>testSheetDocs['campaigns/a/playerNPCs/'+id].content,recordId)!==published.content)throw Error('Private edit silently updates player NPC');
 console.log('PASS Explicit NPC reveal excludes secrets/statistics and keeps later edits private');
 await page.evaluate(()=>{CampaignWorkspace.clear(true);seed('player');showTab('campaign-home')});await navigateJournal(page,'campaign-npcs');await page.waitForSelector('[data-information-id]');
 const content=await page.locator('#tab-campaign-npcs').textContent();if(!content.includes('Captain Elowen')||content.includes('Overthrow')||content.includes('Secret betrayal'))throw Error('Player NPC content is incorrect');
 await page.locator('[data-read-npc]').click();if(await page.locator('.npc-post-reader .campaign-book-prose img').count())throw Error('NPC description executed markup');
 await page.locator('[data-npc-back]').click();
 await page.locator('[data-information-search]').fill('unmet');if(await page.locator('[data-information-id]').count())throw Error('NPC search fails');await page.locator('[data-information-search]').fill('harbor');if(await page.locator('[data-information-id]').count()!==1)throw Error('NPC summary search fails');
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('NPC catalogue overflows mobile');await page.addScriptTag({content:require('axe-core').source});
 const violations=await page.evaluate(async()=> (await axe.run('#tab-campaign-npcs',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);if(violations.length)throw Error('NPC accessibility: '+violations.map(row=>row.id).join(','));
 for(const kind of ['world','creatures','chapters','one-shots']){
   if(await page.locator('#dmPlanningTab-'+kind).isVisible())throw Error('Player transition retains DM tab: '+kind);
   await page.evaluate(kind=>showTab('dm-'+kind),kind);
   if(await page.locator('#tab-dm-'+kind).isVisible())throw Error('Player can open DM tab directly: '+kind);
 }
 console.log('PASS Player catalogue link, search, safe text, mobile layout and axe checks');
 await page.evaluate(id=>{delete testSheetDocs['campaigns/a/playerNPCs/'+id];emitInformationSnapshot()},recordId);if(await page.locator('[data-information-id]').count())throw Error('Unrevealed NPC remains visible');
 await page.evaluate(({id,published})=>{testSheetDocs['campaigns/a/playerNPCs/'+id]=published;emitInformationSnapshot()},{id:recordId,published});
 await page.evaluate(()=>informationListeners.get('campaigns/a/playerNPCs').error(Error('Permission denied')));if(await page.locator('[data-information-id]').count())throw Error('Permission error keeps NPC content');
 console.log('PASS Unrevealing and access revocation clear the catalogue');
 await page.evaluate(()=>{CampaignInformation.clear();seed('dm');showTab('dm-world')});await page.waitForSelector('#dmPlanningTab-creatures',{state:'attached'});await navigate(page,'dm-creatures');await page.waitForFunction(()=>CampaignWorkspace.session?.kind==='creature'&&CampaignWorkspace.session.rowsLoaded);
 await page.locator('[data-open-record="'+recordId+'"]').click();
 await page.waitForFunction(id=>CampaignWorkspace.session?.kind==='creature'&&CampaignWorkspace.session.record?.id===id&&CampaignWorkspace.session.record.revision>0,recordId).catch(async error=>{throw Error('Saved NPC editor did not open: '+JSON.stringify(await page.evaluate(()=>({route:AppShell.route,kind:CampaignWorkspace.session?.kind,id:CampaignWorkspace.session?.record?.id,revision:CampaignWorkspace.session?.record?.revision,rows:CampaignWorkspace.session?.rows.map(r=>({id:r.id,revision:r.revision})),status:document.querySelector('[data-workspace-status]')?.textContent})))+' '+error.message)});
 await page.locator('[data-record-field=category]').selectOption('Monster');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record.revision===3);
 if(await page.evaluate(id=>!!testSheetDocs['campaigns/a/playerNPCs/'+id],recordId))throw Error('Reclassified NPC stays revealed');
 if(!await page.locator('[data-publish-npc]').isDisabled())throw Error('Monster can be revealed as NPC');
 await page.locator('[data-record-field=category]').selectOption('Story NPC');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record.revision===4);await page.waitForFunction(()=>!document.querySelector('[data-publish-npc]').disabled);await page.locator('[data-publish-npc]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Published to players'));
 await archiveEntry(page);await page.waitForFunction(()=>CampaignWorkspace.session?.record.archived);if(await page.evaluate(id=>!!testSheetDocs['campaigns/a/playerNPCs/'+id],recordId))throw Error('Archived NPC remains revealed');
 console.log('PASS Reclassification and archive unshare NPCs while keeping private masters');
 if(errors.length)throw Error(errors.join('\n'));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
