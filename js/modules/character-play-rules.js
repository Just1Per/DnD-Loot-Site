/* Pure play helpers. Slots follow class levels, not multiclass total level. */
var CharacterPlayRules = (()=>{
 const alignments={
 'Lawful Good':'Acts with honor, compassion, and duty.', 'Neutral Good':'Helps others without strict allegiance to rules or rebellion.', 'Chaotic Good':'Fights injustice guided by personal conscience.',
 'Lawful Neutral':'Follows laws, traditions, or a personal code.', 'True Neutral':'Seeks balance or survival without a strong moral allegiance.', 'Chaotic Neutral':'Values personal freedom and resists authority.',
 'Lawful Evil':'Uses rules and hierarchies to exploit and oppress.', 'Neutral Evil':'Pursues personal benefit without remorse.', 'Chaotic Evil':'Acts through hatred, greed, and destructive violence.'};
 const norm=(raw={})=>({gender:['male','female','other'].includes(raw.gender)?raw.gender:'',age:Math.max(0,Math.min(100000,Number(raw.age)||0)),size:['small','medium','large'].includes(raw.size)?raw.size:'',height:Math.max(0,Math.min(100000,Number(raw.height)||0)),weight:Math.max(0,Math.min(100000,Number(raw.weight)||0)),hair:String(raw.hair||'').slice(0,200),eyes:String(raw.eyes||'').slice(0,200),skin:String(raw.skin||'').slice(0,200)});
 const advancement=(raw={})=>({asiSpent:Math.max(0,Math.min(7,Math.trunc(Number(raw.asiSpent)||0))),lessons:raw.lessons===true});
 function budget(data,level,catalog){
  const b=data.build||{},classId=b.classId,known=['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'].includes(classId),modern=b.edition==='2024';
  const levels=[4,8,12,16,19,...(classId==='fighter'?[6,14]:classId==='rogue'?[10]:[])].sort((a,b)=>a-b);
  const total=known?levels.filter(n=>n<=level).length:0,spent=advancement(data.advancement).asiSpent;
  const style=modern&&((classId==='fighter'&&level>=1)||(['paladin','ranger'].includes(classId)&&level>=2))?1:0;
  const lessons=modern&&classId==='warlock'&&level>=2&&data.advancement?.lessons?1:0;
  let generalUsed=spent,styleUsed=0,lessonUsed=0;
  for(const id of data.rulesChoices.feats){const f=catalog.find(v=>v.id===id);if(f?.category==='FS'&&styleUsed<style)styleUsed++;else if(f?.category==='O'&&lessonUsed<lessons)lessonUsed++;else generalUsed++;}
  return {total,remaining:Math.max(0,total-generalUsed),style:Math.max(0,style-styleUsed),lessons:Math.max(0,lessons-lessonUsed),over:Math.max(0,generalUsed-total),levels,known};
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
