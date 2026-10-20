const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=[...html.matchAll(/<link\b[^>]*href="(css\/[^"]+)"/g)].map(match=>fs.readFileSync(path.join(root,match[1].split('?')[0]),'utf8')).join('\n');
 await page.setContent('<style>'+css+'</style>');
 await page.evaluate(()=>{
 window.activeCampaign={id:'a',inventoryVersion:2};window.auth={currentUser:{uid:'dm'}};window.canManageCampaign=()=>true;window.itemsLoadPromise=Promise.resolve();window.CampaignRules={allowed:i=>i.edition!=='blocked'};window.SharedCataloguePolicy={approved:i=>i.catalogueStatus==='approved-v1'};
 window.rootItems=Array.from({length:302},(_,n)=>({id:'root-'+n,name:'Item '+String(n).padStart(3,'0'),rarity:n<10?'Common':'Rare',category:n%2?'Weapon':'Ring',source:'SRD',classes:n%2?['Wizard']:[],attunement:!!(n%2),catalogueStatus:'approved-v1'}));rootItems.push({id:'unapproved',name:'Hidden',catalogueStatus:'draft'},{id:'blocked',name:'Blocked',edition:'blocked',catalogueStatus:'approved-v1'});
 window.escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');window.calls=[];window.refreshes=0;window.refreshCampaignData=async()=>{refreshes++};window.vaultCall=async(name,data)=>{calls.push(data);if(window.failAt===calls.length)throw Error('Simulated failure');if(window.hold)await new Promise(resolve=>window.release=resolve);return {itemId:'copy-'+data.sourceId}};
 });
 await page.evaluate(()=>{window.currentUser=auth.currentUser;});
 for(const name of ['site-help-data','site-help'])await page.addScriptTag({path:path.join(root,'js/modules/'+name+'.js')});
 await page.evaluate(()=>SiteHelp.init());
 await page.addScriptTag({path:path.join(root,'js/modules/campaign-items.js')});await page.evaluate(()=>{window.refreshCampaignData=async()=>{refreshes++};return openRootPicker()});
 await page.evaluate(()=>SiteHelp.refresh());
 assert.equal(await page.locator('[data-root-id]').count(),302);await page.locator('[data-root-id="root-301"]').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#rootPicker>.vault-help-badge').count(),0);assert.equal(await page.locator('.root-picker-row .vault-help-badge').count(),0);assert.equal(await page.locator('.root-picker-search .vault-help-badge').count(),1);
 for(const size of [{width:1280,height:800},{width:844,height:390},{width:390,height:640}]){
 await page.setViewportSize(size);await page.locator('[data-root-id="root-301"]').scrollIntoViewIfNeeded();
 for(const selector of ['#rootPicker','#addSelectedRoots','#closeRootPicker','[data-root-id="root-301"]']){const box=await page.locator(selector).boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=size.height+1,selector+' must fit viewport');}
 for(const selector of ['#closeRootPicker','#selectRootMatches','#clearRootSelection','#addSelectedRoots']){const button=page.locator(selector),box=await button.boundingBox();assert.ok(box.height>=44,selector+' needs a usable touch target');if(!await button.isDisabled())assert.equal(await button.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===node||node.contains(hit)}),true,selector+' must not be covered by results');}
 const bounds=await page.locator('#rootPickerResults').boundingBox(),footer=await page.locator('.root-picker-footer').boundingBox();assert.ok(bounds.y+bounds.height<=footer.y+1,'Results must not overlap footer');
 }
 if(process.env.ROOT_PICKER_SCREENSHOT)await page.screenshot({path:process.env.ROOT_PICKER_SCREENSHOT});
 await page.locator('.root-picker-search .vault-help-badge').click();await page.waitForFunction(()=>!document.querySelector('#vaultContextHelp').hidden);await page.keyboard.press('Escape');
 console.log('PASS Live help cannot change the grid or decorate item rows; 302 results and 44px unobscured controls fit desktop, mobile and short viewports');
 await page.locator('.catalogue-filters summary').click();
 await page.locator('[data-catalogue-filter=rarity]').selectOption('Common');assert.equal(await page.locator('[data-root-id]').count(),10);
 await page.locator('#selectRootMatches').click();await page.locator('[data-catalogue-filter=category]').selectOption('Ring');assert.equal(await page.locator('[data-root-id]').count(),5);
 await page.locator('[data-catalogue-filter=attunement]').selectOption('required');assert.equal(await page.locator('[data-root-id]').count(),0);
 await page.locator('[data-catalogue-clear]').click();assert.equal(await page.locator('[data-root-id]').count(),302);assert.equal(await page.locator('[data-root-id]:checked').count(),10);
 await page.locator('#clearRootSelection').click();await page.locator('.catalogue-filters summary').click();
 console.log('PASS Common rarity, combined category/attunement filters, reset and selection preservation');
 await page.locator('[data-root-id="root-301"]').check();await page.locator('#rootPickerSearch').fill('Item 00');await page.locator('#selectRootMatches').click();assert.match(await page.locator('#addSelectedRoots').textContent(),/11/);await page.locator('#rootPickerSearch').fill('');assert.equal(await page.locator('input[data-root-id]:checked').count(),11);
 await page.locator('#clearRootSelection').click();await page.locator('#selectRootMatches').click();assert.match(await page.locator('#addSelectedRoots').textContent(),/302/);
 await page.locator('#addSelectedRoots').click();await page.waitForFunction(()=>document.querySelector('#rootPickerStatus').textContent.startsWith('Added 302')&&document.querySelector('#rootPicker').getAttribute('aria-busy')==='false');
 assert.equal(await page.evaluate(()=>calls.length),302);assert.equal(await page.evaluate(()=>new Set(calls.map(c=>c.sourceId)).size),302);assert.equal(await page.evaluate(()=>refreshes),1);assert.equal(await page.locator('#addSelectedRoots').isDisabled(),true);
 console.log('PASS Filter selection persists, select-all imports all eligible items exactly once, with one refresh');
 await page.locator('#selectRootMatches').click();await page.evaluate(()=>{calls=[];failAt=2});await page.locator('#addSelectedRoots').click();await page.waitForFunction(()=>document.querySelector('#rootPickerStatus').textContent.includes('Stopped after 1')&&document.querySelector('#rootPicker').getAttribute('aria-busy')==='false');
 assert.equal(await page.locator('input[data-root-id]:checked').count(),301);assert.equal(await page.locator('[data-root-id="root-0"]').isChecked(),false);
 console.log('PASS Partial failures retain remaining selections and remove confirmed successes');
 await page.evaluate(()=>{failAt=0;hold=true});await page.locator('#addSelectedRoots').click();await page.waitForFunction(()=>!!window.release);assert.equal(await page.locator('#closeRootPicker').isDisabled(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#rootPicker').evaluate(d=>d.open),true);
 const before=await page.evaluate(()=>calls.length);await page.evaluate(()=>{activeCampaign={id:'b',inventoryVersion:2};hold=false;release()});await page.waitForFunction(()=>document.querySelector('#rootPicker').getAttribute('aria-busy')==='false');assert.equal(await page.evaluate(()=>calls.length),before);
 assert.deepEqual(errors,[]);console.log('PASS Busy state prevents duplicate submissions/Escape; campaign changes stop further copies');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
