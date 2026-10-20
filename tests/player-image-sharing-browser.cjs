const {navigate,archiveEntry}=require('./app-navigation-fixture.cjs');
// Real browser integration against a deterministic Firebase fixture; never touches production.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
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
 await page.waitForSelector('#dmPlanningTab-creatures',{state:'attached'});await navigate(page,'dm-creatures');await page.locator('[data-new-record]').click();
 await page.locator('[name=title]').fill('Illustrated NPC');await page.locator('[name=content]').fill('Shared introduction');await page.locator('[name=privateNotes]').fill('PRIVATE SECRET');
 const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;const c=canvas.getContext('2d');c.fillStyle='navy';c.fillRect(0,0,2,2);return canvas.toDataURL('image/png').split(',')[1];});
 const image={name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')};
 await page.locator('[data-journal-image-upload]').setInputFiles(image);await page.waitForSelector('[data-journal-image-view]').catch(async error=>{console.log(await page.locator('[data-workspace-status]').textContent());throw error;});
 await page.locator('[data-journal-image-caption]').fill('Saved portrait caption');await page.locator('[data-journal-image-alt]').fill('NPC portrait');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===1);
 const id=await page.evaluate(()=>CampaignWorkspace.session.record.id);
 await page.evaluate(async()=>{await CampaignWorkspace.openRecord(CampaignWorkspace.session.record.id)});
 await page.waitForSelector('[data-journal-image-view]');
 if(await page.locator('[data-journal-image-caption]').inputValue()!=='Saved portrait caption')throw Error('Caption not retained after reopen');
 if(!await page.locator('[data-share-entry-image]').isDisabled())throw Error('Can share image before text');
 await page.waitForFunction(()=>!document.querySelector('[data-publish-npc]').disabled);await page.locator('[data-publish-npc]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-share-entry-image]').disabled);
 await page.locator('[data-share-entry-image]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Illustration shared'));
 const published=await page.evaluate(id=>structuredClone(testSheetDocs['campaigns/a/playerNPCs/'+id]),id);
 if(!published.image||JSON.stringify(published).includes('PRIVATE SECRET'))throw Error('Image missing or private notes leaked');
 await page.locator('[name=content]').fill('New private introduction');await page.locator('[data-journal-image-caption]').fill('New saved caption');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===2);
 if(await page.evaluate(id=>testSheetDocs['campaigns/a/playerNPCs/'+id].image.caption,id)!=='Saved portrait caption')throw Error('Save publishes caption automatically');
 await page.waitForFunction(()=>!document.querySelector('[data-share-entry-image]').disabled);await page.locator('[data-share-entry-image]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Illustration shared'));
 if(await page.evaluate(id=>testSheetDocs['campaigns/a/playerNPCs/'+id].content,id)!=='Shared introduction')throw Error('Updating image publishes private text');
 await page.evaluate(()=>{CampaignWorkspace.clear(true);seed('player');showTab('campaign-home')});await page.locator('[data-home-tab=campaign-npcs]').click();await page.waitForSelector('[data-information-id]');
 await page.locator('[data-read-npc]').click();await page.waitForSelector('[data-shared-image] img');
 if(await page.locator('[data-shared-image] figcaption').textContent()!=='New saved caption')throw Error('Player caption incorrect');
 if((await page.locator('#tab-campaign-npcs').textContent()).includes('PRIVATE SECRET'))throw Error('Player sees private notes');
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.addScriptTag({content:require('axe-core').source});const violations=await page.evaluate(async()=>(await axe.run('#tab-campaign-npcs',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);if(violations.length)throw Error('Accessibility: '+violations.map(v=>v.id));
 await page.evaluate(()=>informationListeners.get('campaigns/a/playerNPCs').error(Error('Access revoked')));if(await page.locator('[data-shared-image] img').count())throw Error('Revoked access retains illustration');
 await page.evaluate(()=>{CampaignInformation.clear(true);seed('dm');showTab('dm-world')});await navigate(page,'dm-creatures');await page.waitForSelector('[data-open-record]');await page.locator('[data-open-record]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-hide-entry-image]').disabled);await page.locator('[data-hide-entry-image]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Illustration hidden'));
 if(await page.evaluate(id=>!!testSheetDocs['campaigns/a/playerNPCs/'+id].image,id))throw Error('Hide image failed');
 if(await page.evaluate(id=>testSheetDocs['campaigns/a/playerNPCs/'+id].content,id)!=='Shared introduction')throw Error('Hide changes text');
 const oldPath=await page.evaluate(()=>CampaignWorkspace.session.record.data.journalImage.path);
 await page.locator('[data-journal-image-upload]').setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
 await page.waitForFunction(()=>document.querySelector('[data-workspace-status]').textContent.includes('failed'));
 if(await page.evaluate(()=>CampaignWorkspace.session.record.data.journalImage.path)!==oldPath)throw Error('Invalid bytes replaced saved picture');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Real-app image upload/save/reopen, separate image/text publication, player caption, privacy, access revocation, mobile/WCAG and invalid bytes');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
