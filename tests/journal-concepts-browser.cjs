// Standalone design prototype; no Firebase or application writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(fs.readFileSync(path.join(__dirname,'../docs/prototypes/journal-concepts.html'),'utf8'));
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 fs.mkdirSync('/tmp/journal-concepts',{recursive:true});
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const concept of ['overview','timeline','notebook']){
   await page.locator('[data-concept='+concept+']').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,concept+' fits '+width);
   const violations=await page.evaluate(async()=>(await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations);
   assert.deepEqual(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],concept+' accessibility');
   await page.screenshot({path:'/tmp/journal-concepts/'+concept+'-'+width+'.png',fullPage:true});
  }
 }
 await page.locator('[data-page=letter]').click();assert.ok((await page.locator('#notebookPage').textContent()).includes('northern watch'));
 await page.locator('[data-concept=overview]').click();await page.locator('[data-filter=dm]').click();assert.equal(await page.locator('#overview [data-kind=recap]:visible').count(),0);
 await page.locator('#write').click();assert.equal(await page.locator('#audience').inputValue(),'private');
 await page.locator('#title').fill('A player’s recap');await page.locator('#body').fill('We found the compass.\nNext time: ask Mara.');
 await page.locator('#preview').click();assert.ok((await page.locator('#readMeta').textContent()).includes('Only you'));await page.keyboard.press('Escape');
 assert.equal(await page.locator('#composer').evaluate(n=>n.open),true);
 await page.locator('#save').click();assert.equal(await page.locator('#demoEntries article').count(),0);
 await page.locator('#write').click();assert.equal(await page.locator('#title').inputValue(),'A player’s recap');
 await page.locator('#audience').selectOption('party');await page.locator('#save').click();
 assert.equal(await page.locator('#demoEntries article:visible').count(),1);assert.ok((await page.locator('#demoEntries').textContent()).includes('We found the compass.'));
 await page.locator('#write').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#write').evaluate(n=>n===document.activeElement),true);
 assert.deepEqual(errors,[]);console.log('PASS Three journal concepts at desktop/390/320px; axe, filters, notebook pages, preview, private drafts, sample sharing and focus restoration');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
