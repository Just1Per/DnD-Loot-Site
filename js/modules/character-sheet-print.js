'use strict';
/* Read-only print views use current sheet data; the live editors stay untouched. */
var CharacterSheetPrint=(()=>{
 const esc=value=>sheetEscape(String(value??'')),sign=value=>CharacterSheetModel.signed(Number(value)||0);
 const prose=value=>'<p class="sheet-paper-text">'+esc(value||'—')+'</p>';
 const block=(title,content)=>'<section class="sheet-paper-block"><h3>'+esc(title)+'</h3>'+content+'</section>';
 const table=(head,rows)=>'<table class="sheet-paper-table"><thead><tr>'+head.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr'+(row.join('').length>2000?' class="sheet-paper-long-row"':'')+'>'+row.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const facts=rows=>'<dl class="sheet-paper-facts">'+rows.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value??'—')+'</dd></div>').join('')+'</dl>';
 // Copy reference prose, never event handlers, IDs, catalog options or edit controls.
 function reference(selector){
  const source=document.querySelector(selector);if(!source)return'';
  const copy=source.cloneNode(true);
  copy.querySelectorAll('button,input,select,textarea,.sheet-help,.sheet-feature-overview-controls').forEach(node=>node.remove());
  [copy,...copy.querySelectorAll('*')].forEach(node=>{node.removeAttribute('id');node.removeAttribute('hidden');node.removeAttribute('style');if(node.tagName==='DETAILS')node.setAttribute('open','');});
  copy.querySelectorAll('h3,h4').forEach(heading=>{heading.textContent=heading.textContent.replace(/[\p{Extended_Pictographic}\uFE0F]/gu,'').trim();});
  return copy.innerHTML;
 }
 function slots(data,d){
  const ordinary=(d.effects.slotMax||[]).flatMap((max,i)=>max?[[String(i+1),String(max),String(Math.max(0,max-(data.slots[i]?.used||0)))]]:[]),pact=d.progression?.pact;
  return '<div class="sheet-paper-slot-pools">'+(ordinary.length?block('Spellcasting slots'+(d.progression.spellAccess.filter(c=>c.classId!=='warlock').length>1?' · Shared pool':''),facts(ordinary.map(([level,total,available])=>['Level '+level,available+' / '+total+' available']))):'')+(pact?block('Warlock · Pact Magic',facts([['Slot level',pact.slotLevel],['Available',(pact.count-pact.used)+' / '+pact.count],['Recovery','Short or long rest']])):'')+'</div>';
 }
 function skills(data,d){
  const abilities=Object.entries(CharacterSheetModel.abilities).map(([key,name])=>[esc(name),esc(data.abilities[key]),esc(d.scores[key]),sign(d.mods[key]),sign(d.saves[key])]);
  const checks=Object.entries(CharacterSheetModel.skills).map(([key,[name,ability]])=>{const rank=Math.max(data.skills[key].rank,d.effects.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0);return[esc(name),esc(ability.toUpperCase()),esc(rank===2?'Expertise':rank===1?'Proficient':rank===.5?'Half':'—'),sign(d.skills[key])];});
  return facts([['Score method',data.build.scoreMethod==='pointBuy'?'Point buy':'Manual / rolled'],['Proficiency bonus',sign(d.pb)],['Passive perception',d.passive]])+block('Abilities & saving throws',table(['Ability','Base','Total','Modifier','Save'],abilities))+block('Skills',table(['Skill','Ability','Training','Total'],checks));
 }
 function combat(data,d){
  const attacks=[...(d.gear.attacks||[]).filter(a=>a.equipped).map(a=>[esc(a.name),a.attack===null?'—':sign(a.attack),esc(a.damage),esc(a.range)]),...data.attacks.map((a,i)=>[esc(a.name),sign(d.attacks[i]),esc(a.damage),esc(a.range)]),...d.actions.map(a=>[esc(a.name)+(a.available?'':' (unavailable)'),esc(a.hit),esc(a.damage),esc(a.range)])];
  const notes=[...data.attacks.filter(a=>a.notes).map(a=>block(a.name,prose(a.notes))),...d.actions.filter(a=>a.notes?.length).map(a=>block(a.name,prose(a.notes.join('\n'))))].join('');
  return facts([['Armor Class',d.ac],['Maximum HP',d.hpMax],['Initiative',sign(d.initiative)],['Speed',d.effects.speed+' ft'],['Proficiency',sign(d.pb)],['Hit dice',d.progression.hitDice],['Death saves',data.deathSuccess+' successes / '+data.deathFailure+' failures']])+block('Defenses',prose(d.gear.baseLabel+' '+d.gear.base+' · Shield '+d.gear.shield+' · Items '+sign(d.gear.bonus)+' · Defense '+sign(d.gear.defense)+' · Adjustment '+sign(d.gear.adjustment)))+block('Hit points',reference('#sheetHPDefense'))+block('Attacks & actions',attacks.length?table(['Name','To hit / save','Damage','Range'],attacks):prose('No attacks recorded.'))+notes+block('Conditions & resistances',prose([data.conditions,...d.effects.resistances,data.resistances].filter(Boolean).join('\n')))+block('Features & resources',prose(data.resources||data.features)+(d.feats.reports||[]).map(r=>{const resource=CharacterFeatRules.resource(r.def,d.progression.targetLevel);return resource?facts([[r.def.name+' · '+resource.label,Math.max(0,resource.max-r.choice.used)+' / '+resource.max]]):'';}).join(''));
 }
 function spells(data,d){
  const profiles=CharacterSpellcasting.profiles(data,d.progression.targetLevel,d.scores),ids=new Set(profiles.map(p=>p.classId));
  const groups=profiles.map(p=>({p,rows:data.spells.filter(s=>s.classId===p.classId)}));
  const unassigned=data.spells.filter(s=>!ids.has(s.classId));if(unassigned.length)groups.push({p:null,rows:unassigned});
  return slots(data,d)+groups.map(({p,rows})=>{
   const stats=p?CharacterSpellcasting.castingStats(p,d,data):null,counts=p?CharacterSpellcasting.selectionCounts(p,rows,CharacterCatalog.rawData?.spells||[]):null;
   const header=p?facts([['Class level',p.level],['Rules',p.edition],['Ability',CharacterSheetModel.abilities[stats.ability]+' '+sign(stats.modifier)],['Spell attack',sign(stats.attack)],['Save DC',stats.dc],['Cantrips',counts.cantrips+' / '+p.cantrips],['Prepared / known',(p.mode==='known'?counts.leveled:counts.prepared)+' / '+p.spellCount],['Always prepared (extra)',counts.automatic]]):prose('Class not assigned.');
   const grants=p?new Set(CharacterSpellcasting.automaticGrants(p,CharacterCatalog.rawData?.spells||[]).map(s=>s.id)):new Set();
   const list=[...rows].sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name)).map(s=>{const catalog=CharacterCatalog.find(s.catalogId),description=(catalog?.description||catalog?.shortDescription||s.notes||'')+(catalog&&s.notes&&s.notes!==CharacterCatalog.spellRow(catalog).notes?'\n\nPlayer notes:\n'+s.notes:'');return '<tr'+(String(description||'').length>1600?' class="sheet-paper-long-row"':'')+'><td>'+esc(s.level||'C')+'</td><td><strong>'+esc(s.name)+'</strong><small>'+esc(s.level===0?'Cantrip':grants.has(s.catalogId)?'Always prepared':s.prepared?'Prepared':p?.mode==='known'?'Known':'Not prepared')+' · Time: '+esc(s.casting)+'</small>'+prose(description)+'</td><td>'+esc(s.range)+'</td><td>'+esc(s.duration)+'<small>'+esc(s.components)+'</small></td></tr>';}).join('');
   return '<section class="sheet-paper-class-spells" data-paper-spell-class="'+esc(p?.classId||'unassigned')+'">'+block(p?p.name+' spell sheet':'Other / unassigned spells',header+(rows.length?'<table class="sheet-paper-table sheet-paper-spells"><colgroup><col class="paper-spell-level"><col class="paper-spell-description"><col class="paper-spell-range"><col class="paper-spell-duration"></colgroup><thead><tr><th colspan="4" class="sheet-paper-table-class">'+esc(p?.name||'Unassigned')+' spells · '+esc(sheetSession.identity.name)+'</th></tr><tr><th>Lv</th><th>Spell & description</th><th>Range</th><th>Duration / components</th></tr></thead><tbody>'+list+'</tbody></table>':prose('No spells selected.')))+'</section>';
  }).join('');
 }
 function inventory(data,d){
  const rows=sheetEquipmentLoot().map(entry=>{const item=entry.item||{},gear=d.gear.entries.find(g=>g.entry.id===entry.id),personal=data.personalGear.find(g=>g.id===entry.id);return [esc(item.name||personal?.name||'Item')+prose(personal?.notes||item.description),esc(entry.quantity),esc(personal?.location||'Active gear'),esc(personal?.weight??item.weight??'—'),esc([gear?.choice.equipped?'Worn':'Not worn',gear?.choice.attuned?'Attuned':''].filter(Boolean).join(' · '))];});
  return facts(Object.entries(data.coins).map(([key,value])=>[key.toUpperCase(),value]))+block('Equipment & treasure',rows.length?'<div class="sheet-paper-inventory">'+table(['Item & notes','Qty','Location','Weight','Status'],rows)+'</div>':prose('No items recorded.'))+block('Equipment notes',prose(data.equipment));
 }
 function builder(data,d){
  const classes=d.progression.classLevels;
  const features=classes.map(c=>{const subclass=CharacterSubclassData.find(c.subclassId),groups=CharacterClassProgression.byLevel(c.classId,c.level,c.subclassId,data.build.edition),choices=CharacterClassFeatureChoices.groups(c,data.build.edition).map(g=>[g.name||g.label||g.id,CharacterClassFeatureChoices.selections(data,g).map(id=>g.options.find(o=>o.id===id)?.name||id).filter(Boolean).join(', ')||'Not selected']);
   return block(CharacterAdobeEngine.className(c.classId)+' · Level '+c.level,facts([['Subclass',subclass?.name||'—'],...choices])+Object.entries(groups).map(([level,items])=>'<div class="sheet-paper-feature-group"><h4>Level '+esc(level)+'</h4>'+items.map(f=>'<div class="sheet-paper-feature"><strong>'+esc(f.name)+'</strong>'+prose(f.summary||'Source reference')+(f.action||f.recharge?'<small>'+esc([f.action,f.recharge].filter(Boolean).join(' · '))+'</small>':'')+'</div>').join('')+'</div>').join(''));
  }).join('');
  return block('Character choices',facts([['Rules',data.build.edition],['Species',d.effects.race?.name||data.species||'—'],['Background',CharacterBackgrounds.get(data.build.background)?.name||data.background||'—']])+reference('#sheetBuildSummaryContent'))+features;
 }
 function feats(data,d){return d.feats.reports.length?d.feats.reports.map(r=>block((r.def.displayName||r.def.name)+' · '+r.def.edition,prose(featOverviewDescription(r.id))+facts([['Ability choices',r.choice.abilities.filter(Boolean).map(k=>CharacterSheetModel.abilities[k]).join(', ')||'—'],['Training choices',r.choice.training.filter(Boolean).join(', ')||'—'],['Expertise',r.choice.expertise||'—']])+(r.automated.length?prose('Applied effects: '+r.automated.join('; ')):'')+(r.warnings.length?prose('Notes: '+r.warnings.join('\n')):''))).join(''):prose('No feats selected.');}
 function story(data){return (data.adobe.portrait?'<img class="sheet-paper-portrait" src="'+esc(data.adobe.portrait)+'" alt="Character portrait">':'')+facts([['Gender',data.profile.gender],['Age',data.profile.age],['Size',data.profile.size],['Height (cm)',data.profile.height],['Weight (kg)',data.profile.weight],['Hair',data.profile.hair],['Eyes',data.profile.eyes],['Skin',data.profile.skin],['Alignment',data.alignment]])+['appearance','allies','enemies','personality','ideals','bonds','flaws','backstory'].map(key=>block(({allies:'Allies & organizations',backstory:'Backstory'})[key]||key[0].toUpperCase()+key.slice(1),prose(data[key]))).join('');}
 function notes(data){const groups=new Map();for(const n of data.adobe.journal){if(!groups.has(n.category))groups.set(n.category,[]);groups.get(n.category).push(n);}return [...groups].map(([category,rows])=>'<section class="sheet-paper-note-category"><h3>'+esc(category)+'</h3>'+rows.map(n=>'<article class="sheet-paper-note"><h4>'+esc(n.title)+'</h4>'+prose(n.text)+'</article>').join('')+'</section>').join('')||prose('No journal notes recorded.');}
 function companions(data,d){return '<div class="sheet-paper-companions">'+data.adobe.companions.map(c=>{const wild=c.type==='wildshape',pb=wild?d.pb:c.profBonus,score=k=>wild&&['int','wis','cha'].includes(k)?d.scores[k]:c.abilities[k];const skills=Object.entries(CharacterSheetModel.skills).flatMap(([key,[name,ability]])=>{const rank=wild?Math.max(c.skillRank[key],data.skills[key].rank,d.effects.skills.includes(key)?1:0,d.feats.expertise.includes(key)?2:0):c.skillRank[key],bonus=c.skillBonus[key];return rank||bonus?[[esc(name),sign(CharacterSheetModel.mod(score(ability))+rank*pb+bonus)]]:[]});return '<article class="sheet-paper-companion'+(c.notes.length+c.traits.length+c.attacks.length>2000?' sheet-paper-companion-long':'')+'">'+block(c.name||c.creature||'Companion',facts([['Creature',c.creature],['Type',c.type],['Size',c.size],['AC',c.ac],['Maximum HP',c.hpMax],['Speed',c.speed+' ft'],['Proficiency',sign(pb)],['Initiative',sign(CharacterSheetModel.mod(score('dex'))+c.initiativeBonus)]])+table(['Ability','Score','Modifier','Save'],Object.keys(CharacterSheetModel.abilities).map(k=>[k.toUpperCase(),esc(score(k)),sign(CharacterSheetModel.mod(score(k))),sign(CharacterSheetModel.mod(score(k))+(c.saveProficient[k]?pb:0))]))+(skills.length?block('Trained skills',table(['Skill','Total'],skills)):'')+block('Attacks',prose(c.attacks))+block('Traits & features',prose(c.traits))+block('Notes & manual adjustments',prose(c.notes)))+'</article>';}).join('')+'</div>';}
 const renderers={skills,combat,spells,inventory,builder,feats,story,notes,companion:companions,rules:()=>reference('#sheet-rules .sheet-rules-grid')};
 function clear(){document.querySelectorAll('#characterSheetDialog .sheet-paper-page').forEach(node=>node.remove());document.querySelectorAll('#characterSheetDialog .sheet-has-paper-view').forEach(node=>node.classList.remove('sheet-has-paper-view'));document.getElementById('sheet-overview')?.classList.remove('sheet-paper-overview-following');}
 function prepare(selected){
  clear();const s=sheetSession;if(!s)return;
  const d=CharacterSheetModel.derive(s.data,s.identity.level,sheetEquipmentLoot());
  let seenSelected=false;
  for(const panel of document.querySelectorAll('#characterSheetDialog [data-sheet-section]')){
   const key=panel.dataset.sheetSection;if(selected instanceof Set&&!selected.has(key))continue;if(key==='overview'){if(seenSelected)panel.classList.add('sheet-paper-overview-following');seenSelected=true;continue;}
   const render=renderers[key];if(!render)continue;
   const page=document.createElement('section');page.className='sheet-paper-page';page.dataset.paperSection=key;
   const label=sheetPrintPageOptions().find(p=>p.key===key)?.label||key;
   page.innerHTML='<header class="sheet-paper-header"><div><small>CHARACTER SHEET · '+esc(s.data.build.edition)+'</small><h2>'+esc(s.identity.name||'Unnamed adventurer')+'</h2><p>'+esc(s.identity.class||'Adventurer')+' · Level '+s.identity.level+'</p></div><h2>'+esc(label)+'</h2></header>'+render(s.data,d);
   if(!seenSelected)page.classList.add('sheet-paper-first');seenSelected=true;panel.classList.add('sheet-has-paper-view');panel.after(page);
  }
 }
 return{prepare,clear};
})();
