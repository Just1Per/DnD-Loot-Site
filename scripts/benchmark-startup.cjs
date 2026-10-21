// Offline bootstrap audit: real ordered feature loader, fixture SDK, no production requests/writes.
const fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),requireTests=createRequire(root+'/tests/package.json');
const {chromium}=requireTests(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const results=[];
  for(const delay of [0,40])for(let run=0;run<3;run++){
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   const source=fs.readFileSync(root+'/js/app.js','utf8').replace(/^import\s+\{([\s\S]*?)\}\s+from\s+["'][^"']+["'];/gm,'const {$1}=window.__DND_VAULT_DEPS__;');
   const html=fs.readFileSync(root+'/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.origin!=='https://startup.example.test')return route.abort();
    const rel=u.pathname.slice(1);
    if(rel==='js/app.js')return route.fulfill({contentType:'text/javascript',body:source});
    if(rel.startsWith('js/modules/')){requests.push(rel);if(delay)await new Promise(r=>setTimeout(r,delay));}
    const file=path.join(root,rel);
    if(rel&&fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
    return route.fulfill({contentType:'text/html',body:html});
   });
   await page.goto('https://startup.example.test/',{waitUntil:'domcontentloaded'});
   await page.addScriptTag({path:root+'/tests/dom-setup.js'});
   await page.addScriptTag({path:root+'/tests/dom-fixture.js'});
   await page.evaluate(()=>{window.fetch=async()=>({ok:true,json:async()=>({})});window.__ready=null;window.__failed=false;document.addEventListener('campaignatlas:ready',()=>{window.__ready=performance.now()-window.__start},{once:true});document.addEventListener('campaignatlas:failed',()=>window.__failed=true,{once:true});});
   await page.context().newCDPSession(page).then(s=>s.send('Emulation.setCPUThrottlingRate',{rate:4}));
   await page.evaluate(()=>window.__start=performance.now());
   await page.addScriptTag({url:'https://startup.example.test/js/app.js',type:'module'});
   await page.waitForFunction(()=>__ready!==null||__failed);
   const result=await page.evaluate(()=>({readyMs:Math.round(__ready),failed:__failed,writes:testWrites.length,modules:document.querySelectorAll('script[data-dnd-vault-module]').length,requests:performance.getEntriesByType('resource').filter(r=>r.name.includes('/js/modules/')).length,functions:{tabs:typeof showTab,world:typeof CampaignInformation,guide:typeof SiteHelp},authRegistered:typeof testAuthCallback==='function'}));
   assert.deepEqual(errors,[]);assert.equal(result.failed,false);assert.equal(result.writes,0);assert.equal(result.authRegistered,true);assert.equal(result.functions.tabs,'function');assert.equal(result.functions.world,'object');assert.equal(result.functions.guide,'object');assert.equal(requests.length,result.modules);assert.equal(new Set(requests).size,result.modules);
   results.push({simulatedModuleDelayMs:delay,run,...result,uniqueRequestedModules:new Set(requests).size});
   await page.close();
  }
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
