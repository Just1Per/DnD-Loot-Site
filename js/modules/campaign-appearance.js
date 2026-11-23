'use strict';
/* Three editable colours; derive readable companion shades instead of storing CSS. */
var CampaignAppearance=(()=>{
 const presets=Object.freeze({
  classic:Object.freeze({label:'Classic',primary:'#9b1d1d',background:'#f3e8d2',accent:'#d4af37'}),
  ocean:Object.freeze({label:'Ocean',primary:'#0b5b86',background:'#dceef3',accent:'#277b95'}),
  forest:Object.freeze({label:'Forest',primary:'#1d5b44',background:'#e1eadf',accent:'#947329'}),
  horror:Object.freeze({label:'Horror',primary:'#7c2d55',background:'#12141e',accent:'#c89b68'})
 });
 const hex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 function normalize(raw){
  if(!raw||raw.schemaVersion!==1||!['classic','ocean','forest','horror','custom'].includes(raw.preset)||!['primary','background','accent'].every(k=>hex(raw[k])))throw Error('Choose a preset or enter three six-digit hex colours, such as #0b5b86.');
  if(!Number.isSafeInteger(raw.revision)||raw.revision<0)throw Error('Invalid appearance revision. Reopen appearance settings.');
  return {schemaVersion:1,preset:raw.preset,primary:raw.primary.toLowerCase(),background:raw.background.toLowerCase(),accent:raw.accent.toLowerCase(),revision:raw.revision};
 }
 const preset=(name='classic',revision=0)=>({schemaVersion:1,preset:name,...Object.fromEntries(['primary','background','accent'].map(k=>[k,(presets[name]||presets.classic)[k]])),revision});
 function read(raw){try{return normalize(raw);}catch{return preset();}}
 const rgb=value=>[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
 const mix=(a,b,weight)=>'#'+rgb(a).map((v,i)=>Math.round(v*(1-weight)+rgb(b)[i]*weight).toString(16).padStart(2,'0')).join('');
 const luminance=value=>rgb(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const ink=background=>contrast('#000000',background)>=contrast('#ffffff',background)?'#000000':'#ffffff';
 function readable(colour,background,minimum=4.8){
  if(contrast(colour,background)>=minimum)return colour;
  const target=ink(background);
  for(let i=1;i<=100;i++){const candidate=mix(colour,target,i/100);if(contrast(candidate,background)>=minimum)return candidate;}
  return target;
 }
 function tokens(raw){
  const data=normalize(raw);if(data.preset==='classic'&&['primary','background','accent'].every(k=>data[k]===presets.classic[k]))return {};
  const paper='#fdfbf7',primary=readable(data.primary,paper),hover=mix(primary,'#000000',.16),header=mix(primary,'#000000',.67),canvasInk=ink(data.background);
  return {'--theme-primary':primary,'--theme-primary-hover':hover,'--theme-heading':readable(data.primary,paper,7),
   '--theme-accent':data.accent,'--theme-accent-deep':readable(data.accent,paper,3.2),'--theme-accent-ink':readable(data.accent,paper,7),
   '--theme-canvas':data.background,'--theme-canvas-end':data.background,'--theme-canvas-ink':canvasInk,
   '--theme-header':header,'--theme-header-end':mix(header,'#000000',.12),'--theme-header-accent':readable(data.accent,header,7),
   '--theme-on-primary':'#ffffff','--theme-focus':readable(data.primary,paper,4.8)};
 }
 return {presets,preset,normalize,read,tokens,contrast};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CampaignAppearance;
