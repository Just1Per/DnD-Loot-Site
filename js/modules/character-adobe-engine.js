'use strict';
/* Core progression/persistence adapter inspired by the user-supplied MPMB sheet. */
var CharacterAdobeEngine=(()=>{
 const P=CharacterProgression,A=['str','dex','con','int','wis','cha'],CAST=new Set(['artificer','bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard']),THIRD=new Set(['eldritch-knight','arcane-trickster']),KEY='__adobe';
 const num=(v,d=0,min=-1e9,max=1e9)=>{v=Math.trunc(Number(v));return Number.isFinite(v)?Math.max(min,Math.min(max,v)):d};
 const rankMap=()=>Object.fromEntries(Object.keys(CharacterSheetModel.skills||{}).map(k=>[k,0]));
 const privateImage=value=>typeof value==='string'&&value.length<=160000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)?value:'';
 function companion(r={}){const abilities={},saveProficient={},saveBonus={},skillRank=rankMap(),skillBonus=rankMap();for(const k of A){abilities[k]=num(r.abilities?.[k],10,1,30);saveProficient[k]=r.saveProficient?.[k]===true;saveBonus[k]=num(r.saveBonus?.[k],0,-30,30)}for(const k of Object.keys(skillRank)){skillRank[k]=[0,1,2].includes(Number(r.skillRank?.[k]))?Number(r.skillRank[k]):0;skillBonus[k]=num(r.skillBonus?.[k],0,-30,30)}const companion={hitDiceUsed:num(r.hitDiceUsed,0,0,1000),portrait:privateImage(r.portrait),...Object.fromEntries(['height','weight','age','gender','alignment','creatureType'].map(key=>[key,String(r[key]||'').slice(0,120)])),features:String(r.features||'').slice(0,8000),deathSuccess:num(r.deathSuccess,0,0,3),deathFailure:num(r.deathFailure,0,0,3),notesExpanded:r.notesExpanded===true,skillsCollapsed:r.skillsCollapsed===true,type:['companion','familiar','wildshape'].includes(r.type)?r.type:'companion',name:String(r.name||'').slice(0,120),creature:String(r.creature||'').slice(0,160),size:['Tiny','Small','Medium','Large','Huge'].includes(r.size)?r.size:'Medium',profBonus:num(r.profBonus,2,0,10),ac:num(r.ac,10,0,50),hpMax:num(r.hpMax,1,0,1e5),hpCurrent:num(r.hpCurrent,1,0,1e5),hpTemp:num(r.hpTemp,0,0,1e5),speed:num(r.speed,30,0,1000),initiativeBonus:num(r.initiativeBonus,0,-30,30),abilities,saveProficient,saveBonus,skillRank,skillBonus,paperAttackSlots:Array.from({length:3},(_,i)=>Number.isInteger(r.paperAttackSlots?.[i])&&r.paperAttackSlots[i]>=-1&&r.paperAttackSlots[i]<=2?r.paperAttackSlots[i]:i),attacks:String(r.attacks||'').slice(0,6000),traits:String(r.traits||'').slice(0,8000),notes:String(r.notes||'').slice(0,8000)};return CharacterCompanionHitPoints.normalize({...companion,...CharacterCompanionHitPoints.settings(r)},typeof CharacterCreatureData!=='undefined'?CharacterCreatureData.find(companion.creature):null)}
 function journal(rows){
  const ids=new Set();let remaining=180000;
  return (Array.isArray(rows)?rows:[]).slice(0,300).map((r,i)=>{
   let id=String(r?.id||'note-'+i).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'note-'+i;while(ids.has(id))id+='x';ids.add(id);
   const text=String(r?.text||'').slice(0,Math.min(20000,remaining));remaining-=text.length;
   return{id,title:String(r?.title||'Untitled note').slice(0,150),category:String(r?.category||'General').slice(0,60),text};
  });
 }
 function noteLines(raw){return Object.fromEntries(Object.entries(raw&&typeof raw==='object'?raw:{}).slice(0,150).filter(([key,value])=>/^(0|[1-9]\d{0,2})$/.test(key)&&Number(key)<150&&value&&(value.left===false||value.right===false)).map(([key,value])=>[key,{left:value.left!==false,right:value.right!==false}]))}
 const builtinIcon=value=>typeof value==='string'&&/^(?:class-(?:artificer|barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard)|faction-(?:emeraldenclave|harpers|lordsalliance|ordergauntlet|zhentarim)-(?:symbol|banner|icon)|season-(?:tod|ee|rod|cos|skt|totyp|toa|wda|dia|rotf))$/.test(value)?value:'';
 function paperIcon(raw={}){const builtin=builtinIcon(raw?.builtin),image=privateImage(raw?.image);return{builtin:image?'':builtin,image,print:raw?.print===true};}
 const backgroundKey=data=>/^[a-z0-9][a-z0-9_-]{0,79}$/.test(data?.build?.background||'')&&!['constructor','prototype'].includes(data.build.background)?data.build.background:'custom';
 function backgroundDetails(raw){return Object.fromEntries(Object.entries(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}).filter(([key,value])=>/^[a-z0-9][a-z0-9_-]{0,79}$/.test(key)&&!['constructor','prototype'].includes(key)&&typeof value==='string'&&value).slice(0,64).map(([key,value])=>[key,value.slice(0,200)]));}
 const backgroundDetail=data=>{const key=backgroundKey(data);return{key,value:Object.hasOwn(data?.adobe?.backgroundDetails||{},key)?data.adobe.backgroundDetails[key]:''};};
 function normalize(r={}){
  const p=r.pages||{},allowedTabs=['overview','skills','combat','spells','inventory','builder','feats','story','notes','companion','rules'];
  const rawCompanions=Array.isArray(r.companions)?r.companions:(r.companion?[r.companion]:[]);
  const companions=(rawCompanions.length?rawCompanions:[{}]).slice(0,12).map(companion);
  const requested=Array.isArray(r.tabOrder)?r.tabOrder.map(v=>String(v||'')).filter(v=>allowedTabs.includes(v)):[];
  const tabOrder=[...new Set([...requested,...allowedTabs])];
  return{carrying:CharacterCarrying.normalize(r.carrying),backgroundDetails:backgroundDetails(r.backgroundDetails),customToolCheck:CharacterToolChecks.normalize(r.customToolCheck),paperIcons:{header:paperIcon(r.paperIcons?.header),log:paperIcon(r.paperIcons?.log)},itemResources:CharacterItemResources.normalize(r.itemResources),paperCombat:CharacterPaperCombat.normalize(r.paperCombat),paperNoteLines:noteLines(r.paperNoteLines),adventureLog:CharacterAdventureLog.normalize(r.adventureLog),paperWildShapeForms:(Array.isArray(r.paperWildShapeForms)?r.paperWildShapeForms:[]).slice(0,20).map(id=>typeof id==='string'&&id.length<=200?id:''),paperMagicOrder:[...new Set((Array.isArray(r.paperMagicOrder)?r.paperMagicOrder:[]).filter(id=>typeof id==='string'&&id.length>0&&id.length<=200))].slice(0,1000),journal:journal(r.journal),notesMigrated:r.notesMigrated===true,portrait:privateImage(r.portrait),organizationSymbol:privateImage(r.organizationSymbol),showPortraitOnOverview:r.showPortraitOnOverview===true,overviewFeatDescriptions:[...new Set((Array.isArray(r.overviewFeatDescriptions)?r.overviewFeatDescriptions:[]).filter(id=>typeof id==='string'&&(Object.hasOwn(CharacterFeatRules.definitions,id)||/^custom-[a-zA-Z0-9_-]{1,90}$/.test(id))))].slice(0,100),importantCollapsed:r.importantCollapsed===true,readBuildWarnings:[...new Set((Array.isArray(r.readBuildWarnings)?r.readBuildWarnings:[]).map(v=>String(v).slice(0,1000)))].slice(-60),showCalculatedOnOverview:r.showCalculatedOnOverview===true,overviewFeatures:typeof CharacterClassProgression!=='undefined'?CharacterClassProgression.normalizeOverview(r.overviewFeatures):{},classFeatureChoices:(typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices.normalize(r.classFeatureChoices):{}),pactSlotsUsed:num(r.pactSlotsUsed,0,0,4),pactSlotsSeparated:r.pactSlotsSeparated===true,showSpellSlotsOnOverview:r.showSpellSlotsOnOverview===true,useExperience:r.useExperience===true,hpMode:CharacterHitPointOptions.mode(r.hpMode),hpOverride:CharacterHitPointOptions.normalizeOverride(r.hpOverride),hpRolls:(Array.isArray(r.hpRolls)?r.hpRolls:[]).slice(0,19).map(v=>num(v,0,0,20)),classLevels:(Array.isArray(r.classLevels)?r.classLevels:[]).slice(0,8).map(e=>({classId:String(e?.classId||'').toLowerCase().replace(/[^a-z0-9-]+/g,'').slice(0,60),level:num(e?.level,1,1,20),subclassId:String(e?.subclassId||'').toLowerCase().replace(/[^a-z0-9-]+/g,'').slice(0,80)})).filter(e=>e.classId),pages:{spells:p.spells===true,companion:p.companion===true,rules:p.rules===true},tabOrder,companions,companion:companions[0]}
 }
 const stored=r=>r?.adobe||r?.rulesChoices?.grants?.[KEY]?.data||{};
 function classLevels(data,target,assigned=false){let a=(data.adobe?.classLevels||[]).map(x=>({...x})),primary=data.build?.classId||a[0]?.classId;if(!a.length&&primary)a=[{classId:primary,level:target,subclassId:''}];if(assigned)return a;let sum=a.reduce((s,x)=>s+x.level,0);if(a.length&&sum<target)a[0].level+=target-sum;for(let i=a.length-1;i>=0&&sum>target;i--){const d=Math.min(Math.max(0,a[i].level-1),sum-target);a[i].level-=d;sum-=d}return a.filter(x=>x.level>0)}
 const level=(d,l)=>d.adobe?.useExperience?P.levelFromXP(d.experience):Math.max(1,Math.min(20,num(l,1,1,20)));
 function maxSpellLevel(id,l,edition='2024',sub=''){if(!l)return-1;if(['bard','cleric','druid','sorcerer','wizard'].includes(id))return Math.min(9,Math.ceil(l/2));if(id==='warlock')return Math.min(5,Math.ceil(l/2));if(id==='artificer')return Math.min(5,Math.floor((l+3)/4));if(['paladin','ranger'].includes(id)){if(edition==='2014'&&l<2)return-1;return Math.min(5,Math.floor((l+3)/4))}if(THIRD.has(sub))return l<3?-1:l<7?1:l<13?2:l<19?3:4;return-1}
 function spellAccess(data,l){return classLevels(data,l).map(e=>({...e,maxSpellLevel:maxSpellLevel(e.classId,e.level,data.build?.edition||'2024',e.subclassId)})).filter(e=>(CAST.has(e.classId)||THIRD.has(e.subclassId))&&e.maxSpellLevel>=0)}
 function hpBonus(data,r,l){const all=Number(r.effects?.hpBonus||0);if(data.build?.scoreMode!=='base')return all;const base=data.abilities?.con??10,origin=Math.min(r.effects?.asi?.con||0,Math.max(0,20-base)),before=Math.min(30,base+origin);return all-l*(CharacterSheetModel.mod(r.scores.con)-CharacterSheetModel.mod(before))}
 function install(){if(CharacterSheetModel.__adobeIntegrated)return;const catalogNormalize=CharacterCatalog.normalize.bind(CharacterCatalog),modelNormalize=CharacterSheetModel.normalize.bind(CharacterSheetModel),modelDerive=CharacterSheetModel.derive.bind(CharacterSheetModel),modelDamage=CharacterSheetModel.damage.bind(CharacterSheetModel),load=characterSheetStore.load.bind(characterSheetStore),save=characterSheetStore.save.bind(characterSheetStore);
  CharacterCatalog.normalize=raw=>{const keep=raw?.grants?.[KEY]?.data,out=catalogNormalize(raw);if(keep)out.grants[KEY]={data:normalize(keep),used:0};return out};
  CharacterSheetModel.normalize=raw=>{const out=modelNormalize(raw);out.adobe=normalize(stored(raw));if(!out.adobe.pactSlotsSeparated){const classes=out.adobe.classLevels;const pureWarlock=classes.length?classes.every(c=>c.classId==='warlock'):out.build?.classId==='warlock';if(pureWarlock)out.adobe.pactSlotsUsed=Math.min(4,out.slots.reduce((sum,slot)=>sum+(Number(slot.used)||0),0));out.adobe.pactSlotsSeparated=true;}if(!out.adobe.notesMigrated){if(out.notes)out.adobe.journal.unshift({id:'legacy-session-notes',title:'Previous session notes',category:'Sessions',text:out.notes});out.adobe.notesMigrated=true;}out.notes='';out.rulesChoices.grants[KEY]={data:out.adobe,used:0};return out};
  CharacterSheetModel.derive=(raw,l,loot=[])=>{
   const d=CharacterSheetModel.normalize(raw),lv=level(d,l),r=modelDerive(d,lv,loot);
   const classes=classLevels(d,lv),assigned=classLevels(d,lv,true);
   const hpOptions={
    classLevels:classes,constitution:r.scores.con,hpMode:d.adobe.hpMode,
    hpRolls:d.adobe.hpRolls,bonuses:hpBonus(d,r,lv),bonusSources:r.effects.hpSources||[]
   };
   const hp=CharacterHitPointOptions.project(hpOptions,{...d.adobe,hpMax:d.hpMax});
   hp.options=hpOptions;
   // Constitution changes are already counted by calculateHP, not added again.
   hp.constitutionSources=[
    ...(r.classAbilityFeatures||[]).filter(feature=>feature.appliedAbilityIncreases?.con).map(feature=>({kind:'class',name:feature.name,before:null,after:null})),
    ...(r.feats?.reports||[]).filter(f=>f.appliedAbilityIncreases?.con)
     .map(f=>({kind:'feat',name:f.def.name,before:null,after:null})),
    ...(r.magicItems?.reports||[]).flatMap(item=>(item.abilityChanges||[])
     .filter(change=>change.ability==='con').map(change=>({kind:'item',name:item.name,...change})))
   ];
   const slots=assigned.length>1||classes.some(c=>c.classId==='warlock')?P.spellSlots(classes,d.build.edition):
    (r.effects?.slotMax?[...r.effects.slotMax]:P.spellSlots(classes,d.build.edition));
   const access=spellAccess(d,lv),warlock=classes.filter(e=>e.classId==='warlock').reduce((sum,e)=>sum+e.level,0);
   if(access.length)r.effects.slotMax=Array.from({length:9},(_,i)=>Number(slots[i]||0));
   r.hpMax=hp.max;
   r.progression={
    targetLevel:lv,xp:P.xpProgress(d.experience),classLevels:classes,assignedClassLevels:assigned,
    assignedLevel:assigned.reduce((sum,e)=>sum+e.level,0),hp,hitDice:P.hitDiceSummary(classes),
    spellAccess:access,isSpellcaster:access.length>0,
    pact:warlock?{count:warlock===1?1:warlock<11?2:warlock<17?3:4,slotLevel:Math.min(5,Math.ceil(warlock/2)),used:Math.min(d.adobe.pactSlotsUsed,warlock===1?1:warlock<11?2:warlock<17?3:4)}:null,
    classFeatureChoices:typeof CharacterClassFeatureChoices!=='undefined'?
     classes.flatMap(e=>CharacterClassFeatureChoices.status(d,e,d.build.edition)):[]
   };
   r.customToolCheck=CharacterToolChecks.project(d.adobe.customToolCheck,{...r,proficiencies:d.proficiencies,toolNames:CharacterRules.tools});
   return r;
  };
  // Core HP helpers use their original normalizer; restore the progression adapter.
  CharacterSheetModel.damage=(raw,amount)=>CharacterSheetModel.normalize(modelDamage(CharacterSheetModel.normalize(raw),amount));
  CharacterSheetModel.heal=(raw,amount,l=1)=>{const d=CharacterSheetModel.normalize(raw);d.hpCurrent=Math.min(CharacterSheetModel.derive(d,l).hpMax,d.hpCurrent+Math.max(0,Number(amount)||0));return d};
  characterSheetStore.load=async(...args)=>load(...args);
  characterSheetStore.save=args=>{const d=structuredClone(args.data||{});d.rulesChoices||={feats:[],grants:{},effects:{}};d.rulesChoices.grants||={};d.rulesChoices.grants[KEY]={data:normalize(d.adobe||{}),used:0};delete d.adobe;return save({...args,data:d})};
  CharacterSheetModel.__adobeIntegrated=true;characterSheetStore.__adobeIntegrated=true;
 }
 install();
 return{P,A,num,paperIcon,backgroundKey,backgroundDetail,normalize,classLevels,level,maxSpellLevel,spellAccess,className:id=>CharacterRules.classes?.[id]?.name||String(id||'Adventurer').replace(/(^|-)([a-z])/g,(_,a,b)=>(a?' ':'')+b.toUpperCase())};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobeEngine;
