'use strict';
/* Global class/subclass rules reference.
 * Canonical Firestore path: /rulesCatalog/{edition}/parts/{part}
 * This data is shared by every campaign. Campaign documents store selections only.
 */
var CharacterRulesCatalogStore=(()=>{
  const D=()=>window.__DND_VAULT_DEPS__||{};
  const release=e=>e==='2024'?'2024':'2014';
  const path=(edition,part)=>['rulesCatalog',release(edition),'parts',part];

  function serializeFeature(row){
    return {
      name:String(row?.name||''),
      level:Number(row?.level||0),
      summary:String(row?.summary||''),
      source:String(row?.source||'class'),
      action:String(row?.action||''),
      recharge:String(row?.recharge||''),
      incomplete:!!row?.incomplete
    };
  }
  function localSnapshot(edition){
    const CP=window.CharacterClassProgression,S=window.CharacterSubclassData;
    if(!CP||!S)return null;
    const classes=Object.fromEntries(Object.entries(CP.classes||{}).map(([id,row])=>[id,{
      id,name:row.name,subclassTitle:row.subclassTitle||'',edition:release(edition),
      features:(CP.classFeatures?.(id,edition)||[]).map(serializeFeature)
    }]));
    const subclasses=Object.fromEntries(Object.values(S.all||{}).filter(row=>{
      if(edition==='2014')return row.edition==='2014';
      return row.edition==='2024'||row.edition==='2014';
    }).map(row=>[row.id,{
      id:row.id,classId:row.classId,name:row.name,edition:row.edition||'2014',
      source:row.source||'',sourceName:row.sourceName||'',minimumLevel:Number(row.minimumLevel||3),
      legacy:edition==='2024'&&row.edition==='2014',
      features:(CP.subclassFeatures?.(row.classId,row.id,edition)||[]).map(serializeFeature)
    }]));
    return {classes,subclasses};
  }
  async function readPart(edition,part){
    const {db,doc,getDoc}=D();if(!db||!doc||!getDoc)return null;
    try{const snap=await getDoc(doc(db,...path(edition,part)));return snap.exists()?snap.data():null}
    catch(e){console.warn('[rulesCatalog] read failed',edition,part,e?.message||e);return null}
  }
  async function loadEdition(edition){
    const [classes,subclasses]=await Promise.all([readPart(edition,'classes'),readPart(edition,'subclasses')]);
    return classes&&subclasses?{classes:classes.records||{},subclasses:subclasses.records||{},version:classes.version||subclasses.version||0}:null;
  }
  async function hydrate(edition){
    const remote=await loadEdition(edition);if(!remote)return false;
    const CP=window.CharacterClassProgression;if(!CP)return false;
    CP.installReference?.(edition,remote);
    return true;
  }
  async function seedEdition(edition){
    const {db,doc,setDoc}=D();if(!db||!doc||!setDoc)throw new Error('Firestore is not ready.');
    if(typeof window.isAdmin==='function'&&!window.isAdmin())throw new Error('Only a global admin can publish rules reference data.');
    const snapshot=localSnapshot(edition);if(!snapshot)throw new Error('Class catalogue is not loaded.');
    const now=Date.now(),version=20261005;
    await Promise.all([
      setDoc(doc(db,...path(edition,'classes')),{kind:'classes',edition,version,updatedAt:now,records:snapshot.classes}),
      setDoc(doc(db,...path(edition,'subclasses')),{kind:'subclasses',edition,version,updatedAt:now,records:snapshot.subclasses})
    ]);
    await setDoc(doc(db,'rulesCatalog',edition),{edition,version,updatedAt:now,scope:'global',parts:['classes','subclasses']},{merge:true});
    return {edition,classes:Object.keys(snapshot.classes).length,subclasses:Object.keys(snapshot.subclasses).length};
  }
  async function seedAll(){return Promise.all([seedEdition('2014'),seedEdition('2024')])}
  return {localSnapshot,loadEdition,hydrate,seedEdition,seedAll};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterRulesCatalogStore;
