/* Edition-aware catalogue and feat spell choices. No campaign permissions here. */
var CharacterCatalog = (() => {
  const Feats=typeof CharacterFeatRules!=='undefined'?CharacterFeatRules:require('./character-feat-rules');
  let catalogue=null, pending=null;
  const sdk=typeof window!=='undefined'?window.__DND_VAULT_DEPS__:null;
  const normalize = raw => {
    const values=Array.isArray(raw?.feats)?raw.feats:[];
    const feats=values.filter((x,i)=>typeof x==='string' && x.length<100 && !['__proto__','constructor','prototype'].includes(x) && (Feats.definitions[x]?.repeatable || values.indexOf(x)===i)).slice(0,30);
    const grants={};
    for(const [key,g] of Object.entries(raw?.grants||{}).slice(0,40)) {
      if(['__proto__','constructor','prototype'].includes(key) || !/^[a-zA-Z0-9_-]{1,100}$/.test(key) || !g || typeof g!=='object') continue;
      grants[key]={classId:String(g.classId||'').slice(0,30),ability:['int','wis','cha'].includes(g.ability)?g.ability:'int',spells:[0,1,2].map(i=>String(g.spells?.[i]||'').slice(0,100)),used:g.used?1:0};
    }
    const effects={};
    for(const [key,value] of Object.entries(raw?.effects||{}).slice(0,40))if(!['__proto__','constructor','prototype'].includes(key)&&/^[a-zA-Z0-9_-]{1,100}$/.test(key))effects[key]=Feats.choice(value||{});
    return {feats,grants,effects};
  };
  function set(data) {
    if(data?.format!==1 || !Array.isArray(data.spells) || !Array.isArray(data.feats)) throw Error('Unsupported rules catalogue');
    const ids=new Set();
    for(const r of [...data.spells,...data.feats]) {
      if(!r.id || ids.has(r.id) || !['2014','2024'].includes(r.edition) || !r.name || (!r.licensedText && r.description)) throw Error('Invalid rules catalogue');
      ids.add(r.id);
    }
    if(data.spells.some(s=>!Number.isInteger(s.level)||s.level<0||s.level>9) || data.feats.some(f=>!Number.isInteger(f.minimumLevel)||f.minimumLevel<0||f.minimumLevel>20)) throw Error('Invalid catalogue levels');
    for(const feat of data.feats)if(feat.licensedText && Feats.definitions[feat.id]?.descriptionOverride)feat.description=Feats.definitions[feat.id].descriptionOverride;
    catalogue=data;return data;
  }
  async function load() {
    if(catalogue) return catalogue;
    if(pending) return pending;
    pending=(async()=>{
      let reason='Bundled catalogue';
      if(sdk?.getDoc && sdk.auth?.currentUser) {
        try {
          const snapshot=await sdk.getDoc(sdk.doc(sdk.db,'rulesCatalog','current'));
          if(snapshot.exists()) {
            const manifest=snapshot.data();
            if(manifest.metadataVersion!==3 || manifest.format!==1 || !/^[a-f0-9]{64}$/.test(manifest.release) || !Number.isInteger(manifest.parts) || manifest.parts<1 || manifest.parts>100) throw Error('Invalid catalogue manifest');
            const parts=await Promise.all(Array.from({length:manifest.parts},(_,i)=>sdk.getDoc(sdk.doc(sdk.db,'rulesCatalog',manifest.release,'parts',String(i).padStart(4,'0')))));
            if(parts.some(p=>!p.exists() || typeof p.data().text!=='string')) throw Error('Incomplete catalogue release');
            const text=parts.map(p=>p.data().text).join('');
            const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
            if(hash!==manifest.release) throw Error('Catalogue checksum mismatch');
            const data=set(JSON.parse(text)); data.loadedFrom='Firestore catalogue'; return data;
          }
        } catch(error) { reason='Bundled catalogue (database catalogue unavailable)'; console.warn(reason,error.message); }
      }
      const response=await fetch('data/rules/catalog.json?v=20260928-attacks-v1');
      if(!response.ok) throw Error('Could not load spell and feat catalogue');
      const data=set(await response.json()); data.loadedFrom=reason; return data;
    })().catch(e=>{pending=null;throw e;});
    return pending;
  }
  const find=(id,kind='spells')=>catalogue?.[kind]?.find(s=>s.id===id);
  const schools=Object.freeze(['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation']);
  function spells({edition,legacy=false,classId='',level='',school='',search=''}={}) {
    const needle=String(search||'').trim().toLowerCase();
    return (catalogue?.spells||[]).filter(s=>{
      const versionOk=!edition || s.edition===edition || legacy && edition==='2024' && s.edition==='2014';
      const levelOk=level==='' || s.level===Number(level);
      const classOk=!classId || (s.classesByEdition?.[edition]||s.classes||[]).includes(classId);
      const schoolOk=!school || String(s.school||'').toLowerCase()===String(school).toLowerCase();
      const searchable=[
        s.name,s.school,s.source,s.book,s.save,s.casting,s.range,
        ...(s.combat?.types||[])
      ].filter(Boolean).join(' ').toLowerCase();
      return versionOk&&levelOk&&classOk&&schoolOk&&(!needle||searchable.includes(needle));
    });
  }
  function grants(data) {
    const b=data.build||{}, out=[];
    const add=(key,label,edition,feat,fixedClass='')=>{
      if(/^Magic Initiate(?: \(|$)/.test(feat||'')) out.push({key,label,edition,fixedClass:fixedClass || /\((\w+)\)/.exec(feat)?.[1]?.toLowerCase() || ''});
    };
    if(b.edition==='2024') {
      const rules=typeof CharacterRules!=='undefined'?CharacterRules:(typeof require!=='undefined'?require('./character-rules'):null);
      const bg=rules?.modern.backgrounds[b.background];
      add('background','Background · Magic Initiate','2024',bg?.feat||b.backgroundFeat);
      if(b.race==='human-2024') add('human','Human · Magic Initiate','2024',b.humanOriginFeat);
    }
    if(b.edition==='2014' && b.race==='variant-human') add('variant','Variant Human · Magic Initiate','2014',b.raceFeat);
    for(const {id,key,origin} of Feats.entries(data)) {
      if(origin)continue;
      const feat=find(id,'feats');if(feat)add(key,`${feat.name} · ${feat.edition}`,feat.edition,feat.name);
    }
    return out;
  }
  function validateGrant(grant,choice={},data=null) {
    const errors=[], classes=grant.edition==='2024'?['cleric','druid','wizard']:['bard','cleric','druid','sorcerer','warlock','wizard'];
    const classId=grant.fixedClass||choice.classId;
    if(!classes.includes(classId)) errors.push('Choose a spell class.');
    const picks=[0,1,2].map(i=>find(choice.spells?.[i]));
    picks.forEach((spell,i)=>{
      if(!spell || spell.level!==(i===2?1:0) || spell.edition!==grant.edition || !(spell.classesByEdition?.[grant.edition]||[]).includes(classId)) errors.push(`Choose a valid ${i===2?'level 1 spell':'cantrip '+(i+1)} (${grant.edition}).`);
    });
    if(picks[0] && picks[0]?.id===picks[1]?.id) errors.push('Choose two different cantrips.');
    const ability=grant.edition==='2024'?choice.ability:({cleric:'wis',druid:'wis',wizard:'int',bard:'cha',sorcerer:'cha',warlock:'cha'}[classId]);
    if(data && classId && grants(data).some(other=>other.key!==grant.key && other.edition===grant.edition && (grant.edition==='2014' || (other.fixedClass||data.rulesChoices?.grants?.[other.key]?.classId)===classId))) errors.push(grant.edition==='2014'?'2014 Magic Initiate is not repeatable.':'Repeated Magic Initiate must use a different spell class.');
    if(data && grants(data).some(other=>other.edition!==grant.edition))errors.push('Choose one rules edition for Magic Initiate; do not stack its 2014 and 2024 versions.');
    return {errors,picks,classId,ability};
  }
  function spellRow(spell) {
    return {name:`${spell.name} [${spell.edition}]`,level:spell.level,prepared:false,casting:spell.casting,range:spell.range,duration:spell.duration,components:spell.components,notes:`${spell.book}, p. ${spell.page} · ${spell.school}${spell.ritual?' · Ritual':''}\n\n${spell.description || 'Reference entry: consult this source for the complete rules.'}${spell.license?'\n\n'+spell.license:''}`,catalogId:spell.id};
  }
  function longRest(data) {
    for(const g of Object.values(data.rulesChoices.grants)) g.used=0;
    for(const slot of data.slots) slot.used=0;
    Feats.reset(data,'long');
  }
  return {normalize,set,load,find,spells,schools,grants,validateGrant,spellRow,longRest,get data(){return catalogue;}};
})();
if(typeof module!=='undefined' && module.exports) module.exports=CharacterCatalog;
