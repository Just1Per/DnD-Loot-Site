'use strict';
/* Global rules reference catalogue v2. Shared by every campaign.
 * /rulesCatalog/{edition}/{classes|subclasses|species|backgrounds|feats|spells}/{id}
 * SRD-derived text is CC-BY-4.0. Non-SRD records contain structured facts,
 * concise original summaries, and source pointers rather than copied book prose. */
var CharacterRulesCatalogStore=(()=>{
  const deps=window.__DND_VAULT_DEPS__||{},D=()=>deps,release=e=>e==='2024'?'2024':'2014';
  const CATALOG_VERSION=2026100503,KINDS=['classes','subclasses','species','backgrounds','feats','spells'];
  const LICENSE={'2014':{source:'SRD 5.1',license:'CC-BY-4.0'},'2024':{source:'SRD 5.2.1',license:'CC-BY-4.0'}};
  const safeId=id=>String(id||'record').replaceAll('/','_').slice(0,500);
  const jsonSafe=value=>JSON.parse(JSON.stringify(value,(key,v)=>typeof v==='function'||v===undefined?undefined:v));
  const feature=row=>jsonSafe({name:String(row?.name||''),level:Number(row?.level||0),summary:String(row?.summary||''),source:String(row?.source||'class'),action:String(row?.action||''),recharge:String(row?.recharge||''),incomplete:!!row?.incomplete});
  function artificer(edition){
    const rows=edition==='2024'
      ? [['Spellcasting',1],["Tinker's Magic",1],['Replicate Magic Item',2],['Artificer Subclass',3],['Ability Score Improvement',4],['Subclass Feature',5],['Magic Item Tinker',6],['Flash of Genius',7],['Ability Score Improvement',8],['Subclass Feature',9],['Magic Item Adept',10],['Spell-Storing Item',11],['Ability Score Improvement',12],['Magic Item Savant',14],['Subclass Feature',15],['Ability Score Improvement',16],['Magic Item Master',18],['Epic Boon',19],['Soul of Artifice',20]]
      : [['Magical Tinkering',1],['Spellcasting',1],['Infuse Item',2],['Artificer Specialist',3],['The Right Tool for the Job',3],['Ability Score Improvement',4],['Specialist Feature',5],['Tool Expertise',6],['Flash of Genius',7],['Ability Score Improvement',8],['Specialist Feature',9],['Magic Item Adept',10],['Spell-Storing Item',11],['Ability Score Improvement',12],['Magic Item Savant',14],['Specialist Feature',15],['Ability Score Improvement',16],['Magic Item Master',18],['Ability Score Improvement',19],['Soul of Artifice',20]];
    return {id:'artificer',name:'Artificer',subclassTitle:edition==='2024'?'Artificer Subclass':'Artificer Specialist',edition,source:edition==='2024'?'EFOTA':'TCE',expanded:true,features:rows.map(([name,level])=>feature({name,level,summary:'Reference record; detailed automation may still require source-specific implementation.',incomplete:true}))};
  }
  async function localSnapshot(edition){
    edition=release(edition);
    const CP=window.CharacterClassProgression,S=window.CharacterSubclassData,R=window.CharacterRules,B=window.CharacterBackgroundData,F=window.CharacterFeatData,C=window.CharacterCatalog;
    if(!CP||!S||!R||!B||!F)return null;
    try{await C?.load?.()}catch(e){console.warn('[rulesCatalog] spell catalogue unavailable during publish',e?.message||e)}
    const classes=Object.fromEntries(Object.entries(CP.classes||{}).map(([id,row])=>[id,jsonSafe({id,name:row.name,subclassTitle:row.subclassTitle||'',edition,features:(CP.classFeatures?.(id,edition)||[]).map(feature)})]));
    classes.artificer=artificer(edition);
    const subclasses=Object.fromEntries(Object.values(S.all||{}).filter(row=>release(row.edition)===edition).map(row=>[row.id,jsonSafe({id:row.id,classId:row.classId,name:row.name,edition,source:row.source||'',sourceName:row.sourceName||'',minimumLevel:Number(row.minimumLevel||3),features:(CP.subclassFeatures?.(row.classId,row.id,edition)||[]).map(feature)})]));
    const species=Object.fromEntries(Object.entries(R.races||{}).filter(([,row])=>release(row.edition)===edition).map(([id,row])=>[id,jsonSafe({id,edition,...row,name:row.name,source:row.source||LICENSE[edition].source})]));
    const bgSource=edition==='2024'?(B.modern||{}):(B.legacy||{});
    const backgrounds=Object.fromEntries(Object.entries(bgSource).map(([id,row])=>[id,jsonSafe({id,...row,edition})]));
    const feats=Object.fromEntries(Object.entries(F).filter(([,row])=>release(row.edition)===edition).map(([id,row])=>[id,jsonSafe({id,...row,edition})]));
    const spells=Object.fromEntries((C?.data?.spells||[]).filter(row=>release(row.edition)===edition).map(row=>[row.id,jsonSafe(row)]));
    return {classes,subclasses,species,backgrounds,feats,spells};
  }
  async function readMeta(edition){const {db,doc,getDoc}=D();if(!db||!doc||!getDoc)return null;try{const s=await getDoc(doc(db,'rulesCatalog',release(edition)));return s.exists()?s.data():null}catch(e){return null}}
  async function readKind(edition,kind){
    const {db,collection,getDocs}=D();if(!db||!collection||!getDocs||!KINDS.includes(kind))return{};
    try{const snap=await getDocs(collection(db,'rulesCatalog',release(edition),kind)),out={};snap.docs.forEach(d=>{const row=d.data();if(Number(row.catalogVersion||0)===CATALOG_VERSION)out[row.id||d.id]=row});return out}
    catch(e){console.warn('[rulesCatalog] read failed',edition,kind,e?.message||e);return{}}
  }
  async function loadEdition(edition){edition=release(edition);const meta=await readMeta(edition);if(!meta)return null;const [classes,subclasses]=await Promise.all([readKind(edition,'classes'),readKind(edition,'subclasses')]);return Object.keys(classes).length&&Object.keys(subclasses).length?{classes,subclasses,version:Number(meta.version||0),meta}:null}
  async function hydrate(edition){const remote=await loadEdition(edition);if(!remote)return false;window.CharacterClassProgression?.installReference?.(edition,remote);return true}
  function coverage(snapshot){
    const kinds={};for(const kind of KINDS){const rows=Object.values(snapshot?.[kind]||{}),incomplete=rows.filter(row=>row.partial||row.incomplete||(Array.isArray(row.features)&&row.features.some(f=>f.incomplete))).length;kinds[kind]={records:rows.length,complete:rows.length-incomplete,incomplete}}
    const classes=Object.values(snapshot?.classes||{});kinds.classLevels={records:classes.length*20,complete:classes.reduce((n,row)=>n+new Set((row.features||[]).map(f=>Number(f.level)).filter(x=>x>=1&&x<=20)).size,0)};kinds.classLevels.incomplete=Math.max(0,kinds.classLevels.records-kinds.classLevels.complete);return kinds;
  }
  async function commitChunk(rows){const {db,writeBatch,doc}=D(),batch=writeBatch(db);for(const row of rows)batch.set(doc(db,...row.path),row.data);await batch.commit()}
  async function seedEdition(edition){
    edition=release(edition);const {db,doc,setDoc,writeBatch}=D();if(!db||!doc||!setDoc||!writeBatch)throw new Error('Firestore is not ready.');if(typeof window.isAdmin==='function'&&!window.isAdmin())throw new Error('Only a global admin can publish rules reference data.');
    const snapshot=await localSnapshot(edition);if(!snapshot)throw new Error('Rules catalogue is not loaded.');const now=Date.now(),writes=[];
    for(const kind of KINDS)for(const [id,value] of Object.entries(snapshot[kind]||{}))writes.push({path:['rulesCatalog',edition,kind,safeId(id)],data:{...jsonSafe(value),id,catalogVersion:CATALOG_VERSION,updatedAt:now}});
    for(let i=0;i<writes.length;i+=400)await commitChunk(writes.slice(i,i+400));
    const counts=Object.fromEntries(KINDS.map(k=>[k,Object.keys(snapshot[k]||{}).length])),report=coverage(snapshot);
    await setDoc(doc(db,'rulesCatalog',edition),{edition,version:CATALOG_VERSION,updatedAt:now,scope:'global',schema:2,kinds:KINDS,counts,coverage:report,license:LICENSE[edition],attribution:'System Reference Document by Wizards of the Coast LLC; CC-BY-4.0 applies to SRD-derived records.'},{merge:true});
    return {edition,version:CATALOG_VERSION,counts,coverage:report};
  }
  async function seedAll(){return Promise.all([seedEdition('2014'),seedEdition('2024')])}
  return {CATALOG_VERSION,KINDS,LICENSE,localSnapshot,readMeta,readKind,loadEdition,hydrate,coverage,seedEdition,seedAll};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterRulesCatalogStore;
