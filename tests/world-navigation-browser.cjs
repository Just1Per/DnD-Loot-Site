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


 await page.evaluate(async()=>{
  const sdk=__DND_VAULT_DEPS__;sdk.doc=(parent,...parts)=>[...(typeof parent==='string'?[parent]:[]),...parts].join('/');sdk.setDoc=async(p,d)=>{testSheetDocs[p]=structuredClone(d)};
  auditSeed('dm');
  await CampaignWorkspace.store.save({campaignId:'a',kind:'world',id:'harbor',revision:0,input:{title:'Hollow Harbor',summary:'Where the storm coast meets the old world.',content:'The harbor wakes before the sun. Lanterns sway above the quay as fishing boats return through the morning mist.\n\nBeyond the sea wall, crooked streets climb toward the old lighthouse. Everyone knows a story about its keeper. Few tell the same one twice.',privateNotes:'The keeper hides the lost crown.',data:{category:'Location',journalImage:{path:'campaign-journal-images/a/world/harbor/scene',alt:'The lighthouse and houses above Hollow Harbor',caption:'Hollow Harbor, on the edge of the Storm Coast.'}}}});
  await CampaignInformation.store.publish({campaignId:'a',id:'harbor',sourceRevision:1,includeImage:true});
  for(const [id,title,category,description] of [['faith','The Old Faith','Lore','The sea remembers every promise.'],['watch','The Northern Watch','Faction','Guardians of the roads beyond the harbor.']]){
   await CampaignWorkspace.store.save({campaignId:'a',kind:'world',id,revision:0,input:{title,summary:description,content:description,privateNotes:'Private preparation',data:{category}}});await CampaignInformation.store.publish({campaignId:'a',id,sourceRevision:1});
  }
  // A local illustration fixture, never a production image or request.
  __DND_VAULT_DEPS__.getBlob=async()=>new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 620"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#9eafb0"/><stop offset="1" stop-color="#ded1b4"/></linearGradient><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#879f9c"/><stop offset="1" stop-color="#3d6869"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h1200v620H0z"/><circle cx="885" cy="160" r="70" fill="#eee1be"/><path d="M0 275 120 210 240 270 395 180 520 300 680 230 890 310 1200 215V620H0Z" fill="#7c8980"/><path d="M0 340Q350 290 680 360T1200 300V620H0" fill="url(#sea)"/><path d="M540 620 610 420 750 365 900 280 1200 280V620Z" fill="#706f56"/><path d="m800 370 44-27v-70h64v70l30 22Z" fill="#c4b899"/><path d="m832 273 45-40 45 40" fill="#5b6056"/><path d="M1010 280 1023 140h35l14 140" fill="#e6d6b4"/><path d="M1016 140h49v-25h-49z" fill="#4d6460"/><path d="m1010 115 30-22 31 22" fill="#594a40"/><g stroke="#d4c4a2" stroke-width="3" opacity=".5"><path d="M20 460h280m90 70h185M90 575h270M5 390h205m140 40h160"/></g><path d="m610 430 590-70v40l-604 79Z" fill="#b1a78a"/><g fill="#d1c1a0"><path d="M680 440v-58h54v58zm72-25v-56h60v56zm185-33v-62h48v62z"/></g><g fill="#665348"><path d="m670 382 36-35 37 35zm72-23 40-30 40 30zm185-39 34-29 34 29z"/></g></svg>`],{type:'image/svg+xml'});
  showTab('campaign-information');
 });
 await page.waitForSelector('[data-read-world=harbor]');
 await page.waitForFunction(()=>document.querySelector('[data-shared-image] img')?.complete);
 await page.screenshot({path:out+'/world-list-desktop.png',fullPage:true});
 await page.locator('[data-information-search]').fill('harbor');await page.locator('[data-information-category]').selectOption('Location');
 await page.locator('[data-read-world=harbor]').click();
 assert.equal(await page.locator('.world-post-reader .campaign-book-prose p').count(),2);
 assert.equal(await page.locator('.world-post-reader img').count(),1);
 assert.equal(await page.locator('.world-reader-image figcaption').textContent(),'Hollow Harbor, on the edge of the Storm Coast.');
 assert.ok(!(await page.locator('.world-post-reader').textContent()).includes('lost crown'));
 await page.waitForFunction(()=>document.querySelector('.world-reader-image img')?.complete);
 await page.screenshot({path:out+'/world-reader-desktop.png',fullPage:true});
 await page.locator('[data-world-edit]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.id==='harbor');
 assert.equal(await page.locator('[name=title]').inputValue(),'Hollow Harbor');
 assert.equal(await page.locator('[data-back-to-world]').count(),1);
 await page.locator('[name=content]').fill('A new public discovery.\n\nThe harbor has a story to tell.');
 await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session.record.revision===2);
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].sourceRevision),1);
 await page.waitForFunction(()=>!document.querySelector('[data-publish-world]').disabled);
 assert.match(await page.locator('[data-release-includes]').textContent(),/image and caption/);
 await page.screenshot({path:out+'/world-editor-desktop.png',fullPage:true});
 await page.locator('[data-publish-world]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent==='Published to players.');
 assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].content),'A new public discovery.\n\nThe harbor has a story to tell.');
 assert.ok(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].image));
 await page.locator('[data-back-to-world]').click();await page.waitForSelector('[data-read-world=harbor]');
 assert.equal(await page.locator('[data-information-search]').inputValue(),'harbor');assert.equal(await page.locator('[data-information-category]').inputValue(),'Location');
 assert.equal(await page.locator('[data-read-world]').count(),1);
 await page.locator('[data-read-world=harbor]').click();await page.locator('[data-world-back]').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.readWorld),'harbor');
 console.log('PASS World reader shows image, caption and paragraphs; edit opens exact post; draft isolation, combined release, retained filters and return focus');
 await page.evaluate(async()=>{await PersonalCreatureLibrary.add({title:'Harbor keeper',summary:'A quiet guide with an old secret.',content:'A reusable NPC introduction.',data:{category:'Story NPC'}});showTab('library-reusable')});
 await page.waitForSelector('[data-use-template]',{state:'attached'});
 assert.deepEqual(await page.locator('[data-section-group=library] button').allTextContents(),['Items','Reusable content']);
 assert.equal(await page.locator('#primaryNavigation [data-tab=library]').getAttribute('aria-current'),'page');
 assert.equal(await page.evaluate(()=>AppNavigation.read(auth.currentUser.uid).tab),'library-reusable');
 await page.locator('[data-template-search]').fill('unmatched');assert.equal(await page.locator('[data-use-template]').count(),0);await page.locator('[data-template-search]').fill('keeper');
 await page.locator('#tab-library-reusable summary').click();await page.screenshot({path:out+'/library-reusable-desktop.png',fullPage:true});
 await page.locator('[data-use-template]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.dirty&&CampaignWorkspace.session.record.title==='Harbor keeper');
 assert.equal(await page.evaluate(()=>CampaignWorkspace.session.record.revision),0);
 console.log('PASS Library sections show real personal templates; search and Create campaign draft preserve the source and require an explicit save');
 await page.evaluate(()=>{CampaignWorkspace.clear(true);auditSeed('player');showTab('campaign-information')});
 await page.waitForSelector('[data-read-world=harbor]');await page.locator('[data-read-world=harbor]').click();
 assert.equal(await page.locator('[data-world-edit]').count(),0);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const violations=await page.evaluate(async()=>(await axe.run('.campaign-information-shell',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
  if(width===390)await page.screenshot({path:out+'/world-reader-mobile.png',fullPage:true});
 }
 await page.evaluate(()=>showTab('library-reusable'));assert.equal(await page.locator('[data-use-template]').count(),0);assert.ok(!(await page.locator('#tab-library-reusable').textContent()).includes('Harbor keeper'));
 assert.deepEqual(errors,[]);console.log('PASS Player boundaries, desktop/mobile layout and WCAG checks');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
