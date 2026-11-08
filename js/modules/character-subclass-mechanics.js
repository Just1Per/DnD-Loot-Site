'use strict';
// Shared subclass boundaries and counters. No source entries are shipped here.
var CharacterSubclassMechanics=(()=>{
 const C=()=>globalThis.CharacterClassFeatureChoices||(typeof require==='function'?require('./character-class-feature-choices'):null);
 const stored=d=>d.adobe||d.rulesChoices?.grants?.__adobe?.data||{};
 const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
 const catalogue=()=>globalThis.CharacterCatalog?.rawData?.spells||(typeof require==='function'?require('../../data/rules/catalog.json').spells:[]);
 function context(d,classId,{level=1,mods={}}={}){
  const s=stored(d),edition=d.build?.edition==='2024'?'2024':'2014',choices=C().normalize(s.classFeatureChoices);let left=Math.max(1,Math.min(20,Math.trunc(Number(level)||1))),actual=0,id='';const seen=new Set();
  for(const e of s.classLevels?.length?s.classLevels:[{classId:d.build?.classId,subclassId:d.build?.subclassId,level}]){const n=Math.min(left,Math.max(0,Math.trunc(Number(e?.level)||0)));left-=n;if(e?.classId===classId&&!seen.has(classId)){actual=n;id=e.subclassId||'';}seen.add(e?.classId);}
  const key=name=>C().groupKey(edition,classId,id+':'+name),pb=Math.ceil(Math.max(1,Math.min(20,Number(level)||1))/4)+1,mod=a=>Math.max(-5,Math.min(10,Math.trunc(Number(mods[a])||0)));
  return{classId,edition,modern:edition==='2024',level:actual,id,key,pb,mod,dc:a=>8+pb+mod(a),choices,picks:name=>choices[key(name)]||[],pick:name=>choices[key(name)]?.[0]||'',used:name=>/^\d{1,3}$/.test(choices[key(name)]?.[0]||'')?Number(choices[key(name)][0]):0};
 }
 function group(edition,classId,id,name,minLevel,options,count=1){C().registerSubclass(edition,classId,id,{id:name,name:name.replaceAll('-',' '),minLevel,count:typeof count==='function'?count:()=>count,referenceComplete:true,options:(entry)=>{const rows=typeof options==='function'?options(entry,edition):options;return rows.map(v=>typeof v==='string'?{id:slug(v),name:v,source:edition,referenceComplete:true,automationComplete:true}:v);}});}
 function resource(c,id,name,max,resets,description,extra={}){const key=c.key(id+'-uses'),used=c.used(id+'-uses');return{id:c.classId+'-'+id,key,name,source:c.edition+' '+c.id,className:c.classId[0].toUpperCase()+c.classId.slice(1),level:c.level,max,used,remaining:Math.max(0,max-used),resets,recovery:resets.includes('short')?'Short or Long Rest recovery':resets.includes('turn')?'Once on your turn':'Long Rest recovery',unit:'uses',useLabel:'Use '+name,undoLabel:'Undo use',description,...extra};}
 function save(d,updates){if(!Object.keys(updates).length)return true;const next={...C().normalize(stored(d).classFeatureChoices),...updates};if(Object.keys(next).length>100)return false;d.adobe={...stored(d),classFeatureChoices:next};return true;}
 function spellOptions(entry,edition,{classes=null,cantrip=false,schools=null,maxLevel=null}={}){return catalogue().filter(s=>s.edition===edition&&s.level<=(maxLevel??Math.min(9,Math.ceil(entry.level/2)))&&(!cantrip||s.level===0)&&(!classes||(s.classesByEdition?.[edition]||s.classes||[]).some(id=>classes.includes(id)))&&(!schools||schools.includes(String(s.school).toLowerCase()))).map(s=>({id:slug(s.id),name:s.name,spellId:s.id,source:s.source||edition,referenceComplete:true,automationComplete:true}));}
 function selectedSpells(c,groupId,options,count){const valid=new Set(options.map(s=>s.spellId)),picked=c.picks(groupId).slice(0,count),seen=new Set();return picked.flatMap(id=>{const opt=options.find(o=>o.id===id),spell=opt&&catalogue().find(s=>s.id===opt.spellId);if(!spell||!valid.has(spell.id)||seen.has(spell.id))return[];seen.add(spell.id);return[{...spell,grantSource:c.classId+' / '+c.id}];});}
 return{context,stored,slug,catalogue,group,resource,save,spellOptions,selectedSpells};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSubclassMechanics;
