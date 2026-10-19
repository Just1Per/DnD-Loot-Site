// Real browser integration against a deterministic Firebase fixture; never touches production.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
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
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__, original=deps.runTransaction;deps.runTransaction=async(...args)=>{if(window.testTransactionFailure)throw Object.assign(Error('Missing or insufficient permissions.'),{code:'permission-denied'});if(window.pauseHomeRead)return original(args[0],tx=>args[1]({...tx,get:async path=>{await new Promise(resolve=>window.finishHomeRead=resolve);return tx.get(path)}}));return original(...args)}});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__, original=deps.uploadBytes;deps.uploadBytes=async(...args)=>{if(window.failCoverUpload)throw Object.assign(Error('Denied'),{code:'storage/unauthorized'});if(window.pauseCoverUpload)await new Promise(resolve=>window.finishCoverUpload=resolve);return original(...args)}});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__,original=deps.getBlob;window.coverReads=0;deps.getBlob=async(...args)=>{++window.coverReads;if(window.failCoverRead)throw Object.assign(Error('Image read failed'),{code:window.failCoverRead});if(window.pauseCoverRead)await new Promise(resolve=>window.finishCoverRead=resolve);return original(...args)}});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=fs.readFileSync(path.join(__dirname,'dom.cjs'),'utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1];
 for(const name of JSON.parse(modules.replaceAll("'",'"')))await page.addScriptTag({path:path.join(root,'js/modules',name+'.js')});
 await page.evaluate(()=>CharacterCatalog.set(window.__testCatalog));await page.addScriptTag({path:path.join(__dirname,'dom-state.js')});
 await page.evaluate(monsters=>{window.__testMonsters=monsters;window.fetch=async url=>({ok:true,json:async()=>String(url).includes('monsters.json')?window.__testMonsters:window.__testCatalog})},JSON.parse(fs.readFileSync(path.join(root,'data/rules/monsters.json'),'utf8')));
 await page.route('https://art.example.test/cover.png', route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64')}));
 await page.evaluate(()=>{seed('dm');activeCampaign.description='An adventure on the Storm Coast';testSheetDocs['campaigns/a']={...activeCampaign};showMainApp();document.getElementById('siteBootPanel')?.remove();document.getElementById('loginControls').style.display='none';document.getElementById('userDisplay').textContent='Campaign DM';document.getElementById('activeCampaignName').textContent=activeCampaign.name});
 // A small original SVG map fixture, used only for visual/layout checks.
 await page.route('https://art.example.test/map.svg',route=>route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><rect width="1200" height="760" fill="#d5c69e"/><path d="M0 190Q280 70 420 280T720 400T1200 570V760H0Z" fill="#758b77"/><path d="M950 0Q760 250 890 400T750 760" fill="none" stroke="#75989b" stroke-width="90"/><g fill="#596f65" stroke="#c4cba9" stroke-width="4"><path d="M90 320L220 70L340 320Z"/><path d="M230 350L390 100L510 350Z"/><path d="M160 610L300 370L420 610Z"/></g><g fill="none" stroke="#8f7b53" stroke-width="3" opacity=".6"><path d="M50 40H1150V710H50Z"/><path d="M65 55H1135V695H65Z"/></g><circle cx="1010" cy="130" r="55" fill="none" stroke="#6e5234" stroke-width="2"/><path d="M1010 55V205M935 130H1085" stroke="#6e5234" stroke-width="3"/><text x="595" y="660" fill="#4d3926" font-family="Georgia,serif" font-size="44" text-anchor="middle" letter-spacing="7">THE STORM COAST</text></svg>`}));
 const initial={tagline:'Where the sea meets the forgotten kingdoms',introduction:'Beyond the last watchtower, old roads lead into a land of sleeping giants, lost cities and stories waiting to be told.\n\nBring your curiosity. The coast remembers every traveller.',expectations:'Exploration, intrigue and a little danger.\nWe play every other Thursday. Respect the table, share the spotlight and let the story surprise you.',imageUrl:'https://art.example.test/map.svg',imageAlt:'A parchment map of the Storm Coast, showing mountains and a winding river',imageCredit:'Original layout test illustration',revision:1};
 await page.evaluate(frontPage=>{activeCampaign.name='The Storm Coast';activeCampaign.frontPage=frontPage;testSheetDocs['campaigns/a']={...activeCampaign};CampaignHome.render();},initial);
 const article=()=>page.locator('#tab-campaign-home article.campaign-book');
 const choice=id=>page.locator('input[name=homeLayout][value="'+id+'"]');
 const pick=async id=>{await choice(id).check();await page.waitForFunction(id=>document.querySelector('[data-home-preview-surface] article')?.dataset.homeLayout===id,id);};
 await page.addScriptTag({content:require('axe-core').source});
 const accessible=async selector=>assert.deepEqual(await page.evaluate(async selector=>(await axe.run(selector,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(row=>({id:row.id,targets:row.nodes.map(node=>node.target)})),selector),[]);
 fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});
 assert.equal(await article().getAttribute('data-home-layout'),'classic');
 const original=await page.locator('.campaign-book-opening').evaluate(node=>({columns:getComputedStyle(node).gridTemplateColumns,background:getComputedStyle(node.closest('article')).backgroundColor}));
 assert.ok(original.columns.split(' ').length===2);assert.equal(original.background,'rgb(253, 251, 247)');
 await page.locator('[data-edit-campaign-home]').click();assert.equal(await page.locator('#campaignHomeLayoutOptions').isVisible(),false);
 await page.locator('[data-home-layout-options]').click();assert.equal(await page.locator('[data-home-layout-options]').getAttribute('aria-expanded'),'true');
 assert.equal(await page.locator('.campaign-home-editor-actions button').evaluateAll(nodes=>nodes.every(node=>node.getBoundingClientRect().height>=44)),true);
 assert.equal(await choice('classic').isChecked(),true);assert.equal(await page.locator('input[name=homeLayout]').count(),4);
 await page.locator('[name=introduction]').fill(initial.introduction+'\nUnpublished DM edit.');
 const writesBefore=await page.evaluate(()=>testWrites.length);
 for(const id of ['chronicle','atlas','grimoire','classic']){
  await pick(id);
  assert.equal(await page.locator('[data-home-edit-fields]').isVisible(),false);
  assert.equal(await page.locator('[name=introduction]').inputValue(),initial.introduction+'\nUnpublished DM edit.');
  assert.equal(await page.locator('[data-home-preview-surface] img').getAttribute('alt'),initial.imageAlt);
  assert.equal(await page.evaluate(()=>testWrites.length),writesBefore,'choosing a layout must not write to Firestore');
  await accessible('#campaignHomeEditor');
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'/tmp/campaignatlas-ui-checks/campaign-layout-'+id+'-desktop.png',fullPage:true});
  for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,id+' fits '+width);}
  await accessible('#campaignHomeEditor');
  await page.screenshot({path:'/tmp/campaignatlas-ui-checks/campaign-layout-'+id+'-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
 }
 console.log('PASS Four layouts preview without writes, retain every draft/image field and pass desktop/mobile/WCAG checks');
 await pick('chronicle');await page.locator('#campaignHomeEditor button[type=submit]').click();await page.waitForSelector('#campaignHomeEditor',{state:'detached'});
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].frontPage.layout),'chronicle');
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].frontPage.revision),2);
 assert.match(await article().textContent(),/Unpublished DM edit/);
 await page.evaluate(()=>{const saved=testSheetDocs['campaigns/a'].frontPage;seed('player');activeCampaign.frontPage=saved;showMainApp();});
 assert.equal(await article().getAttribute('data-home-layout'),'chronicle');assert.equal(await page.locator('[data-edit-campaign-home]').count(),0);
 await page.evaluate(()=>CampaignHome.edit());assert.equal(await page.locator('#campaignHomeEditor').count(),0);
 await accessible('#tab-campaign-home');
 console.log('PASS Chosen layout saves with the existing revision, renders for players and remains DM-only to edit');
 await page.evaluate(()=>{const saved=testSheetDocs['campaigns/a'].frontPage;seed('dm');activeCampaign.frontPage=saved;showMainApp();});
 await page.locator('[data-edit-campaign-home]').click();await page.locator('[data-home-layout-options]').click();await pick('atlas');
 await page.evaluate(()=>window.confirm=()=>false);await page.locator('[data-home-cancel]').click();assert.equal(await page.locator('#campaignHomeEditor').isVisible(),true);
 await page.evaluate(()=>window.confirm=()=>true);await page.locator('[data-home-cancel]').click();assert.equal(await article().getAttribute('data-home-layout'),'chronicle');
 await page.locator('[data-edit-campaign-home]').click();await page.locator('[data-home-layout-options]').click();await pick('atlas');
 await page.evaluate(()=>testTransactionFailure=true);await page.locator('#campaignHomeEditor button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('[data-home-editor-status]').textContent.includes('Missing or insufficient permissions'));
 assert.match(await page.locator('[data-home-editor-status]').textContent(),/draft is still in this editor.*selected layout/);
 assert.equal(await choice('atlas').isChecked(),true);assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].frontPage.layout),'chronicle');
 await page.evaluate(()=>{testTransactionFailure=false;testSheetDocs['campaigns/a'].frontPage.revision=3;});
 await page.locator('#campaignHomeEditor button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-home-editor-status]').textContent.includes('Another DM'));
 assert.equal(await choice('atlas').isChecked(),true);assert.equal(await page.locator('[name=imageAlt]').inputValue(),initial.imageAlt);
 await page.locator('[data-home-cancel]').click();
 console.log('PASS Cancel, denied saves and revision conflicts preserve both layout drafts and saved content');
 await page.evaluate(()=>{activeCampaign.frontPage={...testSheetDocs['campaigns/a'].frontPage,layout:'unknown-future-layout'};CampaignHome.render();});
 assert.equal(await article().getAttribute('data-home-layout'),'classic');
 await page.locator('[data-edit-campaign-home]').click();await page.locator('[data-home-layout-options]').click();
 await choice('classic').focus();await page.keyboard.press('ArrowRight');assert.equal(await choice('chronicle').isChecked(),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#campaignHomeLayoutOptions').isVisible(),false);
 assert.equal(await page.locator('[data-home-layout-options]').evaluate(node=>node===document.activeElement),true);
 await page.locator('[data-home-layout-options]').click();await pick('classic');
 await page.evaluate(()=>activeCampaign.frontPage=testSheetDocs['campaigns/a'].frontPage);
 await page.locator('#campaignHomeEditor button[type=submit]').click();await page.waitForSelector('#campaignHomeEditor',{state:'detached'});
 assert.equal(await page.evaluate(()=>Object.hasOwn(testSheetDocs['campaigns/a'].frontPage,'layout')),false,'Classic retains the legacy payload');
 console.log('PASS Unknown preferences safely fall back to Classic; keyboard selection/Escape and restoring Standard work');
 await page.locator('[data-edit-campaign-home]').click();
 const readsBeforeUpload=await page.evaluate(()=>coverReads);
 await page.locator('[data-home-upload]').setInputFiles({name:'campaign-map.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64')});
 await page.waitForFunction(()=>document.querySelector('[data-home-image-source]').textContent.includes('Uploaded:'));
 await page.locator('[data-home-layout-options]').click();
 for(const id of ['grimoire','atlas','chronicle']){
  await pick(id);await page.waitForFunction(()=>document.querySelector('[data-home-preview-surface] img')?.src.startsWith('blob:'));
  assert.equal(await page.evaluate(()=>coverReads),readsBeforeUpload,'layout previews reuse the uploaded file without another bucket read');
 }
 await page.locator('#campaignHomeEditor button[type=submit]').click();await page.waitForSelector('#campaignHomeEditor',{state:'detached'});
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].frontPage.layout),'chronicle');
 assert.ok((await page.evaluate(()=>testSheetDocs['campaigns/a'].frontPage.imagePath)).startsWith('campaign-cover-images/a/'));
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a'].frontPage.imageUrl),'');
 console.log('PASS Uploaded campaign images survive layout switching and save in their original private scope without duplicate reads');
 // All variants remain useful without campaign artwork, including long wrapping text.
 for(const id of ['classic','chronicle','atlas','grimoire']){
  await page.evaluate(id=>{activeCampaign.frontPage={...testSheetDocs['campaigns/a'].frontPage,layout:id,imageUrl:'',imagePath:'',tagline:'A'.repeat(160)};CampaignHome.render();},id);
  assert.equal(await article().locator('img').count(),0);
  await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,id+' without an image fits mobile');
  await accessible('#tab-campaign-home');
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{activeCampaign.frontPage={...testSheetDocs['campaigns/a'].frontPage,layout:'grimoire'};CampaignHome.render();});
 await page.emulateMedia({media:'print'});assert.equal(await article().locator('h2').evaluate(node=>getComputedStyle(node).color),'rgb(92, 29, 29)');await page.emulateMedia({media:'screen'});
 for(const id of ['classic','chronicle','atlas','grimoire']){
  await page.evaluate(()=>{const saved=structuredClone(testSheetDocs['campaigns/a'].frontPage);seed('dm');activeCampaign.frontPage=saved;showMainApp();});
  const before=await page.evaluate(()=>structuredClone(testSheetDocs['campaigns/a'].frontPage));
  await page.locator('[data-edit-campaign-home]').click();await page.locator('[data-home-layout-options]').click();await pick(id);
  await page.locator('#campaignHomeEditor button[type=submit]').click();await page.waitForSelector('#campaignHomeEditor',{state:'detached'});
  const saved=await page.evaluate(()=>structuredClone(testSheetDocs['campaigns/a'].frontPage));
  assert.equal(saved.layout||'classic',id);assert.equal(saved.revision,before.revision+1);
  for(const field of ['tagline','introduction','expectations','imageUrl','imagePath','imageAlt','imageCredit'])assert.equal(saved[field],before[field],id+' retains '+field);
  // Rebuild the application state from persisted fixture data rather than keeping the preview object.
  for(const role of ['dm','player']){
   await page.evaluate(role=>{const stored=structuredClone(testSheetDocs['campaigns/a'].frontPage);seed(role);activeCampaign.frontPage=stored;showMainApp();},role);
   assert.equal(await article().getAttribute('data-home-layout'),id,id+' reopens for '+role);
   if(role==='player')assert.equal(await page.locator('[data-edit-campaign-home]').count(),0);
  }
 }
 console.log('PASS Every layout saves, increments its revision once, preserves text/private image fields and reopens for both DMs and players');
 assert.deepEqual(errors,[]);
 console.log('PASS No-image/long-text layouts remain accessible, fit narrow screens and retain readable print headings');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
