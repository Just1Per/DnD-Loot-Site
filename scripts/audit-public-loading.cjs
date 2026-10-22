// Read-only public-page audit. No login, clicks, campaign reads, or production writes.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),requireTests=createRequire(root+'/tests/package.json');
const {chromium}=requireTests(process.env.PLAYWRIGHT_PATH||'playwright');
const target=process.env.AUDIT_URL||'https://dnd-loot-site.web.app/';
const safeUrl=value=>{try{const u=new URL(value);return u.origin+u.pathname;}catch{return 'unknown';}};
(async()=>{const browser=await chromium.launch({headless:true});try{
 const results=[];
 for(const profile of [{name:'desktop',width:1440,height:1000,latency:40,download:2000000,cpu:1},{name:'mobile',width:390,height:844,latency:100,download:187500,cpu:4}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.download,uploadThroughput:profile.download,connectionType:'cellular4g'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
  await page.addInitScript(()=>{window.__audit={ready:null,failed:false,lcp:null,longTasks:[],errors:0};document.addEventListener('campaignatlas:ready',()=>__audit.ready=performance.now(),{once:true});document.addEventListener('campaignatlas:failed',()=>__audit.failed=true,{once:true});window.addEventListener('error',()=>__audit.errors++);try{new PerformanceObserver(list=>{for(const e of list.getEntries())__audit.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())__audit.longTasks.push(Math.round(e.duration));}).observe({type:'longtask',buffered:true});}catch{}});
  let requests=new Map();
  cdp.on('Network.requestWillBeSent',e=>requests.set(e.requestId,{url:safeUrl(e.request.url),type:e.type}));
  cdp.on('Network.responseReceived',e=>{const r=requests.get(e.requestId);if(r)Object.assign(r,{status:e.response.status,cached:!!(r.cached||e.response.fromDiskCache||e.response.fromServiceWorker),cacheControl:e.response.headers['cache-control']||e.response.headers['Cache-Control']||null});});
  cdp.on('Network.requestServedFromCache',e=>{const r=requests.get(e.requestId);if(r)r.cached=true;});
  cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)r.transfer=e.encodedDataLength;});
  cdp.on('Network.loadingFailed',e=>{const r=requests.get(e.requestId);if(r)r.failed=e.errorText;});
  for(const cache of ['cold','warm']){
   requests=new Map();await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>__audit.ready!==null||__audit.failed,{timeout:45000}).catch(()=>{});
   await page.waitForLoadState('load',{timeout:45000}).catch(()=>{});
   await page.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{});
   await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,500)));
   const timing=await page.evaluate(()=>({readyMs:__audit.ready===null?null:Math.round(__audit.ready),failed:__audit.failed,lcpMs:__audit.lcp===null?null:Math.round(__audit.lcp),longTasks:__audit.longTasks,errors:__audit.errors,loadMs:Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd),logoLoaded:!!document.querySelector('.header-logo')?.naturalWidth,domContentLoadedMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),paints:performance.getEntriesByType('paint').map(x=>({name:x.name,ms:Math.round(x.startTime)})),features:document.querySelectorAll('script[data-dnd-vault-module]').length,landing:document.getElementById('siteBootStatus')?.textContent||null}));
   const rows=[...requests.values()];results.push({profile:profile.name,cache,conditions:{latency:profile.latency,downloadBytesPerSecond:profile.download,cpu:profile.cpu},...timing,requestCount:rows.length,transferredBytes:rows.reduce((sum,r)=>sum+(r.transfer||0),0),cacheHits:rows.filter(r=>r.cached).length,failedRequests:rows.filter(r=>r.failed),largest:rows.filter(r=>r.transfer).sort((a,b)=>b.transfer-a.transfer).slice(0,12),headers:rows.filter(r=>r.url===safeUrl(target)||r.url.endsWith('/js/app.js')||r.url.endsWith('/logo.png')).map(r=>({url:r.url,cacheControl:r.cacheControl}))});
   console.log(JSON.stringify(results.at(-1)));await page.screenshot({path:'/tmp/campaignatlas-public-'+profile.name+'-'+cache+'.png',fullPage:false});
  }
  await context.close();
 }
 if(process.env.AUDIT_OUTPUT)fs.writeFileSync(process.env.AUDIT_OUTPUT,JSON.stringify(results,null,2)+'\n');
 }finally{await browser.close();}})().catch(e=>{console.error(e.name+': '+String(e.message).replace(/https?:\/\/[^\s]+/g,safeUrl));process.exitCode=1;});
