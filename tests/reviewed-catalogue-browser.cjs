const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true,...process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error('Browser fixture error:',error.message);});
 await page.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><title>Reviewed catalogue fixture</title></head><body><main><h1>Campaign Library</h1><button id="opener">Add shared item</button><div id="rootCatalogueScreen" style="display:none"></div><div id="art"></div></main></body></html>'}));
 await page.goto('https://fixture.example.test/');
 await page.addScriptTag({content:`
 let rootItems=[],catalogVersion=0,currentRole='dm';const auth={currentUser:{uid:'dm'}},db={},storage={},imageCache=new Map(),items=[];
 let activeCampaign={id:'a',inventoryVersion:2};const CATALOG_META_ID='catalog_meta',CATALOG_CACHE_DB='reviewed-test',CATALOG_CACHE_DB_VERSION=1,CATALOG_CACHE_STORE='catalog',CATALOG_CACHE_KEY='master-items-reviewed-v1',PLACEHOLDER_IMAGE='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
 const isAdmin=()=>currentRole==='admin',canManageCampaign=()=>currentRole==='dm'||currentRole==='admin';
 const populateSourceFilter=()=>{},populateCampaignFilter=()=>{},escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const collection=(_,...parts)=>parts.join('/'),doc=collection,where=(field,op,value)=>({field,op,value}),query=(path,...filters)=>({path,filters});
 window.reads=[];window.catalogue=[{id:'yes',name:'Reviewed item',catalogueStatus:'approved-v1',artwork:{status:'none'}},{id:'no',name:'Unreviewed item'}];
 async function getDocs(request){reads.push(request);if(window.pauseRead)await new Promise(resolve=>window.releaseRead=resolve);return {docs:catalogue.filter(item=>typeof request==='string'||request.filters.every(filter=>item[filter.field]===filter.value)).map(item=>({id:item.id,data:()=>item}))};}
 async function getDoc(){return {exists:()=>true,data:()=>({version:7})};}
 const getDownloadURL=async()=>{window.legacyReads=(window.legacyReads||0)+1;return 'https://example.invalid/legacy-art';},ref=(_,p)=>p;
 window.privateReads=[];window.__DND_VAULT_DEPS__={getBlob:async path=>{privateReads.push(path);if(window.pauseBlob)await new Promise(resolve=>window.releaseBlob=resolve);return new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],{type:'image/png'});}};
 const itemsLoadPromise=Promise.resolve(),CampaignRules={allowed:()=>true};window.copies=[];
 async function vaultCall(name,data){copies.push(data);return {itemId:'new'};}function openItemModal(){};
 `});
 for(const name of ['shared-catalogue-policy','images','catalog-cache','data','campaign-items','library'])await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.evaluate(()=>{refreshCampaignData=async()=>{};openItemModal=()=>{};});
 await page.evaluate(async()=>{
  const db=await openCatalogCacheDB();await new Promise((resolve,reject)=>{const tx=db.transaction(CATALOG_CACHE_STORE,'readwrite');tx.objectStore(CATALOG_CACHE_STORE).put({key:catalogAudienceKey(false),version:7,cachedAt:Date.now(),items:catalogue});tx.oncomplete=resolve;tx.onerror=reject;});db.close();
  await loadItemsFromFirestore();
 });
 assert.deepEqual(await page.evaluate(()=>rootItems.map(item=>item.id)),['yes']);
 await page.evaluate(()=>loadItemsFromFirestore({forceRefresh:true}));assert.equal(await page.evaluate(()=>reads.at(-1).filters[0].field),'catalogueStatus');assert.deepEqual(await page.evaluate(()=>rootItems.map(item=>item.id)),['yes']);
 console.log('PASS Old/malicious cache contents cannot expose unreviewed items; fresh reads use the approved-only query');
 await page.evaluate(async()=>{currentRole='admin';auth.currentUser={uid:'admin'};await loadItemsFromFirestore({forceRefresh:true});});assert.equal(await page.evaluate(()=>rootItems.length),2);
 assert.equal(await page.evaluate(()=>readCatalogCache()),null);
 await page.evaluate(()=>{window.pauseRead=true;window.pending=loadItemsFromFirestore({forceRefresh:true});});await page.waitForFunction(()=>!!window.releaseRead);
 await page.evaluate(async()=>{currentRole='dm';auth.currentUser={uid:'dm'};rootItems=[];window.pauseRead=false;releaseRead();await pending;});assert.deepEqual(await page.evaluate(()=>rootItems),[]);
 console.log('PASS Administrator reads remain uncached and late results cannot enter a different account');
 await page.evaluate(()=>{rootItems=structuredClone(catalogue);openRootPicker();});await page.waitForSelector('#rootPicker[open]');assert.equal(await page.locator('[data-root-id]').count(),1);assert.equal(await page.locator('[data-root-id]').getAttribute('data-root-id'),'yes');
 await page.setViewportSize({width:320,height:760});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('[data-root-id="yes"]').check();await page.locator('#addSelectedRoots').click();await page.waitForFunction(()=>copies.length===1&&document.querySelector('#rootPicker').getAttribute('aria-busy')==='false');assert.equal(await page.evaluate(()=>copies[0].sourceId),'yes');await page.locator('#closeRootPicker').click();
 console.log('PASS The DM picker imports only reviewed templates and fits a 320px viewport');
 await page.evaluate(()=>{imageCache.set('yes','https://example.invalid/old-token');document.querySelector('#art').innerHTML=itemImageMarkup(catalogue[0],'card-art');observePendingImages(document);});assert.equal(await page.locator('#art img').getAttribute('src'),await page.evaluate(()=>PLACEHOLDER_IMAGE));assert.equal(await page.evaluate(()=>window.legacyReads||0),0);
 const markup=await page.evaluate(()=>itemAttributionMarkup({rights:{attribution:'<img src=x onerror=alert(1)>',license:'CC-BY-4.0',sourceUrl:'javascript:alert(1)'}}));assert.ok(markup.includes('&lt;img'));assert.ok(!markup.includes('href="javascript:'));assert.ok(markup.includes('creativecommons.org/licenses/by/4.0/'));
 console.log('PASS Cleared artwork cannot reuse cached legacy URLs; attribution renders as safe text with a licence link');
 await page.addStyleTag({path:root+'/css/campaign-controls.css'});
 const credits=await page.evaluate(()=>{
  const notice='Replaced the old catalogue version with the selected licensed SRD description; normalized line endings/literal newline escapes and removed Markdown link/emphasis syntax for plain-text cards. No old quotes or property prose retained. Generated illustrations are preserved separately under the owner instruction.';
  const rights={license:'CC-BY-4.0',sourceUrl:'https://example.com/srd',attribution:'This work includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, available at https://example.com/srd. Licensed under CC BY 4.0. Changes: '+notice};
  const before=JSON.stringify(rights);document.querySelector('#art').className='item-card';document.querySelector('#art').innerHTML=itemAttributionMarkup({rights});return {unchanged:before===JSON.stringify(rights),custom:itemAttributionMarkup({rights:{license:'ORIGINAL',attribution:'Custom author. Changes: Custom explanation.'}}),empty:itemAttributionMarkup({})};
 });
 assert.equal(credits.unchanged,true);assert.equal(credits.empty,'');assert.match(credits.custom,/Changes: Custom explanation/);
 const disclosure=page.locator('#art details'),creditText=disclosure.locator('p'),summary=disclosure.locator('summary');
 assert.equal(await disclosure.evaluate(d=>d.open),false);assert.equal(await creditText.isVisible(),false);assert.equal(await summary.textContent(),'Source & licence');
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await creditText.isVisible(),true);assert.match(await creditText.textContent(),/System Reference Document 5.2/);assert.match(await creditText.textContent(),/Adapted for this catalogue/);assert.doesNotMatch(await creditText.textContent(),/normalized line endings|owner instruction/);assert.equal(await creditText.locator('a').count(),2);
 await page.keyboard.press('Space');assert.equal(await creditText.isVisible(),false);assert.ok((await summary.boundingBox()).height>=44);
 console.log('PASS Credits are collapsed, keyboard accessible and compact on mobile; SRD attribution/licence and original metadata are retained');

 await page.evaluate(()=>{document.querySelector('#art').innerHTML=itemImageMarkup({name:'Private image',archivedImage:{path:'campaign-catalogue-images/a/'+'a'.repeat(64)+'/'+'b'.repeat(64)}},'card-art');observePendingImages(document);});await page.waitForFunction(()=>document.querySelector('#art img').src.startsWith('blob:'));
 await page.evaluate(()=>{window.pauseBlob=true;document.querySelector('#art').innerHTML=itemImageMarkup({name:'Late image',archivedImage:{path:'campaign-catalogue-images/a/'+'c'.repeat(64)+'/'+'d'.repeat(64)}},'card-art');observePendingImages(document);});await page.waitForFunction(()=>!!window.releaseBlob);
 await page.evaluate(()=>{auth.currentUser={uid:'player'};currentRole='player';releaseBlob();});await page.waitForTimeout(100);assert.equal(await page.locator('#art img').getAttribute('src'),await page.evaluate(()=>PLACEHOLDER_IMAGE));
 assert.equal(await page.evaluate(()=>itemImageMarkup({name:'Private',archivedImage:{path:'campaign-catalogue-images/a/'+'e'.repeat(64)+'/'+'f'.repeat(64)}},'card-art').includes('data-private-item-image-path')),false);
 console.log('PASS Private artwork uses authenticated blobs and ignores responses after role/account changes');
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
