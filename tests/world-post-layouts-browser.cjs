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

 await page.locator('[data-read-world=harbor]').click();await page.waitForFunction(()=>document.querySelector('.world-reader-image img')?.naturalWidth>0);
 assert.equal(await page.locator('.world-post-reader').getAttribute('data-post-layout'),'split','legacy posts get the wider default');
 assert.ok((await page.locator('.world-post-reader').boundingBox()).width>1100,'the reader uses the available desktop width');
 await page.locator('[data-world-edit]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.id==='harbor');await page.waitForFunction(()=>document.querySelector('[data-journal-image-preview] img')?.naturalWidth>0);
 for(const layout of ['split','reverse','panorama','classic']){
  await page.locator(`[data-world-layout=${layout}]`).click();assert.equal(await page.locator(`[data-world-layout=${layout}]`).getAttribute('aria-pressed'),'true');
  if(layout==='split')await page.locator('.world-layout-picker').screenshot({path:out+'/world-layout-picker.png'});
  await page.locator('[data-world-layout-preview]').click();assert.equal(await page.locator('.world-layout-preview').getAttribute('data-post-layout'),layout);await page.waitForFunction(()=>document.querySelector('.world-layout-preview img')?.naturalWidth>0);
  assert.ok(!(await page.locator('.world-layout-preview').textContent()).includes('lost crown'));
  const before=await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].postLayout);
  await page.locator('[data-save-record]').click();await page.waitForFunction(()=>!CampaignWorkspace.session.busy&&!CampaignWorkspace.session.dirty);
  assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].postLayout),before,'saving a layout remains private');
  assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/worldEntries/harbor'].data.postLayout),layout);
  await page.locator('[data-publish-entry]').click();await page.waitForFunction(()=>document.querySelector('[data-sharing-status]').textContent==='Published to players.');
  assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].postLayout),layout);
  assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/faith'].postLayout),undefined,'each entry keeps its own design');
  await page.evaluate(()=>showTab('campaign-information'));await page.waitForSelector('.world-post-reader');await page.waitForFunction(()=>document.querySelector('.world-reader-image img')?.naturalWidth>0);
  assert.equal(await page.locator('.world-post-reader').getAttribute('data-post-layout'),layout);
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:1000});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const art=await page.locator('.world-reader-image').boundingBox(),copy=await page.locator('.world-post-copy').boundingBox();
   if(width===1440&&['split','reverse'].includes(layout)){assert.ok(Math.abs(art.y-copy.y)<2,'text and illustration sit side by side');assert.ok(layout==='split'?copy.x<art.x:art.x<copy.x);}else assert.ok(art.y+art.height<=copy.y,'the stacked design keeps the illustration above the article');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(await page.evaluate(async()=>(await axe.run('#tab-campaign-information',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)),[]);
   if(width!==320){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/world-layout-'+layout+'-'+width+'.png',fullPage:true});}
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-world-edit]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.id==='harbor');
 }
 await page.locator('[data-world-layout=reverse]').click();await page.evaluate(()=>failJournalWrite=true);await page.locator('[data-save-record]').click();await page.waitForFunction(()=>!CampaignWorkspace.session.busy);assert.match(await page.locator('[data-workspace-status]').textContent(),/Could not save/);assert.equal(await page.locator('[data-world-layout=reverse]').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/worldEntries/harbor'].data.postLayout),'classic');assert.equal(await page.evaluate(()=>testSheetDocs['campaigns/a/playerInformation/harbor'].postLayout),'classic');
 await page.evaluate(()=>{failJournalWrite=false;CampaignWorkspace.clear(true);auditSeed('player');__DND_VAULT_DEPS__.getBlob=async()=>{throw Error('Private image denied')};showTab('campaign-information')});await page.waitForSelector('[data-read-world=harbor]');await page.locator('[data-read-world=harbor]').click();await page.waitForFunction(()=>document.querySelector('.world-reader-image img')?.naturalWidth>0);assert.equal(await page.locator('[data-world-edit],[data-world-layout]').count(),0);assert.equal(await page.locator('.world-post-reader').getAttribute('data-post-layout'),'classic');
 await page.locator('[data-world-back]').click();await page.locator('[data-read-world=faith]').click();assert.equal(await page.locator('.world-reader-image').count(),0);assert.equal(await page.locator('.world-post-no-image').count(),1);assert.ok((await page.locator('.world-post-copy').boundingBox()).width>700);
 await page.evaluate(()=>{testSheetDocs['campaigns/a/playerInformation/faith'].postLayout='<script>unsafe()</script>';CampaignInformation.render('world')});await page.waitForSelector('.world-post-reader');assert.equal(await page.locator('.world-post-reader').getAttribute('data-post-layout'),'split');
 assert.deepEqual(errors,[]);console.log('PASS Four per-post World layouts: wide legacy default, real previews, save/reopen/publish, private draft designs, failed-save recovery, per-post independence, player boundaries, whole illustrations, no-image/unknown fallback and desktop/mobile/WCAG');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
