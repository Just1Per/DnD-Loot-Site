const fs=require('fs'),vm=require('vm'),path=require('path'),{webcrypto}=require('node:crypto');
const {parseHTML}=require('linkedom');
const {window}=parseHTML(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));const {document}=window;
const sandbox={document,console,URLSearchParams,URL,Map,Set,Promise,setTimeout,clearTimeout,structuredClone,crypto:webcrypto,Event:window.Event,IntersectionObserver:class{observe(){}unobserve(){}disconnect(){}},location:{search:''},navigator:{},Image:class{},localStorage:{getItem:()=>null,setItem:()=>{}},window:null};sandbox.window=sandbox;sandbox.addEventListener=window.addEventListener.bind(window);sandbox.print=()=>{};
window.HTMLElement.prototype.showModal=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'))};window.HTMLElement.prototype.focus=function(){};
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){const o=[...this.querySelectorAll('option')].find(o=>o.selected)||this.querySelector('option');return o?.getAttribute('value')??o?.textContent??''},set(value){for(const o of this.querySelectorAll('option'))o.removeAttribute('selected');const chosen=[...this.querySelectorAll('option')].find(o=>(o.getAttribute('value')??o.textContent)===String(value));if(chosen)chosen.setAttribute('selected','');}});
const ctx=vm.createContext(sandbox);const run=async f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
(async()=>{
 await run(path.join(__dirname,'dom-setup.js'));await run(path.join(__dirname,'dom-fixture.js'));
 vm.runInContext('function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}',ctx);
 for(const name of ['core','character-rules','character-sheet-model','character-sheet-store','character-sheet','images','catalog-cache','data','dm-approval','invitations','library-state','dashboard','campaign-items','library','admin','player','dm-tools','ui-auth'])await run(path.join(__dirname,`../js/modules/${name}.js`));
 await run(path.join(__dirname,'dom-state.js'));await run(path.join(__dirname,'dom-checks.js'));
 await run(path.join(__dirname,'character-sheet-ui-checks.js'));
 await run(path.join(__dirname,'character-rules-ui-checks.js'));
 const results=JSON.parse(document.getElementById('test-results').textContent);fs.writeFileSync(path.join(__dirname,'dom-results.json'),JSON.stringify(results,null,2));
 for(const r of results)console.log(r.pass?'PASS':'FAIL',r.name);if(results.some(r=>!r.pass))process.exitCode=1;else console.log(`SUCCESS ${results.length} DOM checks`);
})().catch(e=>{console.error(e);process.exitCode=1;});
