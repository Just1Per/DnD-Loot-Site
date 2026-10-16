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
 assert.equal(await page.locator('[name=title]').isVisible(),true);
 assert.equal(await page.locator('[name=content]').isVisible(),true);
 assert.equal(await page.locator('[name=privateNotes]').isVisible(),false);
 assert.equal(await page.locator('[data-journal-image-upload]').isVisible(),false);
 assert.equal(await page.locator('[data-record-field=category]').inputValue(),'Location');
 assert.equal(await page.locator('[data-world-option][open]').count(),0);
 await page.locator('[name=title]').fill('Hollow Harbor');await page.locator('[name=content]').fill('A quiet town overlooking the storm coast.');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===1);
 const id=await page.evaluate(()=>CampaignWorkspace.session.record.id);
 assert.equal(await page.evaluate(id=>!!testSheetDocs['campaigns/a/playerInformation/'+id],id),false);
 assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.data.category),'Location');
 console.log('PASS A place needs only a name and description; Save stays private and optional tools start collapsed');
 await page.locator('[data-world-option=notes] > summary').focus();await page.keyboard.press('Enter');
 await page.locator('[name=privateNotes]').fill('The keeper hides the lost crown.');
 await page.locator('[data-world-option=options] > summary').click();await page.locator('[name=summary]').fill('A coastal town');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===2);
 await page.locator('[data-open-record]').click();await page.waitForFunction(()=>!CampaignWorkspace.session.dirty);
 assert.equal(await page.locator('[data-world-option][open]').count(),0);
 await page.locator('[name=content]').fill('An expanded town description.');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===3);
 assert.equal(await page.evaluate(id=>testSheetDocs['campaigns/a/workspaceSecrets/world-'+id].notes,id),'The keeper hides the lost crown.');
 assert.equal(await page.evaluate(id=>testSheetDocs['campaigns/a/worldEntries/'+id].summary,id),'A coastal town');
 console.log('PASS Reopening and saving collapsed preparation preserves existing private notes and optional metadata');
 await page.locator('[data-world-option=sharing] > summary').click();await page.waitForFunction(()=>!document.querySelector('[data-publish-world]').disabled);
 await page.locator('[data-publish-world]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Shared with campaign members'));
 assert.equal(await page.evaluate(id=>testSheetDocs['campaigns/a/playerInformation/'+id].content,id),'An expanded town description.');
 assert.equal(await page.evaluate(id=>JSON.stringify(testSheetDocs['campaigns/a/playerInformation/'+id]).includes('crown'),id),false);
 await page.setViewportSize({width:390,height:844});await page.addScriptTag({content:require('axe-core').source});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const violations=await page.evaluate(async()=>(await axe.run('#tab-dm-world',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);
 assert.deepEqual(violations.map(v=>v.id),[]);assert.deepEqual(errors,[]);
 await page.locator('[data-world-option=sharing] > summary').click();
 fs.mkdirSync('/tmp/campaignatlas-ui-checks',{recursive:true});await page.screenshot({path:'/tmp/campaignatlas-ui-checks/simple-world-mobile.png',fullPage:true});
 console.log('PASS Explicit sharing keeps secrets private; the simplified editor supports mobile, keyboard and WCAG checks');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
