// Real browser integration against a deterministic Firebase fixture; never touches production.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi,(tag,href)=>href.startsWith('css/')?'<style>'+fs.readFileSync(path.join(root,href.split('?')[0]),'utf8')+'</style>':'');
 await page.route('https://fixture.example.test/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://fixture.example.test/');
 await page.evaluate(data=>{window.__testCatalog=data;window.print=()=>{};window.fetch=async()=>({ok:true,json:async()=>window.__testCatalog});window.alert=()=>{};window.confirm=()=>true},JSON.parse(fs.readFileSync(path.join(root,'data/rules/catalog.json'),'utf8')));
 for(const file of ['dom-setup.js','dom-fixture.js'])await page.addScriptTag({path:path.join(__dirname,file)});
 await page.evaluate(()=>{const deps=window.__DND_VAULT_DEPS__;deps.getDocs=async p=>({docs:Object.entries(testSheetDocs).filter(([key])=>key.startsWith(p+'/')&&key.slice(p.length+1).indexOf('/')<0).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}))});deps.ref=(_,p)=>p;deps.uploadBytes=async(p)=>{window.lastUpload=p};deps.getBlob=async()=>new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0))],{type:'image/png'})});
 await page.addScriptTag({content:'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
 const modules=fs.readFileSync(path.join(__dirname,'dom.cjs'),'utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1];
 for(const name of JSON.parse(modules.replaceAll("'",'"')))await page.addScriptTag({path:path.join(root,'js/modules',name+'.js')});
 await page.evaluate(()=>CharacterCatalog.set(window.__testCatalog));await page.addScriptTag({path:path.join(__dirname,'dom-state.js')});
 await page.evaluate(()=>{seed('dm');showMainApp();showTab('dm-world')});
 await page.waitForSelector('[data-new-record]');await page.waitForFunction(()=>CampaignWorkspace.session?.rows);
 await page.locator('[data-new-record]').click();await page.locator('[name="title"]').fill('The Northern Kingdom');await page.locator('[name="content"]').fill('A snowy land');await page.locator('[name="privateNotes"]').fill('The king is an impostor');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.revision===1);
 await page.locator('[name="content"]').fill('A cold and snowy land');if(await page.locator('[name="title"]').inputValue()!=='The Northern Kingdom')throw Error('Editor closed during typing');await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.revision===2);
 await page.locator('[data-open-record]').click();await page.waitForFunction(()=>!CampaignWorkspace.session?.dirty);if(await page.locator('[name="privateNotes"]').inputValue()!=='The king is an impostor')throw Error('Secrets not restored');
 await page.locator('[data-preview-record]').click();if((await page.locator('[data-player-preview]').textContent()).includes('impostor'))throw Error('Secret leaked in preview');
 await page.locator('[data-map-upload]').setInputFiles({name:'map.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64')});await page.waitForFunction(()=>!!CampaignWorkspace.session?.record?.data?.imagePath);await page.locator('[data-save-record]').click();await page.waitForFunction(()=>CampaignWorkspace.session?.record?.revision===3);
 await page.screenshot({path:'/tmp/world80-desktop.png'});await page.setViewportSize({width:390,height:850});await page.screenshot({path:'/tmp/world80-mobile.png'});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS World editor creation, reopen, private preview, persistent editor, image upload and mobile layout');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
