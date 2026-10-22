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
  auditSeed('player');window.pictureCalls=[];window.pictureActive=0;window.pictureMax=0;window.pausePictures=false;window.releasePictures=[];
  const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;canvas.getContext('2d').fillRect(0,0,8,8);window.pictureBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  CampaignJournalImages.publishedBlob=async args=>{pictureCalls.push(args.id);pictureActive++;pictureMax=Math.max(pictureMax,pictureActive);try{if(pausePictures)await new Promise(resolve=>releasePictures.push(resolve));return pictureBlob;}finally{pictureActive--;}};
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);window.livePictureUrls=new Set();
  URL.createObjectURL=blob=>{const url=create(blob);livePictureUrls.add(url);return url};URL.revokeObjectURL=url=>{livePictureUrls.delete(url);revoke(url)};
  for(const [kind,collection,title] of [['world','playerInformation','Place'],['creature','playerNPCs','Person']])for(let n=0;n<24;n++){
   const id='entry'+String(n).padStart(2,'0');testSheetDocs['campaigns/a/'+collection+'/'+id]={title:title+' '+String(n).padStart(2,'0'),summary:'An introduction for players.',content:'The full published article.',category:kind==='world'?'Location':'Story NPC',revision:1,sourceRevision:1,updatedBy:'dm',updatedAt:1,image:{path:'campaign-journal-images/a/'+kind+'/'+id+'/photo',alt:title+' illustration',caption:'Published illustration.'}};
  }
 });
 const measurements=[];
 for(const width of [1440,390])for(const tab of ['campaign-information','campaign-npcs']){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(tab=>{CampaignInformation.onAccountChanged('player');pictureCalls=[];pictureMax=0;scrollTo(0,0);showTab(tab)},tab);
  await page.waitForSelector('.campaign-reference-card');await page.waitForFunction(()=>pictureCalls.length>0&&pictureActive===0);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const initial=await page.evaluate(()=>pictureCalls.length);assert.ok(initial>0&&initial<24,'Offscreen images must not all load');
  assert.equal(await page.locator('[data-shared-image=entry23] img').count(),0);
  measurements.push({width,tab,initial,total:24});
  await page.locator('[data-shared-image=entry23]').scrollIntoViewIfNeeded();await page.waitForSelector('[data-shared-image=entry23] img');
  const hook=tab==='campaign-information'?'world':'npc';await page.locator('[data-read-'+hook+'=entry23]').focus();await page.keyboard.press('Enter');
  await page.waitForSelector('.world-post-reader [data-shared-image=entry23] img');assert.equal(await page.locator('.world-reader-image figcaption').textContent(),'Published illustration.');
  await page.locator('[data-'+hook+'-back]').click();assert.equal(await page.evaluate(hook=>document.activeElement?.getAttribute('data-read-'+hook),hook),'entry23');
  assert.ok(await page.evaluate(()=>pictureMax<=4));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 // Pause all image responses. Scrolling can enqueue more work, but only four reads run.
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>{CampaignInformation.onAccountChanged('player');pausePictures=true;pictureCalls=[];pictureMax=0;scrollTo(0,0);showTab('campaign-information')});
 await page.waitForFunction(()=>pictureActive===4);await page.locator('[data-shared-image=entry23]').scrollIntoViewIfNeeded();
 assert.equal(await page.evaluate(()=>pictureCalls.length),4);assert.equal(await page.evaluate(()=>pictureMax),4);
 // Filtering invalidates both queued work and already requested old illustrations.
 await page.locator('[data-information-search]').fill('Place 23');await page.waitForFunction(()=>releasePictures.length>=5);
 await page.evaluate(()=>{pausePictures=false;releasePictures.splice(0).forEach(resolve=>resolve())});await page.waitForSelector('[data-shared-image=entry23] img');
 assert.equal(await page.locator('[data-shared-image]').count(),1);assert.equal(await page.evaluate(()=>livePictureUrls.size),1);
 // Permission loss must clear URLs and stop deferred offscreen reads.
 await page.evaluate(()=>journalWatchers.filter(w=>w.active&&w.path==='campaigns/a/playerInformation').at(-1).error(Object.assign(Error('Access revoked'),{code:'permission-denied'})));
 assert.equal(await page.locator('[data-shared-image] img').count(),0);assert.equal(await page.evaluate(()=>livePictureUrls.size),0);
 const afterDenial=await page.evaluate(()=>pictureCalls.length);await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));assert.equal(await page.evaluate(()=>pictureCalls.length),afterDenial);
 // Account changes invalidate unresolved reads and disconnect the observer.
 await page.evaluate(()=>{CampaignInformation.onAccountChanged('player');pausePictures=true;pictureCalls=[];scrollTo(0,0);showTab('campaign-information')});await page.waitForFunction(()=>pictureActive>0);
 await page.evaluate(()=>{auth.currentUser={uid:'other'};currentUser={uid:'other',role:['player']};CampaignInformation.onAccountChanged('other');pausePictures=false;releasePictures.splice(0).forEach(resolve=>resolve())});
 await page.waitForFunction(()=>pictureActive===0);assert.equal(await page.locator('[data-shared-image] img').count(),0);assert.equal(await page.evaluate(()=>livePictureUrls.size),0);
 // Browsers without IntersectionObserver retain the authenticated eager fallback.
 await page.evaluate(()=>{auditSeed('player');CampaignInformation.onAccountChanged('player');window.savedObserver=window.IntersectionObserver;delete window.IntersectionObserver;pictureCalls=[];pictureMax=0;showTab('campaign-information')});
 await page.waitForFunction(()=>document.querySelectorAll('[data-shared-image] img').length===24);assert.equal(await page.evaluate(()=>pictureCalls.length),24);assert.ok(await page.evaluate(()=>pictureMax<=4));
 await page.evaluate(()=>{window.IntersectionObserver=savedObserver;CampaignInformation.clear(true)});
 assert.deepEqual(errors,[]);console.log('PASS Viewport-limited World/NPC image reads, scroll/keyboard reader, captions, bounded concurrency, filter generations, revoked access, account changes, URL cleanup and eager fallback');console.log(JSON.stringify(measurements));
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
