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


 await page.evaluate(()=>{
  auditSeed('dm');const base={...items[0],category:'Wand',rarity:'Rare',source:'Harbor Collection',classes:['Wizard'],properties:[{title:'Tide call',text:'Summons a wave of healing water'}]};items=[{...base,id:'wand',name:'Harbor Wand',description:'An old sea charm.'},{...base,id:'ring',name:'Ring of Mist',category:'Ring',rarity:'Common',classes:[],properties:[],description:'A silver band.'},{...base,id:'hidden-artifact',name:'SECRET artifact',visible:false}];showTab('library');renderCards();
 });
 await page.locator('#search').fill('water wizard');await page.waitForFunction(()=>document.querySelectorAll('#card-container .item-card').length===2);
 assert.match(await page.locator('#campaignStats').textContent(),/2 of 3 items/);
 assert.equal(await page.locator('[data-remove-library-filter=search]').count(),1);
 await page.locator('#tab-library .filter-panel > summary').click();await page.locator('#rarityFilter').selectOption('Rare');await page.locator('#categoryFilter').selectOption('Wand');
 assert.equal(await page.locator('#libraryActiveFilters button').count(),3);
 await page.locator('[data-remove-library-filter=rarityFilter]').click();assert.equal(await page.locator('#rarityFilter').inputValue(),'');assert.equal(await page.locator('#search').inputValue(),'water wizard');
 await page.locator('#showLootedOnly').check();await page.locator('#showUnlootedOnly').check();assert.equal(await page.locator('#showLootedOnly').isChecked(),false);
 await page.locator('#search').fill('nothing matches');await page.waitForSelector('.library-empty');assert.ok(await page.locator('[data-clear-library-filters]').isVisible());
 await page.locator('[data-clear-library-filters]').click();assert.equal(await page.locator('#card-container .item-card').count(),3);assert.equal(await page.locator('#libraryActiveFilters').isVisible(),false);assert.equal(await page.locator('#search').evaluate(n=>n===document.activeElement),true);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const violations=await page.evaluate(async()=>(await axe.run('#tab-library',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));assert.deepEqual(violations,[]);}
 await page.evaluate(()=>{items=[];renderCards()});await page.locator('[data-open-library-dm]').click();assert.equal(await page.locator('#libraryDMTools').evaluate(n=>n.open),true);
 await page.evaluate(()=>{auditSeed('player');items=items.filter(i=>i.visible);showTab('library');renderCards()});assert.match(await page.locator('#campaignStats').textContent(),/2 of 2 items/);assert.ok(!(await page.locator('#tab-library').textContent()).includes('SECRET artifact'));
 // Re-rendering must observe current inventory, saves and visibility rather than retaining a prior render's indexes.
 const firstItem=await page.evaluate(()=>{selectedCharacter=characters.find(c=>c.userId===auth.currentUser.uid)||{id:'p1'};const item=items[0];inventory=[{itemId:item.id,characterId:selectedCharacter.id,userId:auth.currentUser.uid,quantity:2}];saves=[{itemId:item.id,characterId:selectedCharacter.id,userId:auth.currentUser.uid}];renderCards();return item.id});
 const itemCard=page.locator('#card-container .item-card').filter({has:page.locator('.save-item-button')}).filter({hasText:'You own: 2'});
 assert.equal(await itemCard.count(),1);assert.match(await itemCard.locator('.save-item-button').textContent(),/Saved/);
 await page.evaluate(()=>{inventory=[];saves=[];renderCards()});
 assert.equal(await page.locator('#card-container .inventory-quantity').count(),0);assert.equal(await page.locator('#card-container .save-item-button').filter({hasText:'★ Saved'}).count(),0);
 await page.evaluate(id=>{items.find(item=>item.id===id).visible=false;renderCards()},firstItem);
 assert.equal(await page.locator('#card-container .item-card').count(),1,'updated player visibility applies on the next render');
 await page.evaluate(()=>{items=[];renderCards()});assert.equal(await page.locator('[data-open-library-dm]').count(),0);assert.match(await page.locator('.library-empty').textContent(),/Your DM can share/);

 // Large catalogue pages bound DOM work while filtering/counting the full permitted list.
 await page.evaluate(()=>{
  auditSeed('dm');showTab('library');window.seedLibraryPages=()=>{const base={...items[0],category:'Wand',rarity:'Rare',source:'Harbor Collection',classes:[],properties:[],lootMode:'dm',description:'A charm from the harbor.'};items=Array.from({length:120},(_,i)=>({...base,id:'page-'+i,name:i<5?'SECRET page '+i:i===119?'Needle at the end':'Harbor item '+String(i).padStart(3,'0'),visible:i>=5}));inventory=[];saves=[];campaignSupply={};};seedLibraryPages();clearLibraryFilters();
 });
 const topPages=page.locator('[data-library-pagination]').first(),bottomPages=page.locator('[data-library-pagination]').last();
 const firstName=()=>page.locator('#card-container .item-name').first().textContent();
 const sourceBefore=await page.evaluate(()=>JSON.stringify(testSheetDocs));
 assert.equal(await page.locator('#card-container .item-card').count(),48);assert.match(await topPages.textContent(),/Items 1–48 of 120/);assert.ok(await topPages.locator('[data-library-page="-1"]').isDisabled());
 await topPages.locator('[data-library-page="1"]').click();assert.equal(await firstName(),'Harbor item 048');assert.match(await topPages.textContent(),/Items 49–96 of 120/);
 assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('.library-page-summary')),true);
 await page.evaluate(()=>renderCards());assert.equal(await firstName(),'Harbor item 048','data refresh preserves the page');
 await bottomPages.locator('[data-library-page="1"]').click();assert.equal(await page.locator('#card-container .item-card').count(),24);assert.match(await topPages.textContent(),/Items 97–120 of 120/);assert.ok(await topPages.locator('[data-library-page="1"]').isDisabled());
 await topPages.locator('[data-library-page="-1"]').click();assert.equal(await firstName(),'Harbor item 048');
 await page.locator('#search').fill('needle');await page.waitForFunction(()=>document.querySelectorAll('#card-container .item-card').length===1);assert.equal(await firstName(),'Needle at the end');assert.ok(await topPages.isHidden());assert.match(await page.locator('#campaignStats').textContent(),/1 of 120 items/);
 await page.locator('[data-remove-library-filter=search]').click();assert.match(await topPages.textContent(),/Items 1–48 of 120/);
 await topPages.locator('[data-library-page="1"]').click();await topPages.locator('[data-library-page="1"]').click();
 await page.evaluate(()=>{items=items.slice(0,60);renderCards()});assert.equal(await page.locator('#card-container .item-card').count(),12);assert.match(await topPages.textContent(),/Items 49–60 of 60/);
 await page.evaluate(()=>{seedLibraryPages();clearLibraryFilters()});assert.match(await topPages.textContent(),/Items 1–48 of 120/,'clearing unchanged filters also returns to the first page');
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('#tab-library',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
  await topPages.scrollIntoViewIfNeeded();await page.screenshot({path:out+'/library-pages-'+width+'.png',fullPage:false});
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(testSheetDocs)),sourceBefore,'paging and filtering do not write campaign data');
 await page.evaluate(()=>{auditSeed('player');showTab('library');seedLibraryPages();clearLibraryFilters()});assert.match(await topPages.textContent(),/Items 1–48 of 115/);assert.ok(!(await page.locator('#card-container').textContent()).includes('SECRET'));assert.match(await page.locator('#campaignStats').textContent(),/115 of 115 items/);
 await topPages.locator('[data-library-page="1"]').click();assert.equal(await page.locator('#card-container .item-card').count(),48);assert.ok(!(await page.locator('#card-container').textContent()).includes('SECRET'));
 // Account/campaign changes must not inherit an old result-page offset.
 await page.evaluate(()=>{activeCampaign={...activeCampaign,id:'page-other-campaign'};renderCards()});assert.match(await topPages.textContent(),/Items 1–48 of 115/);
 await topPages.locator('[data-library-page="1"]').click();await page.evaluate(()=>{auth.currentUser={...auth.currentUser,uid:'page-other-user'};renderCards()});assert.match(await topPages.textContent(),/Items 1–48 of 115/);
 await page.evaluate(()=>{magicItemLibraryLoaded=false;renderCards()});assert.ok(await topPages.isHidden());assert.ok(await bottomPages.isHidden());
 console.log('PASS Bounded item pages, full-list search/counts, refresh retention, shrinking results, account/campaign reset, source privacy, keyboard focus and desktop/mobile WCAG');
 await page.evaluate(async()=>{auditSeed('dm');const d=__DND_VAULT_DEPS__;d.doc=(parent,...parts)=>[...(typeof parent==='string'?[parent]:[]),...parts].join('/');d.setDoc=async(p,v)=>{testSheetDocs[p]=structuredClone(v)};await PersonalCreatureLibrary.add({title:'Harbor Keeper',summary:'A friendly watch captain.',content:'A reusable introduction.\n\nA second paragraph.',data:{category:'Story NPC'}});await PersonalCreatureLibrary.add({title:'Tide Beast',summary:'A creature from the deep harbor.',content:'A monster that guards the shoals.',data:{category:'Monster',creatureType:'Beast',combatEnabled:true,ac:15,hp:42,cr:'2',edition:'2024'}});showTab('library-reusable')});
 await page.waitForFunction(()=>document.querySelectorAll('[data-use-template]').length===2);
 await page.locator('[data-template-search]').fill('deep beast');await page.locator('[data-template-category]').selectOption('Monster');assert.equal(await page.locator('[data-use-template]').count(),1);
 await page.locator('[data-template-list] summary').click();assert.equal(await page.locator('[data-template-list] details').evaluate(n=>n.open),true,'click opens the template preview');assert.match(await page.locator('.template-preview-stats').textContent(),/42/);assert.match(await page.locator('.template-preview-kind').textContent(),/2024/);
 const before=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(testSheetDocs).filter(([p])=>p.includes('creatureTemplates')))));
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const violations=await page.evaluate(async()=>(await axe.run('#tab-library-reusable',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));assert.deepEqual(violations,[]);}
 assert.equal(await page.locator('[data-template-list] details').evaluate(n=>n.open),true,'preview remains open before leaving Library');
 await page.evaluate(()=>showTab('library'));await page.evaluate(()=>showTab('library-reusable'));await page.waitForFunction(()=>document.querySelectorAll('[data-use-template]').length===1);assert.equal(await page.locator('[data-template-search]').inputValue(),'deep beast');assert.equal(await page.locator('[data-template-category]').inputValue(),'Monster');assert.equal(await page.locator('[data-template-list] details').evaluate(n=>n.open),true);
 await page.locator('[data-template-reset]').click();assert.equal(await page.locator('[data-use-template]').count(),2);
 await page.locator('[data-template-search]').fill('missing');assert.equal(await page.locator('[data-use-template]').count(),0);assert.match(await page.locator('[data-template-list]').textContent(),/No templates match/);await page.locator('[data-template-reset]').click();
 await page.locator('[data-template-list] details').filter({hasText:'Tide Beast'}).locator('summary').click();
 // Opening state may already be restored; use the disclosure's real visible import action.
 const detail=page.locator('[data-template-list] details').filter({hasText:'Tide Beast'});if(!await detail.evaluate(n=>n.open))await detail.locator('summary').click();await detail.locator('[data-use-template]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.dirty&&CampaignWorkspace.session.record.title==='Tide Beast');
 assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.revision),0);assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(testSheetDocs).filter(([p])=>p.includes('creatureTemplates'))))),before);
 await page.evaluate(()=>{CampaignWorkspace.clear(true);auditSeed('other');activeMembershipRole='dm';showTab('library-reusable')});await page.waitForFunction(()=>document.querySelector('[data-template-status]')?.textContent==='0 of 0 saved templates');assert.equal(await page.locator('[data-template-search]').inputValue(),'');
 assert.deepEqual(errors,[]);console.log('PASS Multi-term item/property/class search, active filters, reset, mutually exclusive statuses, permitted counts, empty states, reusable category/preview/filter retention, independent imports, account isolation and responsive/WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
