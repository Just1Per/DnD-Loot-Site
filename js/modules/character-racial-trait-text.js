'use strict';
/* Editable sheet wording, scoped to species/edition; never a source of mechanics. */
var CharacterRacialTraitText=(()=>{
 const stored=data=>data?.adobe||data?.rulesChoices?.grants?.__adobe?.data||{};
 const key=data=>(data?.build?.edition==='2024'?'2024':'2014')+'_'+(/^[a-z0-9][a-z0-9_-]{0,99}$/.test(data?.build?.race||'')?data.build.race:'custom');
 function normalize(raw){let remaining=120000;return Object.fromEntries(Object.entries(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}).filter(([id,value])=>/^(2014|2024)_[a-z0-9][a-z0-9_-]{0,99}$/.test(id)&&typeof value==='string').slice(0,64).flatMap(([id,value])=>{if(value.length>remaining)return[];const text=value.slice(0,12000);remaining-=text.length;return[[id,text]];}));}
 function project(data,automatic=''){const id=key(data),values=normalize(stored(data).racialTraitText),custom=Object.hasOwn(values,id);return{key:id,custom,value:custom?values[id]:automatic};}
 function set(data,value,automatic,expected=key(data)){
  if(expected!==key(data))throw Error('The race or rules edition changed. Press Escape and edit its current traits.');
  if(typeof value!=='string'||value.length>12000)throw Error('Racial trait text must be at most 12,000 characters.');
  const next=normalize(stored(data).racialTraitText),id=key(data);if(value===automatic)delete next[id];else next[id]=value;
  const normalized=normalize(next);if(value!==automatic&&normalized[id]!==value)throw Error('There is no room for more custom racial trait text. Restore an unused copy first.');return normalized;
 }
 function clear(data){const next=normalize(stored(data).racialTraitText);delete next[key(data)];return next;}
 return{key,normalize,project,set,clear};
})();
if(typeof globalThis!=='undefined')globalThis.CharacterRacialTraitText=CharacterRacialTraitText;
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterRacialTraitText;
