'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
 try{
  const {page,errors}=await require('./adobe-browser-fixture.cjs')(browser);
  await page.evaluate(()=>{
   const sdk=__DND_VAULT_DEPS__,canvas=document.createElement('canvas');canvas.width=1800;canvas.height=900;const c=canvas.getContext('2d');c.fillStyle='#eadcba';c.fillRect(0,0,1800,900);c.fillStyle='#345a67';c.font='80px Georgia';c.fillText('THE EXISTING COAST',100,300);
   const bytes=Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0));window.oldMapBlob=new Blob([bytes],{type:'image/png'});window.originalReads=[];window.originalUploads=[];
   sdk.getBlob=async path=>{originalReads.push(path);if(auth.currentUser.uid==='player'||window.denyOriginals)throw Object.assign(Error('Original forbidden'),{code:'storage/unauthorized'});return oldMapBlob;};sdk.uploadBytes=async path=>originalUploads.push(path);
   for(const mapId of ['main','north']){
    const prefix='campaign-maps/a/'+(mapId==='main'?'':mapId+'/'),pictures='campaign-map-place-images/a/'+(mapId==='main'?'':mapId+'/');
    const pin={id:'town',name:'Existing town',description:'Published place',type:'City',x:30,y:40,markerStyle:'City',boundary:[],revealed:true,picturePath:pictures+'town/image',pictureAlt:'Town',worldEntryId:''};
    testSheetDocs['campaigns/a/campaignMaps/'+mapId]={title:mapId==='main'?'Existing coast':'Northern coast',imagePath:prefix+'original',previewPath:prefix+'overview',schemaVersion:2,revision:7,updatedBy:'dm',updatedAt:1};
    const {id,revealed,...fields}=pin;testSheetDocs['campaigns/a/campaignMaps/'+mapId+'/pins/town']={...fields,imagePath:prefix+'original',schemaVersion:2,publishedRevision:7,revision:7,updatedBy:'dm',updatedAt:1};
    testSheetDocs['campaigns/a/campaignMapDrafts/'+mapId]={title:'Keep private title',imagePath:prefix+'original',previewPath:prefix+'overview',pins:[pin,{...pin,id:'secret',name:'PRIVATE PLACE',revealed:false,picturePath:pictures+'secret/image'}],sourceRevision:7,revision:3,updatedBy:'dm',updatedAt:1};
   }
   window.savedMapRecords=JSON.stringify(Object.fromEntries(Object.entries(testSheetDocs).filter(([p])=>/campaignMap(?:s|Drafts)\//.test(p))));
   auditSeed('player');showTab('campaign-map');
  });
  await page.waitForFunction(()=>CampaignMap.session?.ready&&document.querySelector('[data-map-quality]')?.textContent.includes('Repair image access'));
  assert.equal(await page.evaluate(()=>originalReads.length),0);assert.equal(await page.locator('[data-map-repair]').count(),0);assert.match(await page.locator('[data-map-quality]').textContent(),/DM.*Repair image access/);
  await page.evaluate(()=>{CampaignMap.clear();auditSeed('dm');showTab('dm-map')});await page.waitForFunction(()=>CampaignMap.session?.ready);
  // A denied repair explains the failed permission without changing map data.
  await page.evaluate(()=>window.failJournalWrite=true);await page.locator('[data-map-repair]').click();await page.waitForFunction(()=>!CampaignMap.session.busy);assert.match(await page.locator('[data-map-status]').textContent(),/could not be repaired/);await page.evaluate(()=>window.failJournalWrite=false);
  for(const mapId of ['main','north']){
   if(mapId!=='main'){await page.locator('[data-select-map=north]').click();await page.waitForFunction(()=>CampaignMap.session?.ready&&CampaignMap.session.mapId==='north');}
   await page.locator('[data-map-repair]').click();await page.waitForFunction(()=>!CampaignMap.session.busy&&document.querySelector('[data-map-status]')?.textContent.includes('Image access repaired'));
  }
  assert.equal(await page.evaluate(()=>originalUploads.length),0,'Repair never reuploads or replaces an original');
  assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(testSheetDocs).filter(([p])=>/campaignMap(?:s|Drafts)\//.test(p))))),await page.evaluate(()=>savedMapRecords),'Repair preserves all map, pin and private draft records');
  await page.evaluate(()=>{CampaignMap.clear();auditSeed('player');originalReads=[];showTab('campaign-map')});await page.waitForFunction(()=>CampaignMap.session?.ready&&document.querySelector('[data-map-image]')?.naturalWidth===1800);
  assert.equal(await page.locator('[data-map-pin]').count(),1);assert.ok(!(await page.locator('.campaign-map').textContent()).includes('PRIVATE PLACE'));
  await page.locator('[data-map-pin]').click();await page.locator('.map-place-panel [data-place-picture]').evaluate(img=>img.decode());
  await page.locator('[data-map-zoom=in]').click();await page.waitForFunction(()=>document.querySelector('[data-map-quality]')?.textContent==='Original map detail.');assert.equal(await page.evaluate(()=>originalReads.length),0);
  const bytesMatch=await page.locator('[data-map-image]').evaluate(async img=>{const result=await __realFetch(img.src);return (await result.blob()).size===oldMapBlob.size;});assert.equal(bytesMatch,true);
  await page.locator('[data-select-map=north]').click();await page.waitForFunction(()=>CampaignMap.session?.ready&&CampaignMap.session.mapId==='north'&&document.querySelector('[data-map-image]')?.naturalWidth===1800);
  for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.evaluate(()=>{CampaignMap.clear();auditSeed('dm');window.denyOriginals=true;showTab('dm-map')});await page.waitForFunction(()=>CampaignMap.session?.ready&&document.querySelector('[data-map-image]')?.naturalWidth===1800);
  assert.equal(await page.evaluate(()=>originalReads.length),0,'A repaired map also displays for the DM when Storage refuses the original');
  assert.deepEqual(errors,[]);console.log('PASS Existing main/named map repair, explicit missing-copy and failure feedback, original bytes, unchanged publications/drafts, no reupload, no player Storage requests, place pictures, DM fallback, zoom and mobile layout');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
