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

 const measurements=await page.evaluate(async()=>{
  auditSeed('dm');
  const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=960;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height);let random=17;
  for(let i=0;i<pixels.data.length;i+=4){random=(Math.imul(random,1664525)+1013904223)>>>0;pixels.data[i]=random&255;pixels.data[i+1]=(random>>>8)&255;pixels.data[i+2]=(random>>>16)&255;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
  const original=await new Promise(resolve=>canvas.toBlob(resolve,'image/png')),originalBytes=await original.arrayBuffer();let uploads=0;
  __DND_VAULT_DEPS__.getBlob=async()=>original;__DND_VAULT_DEPS__.uploadBytes=async()=>{uploads++};
  window.thumbnailReads=[];const getDoc=__DND_VAULT_DEPS__.getDoc;__DND_VAULT_DEPS__.getDoc=async ref=>{thumbnailReads.push(String(ref));return getDoc(ref)};
  window.thumbnailImages={};const results=[];
  for(const [kind,id,store]of [['world','harbor',CampaignInformation.store],['creature','keeper',CampaignInformation.npcStore]]){
   const image={path:`campaign-journal-images/a/${kind}/${id}/original`,alt:'Harbor at dusk',caption:'The evening coast'};
   await CampaignWorkspace.store.save({campaignId:'a',kind,id,revision:0,input:{title:'Hollow Harbor',summary:'A place by the sea.',content:'A story to read.',privateNotes:'PRIVATE SECRET',data:{category:kind==='world'?'Location':'Story NPC',journalImage:image}}});
   const prepared=await CampaignJournalImages.preparePublished({campaignId:'a',kind,id,image});
   const published=await store.publish({campaignId:'a',id,sourceRevision:1,includeImage:true,preparedImage:prepared});thumbnailImages[kind]=published.image;
   const thumb=testSheetDocs[`campaigns/a/playerIllustrationThumbnails/${kind}/entries/${id}`],full=testSheetDocs[`campaigns/a/playerIllustrations/${kind}/entries/${id}`];
   if(!published.image.thumbnail||JSON.stringify(published).includes('PRIVATE'))throw Error('Publication snapshot invalid');
   if(thumb.data.length>=full.data.length||thumb.data.length>88000)throw Error('Thumbnail transfer not reduced');
   const blob=await CampaignJournalImages.publishedBlob({campaignId:'a',kind,id,image:published.image,thumbnail:true}),bitmap=await createImageBitmap(blob);if(Math.max(bitmap.width,bitmap.height)>640)throw Error('Thumbnail oversized');bitmap.close();
   results.push({kind,readerBytes:atob(full.data).length,cardBytes:blob.size});
  }
  if(uploads!==0||original.size!==originalBytes.byteLength)throw Error('Private original modified');
  return results;
 });
 console.log('Measured deterministic textured fixture:',JSON.stringify(measurements));
 await page.evaluate(()=>{auditSeed('player');thumbnailReads=[];showTab('campaign-information')});
 await page.waitForFunction(()=>document.querySelector('.world-post-card img')?.naturalWidth>0);
 assert.ok(await page.evaluate(()=>thumbnailReads.some(p=>p.includes('/playerIllustrationThumbnails/'))));assert.equal(await page.evaluate(()=>thumbnailReads.some(p=>p.includes('/playerIllustrations/'))),false,'overview does not download the full illustration');
 await page.evaluate(()=>thumbnailReads=[]);await page.locator('[data-read-world=harbor]').click();await page.waitForFunction(()=>document.querySelector('.world-reader-image img')?.naturalWidth>0);
 assert.ok(await page.evaluate(()=>thumbnailReads.some(p=>p.includes('/playerIllustrations/'))));assert.equal(await page.evaluate(()=>thumbnailReads.some(p=>p.includes('/playerIllustrationThumbnails/'))),false,'reader loads full image directly');
 assert.equal(await page.locator('.world-reader-image img').getAttribute('alt'),'Harbor at dusk');assert.equal(await page.locator('.world-reader-image figcaption').textContent(),'The evening coast');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const violations=await page.evaluate(async()=>(await axe.run('.world-post-reader',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);await page.screenshot({path:out+'/thumbnail-world-reader-'+width+'.png',fullPage:true});}
 await page.evaluate(()=>showTab('campaign-npcs'));await page.waitForFunction(()=>document.querySelector('.campaign-information-grid img')?.naturalWidth>0);
 await page.evaluate(()=>thumbnailReads=[]);await page.locator('[data-read-npc=keeper]').click();await page.waitForFunction(()=>document.querySelector('[data-shared-image] img')?.naturalWidth>0);assert.ok(await page.evaluate(()=>thumbnailReads.some(p=>p.includes('/playerIllustrations/creature/'))));
 await page.evaluate(async()=>{
  const kind='world',id='harbor',image=thumbnailImages.world,key=`campaigns/a/playerIllustrationThumbnails/${kind}/entries/${id}`,saved=structuredClone(testSheetDocs[key]);
  for(const variant of [null,{...saved,path:saved.path+'wrong'},{...saved,data:'not!base64'},{...saved,data:btoa('not an image')},{...saved,contentType:'text/html'}]){
   if(variant)testSheetDocs[key]=variant;else delete testSheetDocs[key];thumbnailReads=[];
   const blob=await CampaignJournalImages.publishedBlob({campaignId:'a',kind,id,image,thumbnail:true});if(blob.size!==atob(testSheetDocs['campaigns/a/playerIllustrations/world/entries/harbor'].data).length)throw Error('Fallback failed');
   if(thumbnailReads.length!==2)throw Error('Fallback read count invalid');
  }
  testSheetDocs[key]=saved;thumbnailReads=[];const legacy={...image};delete legacy.thumbnail;
  await CampaignJournalImages.publishedBlob({campaignId:'a',kind,id,image:legacy,thumbnail:true});if(thumbnailReads.length!==1||thumbnailReads[0].includes('Thumbnails'))throw Error('Legacy made an extra read');
  const sdk=__DND_VAULT_DEPS__,getDoc=sdk.getDoc;sdk.getDoc=async ref=>{if(String(ref).includes('Thumbnails'))throw Error('Permission denied');return getDoc(ref)};
  await CampaignJournalImages.publishedBlob({campaignId:'a',kind,id,image,thumbnail:true});sdk.getDoc=getDoc;
  let active=true;sdk.getDoc=async ref=>{const result=await getDoc(ref);active=false;return result};thumbnailReads=[];
  try{await CampaignJournalImages.publishedBlob({campaignId:'a',kind,id,image,thumbnail:true,isCurrent:()=>active});throw Error('Expected cancelled image');}catch(error){if(error.message!=='Campaign access changed.')throw error}finally{sdk.getDoc=getDoc}
  if(thumbnailReads.length!==1)throw Error('Revoked thumbnail triggered extra fallback');
 });
 assert.deepEqual(errors,[]);console.log('PASS Real World/NPC encoding, atomic publication, smaller card transfers, full readers, mobile, legacy/damaged/denied fallback and access cancellation');
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
