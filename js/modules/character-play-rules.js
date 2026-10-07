/* Pure play helpers. Advancement state is shared by the Adobe-style web engine. */
var CharacterPlayRules = (()=>{
 const alignments={
 'Lawful Good':'Acts with honor, compassion, and duty.', 'Neutral Good':'Helps others without strict allegiance to rules or rebellion.', 'Chaotic Good':'Fights injustice guided by personal conscience.',
 'Lawful Neutral':'Follows laws, traditions, or a personal code.', 'True Neutral':'Seeks balance or survival without a strong moral allegiance.', 'Chaotic Neutral':'Values personal freedom and resists authority.',
 'Lawful Evil':'Uses rules and hierarchies to exploit and oppress.', 'Neutral Evil':'Pursues personal benefit without remorse.', 'Chaotic Evil':'Acts through hatred, greed, and destructive violence.'};
 const norm=(raw={})=>({gender:['male','female','other'].includes(raw.gender)?raw.gender:'',age:Math.max(0,Math.min(100000,Number(raw.age)||0)),size:['small','medium','large'].includes(raw.size)?raw.size:'',height:Math.max(0,Math.min(100000,Number(raw.height)||0)),weight:Math.max(0,Math.min(100000,Number(raw.weight)||0)),hair:String(raw.hair||'').slice(0,200),eyes:String(raw.eyes||'').slice(0,200),skin:String(raw.skin||'').slice(0,200)});
 const text=(value,max=1000)=>String(value??'').slice(0,max);
 const advancement=(raw={})=>{
  const classLevels=(Array.isArray(raw.classLevels)?raw.classLevels:[]).slice(0,20).map(v=>({classId:text(v?.classId||v?.class||'',80).toLowerCase(),level:Math.max(1,Math.min(20,Math.trunc(Number(v?.level)||1))),subclassId:text(v?.subclassId||v?.subclass||'',100).toLowerCase()})).filter(v=>v.classId);
  const hpRolls=(Array.isArray(raw.hpRolls)?raw.hpRolls:[]).slice(0,19).map(v=>Math.max(0,Math.min(20,Math.trunc(Number(v)||0))));
  while(hpRolls.length<19)hpRolls.push(0);
  const extraPages=[...new Set((Array.isArray(raw.extraPages)?raw.extraPages:[]).filter(v=>['spells','companion','rules'].includes(v)))];
  const companionRaw=raw.companion&&typeof raw.companion==='object'?raw.companion:{};
  const abilities={};for(const key of ['str','dex','con','int','wis','cha'])abilities[key]=Math.max(1,Math.min(30,Math.trunc(Number(companionRaw.abilities?.[key])||10)));
  return {
   asiSpent:Math.max(0,Math.min(7,Math.trunc(Number(raw.asiSpent)||0))),lessons:raw.lessons===true,
   useExperience:raw.useExperience===true,xp:Math.max(0,Math.min(1000000000,Math.trunc(Number(raw.xp)||0))),
   hpMode:['fixed','rolled','max','manual'].includes(raw.hpMode)?raw.hpMode:'fixed',hpRolls,
   classLevels,extraPages,
   companion:{name:text(companionRaw.name,160),type:text(companionRaw.type,100),size:text(companionRaw.size,40),ac:Math.max(0,Math.min(99,Math.trunc(Number(companionRaw.ac)||10))),hpMax:Math.max(0,Math.min(99999,Math.trunc(Number(companionRaw.hpMax)||0))),hpCurrent:Math.max(0,Math.min(99999,Math.trunc(Number(companionRaw.hpCurrent)||0))),speed:text(companionRaw.speed,100),initiative:Math.max(-50,Math.min(50,Math.trunc(Number(companionRaw.initiative)||0))),proficiency:Math.max(0,Math.min(20,Math.trunc(Number(companionRaw.proficiency)||0))),abilities,saves:text(companionRaw.saves,1000),skills:text(companionRaw.skills,2000),senses:text(companionRaw.senses,1000),attacks:text(companionRaw.attacks,4000),traits:text(companionRaw.traits,6000),notes:text(companionRaw.notes,6000)}
  };
 };
 function budget(data,level,catalog){
  const b=data.build||{},classId=b.classId,known=['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'].includes(classId),modern=b.edition==='2024';
  const levels=[4,8,12,16,19,...(classId==='fighter'?[6,14]:classId==='rogue'?[10]:[])].sort((a,b)=>a-b);
  const total=known?levels.filter(n=>n<=level).length:0,spent=advancement(data.advancement).asiSpent;
  const dm=data.rulesChoices?.grants?.__dm||{},bonusFeats=Math.max(0,Math.min(10,Math.trunc(Number(dm.bonusFeats)||0))),bonusAsis=Math.max(0,Math.min(10,Math.trunc(Number(dm.bonusAsis)||0))),bonusAsiUsed=Math.max(0,Math.min(10,Math.trunc(Number(dm.usedAsis)||0)));
  const style=modern&&((classId==='fighter'&&level>=1)||(['paladin','ranger'].includes(classId)&&level>=2))?1:0;
  const CFC=typeof CharacterClassFeatureChoices!=='undefined'?CharacterClassFeatureChoices:require('./character-class-feature-choices');
  const warlock=(data.adobe?.classLevels||[]).find(entry=>entry.classId==='warlock');
  const invocations=modern&&warlock?CFC.status(data,{...warlock,level:Math.min(warlock.level,level)},'2024').find(group=>group.id==='eldritch-invocations'):null;
  const lessons=invocations?.valid.filter(id=>id==='lessons-of-the-first-ones').length||0;
  let featUsed=0,styleUsed=0,lessonUsed=0;
  for(const id of data.rulesChoices.feats){const f=catalog.find(v=>v.id===id);if(f?.category==='FS'&&styleUsed<style)styleUsed++;else if(f?.category==='O'&&lessonUsed<lessons)lessonUsed++;else featUsed++;}
  const bonusFeatCovered=Math.min(featUsed,bonusFeats),normalFeatUsed=Math.max(0,featUsed-bonusFeatCovered);
  const normalUsed=normalFeatUsed+spent,normalRemaining=Math.max(0,total-normalUsed),bonusFeatRemaining=Math.max(0,bonusFeats-bonusFeatCovered),bonusAsiRemaining=Math.max(0,bonusAsis-bonusAsiUsed);
  const remaining=normalRemaining+bonusFeatRemaining,asiRemaining=normalRemaining+bonusAsiRemaining;
  const over=Math.max(0,normalUsed-total,bonusAsiUsed-bonusAsis);
  return {total,remaining,asiRemaining,normalRemaining,bonusFeatRemaining,bonusAsiRemaining,style:Math.max(0,style-styleUsed),lessons:Math.max(0,lessons-lessonUsed),over,levels,known,bonusFeats,bonusAsis,featUsed,asiUsed:spent,bonusAsiUsed};
 }
 function eligible(data,level,feat,catalog,scores){
  if(!feat)return 'Feat unavailable';
  if(feat.minimumLevel>level)return `Requires level ${feat.minimumLevel}`;
  const F=typeof CharacterFeatRules!=='undefined'?CharacterFeatRules:require('./character-feat-rules');
  const definition=F.definitions[feat.id];
  const selected=(data.rulesChoices.feats||[]).map(id=>catalog.find(f=>f.id===id)).filter(Boolean);
  if(selected.some(f=>f.name===feat.name&&(!definition?.repeatable||f.edition!==feat.edition)))return 'This feat is already selected';
  const req=definition?.requirements||[];
  if(scores&&req.length&&!req.some(r=>level>=r.level&&(!r.ability.length||r.ability.some(a=>Object.entries(a).every(([k,v])=>scores[k]>=v)))))return 'Level / ability prerequisite is not met';
  if(data.build.edition==='2014'&&data.build.race==='variant-human'&&!data.build.raceFeat&&feat.edition==='2014')return '';
  const b=budget(data,level,catalog);
  if(feat.category==='FS')return b.style?'':'No available Fighting Style choice';
  if(feat.category==='O'&&b.lessons)return '';
  return b.remaining?'':'No available feat / ASI choice at this class level';
 }
 return {alignments,normalizeProfile:norm,normalizeAdvancement:advancement,budget,eligible};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterPlayRules;
