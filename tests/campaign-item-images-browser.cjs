// Synthetic catalogue -> real campaign store -> actual Library/inventory cards.
const path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=','base64');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fixture.example.test/**',route=>{
  const name=new URL(route.request().url()).pathname;
  if(name.endsWith('.png'))return route.fulfill(name.includes('expired')?{status:403,body:''}:{contentType:'image/png',body:png});
  return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><title>Item image regression</title><body><main><h1>Campaign items</h1><section id="library" aria-label="Library"></section><section id="inventory" aria-label="Inventory"></section><section id="other" aria-label="Other artwork"></section></main></body></html>'});
 });
 await page.goto('https://fixture.example.test/');
 await page.addScriptTag({content:`
 const auth={currentUser:{uid:'dm'}},db={},storage={},imageCache=new Map();
 let activeCampaign={id:'a',ownerId:'dm',inventoryVersion:2},items=[],inventory=[],saves=[],characters=[{id:'c1',userId:'player',name:'Player'}],selectedCharacter=null,campaignSupply={},currentRole='dm';
 const PLACEHOLDER_IMAGE='https://fixture.example.test/placeholder.png';
 const canManageCampaign=()=>currentRole==='dm',canUseCharacters=()=>true,isAdmin=()=>false,getItemState=()=>({});
 const escapeHtml=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const runVaultButton=(_button,work)=>work();
 const records=new Map([['campaigns/a',{ownerId:'dm',inventoryVersion:2}],['campaigns/a/characters/c1',{name:'Player',userId:'player'}]]);
 const snap=p=>({exists:()=>records.has(p),data:()=>structuredClone(records.get(p))});
 let generated=0;
 const sdk={db,auth,doc:(_, ...p)=>p.length===0?{id:'copy-'+(++generated)}:p.join('/'),collection:(_, ...p)=>p.join('/'),
  increment:n=>({increment:n}),query:p=>p,where:()=>null,
  getDocs:async()=>({docs:[]}),runTransaction:async(_,work)=>{
   const writes=[];const result=await work({get:async p=>snap(p),set:(p,d)=>writes.push([p,d]),delete:p=>writes.push([p,null]),update:(p,d)=>{const next={...records.get(p)};for(const [k,v] of Object.entries(d))next[k]=v&&typeof v==='object'&&'increment' in v?(next[k]||0)+v.increment:v;writes.push([p,next]);}});
   for(const [p,d]of writes)if(d===null)records.delete(p);else records.set(p,structuredClone(d));return result;
  }};
 const ref=(_,p)=>p;window.reads=[];
 const available=new Set(['Sword-red-2','shared-wand','fresh','source-art']);
 async function getDownloadURL(p){reads.push(p);if(window.pauseImage)await new Promise(resolve=>window.releaseImage=resolve);const id=p.replace('dnd-item-images/','').replace(/\\.png$/,'');if(!available.has(id))throw Error('Synthetic missing object');return 'https://fixture.example.test/'+id+'.png';}
 async function refreshCampaignData(){items=[...records].filter(([p])=>p.startsWith('campaigns/a/items/')).map(([p,d])=>({...d,id:p.split('/').at(-1)}));}
 function paint(host,rows){const target=document.getElementById(host);target.replaceChildren(...rows.map(row=>createCard(row.item||row,row.item?{inventoryEntry:row}:{})));observePendingImages(target);}
 `});
 for(const name of ['campaign-store','images','library'])await page.addScriptTag({path:root+'/js/modules/'+name+'.js'});
 await page.addScriptTag({content:'const vaultCall=createCampaignStore(sdk);openItemModal=()=>{};'});
 await page.evaluate(async()=>{
  records.set('items/root-template',{name:'Exact red sword',catalogueStatus:'approved-v1',imageBaseId:'Sword-red-2',artwork:{status:'generated'}});
  const copy=await vaultCall('vaultCopyCampaignItem',{campaignId:'a',source:'root',sourceId:'root-template'});window.copiedId=copy.itemId;
  await vaultCall('vaultInventoryAction',{campaignId:'a',itemId:copiedId,characterId:'c1',action:'assign',quantity:1});
  await refreshCampaignData();campaignSupply[copiedId]=records.get('campaigns/a/supply/'+copiedId);
  paint('library',items);paint('inventory',[records.get('campaigns/a/inventory/c1__'+copiedId)]);
 });
 const loaded=selector=>page.waitForFunction(s=>{const imgs=[...document.querySelectorAll(s)];return imgs.length&&imgs.every(img=>img.complete&&img.naturalWidth>0&&!img.src.endsWith('/placeholder.png'));},selector);
 await loaded('#library img, #inventory img');
 assert.deepEqual(await page.evaluate(()=>reads),['dnd-item-images/Sword-red-2.png']);
 assert.equal(await page.locator('#library img').getAttribute('src'),'https://fixture.example.test/Sword-red-2.png');
 console.log('PASS Root import and assignment preserve exact artwork; Library and owned cards share one lookup');
 await page.locator('#library .clone-button').click();
 await page.evaluate(()=>paint('library',items));await loaded('#library img');
 assert.equal(await page.locator('#library img').count(),2);
 assert.equal(await page.evaluate(()=>reads.length),1);
 console.log('PASS Cloned campaign items retain the same illustration without another Storage read');
 await page.evaluate(async()=>{
  records.set('items/thumb-template',{name:'Thumbnail item',catalogueStatus:'approved-v1',thumbnailUrl:'https://fixture.example.test/thumbnail.png'});
  const result=await vaultCall('vaultCopyCampaignItem',{campaignId:'a',source:'root',sourceId:'thumb-template'});
  window.thumbnailCopy=records.get('campaigns/a/items/'+result.itemId);paint('other',[{...thumbnailCopy,id:result.itemId}]);
 });
 await loaded('#other img');assert.equal(await page.evaluate(()=>thumbnailCopy.imageUrl),'https://fixture.example.test/thumbnail.png');
 await page.evaluate(()=>paint('other',[
  {id:'random-old-copy',rootItemId:'source-art',name:'Legacy copy',imageUrl:'placeholder.png'},
  {id:'shared-wand-plus-2-blue',name:'Variant'},
  {id:'fresh',name:'Expired URL',imageUrl:'https://fixture.example.test/expired.png'}
 ]));
 await loaded('#other img');
 assert.deepEqual(await page.locator('#other img').evaluateAll(imgs=>imgs.map(i=>new URL(i.src).pathname)),['/source-art.png','/shared-wand.png','/fresh.png']);
 assert.equal(await page.evaluate(()=>reads.filter(p=>p==='dnd-item-images/fresh.png').length),1);
 console.log('PASS Thumbnail-only copies, old placeholder/source IDs, legacy variant art and expired URLs recover');
 await page.evaluate(()=>{
  imageCache.set('fresh','https://fixture.example.test/expired-cache.png');
  paint('other',[{id:'fresh',name:'Stale session cache'}]);
 });
 await loaded('#other img');assert.equal(await page.locator('#other img').getAttribute('src'),'https://fixture.example.test/fresh.png');
 await page.evaluate(()=>paint('other',[{id:'missing',name:'Missing item',imageUrl:'https://fixture.example.test/expired.png'}]));
 await page.waitForFunction(()=>document.querySelector('#other img').src.endsWith('/placeholder.png')&&reads.includes('dnd-item-images/missing.png'));
 assert.equal(await page.evaluate(()=>reads.filter(p=>p==='dnd-item-images/missing.png').length),1);
 const before=await page.evaluate(()=>reads.length);
 await page.evaluate(()=>{currentRole='player';paint('other',[{id:'fresh',name:'No illustration',artwork:{status:'none'},imageUrl:'https://fixture.example.test/fresh.png'},{id:'fresh',name:'Private archive',archivedImage:{path:'campaign-catalogue-images/a/'+'a'.repeat(64)+'/'+'b'.repeat(64)},imageUrl:'https://fixture.example.test/fresh.png'}]);});
 assert.equal(await page.locator('#other [data-image-source-id], #other [data-private-item-image-path]').count(),0);
 assert.equal(await page.evaluate(()=>reads.length),before);
 console.log('PASS Stale cache recovers once; missing/no-art/private records retain placeholders and access boundaries');
 await page.evaluate(()=>{currentRole='dm';window.pauseImage=true;imageCache.clear();sessionStorage.clear();paint('other',[{id:'source-art',name:'Detached card'}]);});
 await page.waitForFunction(()=>!!window.releaseImage);
 await page.evaluate(()=>{window.detached=document.querySelector('#other img');document.getElementById('other').replaceChildren();releaseImage();});
 await page.waitForFunction(()=>imageCache.has('source-art'));
 assert.equal(await page.evaluate(()=>detached.getAttribute('src')),await page.evaluate(()=>PLACEHOLDER_IMAGE));
 assert.deepEqual(errors,[]);
 console.log('PASS Late public artwork does not update detached cards');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
