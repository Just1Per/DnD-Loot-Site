'use strict';
/* One shared custom check; ability/proficiency values come from the character engine. */
var CharacterToolChecks=(()=>{
 const abilities=['str','dex','con','int','wis','cha'];
 const suffix=/\((str|dex|con|int|wis|cha)\)/gi;
 const key=value=>String(value||'').toLowerCase().replace(/[’‘']/g,'').replace(/[\s-]+/g,' ').trim();
 const integer=(value,min,max)=>{const n=['number','string'].includes(typeof value)?Number(value):NaN;return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):0;};
 function normalize(raw={}){return {name:typeof raw?.name==='string'?raw.name.slice(0,200):'',rank:integer(raw?.rank,0,2),bonus:integer(raw?.bonus,-30,30)};}
 function untrained(pb,effects={},ability,scope='ability'){
  const half=scope==='skill'?effects.halfSkillProficiency:scope==='initiative'?effects.halfInitiativeProficiency:effects.halfAbilityProficiency;
  return Math.max(half?Math.floor(pb/2):0,effects.halfPhysicalAbilityProficiency&&['str','dex','con'].includes(ability)?Math.ceil(pb/2):0);
 }
 function project(raw,context={}){
  const row=normalize(raw),lower=row.name.toLowerCase(),ability=abilities.find(id=>lower.includes('('+id+')'))||'',toolName=row.name.replace(suffix,'').trim(),toolKey=key(toolName);
  const same=name=>!!toolKey&&key(name)===toolKey,training=context.toolTraining?.tools?.find(tool=>same(tool.name));
  const recognized=!!toolKey&&(context.toolNames||[]).some(same);
  const proficient=training||recognized&&[...(context.effects?.proficiencies||[]),...String(context.proficiencies||'').split(/[,;\n]+/)].some(same);
  const expertise=training?.expertise||(context.classExpertise?.tools||[]).some(tool=>same(tool.name));
  const automaticRank=expertise?2:proficient?1:0,rank=Math.max(row.rank,automaticRank),pb=Number(context.pb)||0;
  const half=!rank?untrained(pb,context.effects,ability):0;
  const contribution=rank?pb*rank:half,modifier=ability?Number(context.mods?.[ability])||0:null;
  return {...row,toolName,ability,automaticRank,rank,manualRank:row.rank,contribution,modifier,total:ability?modifier+contribution+row.bonus:null,trainingLabel:rank===2?'Expertise':rank===1?'Proficient':half?'Half proficiency':'Untrained'};
 }
 function edit(raw,field,value,context={}){
  const out=normalize(raw),current=project(out,context);
  if(field==='name'){if(typeof value!=='string'||value.length>200)throw Error('A tool/check name can contain up to 200 characters.');out.name=value;}
  else if(field==='ability'){if(value!==''&&!abilities.includes(value))throw Error('Choose an ability for this check.');const base=out.name.replace(suffix,'').trim();out.name=base+(value?(base?' ':'')+'('+value[0].toUpperCase()+value.slice(1)+')':'');if(out.name.length>200)throw Error('Shorten the check name before adding its ability.');}
  else if(field==='proficient'||field==='expertise'){
   if(typeof value!=='boolean')throw Error('Choose checked or unchecked.');const wanted=field==='expertise'?2:1;
   if(!value&&current.automaticRank>=wanted)throw Error('This check inherits that training. Edit its original training choice to remove it.');
   out.rank=value?Math.max(out.rank,wanted):wanted===2?Math.min(out.rank,1):0;
  }else if(field==='bonus'){if(String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<-30||Number(value)>30)throw Error('Enter a check adjustment from -30 to 30.');out.bonus=Number(value);}
  else throw Error('Choose an available custom-check field.');
  return out;
 }
 const signed=n=>(n>=0?'+':'')+n;
 function describe(row){return row.name+' — '+(row.ability?row.ability.toUpperCase()+' '+signed(row.modifier):'Choose an ability')+' · '+row.trainingLabel+' '+signed(row.contribution)+(row.bonus?' · adjustment '+signed(row.bonus):'')+' · '+(row.total===null?'No check total until an ability is chosen':'Check bonus '+signed(row.total));}
 return {abilities,normalize,project,untrained,edit,describe};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterToolChecks;
