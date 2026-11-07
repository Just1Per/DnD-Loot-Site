'use strict';
/* Stable live-sheet destinations. Print-only notes do not become editable copies. */
var CharacterAdobeStackPlan=(()=>{
 const fields=['page','extraPage','notesOffset','logPage','spellCaster','spellPage','companionIndex','wildPage'];
 const key=plan=>JSON.stringify(fields.map((field,index)=>plan[field]??(index===0?'':field==='spellCaster'?'all':0)));
 function merge(plans,extra){const seen=new Set(plans.map(key)),out=[...plans,...extra.filter(plan=>{const id=key(plan);if(seen.has(id))return false;seen.add(id);return true;})];if(out.length>400)throw Error('This character needs more than 400 connected pages.');return out;}
 function create(plans,{titles={},className=id=>id,companions=[]}={}){
  if(!Array.isArray(plans)||plans.length>400)throw Error('The connected sheet list is invalid.');const seen=new Set(),out=[];
  for(const raw of plans){if(!raw||typeof raw.page!=='string'||!Object.hasOwn(titles,raw.page))throw Error('Unknown connected sheet.');if(raw.resourceNotes||raw.hitDiceOverflow)continue;const plan={};for(const field of fields)if(raw[field]!==undefined)plan[field]=raw[field];const id=key(plan);if(seen.has(id))continue;seen.add(id);let title=titles[plan.page];if(plan.spellCaster&&plan.spellCaster!=='all')title=(plan.spellCaster==='unassigned'?'Unassigned spells':className(plan.spellCaster))+' · '+title;if(plan.page==='template-SSmore')title+=' '+((plan.spellPage||0)+2);if(plan.page==='template-AScomp')title+=' · '+(companions[plan.companionIndex||0]?.name||companions[plan.companionIndex||0]?.creature||'Companion '+((plan.companionIndex||0)+1));if(plan.page==='template-ASfront')title+=' '+((plan.extraPage||0)+1);if(plan.page==='template-ASnotes')title+=' '+((plan.notesOffset||0)/2+1);if(plan.page==='template-ALlog')title+=' '+((plan.logPage||0)+1);if(plan.page==='template-WSfront')title+=' '+((plan.wildPage||0)+1);out.push({key:id,plan,title});}
  return out;
 }
 function shortcuts(pages){const first=id=>pages.find(row=>row.plan.page===id),out=[];const add=(id,label,page,field,button)=>{const target=first(page);if(target)out.push({id,label,key:target.key,field,button});};
  add('character','Character','page-1','PC Name');add('abilities','Abilities','page-1','Str');add('skills','Skills','page-1','Acr');add('attacks','Attacks','page-1','Attack.1.Weapon Selection');add('features','Features','page-2','Class Features');add('inventory','Inventory','page-2','Adventuring Gear Row 1');add('feats','Feats & magic items','page-3','Feat Name 1');add('background','Background','page-4','Character History');add('notes','Notes','page-5','Notes.Left');add('slots','Spell slots','template-SSfront',null,'Image.SpellSlots.Checkboxes.1');add('spells','Spells','template-SSfront','spells.name.1');return out;
 }
 return{key,create,shortcuts,merge};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobeStackPlan;
