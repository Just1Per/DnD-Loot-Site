'use strict';
/* Stable live-sheet destinations. Print-only notes do not become editable copies. */
var CharacterAdobeStackPlan=(()=>{
 const fields=['page','extraPage','notesOffset','logPage','spellCaster','spellPage','companionIndex','wildPage'];
 const key=plan=>JSON.stringify(fields.map((field,index)=>plan[field]??(index===0?'':field==='spellCaster'?'all':0)));
 const pageIds=new Set(['page-1','page-2','page-3','page-4','page-5','page-6','template-ASfront','template-ASoverflow','template-ASbackgr','template-AScomp','template-ASnotes','template-ALlog','template-WSfront','template-SSfront','template-SSmore','template-PRsheet','template-blank']);
 const bounds={extraPage:399,notesOffset:298,logPage:19,spellPage:399,companionIndex:11,wildPage:4};
 function cleanPlan(raw){
  if(!raw||typeof raw!=='object'||!pageIds.has(raw.page))return null;
  const plan={page:raw.page};
  for(const field of fields.slice(1))if(raw[field]!==undefined){
   const value=raw[field];
   if(field==='spellCaster'){if(typeof value!=='string'||!/^[a-z][a-z0-9-]{0,59}$/.test(value))return null;}
   else if(!Number.isInteger(value)||value<0||value>bounds[field]||field==='notesOffset'&&value%2)return null;
   plan[field]=value;
  }
  return plan;
 }
 function normalizeLayout(raw){
  const list=(value,max,optional=false)=>{const out=[],seen=new Set();for(const entry of Array.isArray(value)?value.slice(0,max):[]){const plan=cleanPlan(entry);if(!plan||optional&&(!plan.page.startsWith('template-')||(plan.extraPage||0)>29||(plan.spellPage||0)>29)||seen.has(key(plan)))continue;seen.add(key(plan));out.push(plan);}return out;};
  return{hidden:list(raw?.hidden,400),added:list(raw?.added,40,true),includeHiddenPrint:raw?.includeHiddenPrint===true};
 }
 function visible(plans,raw,{printing=false}={}){
  const layout=normalizeLayout(raw);if(printing&&layout.includeHiddenPrint)return [...plans];
  const hidden=new Set(layout.hidden.map(key)),editable=plans.filter(p=>!p.resourceNotes&&!p.hitDiceOverflow);
  // Even a stale or imported layout must leave a destination available.
  if(editable.length&&!editable.some(p=>!hidden.has(key(p))))hidden.delete(key(editable[0]));
  const mainVisible=!hidden.has(key({page:'page-1'})),resourceVisible=mainVisible||editable.some(p=>p.page==='template-ASoverflow'&&!hidden.has(key(p)));
  return plans.filter(p=>p.resourceNotes?!printing||resourceVisible:p.hitDiceOverflow?!printing||mainVisible:!hidden.has(key(p)));
 }
 function merge(plans,extra){const seen=new Set(plans.map(key)),out=[...plans,...extra.filter(plan=>{const id=key(plan);if(seen.has(id))return false;seen.add(id);return true;})];if(out.length>400)throw Error('This character needs more than 400 connected pages.');return out;}
 function create(plans,{titles={},className=id=>id,companions=[]}={}){
  if(!Array.isArray(plans)||plans.length>400)throw Error('The connected sheet list is invalid.');const seen=new Set(),out=[];
  for(const raw of plans){if(!raw||typeof raw.page!=='string'||!Object.hasOwn(titles,raw.page))throw Error('Unknown connected sheet.');if(raw.resourceNotes||raw.hitDiceOverflow)continue;const plan={};for(const field of fields)if(raw[field]!==undefined)plan[field]=raw[field];const id=key(plan);if(seen.has(id))continue;seen.add(id);let title=titles[plan.page];if(plan.spellCaster&&plan.spellCaster!=='all')title=(plan.spellCaster==='unassigned'?'Unassigned spells':className(plan.spellCaster))+' · '+title;if(plan.page==='template-SSmore')title+=' '+((plan.spellPage||0)+2);if(plan.page==='template-AScomp')title+=' · '+(companions[plan.companionIndex||0]?.name||companions[plan.companionIndex||0]?.creature||'Companion '+((plan.companionIndex||0)+1));if(plan.page==='template-ASfront')title+=' '+((plan.extraPage||0)+1);if(plan.page==='template-ASnotes')title+=' '+((plan.notesOffset||0)/2+1);if(plan.page==='template-ALlog')title+=' '+((plan.logPage||0)+1);if(plan.page==='template-WSfront')title+=' '+((plan.wildPage||0)+1);out.push({key:id,plan,title});}
  return out;
 }
 function shortcuts(pages){const first=id=>pages.find(row=>row.plan.page===id),out=[];const add=(id,label,page,field,button)=>{const target=first(page);if(target)out.push({id,label,key:target.key,field,button});};
  add('character','Character','page-1','PC Name');add('abilities','Abilities','page-1','Str');add('skills','Skills','page-1','Acr');add('attacks','Attacks','page-1','Attack.1.Weapon Selection');add('features','Features','page-2','Class Features');add('inventory','Inventory','page-2','Adventuring Gear Row 1');add('feats','Feats & magic items','page-3','Feat Name 1');add('background','Background','page-4','Character History');add('notes','Notes','page-5','Notes.Left');add('slots','Spell slots','template-SSfront',null,'Image.SpellSlots.Checkboxes.1');add('spells','Spells','template-SSfront','spells.name.1');return out;
 }
 return{key,create,shortcuts,merge,cleanPlan,normalizeLayout,visible};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterAdobeStackPlan;
