'use strict';
/* Data-driven choices unlocked by class/subclass features.
 * Structured option names, levels and prerequisites only; long source prose stays in source books. */
var CharacterClassFeatureChoices=(()=>{
  const safe=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
  const option=(name,extra={})=>({id:safe(name),name,...extra});
  const groupKey=(edition,classId,id)=>[edition,classId,id].map(safe).join(':');
  const pickTable=(rows,level)=>{let n=0;for(const [at,count] of rows)if(level>=at)n=count;return n};
  const invocationProgression=Object.freeze({
    '2014':Object.freeze([0,0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8]),
    '2024':Object.freeze([0,1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10])
  });
  const invocationLimit=(level,edition='2014')=>invocationProgression[edition==='2024'?'2024':'2014'][Math.max(0,Math.min(20,Math.trunc(Number(level)||0)))];

  const fighter2014=[
    'Archery','Defense','Dueling','Great Weapon Fighting','Protection','Two-Weapon Fighting'
  ].map(name=>option(name,{source:'PHB 2014',referenceComplete:true,automationComplete:false}));
  function fighter2024(){
    const defs=globalThis.CharacterFeatData||{},refs=globalThis.CharacterFeatReference?.records||{};
    const rows=Object.entries(defs).filter(([id,def])=>{
      const ref=refs[(def.source||'')+'|'+(def.name||'')];
      return def?.edition==='2024'&&ref?.category==='FS';
    }).map(([id,def])=>option(def.name,{source:def.source||'2024',featId:id,referenceComplete:true,automationComplete:false}));
    const seen=new Set();
    return rows.filter(row=>!seen.has(row.id)&&seen.add(row.id)).sort((a,b)=>a.name.localeCompare(b.name));
  }

  const inv2014=[
    option('Agonizing Blast',{requiresSpell:'eldritch blast'}),
    option('Armor of Shadows'),
    option('Ascendant Step',{minLevel:9}),
    option('Beast Speech'),
    option('Beguiling Influence'),
    option('Bewitching Whispers',{minLevel:7}),
    option('Book of Ancient Secrets',{requiresGroup:'pact-boon',requiresChoice:'pact-of-the-tome'}),
    option('Chains of Carceri',{minLevel:15,requiresGroup:'pact-boon',requiresChoice:'pact-of-the-chain'}),
    option("Devil's Sight"),
    option('Dreadful Word',{minLevel:7}),
    option('Eldritch Sight'),
    option('Eldritch Spear',{requiresSpell:'eldritch blast'}),
    option('Eyes of the Rune Keeper'),
    option('Fiendish Vigor'),
    option('Gaze of Two Minds'),
    option('Lifedrinker',{minLevel:12,requiresGroup:'pact-boon',requiresChoice:'pact-of-the-blade'}),
    option('Mask of Many Faces'),
    option('Master of Myriad Forms',{minLevel:15}),
    option('Minions of Chaos',{minLevel:9}),
    option('Mire the Mind',{minLevel:5}),
    option('Misty Visions'),
    option('One with Shadows',{minLevel:5}),
    option('Otherworldly Leap',{minLevel:9}),
    option('Repelling Blast',{requiresSpell:'eldritch blast'}),
    option('Sculptor of Flesh',{minLevel:7}),
    option('Sign of Ill Omen',{minLevel:5}),
    option('Thief of Five Fates'),
    option('Thirsting Blade',{minLevel:5,requiresGroup:'pact-boon',requiresChoice:'pact-of-the-blade'}),
    option('Visions of Distant Realms',{minLevel:15}),
    option('Voice of the Chain Master',{requiresGroup:'pact-boon',requiresChoice:'pact-of-the-chain'}),
    option('Whispers of the Grave',{minLevel:9}),
    option('Witch Sight',{minLevel:15})
  ].map(row=>({...row,source:'PHB 2014',referenceComplete:true,automationComplete:false}));

  const inv2024=[
    option('Agonizing Blast',{minLevel:2,manualPrereq:'eligible damaging Warlock cantrip',repeatable:true}),
    option('Armor of Shadows'),
    option('Ascendant Step',{minLevel:5}),
    option("Devil's Sight",{minLevel:2}),
    option('Devouring Blade',{minLevel:12,requiresInvocation:'thirsting-blade'}),
    option('Eldritch Mind'),
    option('Eldritch Smite',{minLevel:5,requiresInvocation:'pact-of-the-blade'}),
    option('Eldritch Spear',{minLevel:2,manualPrereq:'eligible damaging Warlock cantrip',repeatable:true}),
    option('Fiendish Vigor',{minLevel:2}),
    option('Gaze of Two Minds',{minLevel:5}),
    option('Gift of the Depths',{minLevel:5}),
    option('Gift of the Protectors',{minLevel:9,requiresInvocation:'pact-of-the-tome'}),
    option('Investment of the Chain Master',{minLevel:5,requiresInvocation:'pact-of-the-chain'}),
    option('Lessons of the First Ones',{minLevel:2,manualPrereq:'choose an eligible Origin feat',repeatable:true}),
    option('Lifedrinker',{minLevel:9,requiresInvocation:'pact-of-the-blade'}),
    option('Mask of Many Faces',{minLevel:2}),
    option('Master of Myriad Forms',{minLevel:5}),
    option('Misty Visions',{minLevel:2}),
    option('One with Shadows',{minLevel:5}),
    option('Otherworldly Leap',{minLevel:2}),
    option('Pact of the Blade'),
    option('Pact of the Chain'),
    option('Pact of the Tome'),
    option('Repelling Blast',{minLevel:2,manualPrereq:'eligible attack-roll Warlock cantrip',repeatable:true}),
    option('Thirsting Blade',{minLevel:5,requiresInvocation:'pact-of-the-blade'}),
    option('Visions of Distant Realms',{minLevel:9}),
    option('Whispers of the Grave',{minLevel:7}),
    option('Witch Sight',{minLevel:15})
  ].map(row=>({...row,source:'SRD 5.2.1',referenceComplete:true,automationComplete:false}));

  const subclassDefinitions={
    '2014':{
      'fighter:battle-master':[{
        id:'maneuvers',name:'Battle Master Maneuvers',minLevel:3,
        count:l=>pickTable([[3,3],[7,5],[10,7],[15,9]],l),
        options:()=>[
          "Commander's Strike",'Disarming Attack','Distracting Strike','Evasive Footwork','Feinting Attack','Goading Attack','Lunging Attack','Maneuvering Attack','Menacing Attack','Parry','Precision Attack','Pushing Attack','Rally','Riposte','Sweeping Attack','Trip Attack'
        ].map(name=>option(name,{source:'PHB 2014',referenceComplete:true,automationComplete:false})),
        referenceComplete:true
      }]
    },
    '2024':{}
  };

  const definitions={
    '2014':{
      fighter:[{id:'fighting-style',name:'Fighting Style',minLevel:1,count:()=>1,options:()=>fighter2014,referenceComplete:true}],
      warlock:[
        {id:'eldritch-invocations',name:'Eldritch Invocations',minLevel:2,count:l=>invocationLimit(l,'2014'),options:()=>inv2014,referenceComplete:true},
        {id:'pact-boon',name:'Pact Boon',minLevel:3,count:()=>1,options:()=>[
          option('Pact of the Blade',{source:'PHB 2014',referenceComplete:true,automationComplete:false}),
          option('Pact of the Chain',{source:'PHB 2014',referenceComplete:true,automationComplete:false}),
          option('Pact of the Tome',{source:'PHB 2014',referenceComplete:true,automationComplete:false})
        ],referenceComplete:true}
      ]
    },
    '2024':{
      fighter:[{id:'fighting-style',name:'Fighting Style',minLevel:1,count:()=>1,options:fighter2024,referenceComplete:true}],
      warlock:[{id:'eldritch-invocations',name:'Eldritch Invocations',minLevel:1,count:l=>invocationLimit(l,'2024'),options:()=>inv2024,referenceComplete:true}]
    }
  };

  function normalize(raw={}){
    const out={};
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
    for(const [key,value] of Object.entries(raw).slice(0,60)){
      if(!/^[a-z0-9:-]{1,120}$/i.test(key)||!Array.isArray(value))continue;
      out[key]=value.slice(0,20).map(v=>safe(v));
    }
    return out;
  }
  function groups(entry,edition='2014'){
    const base=(definitions[edition]?.[entry?.classId]||[]).map(g=>({...g,_scope:'class'}));
    const sub=(subclassDefinitions[edition]?.[(entry?.classId||'')+':'+(entry?.subclassId||'')]||[]).map(g=>({...g,_scope:'subclass'}));
    const rows=[...base,...sub];
    return rows.filter(g=>Number(entry?.level||0)>=g.minLevel).map(g=>({...g,key:groupKey(edition,entry.classId,(g._scope==='subclass'?entry.subclassId+':':'')+g.id),allowed:Math.max(0,Math.min(20,Number(g.count(Number(entry.level)||0))||0)),options:g.options(entry,edition)}));
  }
  function registerSubclass(edition,classId,subclassId,definition){
    edition=edition==='2024'?'2024':'2014';const key=safe(classId)+':'+safe(subclassId);
    (subclassDefinitions[edition][key]||=[]).push(definition);
  }
  const selections=(data,group)=>(normalize(data?.adobe?.classFeatureChoices)[group.key]||[]).slice(0,group.allowed);
  function hasSpell(data,name){return (data?.spells||[]).some(s=>String(s.name||'').toLowerCase().replace(/\s*\[[^\]]+\]\s*$/,'')===String(name).toLowerCase());}
  function prerequisite(option,group,data,entry){
    const reasons=[];
    if((option.minLevel||0)>entry.level)reasons.push('Warlock level '+option.minLevel+'+');
    const selected=selections(data,group);
    if(option.requiresInvocation&&!selected.includes(option.requiresInvocation))reasons.push('requires '+option.requiresInvocation.replaceAll('-',' '));
    if(option.requiresGroup){
      const other=groups(entry,data?.build?.edition||'2014').find(g=>g.id===option.requiresGroup);
      if(!other||!selections(data,other).includes(option.requiresChoice))reasons.push('requires '+String(option.requiresChoice||'').replaceAll('-',' '));
    }
    if(option.requiresSpell&&!hasSpell(data,option.requiresSpell))reasons.push('requires '+option.requiresSpell);
    if(option.manualPrereq)reasons.push(option.manualPrereq+' (verify)');
    return{eligible:!reasons.some(r=>!r.endsWith('(verify)')),reasons,manual:reasons.some(r=>r.endsWith('(verify)'))};
  }
  function status(data,entry,edition='2014'){
    return groups(entry,edition).map(group=>{
      const picked=selections(data,group).slice(0,group.allowed);
      const seen=new Set(),valid=picked.filter(id=>{const opt=group.options.find(o=>o.id===id);if(!opt||seen.has(id)&&!opt.repeatable||!prerequisite(opt,group,data,entry).eligible)return false;seen.add(id);return true;});
      const overflow=(normalize(data?.adobe?.classFeatureChoices)[group.key]||[]).slice(group.allowed).filter(Boolean);
      return{...group,picked,valid,overflow,missing:Math.max(0,group.allowed-valid.length),complete:valid.length===group.allowed&&!overflow.length};
    });
  }
  function set(data,entry,groupId,index,value){
    // Recompute the allowance from class level and edition at the mutation boundary.
    // A stale DOM group or a disabled option must never bypass the core rules.
    const stored=(data?.adobe?.classLevels||[]).find(e=>e.classId===entry?.classId);
    if(!stored)return false;
    entry=stored;
    const group=groups(entry,data?.build?.edition||'2014').find(g=>g.id===groupId);
    if(!group||!Number.isInteger(index)||index<0||index>=group.allowed)return false;
    data.adobe||={};data.adobe.classFeatureChoices=normalize(data.adobe.classFeatureChoices);
    const current=[...selections(data,group)],id=safe(value),option=group.options.find(o=>o.id===id);
    if(id&&(!option||!prerequisite(option,group,data,entry).eligible||!option.repeatable&&current.some((v,i)=>i!==index&&v===id)))return false;
    const next=[...current];while(next.length<=index)next.push('');next[index]=id;
    const candidate={...data,adobe:{...data.adobe,classFeatureChoices:{...data.adobe.classFeatureChoices,[group.key]:next}}};
    if(current.some((v,i)=>i!==index&&v&&prerequisite(group.options.find(o=>o.id===v)||{},group,data,entry).eligible&&!prerequisite(group.options.find(o=>o.id===v)||{},group,candidate,entry).eligible))return false;
    while(next.length&&!next[next.length-1])next.pop();
    data.adobe.classFeatureChoices[group.key]=next;
    return true;
  }
  return{invocationProgression,invocationLimit,definitions,subclassDefinitions,registerSubclass,normalize,groupKey,groups,selections,prerequisite,status,set};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterClassFeatureChoices;
