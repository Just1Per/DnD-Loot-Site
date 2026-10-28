'use strict';
/* Print-only text flow. Measurements are supplied by the real browser layout. */
var CharacterAdobePrintOverflow=(()=>{
 function take(text,fits){
  text=String(text??'');if(fits(text))return {head:text,tail:''};
  const ends=[];let offset=0;
  const parts=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text):Array.from(text).map(segment=>({segment}));
  for(const {segment}of parts){offset+=segment.length;ends.push(offset);}
  let lo=0,hi=ends.length;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(fits(text.slice(0,ends[mid-1])))lo=mid;else hi=mid-1;}
  if(!lo)return {head:'',tail:text};
  let end=ends[lo-1];const prefix=text.slice(0,end),space=prefix.search(/\s+\S*$/u);
  if(space>=end*.8){const boundary=ends.find(n=>n>space);if(boundary<=end)end=boundary;}
  return {head:text.slice(0,end),tail:text.slice(end)};
 }
 const fits=(node,line=false)=>node.scrollWidth<=node.clientWidth+.5&&(line||node.scrollHeight<=node.clientHeight+.5);
 function prose(text){const node=document.createElement('div');node.className='adobe-print-prose';node.textContent=text;return node;}
 function collect(batch){
  const records=[];
  for(const paper of batch.children)for(const info of paper.printFields||[]){
   const {host,control,label}=info;if(!control.isConnected||control.type==='checkbox')continue;
   const text=control.tagName==='SELECT'?control.options[control.selectedIndex]?.textContent||'':String(control.value??'');if(!text.trim())continue;
   const line=control.tagName!=='TEXTAREA',probe=prose(text);probe.style.textAlign=getComputedStyle(control).textAlign;
   if(line){probe.classList.add('adobe-print-line');probe.style.lineHeight=control.clientHeight+'px';}
   control.hidden=true;host.append(probe);
   if(fits(probe,line)){probe.remove();control.hidden=false;continue;}
   const number=records.length+1,marker=' … ['+number+']',part=take(text,value=>{probe.textContent=value+marker;return fits(probe,line)});
   probe.textContent=part.head+marker;if(!fits(probe,line)){probe.textContent='['+number+']';if(!fits(probe,line))probe.textContent='…';}
   probe.dataset.printOverflow=String(number);control.remove();
   records.push({number,label:paper.printTitle+' — '+label,text});
  }
  return records;
 }
 function append(batch,records,template,imageURL){
  let paper=null,column=2;
  function nextColumn(){
   if(column>=2){if(batch.children.length>=400)throw Error('Long text needs more than 400 paper pages. Use the Standard print view.');paper=document.createElement('div');paper.className='paper adobe-overflow-page';paper.dataset.printPage=template.id;paper.style.cssText='width:'+template.width+'pt;height:'+template.height+'pt;--scale:1.333333333';const img=document.createElement('img');img.className='artwork';img.src=imageURL;img.alt='';paper.append(img);batch.append(paper);column=0;}
   const field=template.fields.find(f=>f.id===(column++?'Notes.Right':'Notes.Left'));if(!field)throw Error('The notes continuation layout is unavailable.');
   const [x,y,r,b]=field.rect,host=document.createElement('div');host.className='field adobe-overflow-column';Object.assign(host.style,{left:100*x/template.width+'%',top:100*y/template.height+'%',width:100*(r-x)/template.width+'%',height:100*(b-y)/template.height+'%'});const node=prose('');host.append(node);paper.append(host);return node;
  }
  let node=null,used='';
  for(const record of records){let remaining=record.text,continued=false;
   while(remaining){
    if(!node){node=nextColumn();used='';}
    const heading=(used?'\n\n\n':'')+'['+record.number+'] '+record.label+(continued?' (continued)':'')+'\n\n',part=take(remaining,value=>{node.textContent=used+heading+value;return fits(node)});
    if(!part.head){node.textContent=used;if(!used)throw Error('The notes continuation text could not fit. Retry printing.');node=null;continue;}
    used+=heading+part.head;node.textContent=used;node.dataset.printOverflowText=(node.dataset.printOverflowText?node.dataset.printOverflowText+' ':'')+record.number;remaining=part.tail;continued=true;
    if(remaining)node=null;
   }
  }
 }
 return {take,collect,append};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobePrintOverflow;
