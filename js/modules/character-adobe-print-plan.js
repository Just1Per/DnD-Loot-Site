'use strict';
/* Pure page selection; rendering never changes the current page or character. */
var CharacterAdobePrintPlan=(()=>{
 function create({feats=0,magicItems=0,gear=0,equipmentNotes=0,notes=0,spells=0,spellPage=false,spellGroups=null,companions=[],wildForms=0,wildPage=false,logEntries=0,logPage=false,reference=false,actionOverflow=false,resourceOverflow=false,resourceNotes=false,hitDiceOverflow=false}={}){
  for(const n of [feats,magicItems,gear,equipmentNotes,notes,spells,wildForms,logEntries])if(!Number.isInteger(n)||n<0||n>100000)throw Error('The character has an invalid print-page count.');
  if(!Array.isArray(companions)||companions.length>12||companions.some(i=>!Number.isInteger(i)||i<0||i>11))throw Error('The companion print selection is invalid.');
  const groups=spellGroups===null?[{id:'all',count:spells}]:spellGroups;if(!Array.isArray(groups)||groups.length>160||groups.some(g=>!g||typeof g.id!=='string'||!g.id||g.id.length>100||!Number.isInteger(g.count)||g.count<0||g.count>100000)||new Set(groups.map(g=>g.id)).size!==groups.length)throw Error('The spell-caster print selection is invalid.');
  const extra=Math.max(0,Math.ceil((feats-4)/4),Math.ceil((magicItems-5)/5),Math.ceil((gear-90)/36),equipmentNotes),notePages=Math.max(0,Math.ceil(notes/2)-1),spellPages=groups.reduce((sum,g)=>sum+1+(g.count>55?Math.ceil((g.count-55)/70):0),0),wildPages=wildPage?Math.max(1,Math.ceil(wildForms/4)):0,logPages=logPage?Math.max(1,Math.ceil(logEntries/6)):0;
  if(5+(actionOverflow||resourceOverflow?1:0)+(hitDiceOverflow?1:0)+(resourceNotes?1:0)+extra+notePages+(spellPage?spellPages:0)+companions.length+wildPages+logPages+(reference?1:0)>400)throw Error('This character needs more than 400 paper pages. Print individual pages or use the Standard print view.');
  const pages=Array.from({length:5},(_,i)=>({page:'page-'+(i+1)}));
  if(resourceNotes)pages.push({page:'template-ASnotes',resourceNotes:true});
  if(hitDiceOverflow)pages.push({page:'template-ASnotes',hitDiceOverflow:true});
  if(actionOverflow||resourceOverflow)pages.push({page:'template-ASoverflow',combatOnly:true});
  for(let i=0;i<extra;i++)pages.push({page:'template-ASfront',extraPage:i});
  for(let i=0;i<notePages;i++)pages.push({page:'template-ASnotes',notesOffset:(i+1)*2});
  if(spellPage)for(const group of groups){pages.push({page:'template-SSfront',spellCaster:group.id});for(let i=0;i<Math.max(0,Math.ceil((group.count-55)/70));i++)pages.push({page:'template-SSmore',spellCaster:group.id,spellPage:i});}
  for(const companionIndex of companions)pages.push({page:'template-AScomp',companionIndex});
  for(let i=0;i<wildPages;i++)pages.push({page:'template-WSfront',wildPage:i});
  for(let i=0;i<logPages;i++)pages.push({page:'template-ALlog',logPage:i});
  if(reference)pages.push({page:'page-6'});
  return pages;
 }
 return {create};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobePrintPlan;
