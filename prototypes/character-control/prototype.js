'use strict';
(() => {
 const paper=document.getElementById('paper'),fields=document.getElementById('fields'),viewport=document.getElementById('viewport'),zoom=document.getElementById('zoom'),status=document.getElementById('status');
 let definition=null;
 function resize(){
  if(!definition)return;
  const available=Math.max(240,viewport.clientWidth-(innerWidth<=600?16:32));
  const width=zoom.value==='fit'?Math.min(1180,available):definition.width*96/72*Number(zoom.value);
  paper.style.width=width+'px';paper.style.setProperty('--sheet-scale',width/definition.width);
 }
 function control(row,index){
  const [x,y,right,bottom]=row.rect,host=document.createElement('label');
  host.className='prototype-field kind-'+row.kind;
  if(bottom-y>16&&bottom-y<35)host.classList.add('large');
  if(/^(Str|Dex|Con|Int|Wis|Cha)( |$)|^(AC|HP Max|Proficiency Bonus|Passive Perception|Initiative bonus|Spell save DC|HD\d|Speed)/.test(row.id))host.classList.add('center');
  Object.assign(host.style,{left:100*x/definition.width+'%',top:100*y/definition.height+'%',width:100*(right-x)/definition.width+'%',height:100*(bottom-y)/definition.height+'%',fontSize:'calc(var(--sheet-scale) * '+row.fontSize+'px)'});
  const name=document.createElement('span');name.className='visually-hidden';name.textContent=row.label;
  const input=document.createElement(row.kind==='select'?'select':row.kind==='textarea'?'textarea':'input');
  input.id='control-field-'+index;input.dataset.fieldId=row.id;input.setAttribute('aria-label',row.label);input.title=row.label;
  if(row.kind==='select'){
   const blank=new Option('','');input.append(blank);
   for(const option of row.options||[])input.append(new Option(option,option));
  }else if(row.kind==='checkbox')input.type='checkbox';
  else if(row.kind==='text'){input.type='text';input.maxLength=2000;}
  else{input.maxLength=6000;input.rows=2;}
  if(row.id==='Class and Levels')input.setAttribute('list','classOptions');
  host.append(name,input);return host;
 }
 function values(){return Object.fromEntries([...fields.querySelectorAll('[data-field-id]')].map(input=>[input.dataset.fieldId,input.type==='checkbox'?input.checked:input.value]));}
 async function load(){
  document.getElementById('loadError').hidden=true;status.textContent='Loading the sheet…';
  try{
   const response=await fetch('fields.json?v=20261027-control-prototype-v1');if(!response.ok)throw Error('Fields unavailable');
   const data=await response.json();
   if(data.format!==1||!Array.isArray(data.fields)||!Number.isFinite(data.width)||!Number.isFinite(data.height)||data.width<=0||data.height<=0)throw Error('Invalid sheet definition');
   definition=data;fields.replaceChildren(...data.fields.map(control));paper.hidden=false;resize();
   for(const id of ['openDraft','download','reset','print'])document.getElementById(id).disabled=false;
   status.textContent='Manual prototype ready — no automatic calculations.';
  }catch{paper.hidden=true;document.getElementById('loadError').hidden=false;status.textContent='Could not load the sheet. Please try again.';}
 }
 paper.addEventListener('submit',event=>event.preventDefault());
 paper.addEventListener('change',()=>{status.textContent='Prototype edited. Download a draft to keep your entries.';});
 zoom.addEventListener('change',resize);new ResizeObserver(resize).observe(viewport);
 document.getElementById('retry').addEventListener('click',load);
 document.getElementById('reset').addEventListener('click',()=>{if(!confirm('Clear every field on this prototype? Download a draft first if you want to keep your entries.'))return;paper.reset();status.textContent='Prototype fields cleared.';});
 document.getElementById('openDraft').addEventListener('click',()=>document.getElementById('draftFile').click());
 document.getElementById('draftFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
   if(file.size>1000000)throw Error('Draft is too large');
   const draft=JSON.parse(await file.text());
   if(draft.format!==1||draft.prototype!=='adobe-first-page'||!draft.fields||typeof draft.fields!=='object'||Array.isArray(draft.fields))throw Error('Not a prototype draft');
   const prepared=definition.fields.map(row=>{
    const value=Object.hasOwn(draft.fields,row.id)?draft.fields[row.id]:row.kind==='checkbox'?false:'';
    if(row.kind==='checkbox'){if(typeof value!=='boolean')throw Error('Invalid checkbox');}
    else if(typeof value!=='string'||value.length>(row.kind==='textarea'?6000:2000)||row.kind==='select'&&value!==''&&!(row.options||[]).includes(value))throw Error('Invalid field');
    return value;
   });
   if(Object.values(values()).some(Boolean)&&!confirm('Replace this prototype’s entries with the selected draft?'))return;
   [...fields.querySelectorAll('[data-field-id]')].forEach((input,i)=>{if(input.type==='checkbox')input.checked=prepared[i];else input.value=prepared[i];});
   status.textContent='Prototype draft opened. Your saved character is unchanged.';
  }catch{status.textContent='This file is not a valid Control prototype draft. Your entries were kept.';}
  finally{event.target.value='';}
 });
 document.getElementById('download').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({format:1,prototype:'adobe-first-page',fields:values()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='control-prototype-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Draft downloaded. Your saved character is unchanged.';
 });
 document.getElementById('print').addEventListener('click',()=>window.print());
 load();
})();
