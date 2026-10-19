// Real browser integration against a deterministic Firebase fixture; never touches production.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error('Browser error:',error.message)});
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style>'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'</style>':'');
 await page.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://fixture.example.test/');
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=()=>{};window.confirm=()=>true;window.prompt=()=> 'Old Bridge'},JSON.parse(fs.readFileSync(path.join(root,'data/rules/catalog.json'),'utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:path.join(__dirname,file)});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__;deps.where=(field,op,value)=>({field,op,value});deps.query=(path,...filters)=>({path,filters});deps.getDocs=async query=>{const p=typeof query==='string'?query:query.path,filters=query.filters||[];return {docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&key.slice(p.length+1).indexOf('/')<0&&filters.every(f=>{const value=f.field.split('.').reduce((d,k)=>d?.[k],data);return f.op==='array-contains'?value?.includes(f.value):value===f.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};deps.ref=(_,p)=>p;deps.uploadBytes=async(p)=>{window.lastUpload=p};deps.getBlob=async()=>new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0))],{type:'image/png'})});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__;deps.doc=(base,...parts)=>[...(typeof base==='string'?[base]:[]),...parts].join('/');deps.setDoc=async(path,data)=>{testSheetDocs[path]=structuredClone(data)};deps.updateDoc=async(path,data)=>{testSheetDocs[path]={...testSheetDocs[path],...structuredClone(data)}}});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__,getDocs=deps.getDocs;deps.getDocs=async query=>{if((typeof query==='string'?query:query.path)==='campaigns/a/creatures'&&window.pauseCreatureList){window.pauseCreatureList=false;await new Promise(resolve=>window.finishCreatureList=resolve)};return getDocs(query)}});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=fs.readFileSync(path.join(__dirname,'dom.cjs'),'utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1];
 for(const name of JSON.parse(modules.replaceAll("'",'"')))await page.addScriptTag({path:path.join(root,'js/modules',name+'.js')});
 await page.evaluate(()=>CharacterCatalog.set(window.__testCatalog));await page.addScriptTag({path:path.join(__dirname,'dom-state.js')});
 await page.evaluate(monsters=>{window.__testMonsters=monsters;window.fetch=async url=>({ok:true,json:async()=>String(url).includes('monsters.json')?window.__testMonsters:window.__testCatalog})},JSON.parse(fs.readFileSync(path.join(root,'data/rules/monsters.json'),'utf8')));

 const assert=require('node:assert/strict');
 await page.evaluate(()=>{seed('dm');activeCampaign.allowedEditions=['2014'];showTab('dm-creatures')});
 await page.waitForFunction(()=>CampaignWorkspace.session?.rowsLoaded);
 await page.locator('[data-new-record]').click();await page.locator('[name=title]').fill('My unsaved NPC');
 const original=await page.evaluate(()=>JSON.stringify(window.__testMonsters));
 await page.locator('[data-workspace-catalog]').click();await page.waitForSelector('[data-select-monster]');
 await page.locator('[data-catalog-search]').fill('Goblin');await page.locator('[data-select-monster="srd-2014-goblin"]').check();
 await page.locator('[data-catalog-search]').fill('Wolf');await page.locator('[data-select-monster="srd-2014-wolf"]').check();
 assert.equal(await page.locator('[data-catalog-import-selected]').textContent(),'Import selected (2)');
 await page.locator('[data-catalog-search]').fill('Goblin');assert.equal(await page.locator('[data-select-monster="srd-2014-goblin"]').isChecked(),true);
 await page.evaluate(()=>{const original=CampaignWorkspace.store.save;window.normalWorkspaceSave=original;let calls=0;CampaignWorkspace.store.save=async args=>{if(++calls===2)throw Error('Synthetic interrupted import');return original(args);};});
 await page.locator('[data-catalog-import-selected]').click();await page.waitForFunction(()=>document.querySelector('[data-catalog-status]').textContent.includes('Import stopped'));
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).filter(key=>/^campaigns\/a\/creatures\/[^/]+$/.test(key)).length),1);
 assert.equal(await page.locator('[data-catalog-import-selected]').textContent(),'Import selected (1)');
 await page.evaluate(()=>CampaignWorkspace.store.save=window.normalWorkspaceSave);
 await page.locator('[data-catalog-import-selected]').click();await page.waitForFunction(()=>document.querySelector('[data-catalog-status]').textContent.includes('Nothing was shared'));
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).filter(key=>/^campaigns\/a\/creatures\/[^/]+$/.test(key)).length),2);
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).some(key=>key.includes('/playerNPCs/'))),false);
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__testMonsters)),original);
 await page.locator('[data-close-catalog]').click();assert.equal(await page.locator('[name=title]').inputValue(),'My unsaved NPC');assert.equal(await page.evaluate(()=>CampaignWorkspace.session.dirty),true);
 console.log('PASS Selection survives filters; partial imports retry without duplicates, keep the current draft and never reveal stat blocks');

 // A transaction may commit while its response is lost. Its fixed destination ID
 // is loaded and matched before the operation is acknowledged as a success.
 await page.locator('[data-workspace-catalog]').click();await page.waitForSelector('[data-select-monster]');
 await page.locator('[data-catalog-search]').fill('Owl');await page.locator('[data-select-monster="srd-2014-owl"]').check();
 await page.evaluate(()=>{CampaignWorkspace.store.save=async args=>{await normalWorkspaceSave(args);throw Error('Synthetic lost acknowledgement');};});
 await page.locator('[data-catalog-import-selected]').click();await page.waitForFunction(()=>document.querySelector('[data-catalog-status]').textContent.includes('Nothing was shared'));
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).filter(key=>/^campaigns\/a\/creatures\/[^/]+$/.test(key)).length),3);
 await page.evaluate(()=>CampaignWorkspace.store.save=normalWorkspaceSave);
 await page.locator('[data-catalog-search]').fill('');await page.locator('[data-catalog-select-visible]').click();
 assert.equal(await page.locator('[data-catalog-import-selected]').textContent(),'Import selected (100)');
 await page.locator('[data-catalog-search]').fill('Dragon');await page.locator('[data-catalog-select-visible]').click();
 assert.equal(await page.locator('[data-catalog-import-selected]').textContent(),'Import selected (100)');
 await page.locator('[data-catalog-clear]').click();assert.equal(await page.locator('[data-catalog-import-selected]').isDisabled(),true);
 await page.setViewportSize({width:390,height:844});await page.addScriptTag({content:require('axe-core').source});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual((await page.evaluate(async()=>(await axe.run('#workspaceMonsterCatalog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations)).map(row=>row.id),[]);
 console.log('PASS Lost acknowledgement is recovered safely; selection is capped at 100 and the picker fits mobile with accessible checkboxes');
 await page.locator('[data-close-catalog]').click();await page.setViewportSize({width:1440,height:1000});

 // Reveal a Story NPC after import. Combat and preparation remain on DM records.
 await page.locator('[data-open-record]').filter({hasText:'Goblin'}).click();await page.waitForFunction(()=>!CampaignWorkspace.session.dirty);
 await page.locator('[data-record-field=category]').selectOption('Story NPC');
 await page.locator('[name=content]').fill('A friendly guide who knows the forest.');await page.locator('[name=privateNotes]').fill('PRIVATE: secretly follows the party.');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===2);
 await page.locator('[data-publish-npc]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent.includes('Shared with campaign'));
 const publication=await page.evaluate(()=>Object.entries(testSheetDocs).find(([key])=>key.includes('/playerNPCs/'))?.[1]);
 assert.equal(publication.content,'A friendly guide who knows the forest.');
 for(const key of ['data','hp','ac','privateNotes','actions','source'])assert.equal(publication[key],undefined);
 assert.doesNotMatch(JSON.stringify(publication),/secretly follows/);
 console.log('PASS An imported NPC can share its introduction while its stat block and private notes remain DM-only');

 // Revoke context before the pending transaction starts; no new campaign gets
 // any writes and the remainder of the batch is stopped.
 await page.locator('[data-workspace-catalog]').click();await page.waitForSelector('[data-select-monster]');
 await page.locator('[data-catalog-search]').fill('Rat');await page.locator('[data-select-monster="srd-2014-rat"]').check();
 const before=await page.evaluate(()=>Object.keys(testSheetDocs).filter(key=>/^campaigns\/a\/creatures\/[^/]+$/.test(key)).length);
 await page.evaluate(()=>{CampaignWorkspace.store.save=async args=>{await new Promise(resolve=>window.resumeBulkSave=resolve);return normalWorkspaceSave(args);};});
 await page.locator('[data-catalog-import-selected]').click();await page.waitForFunction(()=>!!window.resumeBulkSave);
 await page.evaluate(()=>{activeCampaign={...activeCampaign,id:'b'};resumeBulkSave();});
 await page.waitForFunction(()=>!CampaignWorkspace.session.busy);
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).filter(key=>/^campaigns\/a\/creatures\/[^/]+$/.test(key)).length),before);
 assert.equal(await page.evaluate(()=>Object.keys(testSheetDocs).some(key=>key.startsWith('campaigns/b/creatures/'))),false);
 assert.deepEqual(errors,[]);
 console.log('PASS Campaign changes stop pending imports before writes');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
