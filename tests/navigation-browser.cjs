const {navigate}=require('./app-navigation-fixture.cjs');
// Real reloads and navigation against an isolated Firebase fixture, never production.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const html=fs.readFileSync(root+'/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(_tag,href)=>href.startsWith('css/')?'<style>'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'</style>':'');
 await page.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:html}));
 const catalog=JSON.parse(fs.readFileSync(root+'/data/rules/catalog.json','utf8'));
 const modules=JSON.parse(fs.readFileSync(root+'/tests/dom.cjs','utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'",'"'));
 let docs={
  'users/player':{name:'Mira',role:['player']},'users/dm':{name:'Campaign DM',role:['dm']},'users/other':{name:'Another player',role:['player']},
  'users/player/campaigns/a':{status:'active',role:'player'},'users/dm/campaigns/a':{status:'active',role:'dm'},'users/other/campaigns/a':{status:'active',role:'player'},
  'campaigns/a':{name:'Storm Coast',ownerId:'dm',inventoryVersion:2},
  'campaigns/a/members/player':{status:'active',role:'player'},'campaigns/a/members/dm':{status:'active',role:'dm'},'campaigns/a/members/other':{status:'active',role:'player'},
  'campaigns/a/characters/c1':{name:'Thorin',class:'Fighter',level:7,userId:'player',active:true},
  'campaigns/a/characters/c2':{name:'Rook',class:'Rogue',level:3,userId:'player',active:true},
  'campaigns/a/characters/c3':{name:'Elara',class:'Wizard',level:4,userId:'other',active:true}
 };
 async function boot(uid='player',reload=false){
  if(reload)await page.reload();else await page.goto('https://fixture.example.test/');
  await page.evaluate(catalog=>{window.__testCatalog=catalog;window.fetch=async()=>({ok:true,json:async()=>__testCatalog});window.print=()=>{};window.alert=()=>{};window.confirm=()=>true;},catalog);
  for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:root+'/tests/'+file});
  await page.evaluate(()=>{
   const sdk=window.__DND_VAULT_DEPS__,getDoc=sdk.getDoc,transaction=sdk.runTransaction;
   sdk.getDoc=async path=>{if(window.pauseCampaignRead&&path==='campaigns/a'){window.pauseCampaignRead=false;await new Promise(resolve=>window.finishCampaignRead=resolve)}if(path==='campaigns/a'&&testSheetDocs[path]?.ownerId!==auth.currentUser?.uid&&testSheetDocs['campaigns/a/members/'+auth.currentUser?.uid]?.status!=='active')throw Object.assign(Error('Campaign access denied'),{code:'permission-denied'});return{...await getDoc(path),id:path.split('/').at(-1)}};
   sdk.query=(path,...filters)=>({path,filters});sdk.where=(field,op,value)=>({field,op,value});
   sdk.getDocs=async query=>{const p=typeof query==='string'?query:query.path,filters=(query.filters||[]).filter(row=>row?.field);return{docs:Object.entries(testSheetDocs).filter(([key,data])=>key.startsWith(p+'/')&&!key.slice(p.length+1).includes('/')&&filters.every(filter=>{const value=filter.field.split('.').reduce((d,key)=>d?.[key],data);return filter.op==='array-contains'?value?.includes(filter.value):value===filter.value})).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))}};
   sdk.runTransaction=async(db,work)=>{if(window.failNavigationSave)throw Error('Simulated permission denied');return transaction(db,tx=>work({...tx,get:async path=>{if(window.pauseNavigationSave&&path==='campaigns/a/characterSheets/c1'){window.pauseNavigationSave=false;await new Promise(resolve=>window.finishNavigationSave=resolve)}return tx.get(path)}}))};
  });
  await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
  for(const name of modules)await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
  await page.evaluate(()=>{CharacterCatalog.set(__testCatalog);window.actualLoaders={loadCharacters,loadSaves,loadCampaignItems,loadCampaignInventory,loadCampaignSupply};});
  await page.addScriptTag({path:root+'/tests/dom-state.js'});
  await page.evaluate(({uid,docs})=>{Object.assign(window,actualLoaders);testSheetDocs=docs;auth.currentUser={uid,email:uid+'@example.test'};}, {uid,docs});
  await page.evaluate(()=>testAuthCallback(auth.currentUser));
 }
 async function rememberDocs(){docs=await page.evaluate(()=>structuredClone(testSheetDocs));}
 await boot();await page.evaluate(()=>enterCampaign(campaigns[0]));
 await navigate(page,'campaign-npcs');await rememberDocs();await boot('player',true);
 assert.equal(await page.locator('#tab-campaign-npcs').isVisible(),true,'reload should restore campaign/player tab');
 console.log('PASS Real authentication reload restores the campaign and active player tab');

 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');
 await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('A red cloak');
 await page.locator('[data-tab=library]').click();
 assert.equal(await page.locator('#sheetLeaveDialog').isVisible(),true);assert.equal(await page.locator('#tab-character-sheet').isVisible(),true);
 assert.equal(await page.evaluate(()=>AppNavigation.read('player').tab),'character-sheet','blocked navigation must not remember the destination');
 await page.locator('[data-sheet-leave-stay]').click();assert.equal(await page.locator('[name=appearance]').inputValue(),'A red cloak');
 await page.locator('[data-tab=library]').click();await page.locator('[data-sheet-leave-save]').click();
 await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});assert.equal(await page.locator('#tab-library').isVisible(),true);
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/characterSheets/c1'].data.appearance),'A red cloak');
 console.log('PASS Save/stay choices retain edits and only continue after a successful save');

 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();
 await rememberDocs();await boot('player',true);await page.waitForSelector('#characterSheetForm');
 assert.equal(await page.evaluate(()=>sheetSession.characterId),'c1');assert.equal(await page.locator('[data-sheet-tab=story]').getAttribute('aria-selected'),'true');assert.equal(await page.locator('[name=appearance]').inputValue(),'A red cloak');
 const cache=await page.evaluate(()=>sessionStorage.getItem('campaignatlas.navigation.v1.player'));assert.ok(!cache.includes('cloak')&&!cache.includes('appearance'),'navigation cache must not contain editor data');
 await page.locator('[name=appearance]').fill('Unwanted draft');await page.locator('[data-sheet-close]').click();await page.locator('[data-sheet-leave-discard]').click();
 await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});assert.equal(await page.locator('#tab-player').isVisible(),true);assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/characterSheets/c1'].data.appearance),'A red cloak');
 console.log('PASS Reload restores character/section and saved data; discard never saves a draft');

 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('Keep this draft after failure');
 await page.evaluate(()=>window.failNavigationSave=true);await page.locator('[data-tab=campaign-home]').click();await page.locator('[data-sheet-leave-save]').click();
 await page.waitForFunction(()=>document.querySelector('[data-sheet-leave-status]').textContent.includes('permission denied'));assert.equal(await page.locator('#tab-character-sheet').isVisible(),true);assert.equal(await page.locator('[name=appearance]').inputValue(),'Keep this draft after failure');
 await page.evaluate(()=>window.failNavigationSave=false);await page.locator('[data-sheet-leave-save]').click();await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});
 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=builder]').click();await page.locator('[name="identity.name"]').fill('');
 await page.locator('[data-tab=library]').click();await page.locator('[data-sheet-leave-save]').click();await page.waitForFunction(()=>document.querySelector('[data-sheet-leave-status]').textContent.includes('name'));
 assert.equal(await page.locator('#sheetLeaveDialog').isVisible(),true,'invalid sheet must stay open');await page.locator('[data-sheet-leave-stay]').click();await page.locator('[name="identity.name"]').fill('Thorin');
 await page.locator('[data-tab=library]').click();await page.locator('[data-sheet-leave-discard]').click();await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});
 console.log('PASS Save failure/retry and invalid fields cannot close the sheet or lose its draft');

 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('Switching characters draft');
 await page.locator('#characterWorkspacePicker').selectOption('c2');assert.equal(await page.locator('#sheetLeaveDialog').isVisible(),true);await page.locator('[data-sheet-leave-discard]').click();await page.waitForFunction(()=>sheetSession?.characterId==='c2');
 await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('Another draft');await page.locator('#leaveCampaignBtn').click();assert.equal(await page.locator('#sheetLeaveDialog').isVisible(),true);await page.locator('[data-sheet-leave-stay]').click();
 await page.locator('[data-sheet-close]').click();
 await page.addScriptTag({content:require('axe-core').source});const violations=await page.evaluate(async()=> (await axe.run('#sheetLeaveDialog',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);assert.deepEqual(violations.map(row=>row.id),[]);
 for(let i=0;i<8;i++)await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#sheetLeaveDialog')),true);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#sheetLeaveDialog').count(),0);assert.equal(await page.locator('[name=appearance]').inputValue(),'Another draft');
 await page.locator('[data-sheet-close]').click();await page.locator('[data-sheet-leave-discard]').click();await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});
 console.log('PASS Character switching/campaign exit, Escape, focus containment and mobile/axe checks');

 await page.evaluate(()=>CharacterWorkspace.open('c1','character-sheet'));await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('A conflict must preserve this draft');
 await page.evaluate(()=>testSheetDocs['campaigns/a/characterSheets/c1'].revision++);await page.locator('[data-tab=library]').click();await page.locator('[data-sheet-leave-save]').click();
 await page.waitForFunction(()=>document.querySelector('[data-sheet-leave-status]').textContent.includes('another window'));assert.equal(await page.locator('[name=appearance]').inputValue(),'A conflict must preserve this draft');await page.locator('[data-sheet-leave-discard]').click();await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});
 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('A pending save');
 await page.evaluate(()=>window.pauseNavigationSave=true);await page.locator('[data-tab=library]').click();await page.locator('[data-sheet-leave-save]').click();await page.waitForFunction(()=>!!window.finishNavigationSave);
 assert.equal(await page.locator('[data-sheet-leave-stay]').isDisabled(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#sheetLeaveDialog').isVisible(),true);await page.evaluate(()=>window.finishNavigationSave());await page.waitForSelector('#sheetLeaveDialog',{state:'detached'});
 assert.equal(await page.locator('#tab-library').isVisible(),true);
 await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('An old account draft');
 const revision=await page.evaluate(()=>sheetSession.revision);await page.evaluate(()=>{window.finishNavigationSave=null;window.pauseNavigationSave=true});await page.locator('[data-tab=library]').click();await page.locator('[data-sheet-leave-save]').click();await page.waitForFunction(()=>!!window.finishNavigationSave);
 await page.evaluate(async()=>{auth.currentUser={uid:'other',email:'other@example.test'};await testAuthCallback(auth.currentUser);window.finishNavigationSave()});await page.waitForTimeout(100);
 assert.equal(await page.locator('#sheetLeaveDialog').count(),0);assert.equal(await page.locator('#characterSheetDialog').count(),0);assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/characterSheets/c1'].revision),revision,'late save must not write after an account change');
 console.log('PASS Revision conflicts, pending-save blocking and account changes preserve sheet isolation');

 await rememberDocs();await boot('dm');await page.evaluate(()=>enterCampaign(campaigns[0]));await navigate(page,'dm-world');await page.waitForSelector('[data-new-record]');await page.locator('[data-new-record]').click();await page.locator('[name=title]').fill('Saved location');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===1);
 const worldId=await page.evaluate(()=>CampaignWorkspace.session.record.id);await rememberDocs();await boot('dm',true);
 assert.equal(await page.locator('#tab-dm-world').isVisible(),true);assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.id),worldId);assert.equal(await page.locator('[name=title]').inputValue(),'Saved location');
 await navigate(page,'dm-chapters');await page.waitForSelector('[data-chapter-encounters]');await page.locator('[data-chapter-encounters]').click();await rememberDocs();await boot('dm',true);assert.equal(await page.evaluate(()=>CampaignWorkspace.session.kind),'encounter');
 console.log('PASS Reload restores a saved DM entry and the encounter workspace kind');

 await navigate(page,'dm-map');await page.waitForFunction(()=>CampaignMap.session?.ready);await rememberDocs();await boot('dm',true);await page.waitForFunction(()=>CampaignMap.session?.ready);assert.equal(await page.locator('#tab-dm-map').isVisible(),true);assert.equal(await page.evaluate(()=>CampaignMap.session.mode),'dm');assert.equal(await page.locator('#dmWorkspaceSidebar [data-dm-workspace-tab=dm-map]').getAttribute('aria-current'),'page');console.log('PASS Reload restores the dedicated DM map workspace');
 docs['campaigns/a/members/dm'].role='player';docs['campaigns/a'].ownerId='another-owner';await boot('dm',true);assert.equal(await page.locator('#tab-campaign-home').isVisible(),true);assert.equal(await page.locator('#dmPlanningTab-world').isVisible(),false);
 await boot('other',true);assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true,'another UID must not inherit the remembered campaign');
 await page.evaluate(()=>sessionStorage.setItem('campaignatlas.navigation.v1.other',JSON.stringify({version:1,campaignId:'a',tab:'character-sheet',characterId:'c1',sheetTab:'story'})));await boot('other',true);await page.waitForSelector('#characterSheetForm');assert.equal(await page.evaluate(()=>sheetSession.characterId),'c3','tampered character ID must not expose another player sheet');
 docs['campaigns/a/members/other'].status='inactive';await boot('other',true);assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true);assert.equal(await page.locator('#characterSheetDialog').count(),0);
 console.log('PASS Fresh role/membership checks and UID-scoped cache block stale/tampered private routes');
 docs['campaigns/a/members/player'].status='active';await boot('player');await page.locator('#leaveCampaignBtn').click();await page.waitForFunction(()=>activeCampaign===null);await rememberDocs();await boot('player',true);assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true,'explicit exit should stay on the dashboard after reload');
 await page.evaluate(()=>enterCampaign(campaigns[0]));await navigate(page,'character-sheet');await page.waitForSelector('#characterSheetForm');await page.locator('[data-sheet-tab=story]').click();await page.locator('[name=appearance]').fill('Save before logout');await page.locator('#logoutButton').click();await page.locator('[data-sheet-leave-save]').click();await page.waitForFunction(()=>auth.currentUser===null);
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('campaignatlas.navigation.v1.player')),null);assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/characterSheets/c1'].data.appearance),'Save before logout');
 console.log('PASS Explicit campaign exit and save-before-logout clear remembered destinations correctly');
 await page.evaluate(()=>sessionStorage.setItem('campaignatlas.navigation.v1.player','{malformed'));await boot('player',true);assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true);
 await page.evaluate(()=>sessionStorage.setItem('campaignatlas.navigation.v1.player',JSON.stringify({version:1,campaignId:'missing',tab:'library'})));await boot('player',true);assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true);assert.equal(await page.evaluate(()=>AppNavigation.read('player')),null);
 await page.evaluate(()=>{Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new DOMException('Storage disabled','SecurityError')}})});await page.evaluate(()=>enterCampaign(campaigns[0]));await page.locator('[data-tab=library]').click();assert.equal(await page.locator('#tab-library').isVisible(),true);await page.locator('#leaveCampaignBtn').click();assert.equal(await page.locator('#campaignSelectorScreen').isVisible(),true);
 console.log('PASS Invalid/missing remembered destinations and unavailable browser storage leave navigation usable');
 assert.deepEqual(errors,[],'no unexpected browser errors');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
