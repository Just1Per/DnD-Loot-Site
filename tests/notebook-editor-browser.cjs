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
 for(const [kind,tab,label] of [['world','dm-world','Religion'],['chapter','dm-chapters','Journeys']]){
  await navigate(page,tab);await page.waitForSelector('[data-notebook-mode]');await page.waitForFunction(()=>CampaignWorkspace.session.rowsLoaded);
  await page.locator('[data-notebook-mode]').check();
  await page.locator('[data-add-notebook-category] > summary').click();await page.locator('[data-notebook-category-name]').fill(label);await page.locator('[data-save-notebook-category]').click();
  await page.waitForFunction(()=>document.querySelector('[data-notebook-category-status]').textContent.includes('Category saved'));
  if(await page.evaluate(()=>Object.keys(testSheetDocs).filter(p=>p.includes('/workspaceCategories/')).length)===0)throw Error('Empty category not saved');
  if(await page.evaluate(()=>CampaignWorkspace.session.rows.length)!==0)throw Error('Category creates a fake entry');
  await page.evaluate(async kind=>{CampaignWorkspace.clear(true);await CampaignWorkspace.render(kind)},kind);await page.waitForFunction(()=>CampaignWorkspace.session.notebookCategories.length>0);
  if(!await page.locator('[data-notebook-mode]').isChecked())throw Error('Notebook preference not restored');
  if(kind==='world')await page.locator('[data-world-category="'+label+'"]').click();else await page.locator('[data-notebook-category="'+label+'"]').click();
  await page.locator('[data-new-record]').click();await page.waitForSelector('[data-notebook-sheet]');
  if(await page.locator('[data-workspace-search]').isVisible())throw Error('Notebook displays a search box');
  if(!await page.locator('[name=privateNotes]').isVisible())throw Error('Notebook hides DM notes');
  await page.locator('[name=title]').fill(label+' notebook entry');await page.locator('[name=content]').fill('Notebook description');await page.locator('[name=privateNotes]').fill('DM PRIVATE notebook secret');
  await page.evaluate(()=>{CampaignWorkspace.session.record.data.extension={preserve:'opaque preparation'}});
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2;c.height=2;c.getContext('2d').fillRect(0,0,2,2);return c.toDataURL().split(',')[1]});
  await page.locator('[data-journal-image-upload]').setInputFiles({name:'map.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.waitForSelector('[data-journal-image-view]');
  await page.locator('[data-journal-image-caption]').fill('Notebook illustration');
  await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===1);
  const id=await page.evaluate(()=>CampaignWorkspace.session.record.id),imagePath=await page.evaluate(()=>CampaignWorkspace.session.record.data.journalImage.path);
  await page.locator('[name=content]').fill('Unsaved notebook description');
  await page.locator('[data-notebook-mode]').uncheck();await page.locator('[data-notebook-mode]').check();
  if(await page.locator('[name=content]').inputValue()!=='Unsaved notebook description')throw Error('Layout switch lost draft');
  if(await page.evaluate(()=>CampaignWorkspace.session.record.data.journalImage.path)!==imagePath)throw Error('Layout switch changed image path');
  await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===2);
  await page.evaluate(async id=>{await CampaignWorkspace.openRecord(id)},id);await page.waitForSelector('[data-notebook-sheet]');
  if(await page.locator('[name=content]').inputValue()!=='Unsaved notebook description'||await page.locator('[name=privateNotes]').inputValue()!=='DM PRIVATE notebook secret')throw Error('Notebook save/reopen lost text');
  if(await page.evaluate(()=>CampaignWorkspace.session.record.data.extension.preserve)!=='opaque preparation')throw Error('Notebook lost opaque preparation');
  if(await page.evaluate(()=>CampaignWorkspace.session.record.data.category)!==label)throw Error('Notebook category not saved');
  if(kind==='chapter'){
   await page.locator('[data-notebook-preparation] > summary').click();await page.locator('[data-record-field=status]').selectOption('Completed');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===3);
  }
  await page.waitForFunction(()=>!document.querySelector('[data-publish-entry]').disabled);await page.locator('[data-publish-entry]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Shared with campaign members'));
  await page.locator('[name=content]').fill('PRIVATE NEW DRAFT');await page.locator('[data-notebook-published-preview]').click();await page.waitForSelector('[data-published-preview-content] h3');
  const preview=await page.locator('[data-published-preview-content]').textContent();if(preview.includes('PRIVATE NEW DRAFT')||preview.includes('DM PRIVATE'))throw Error('Published preview leaks drafts');
  if(!preview.includes('Unsaved notebook description'))throw Error('Published preview not using shared text');await page.locator('[data-close-published-preview]').click();
  await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Notebook mobile overflow');
  await page.addScriptTag({content:require('axe-core').source});const violations=await page.evaluate(async tab=>(await axe.run('#tab-'+tab,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations,tab);if(violations.length)throw Error('Notebook accessibility: '+violations.map(v=>v.id));
  await page.screenshot({path:'/tmp/campaignatlas-ui-checks/notebook-'+kind+'-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>CampaignWorkspace.clear(true));
  console.log('PASS',kind,'empty campaign categories, saved notebook preference, draft-safe switching, image/text/notes save/reopen, opaque data, published preview, mobile/WCAG');
 }
 await page.evaluate(async()=>{CampaignWorkspace.clear(true);activeCampaign={...activeCampaign,id:'other-notebook'};await CampaignWorkspace.render('world')});
 await page.waitForFunction(()=>CampaignWorkspace.session.rowsLoaded);
 if(await page.locator('[data-notebook-mode]').isChecked())throw Error('Preference leaks to another campaign');
 if(await page.locator('[data-world-category=Religion]').count())throw Error('Category leaks to another campaign');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Notebook category and view preferences remain campaign-scoped');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
