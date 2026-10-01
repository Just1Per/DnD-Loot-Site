'use strict';
/* Optional spell/companion/reference pages and feat/spell presentation. */
(()=>{
 const E=CharacterAdobeEngine,A=E.A,MENTAL=new Set(['int','wis','cha']);
 function setupPages(){const d=document.getElementById('characterSheetDialog');if(!d||document.getElementById('sheet-companion'))return;const body=d.querySelector('.sheet-body'),f=sheetField,c=document.createElement('section');c.id='sheet-companion';c.className='sheet-panel';c.dataset.sheetSection='companion';c.setAttribute('role','tabpanel');c.innerHTML=`<h3>Companion / Familiar / Wild Shape</h3><p class="sheet-help">Uses the Adobe companion stat groups. Wild Shape keeps your character's mental ability scores and uses the better applicable skill training.</p><div class="sheet-grid">${f('Type','adobe.companion.type','select',{values:[['companion','Companion'],['familiar','Familiar'],['wildshape','Wild Shape']]})}${f('Name','adobe.companion.name')}${f('Creature / form','adobe.companion.creature')}${f('Size','adobe.companion.size','select',{values:[['Tiny','Tiny'],['Small','Small'],['Medium','Medium'],['Large','Large'],['Huge','Huge']]})}${f('Proficiency bonus','adobe.companion.profBonus','number',{min:0,max:10})}${f('Armor Class','adobe.companion.ac','number',{min:0})}${f('Maximum HP','adobe.companion.hpMax','number',{min:0})}${f('Current HP','adobe.companion.hpCurrent','number',{min:0})}${f('Temporary HP','adobe.companion.hpTemp','number',{min:0})}${f('Speed','adobe.companion.speed','number',{min:0})}${f('Initiative bonus','adobe.companion.initiativeBonus','number')}</div><h4>Abilities & saves</h4><div class="sheet-abilities">${A.map(k=>`<article class="sheet-ability"><h4>${CharacterSheetModel.abilities[k]}</h4>${f('Score',`adobe.companion.abilities.${k}`,'number',{min:1,max:30})}${f('Save proficient',`adobe.companion.saveProficient.${k}`,'checkbox')}<p><strong data-comp-mod="${k}"></strong></p></article>`).join('')}</div><h4>Skills</h4><div class="sheet-companion-skills">${Object.entries(CharacterSheetModel.skills).map(([k,[name,ability]])=>`<div class="sheet-skill-edit"><span>${name} <small>${ability.toUpperCase()}</small></span>${f('Training',`adobe.companion.skillRank.${k}`,'select',{values:[[0,'None'],[1,'Proficient'],[2,'Expertise']]})}${f('Bonus',`adobe.companion.skillBonus.${k}`,'number')}<output data-comp-skill="${k}"></output></div>`).join('')}</div><div class="sheet-grid two">${f('Attacks','adobe.companion.attacks','textarea',{rows:5})}${f('Traits & features','adobe.companion.traits','textarea',{rows:5})}${f('Notes','adobe.companion.notes','textarea',{rows:5})}</div>`;body.append(c);
  const rules=document.createElement('section');rules.id='sheet-rules';rules.className='sheet-panel';rules.dataset.sheetSection='rules';rules.setAttribute('role','tabpanel');rules.innerHTML='<h3>Player rules reference</h3><p class="sheet-help">A compact reference following the Adobe sheet categories. Use your campaign rules source when editions differ.</p><div class="sheet-rules-grid"><section><h4>Combat actions</h4><p>Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search and other actions use the action economy defined by your rules edition.</p></section><section><h4>Movement</h4><p>Movement can be split around actions. Difficult terrain, crawling, climbing and swimming can cost extra movement. Standing from prone costs movement.</p></section><section><h4>Cover & vision</h4><p>Cover improves defenses or prevents direct targeting. Light, darkness, Darkvision, Blindsight and Truesight change perception.</p></section><section><h4>Conditions</h4><p>Track Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned and Unconscious from your chosen rules.</p></section><section><h4>Rest & travel</h4><p>Short and long rests recover different resources. Travel pace, forced marching, food, water, falling and suffocation can impose checks, damage or exhaustion.</p></section></div>';body.append(rules);
  const nav=d.querySelector('.sheet-tabs'),plus=document.createElement('details');plus.id='sheetAddPageMenu';plus.className='sheet-add-page-menu';plus.innerHTML='<summary aria-label="Add character sheet page">+</summary><div><button type="button" data-page="spells">Spell sheet</button><button type="button" data-page="companion">Companion / Familiar / Wild Shape</button><button type="button" data-page="rules">Player rules</button></div>';nav.append(plus);plus.querySelectorAll('[data-page]').forEach(b=>b.onclick=e=>{e.preventDefault();readSheetForm();sheetSession.data.adobe.pages[b.dataset.page]=true;sheetSession.dirty=true;updateSheetCalculations();selectSheetTab(b.dataset.page);sheetStatus('Page added. Save the sheet to keep it.')})}
 function ensureTab(k,label){const nav=document.querySelector('#characterSheetDialog .sheet-tabs');let b=nav?.querySelector(`[data-sheet-tab="${k}"]`);if(!b&&nav){b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.dataset.sheetTab=k;b.textContent=label;b.setAttribute('aria-selected','false');b.tabIndex=-1;nav.querySelector('#sheetAddPageMenu')?.before(b);b.onclick=()=>selectSheetTab(k)}return b}
 function updatePages(d){const s=sheetSession,root=document.getElementById('characterSheetDialog');if(!root)return;const spell=root.querySelector('[data-sheet-tab="spells"]'),showSpell=d.progression.isSpellcaster||s.data.adobe.pages.spells;if(spell)spell.hidden=!showSpell;const cb=ensureTab('companion','Companion'),rb=ensureTab('rules','Rules');if(cb)cb.hidden=!s.data.adobe.pages.companion;if(rb)rb.hidden=!s.data.adobe.pages.rules;if(root.querySelector('[data-sheet-tab][aria-selected="true"]')?.hidden)selectSheetTab('overview');const active=root.querySelector('[data-sheet-tab][aria-selected="true"]')?.dataset.sheetTab||'overview',cp=document.getElementById('sheet-companion'),rp=document.getElementById('sheet-rules');if(cp)cp.hidden=active!=='companion';if(rp)rp.hidden=active!=='rules';const addSpell=root.querySelector('[data-page="spels"]');if(addSpell)addSpell.disabled=showSpell;const addComp=root.querySelector('[data-page="companion"]');if(addComp)addComp.disabled=s.data.adobe.pages.companion;const addRules=root.querySelector('[data-page="rules"]');if(addRules)addRules.disabled=s.data.adobe.pages.rules}
 function companion(d){const s=sheetSession,if(!s)return;const c=s.data.adobe.companion,pb=c.type==='wildshape'?d.pb:c.profBonus,charRank={};for(const k of Object.keys(CharacterSheetModel.skills))charRank[k]=Math.max(s.data.skills[k].rank,d.effects.skills.includes(k)?1:0,d.feats.expertise.includes(k)?2:0);for(const k of A){const score=c.type==='wildshape'&&MENTAL.has(k)?d.scores[k]:c.abilities[k],input=document.querySelector(`[name="adobe.companion.abilities.${k}"]`);if(input){input.readOnly=c.type==='wildshape'&&MENTAL.has(k);if(input.readOnly)input.value=score}const out=document.querySelector(`[data-comp-mod="${k}"]`);if(out)out.textContent=`Mod ${CharacterSheetModel.signed(CharacterSheetModel.mod(score))} Â· Save ${CharacterSheetModel.signed(CharacterSheetModel.mod(score)+(c.saveProficient[k]?pb:0))}`}for(const [k,[,ability]] of Object.entries(CharacterSheetModel.skills)){const score=c.type==='wildshape'&&MENTAL.has(ability)?d.scores[ability]:c.abilities[ability],rank=c.type==='wildshape'?Math.max(c.skillRank[k]||0,charRank[k]||0):c.skillRank[k]||0,total=CharacterSheetModel.mod(score)+rank*pb+(c.skillBonus[k]||0),out=document.querySelector(`[data-comp-skill="${k}"]`);if(out)out.textContent=CharacterSheetModel.signed(total)}}
 function cleanFeats(){const host=document.getElementById('catalogSelectedFeats');if(!host)return;const title=host.querySelector('h4');if(title)title.textContent='Selected feats';const intro=title?.nextElementSibling;if(intro?.tagName==='P')intro.textContent='Choose and configure feats here. Their useful calculated effects appear on the relevant sheet pages.';host.querySelector(':scope > .sheet-actions')?.remove();host.querySelectorAll('[data-feat-use]').forEach(x=>x.remove())}
 function overview(d){const s=sheetSession,root=document.getElementById('sheetOverviewReadout');if(!root)return;const p=root.querySelector('.sheet-summary-identity > div > p');if(p)p.textContent=`${d.progression.classLevels.map(e=>`${E.className(e.classId)} ${e.level}`).join(' / ')||s.identity.class} Â· Level ${d.progression.targetLevel} Â· ${s.data.build.edition}`;for(const dt of root.querySelectorAll('dt'))if(dt.textContent.trim()==='Experience')dt.parentElement.hidden=!s.data.adobe.useExperience;for(const sec of root.querySelectorAll('.sheet-summary-box')){const h=sec.querySelector('h4');if(!h?.textContent.startsWith('Features & resources'))continue;const lines=[];for(const x of d.feats?.reports||[]){if(x.warnings?.length)continue;const name=x.def?.name||x.id;if(name==='Tough'[™\Ëœ\Ú
İYÚˆ	ĞÚ\˜Xİ\”ÚY][Ù[œÚYÛ™Y
Š˜Kœ›ÙÜ™\ÜÚ[Û‹\™Ù]]™[
_HX^[][H
NÙ[ÙHYŠ˜[YOOOIÔØ]˜YÙH]XÚÙ\‰Ê[[™\Ëœ\Ú
	ÔØ]˜YÙH]XÚÙ\ˆÛ˜ÙK\\‹]\›ˆÙX\Ûˆ[XYÙH™[™Yš]	ÊNÙ[Ù^ØÛÛœİ[\J˜]]ÛX]Y×JK™š[\ŠO‹Ú[š]X]]™_X^[][HØ[Ú[™ÈÜYYXÈ
ß˜[™ÙYÙX\Ûˆ]XÚßØ]š[™È›İßY\ÚYÚÚK\İ

JNÚYŠ[\›[™İ
[[™\Ëœ\Ú
	Û˜[Y_Nˆ	Ú[\œÛXÙJŠKš›Ú[Š	È0­È	Ê_X
__\ÙXËš[›™\’SX’Ù^H™X]Y™™XİÏÚ‰Û[™\ËœÛXÙJŠK›X\
O˜‰ÜÚY]\ØØ\J
_OÜ˜
Kš›Ú[Š	ÉÊ_	Ï¸ %Ü‰ßOÛ\ÜÏHœÚY]\[K]^‰ÜÚY]\ØØ\JË™]Kœ™\Ûİ\˜Ù\ßË™]K™™X]\™\ß	ÉÊ_OÜ˜_Bˆ[˜İ[ÛˆÜ[š[\Š
^ØÛÛœİÜİYØİ[Y[™Ù][[Y[RY
	ØØ][ÙÔÜ[™\İ[ÉÊNÚYŠZÜİ\ÚY]Ù\ÜÚ[ÛŸPÚ\˜Xİ\Ø][ÙË™]J\™]\›ØÛÛœİ˜[YOZYO™Øİ[Y[™Ù][[Y[RY
Y
OË˜[Y_	ÉËY][Û]˜[YJ	ØØ][ÙÔÜ[Y][Û‰ÊKÙX\˜Ú]˜[YJ	ØØ][ÙÔÜ[ÙX\˜Ú	ÊK]]˜[YJ	ØØ][ÙÔÜ[]™[	ÊKÙ]˜[YJ	ØØ][ÙÔÜ[Û\ÜÉÊK[YØİ[Y[™Ù][[Y[RY
	ØØ][ÙÔÜ[œ›İÜÙP[	ÊOË˜ÚXÚÙYPÚ\˜Xİ\”ÚY][Ù[™\š]™JÚY]Ù\ÜÚ[Û‹™]KÚY]Ù\ÜÚ[Û‹šY[]K›]™[
NÛ]›İÜÎÚYŠ[
\›İÜÏPÚ\˜Xİ\Ø][ÙËœÜ[ÊÙY][Û‹Û\ÜÒY˜Ù‹]™[›]‹ÙX\˜ÚJNÙ[Ù^ØÛÛœİX\[™]ÈX\

NÙ›ÜŠÛÛœİHÙˆœ›ÙÜ™\ÜÚ[Û‹œÜ[XØÙ\ÜË™š[\ŠOˆXÙŸ˜Û\ÜÒYOOXÙŠJY›ÜŠÛÛœİÜÙˆÚ\˜Xİ\Ø][ÙËœÜ[ÊÙY][Û‹Û\ÜÒY˜K˜Û\ÜÒYÙX\˜ÚJJZYŠÜ›]™[XK›X^Ü[]™[	‰Š]OOIÉß
Û]OO\Ü›]™[
J[X\œÙ]
ÜšYÜ
NÜ›İÜÏVË‹‹›X\˜[Y\Ê
WKœÛÜ

KŠOO˜K›]™[X‹›]™[K›˜[YK›ØØ[PÛÛ\\™J‹›˜[YJJ_ZÜİš[›™\’SX‰Ü›İÜË›[™İHX]Ú\ÉØ[ÉÈ0­Èœ›İÜÙKX[İ™\œšYK‰Î‰È0­Èš[\™YÈ[İ\ˆİ\œ™[Û\ÜÈ]™[Ë‰ßIÜ›İÜË›[™İŒÉÈÚİÚ[™Èš\œİŒ‰Î‰ÉßOÜ]ˆÛ\ÜÏHœÚY]XØ][ÙË\™\İ[È‰Ü›İÜËœÛXÙJŒ
K›X\
ÜO˜\XÛOİ›Û™Ï‰ÜÚY]\ØØ\JÜ›˜[YJ_OÜİ›Û™ÏˆÜ[‰ÜÜ™Y][ÛŸH0­È]™[	ÜÜ›]™[H0­È	ÜÚY]\ØØ\JÜœÛİ\˜ÙJ_OÜÜ[]Ûˆ\OH˜]ÛˆˆÛ\ÜÏHœÚY]Z[™›ËX]Ûˆˆ]K\Ü[Z[™›ÏH‰ÜÚY]\ØØ\JÜšY
_HšOØ]Û]Ûˆ\OH˜]Ûˆˆ]KXYXØ][ÙË\Ü[H‰ÜÚY]\ØØ\JÜšY
_HYÜ[Ø]ÛØ\XÛO˜
Kš›Ú[Š	ÉÊ_OÙ]˜ÚÜİœ]Y\TÙ[XİÜ[
	ÖÙ]K\Ü[Z[™›×IÊK™›Ü‘XXÚ
O˜‹›Û˜ÛXÚÏJ
OO›Ü[”Ü[[™›Ü›X][ÛŠØØ][ÙÒY˜‹™]\Ù]œÜ[[™›ßJJNÚÜİœ]Y\TÙ[XİÜ[
	ÖÙ]KXYXØ][ÙË\Ü[IÊK™›Ü‘XXÚ
O˜‹›Û˜ÛXÚÏJ
OO˜YØ][ÙÔÜ[ÊØ‹™]\Ù]˜YØ][ÙÔÜ[JJ_Bˆ[˜İ[ÛˆØ][ÙĞÛÛ›ÛÊ
^ØÛÛœİÜšYYØİ[Y[œ]Y\TÙ[XİÜŠ	ÈÜÚY]Ü[Ø][ÙÈœÚY]YÜšY	ÊNÚYŠYÜšYØİ[Y[™Ù][[Y[RY
	ØØ][ÙÔÜ[œ›İÜÙP[	ÊJ\™]\›ØÛÛœİYØİ[Y[˜Ü™X]Q[[Y[
	ÛX™[	ÊNÛ˜Û\ÜÓ˜[YOIÜÚY]YšY[ÚY]XÚXÚÉÎÛš[›™\’SIÏÜ[œ›İÜÙHİ]ÚYHÚ\˜Xİ\ˆXØÙ\ÜÏÜÜ[[œ]YH˜Ø][ÙÔÜ[œ›İÜÙP[ˆ\OH˜ÚXÚØ›Ş‰ÎÙÜšY˜\[™

NÙ›ÜŠÛÛœİYÙˆÉØØ][ÙÔÜ[œ›İÜÙP[	Ë	ØØ][ÙÔÜ[Y][Û‰Ë	ØØ][ÙÔÜ[Û\ÜÉË	ØØ][ÙÔÜ[]™[	Ë	ØØ][ÙÔÜ[ÙX\˜Ú	×JYØİ[Y[™Ù][[Y[RY
Y
OË˜Y]™[\İ[™\ŠY™[™ÕÚ]
	ÔÙX\˜Ú	ÊOÉÚ[œ]	Î‰ØÚ[™ÙIË

OOœ]Y]YSZXÜ›İ\ÚÊÜ[š[\ŠJNÜÜ[š[\Š
_BˆÛÛœİÙ]\]Ú[™İËœÙ]\Ú\˜Xİ\”^URNİÚ[™İËœÙ]\Ú\˜Xİ\”^UROY[˜İ[ÛŠ‹‹˜J^ØÛÛœİ\Ù]\Ë˜\J\ËJNÜÙ]\YÙ\Ê
NÜ™]\›ˆŸNÂˆÛÛœİ\]O]Ú[™İË\]PÚ\˜Xİ\”^URNİÚ[™İË\]PÚ\˜Xİ\”^UROY[˜İ[ÛŠ‹‹˜J^ØÛÛœİ]\]OË˜Ø[
\Ë‹‹˜JNİ\]TYÙ\Ê
NØÛÛ\[š[ÛŠ
NÜ™]\›ˆŸNÂˆÛÛœİİ]Ú[™İËœ™[™\Ú\˜Xİ\“İ™\šY]ÎİÚ[™İËœ™[™\Ú\˜Xİ\“İ™\šY]ÏY[˜İ[ÛŠ‹‹˜J^ØÛÛœİ[İ‹˜Ø[
\Ë‹‹˜JNÛİ™\šY]Ê
NÜ™]\›ˆŸNÂˆÛÛœİÜ˜[Ï]Ú[™İË\]TÚY]Ø][ÙÑÜ˜[ÎÚYŠÜ˜[Ê]Ú[™İË\]TÚY]Ø][ÙÑÜ˜[ÏY[˜İ[ÛŠ‹‹˜J^ØÛÛœİYÜ˜[Ë˜\J\ËJNØÛX[‘™X]Ê
NÜ™]\›ˆŸNÂˆÛÛœİÛÛ›ÛÏ]Ú[™İËœ™[™\”ÚY]Ø][ÙĞÛÛ›ÛÎÚYŠÛÛ›ÛÊ]Ú[™İËœ™[™\”ÚY]Ø][ÙĞÛÛ›ÛÏY[˜İ[ÛŠ‹‹˜J^ØÛÛœİXÛÛ›ÛË˜\J\ËJNØØ][ÙĞÛÛ›ÛÊ
NÜ™]\›ˆŸNÂˆYŠYØİ[Y[œ]Y\TÙ[XİÜŠ	Û[šÖÙ]KXYØ™KXÚ\˜Xİ\‹\İ[WIÊJ^ØÛÛœİYØİ[Y[˜Ü™X]Q[[Y[
	Û[šÉÊNÛœ™[IÜİ[\ÚY]	ÎÛš™YIØÜÜËØÚ\˜Xİ\‹XYØ™KZ[YÜ˜][Û‹˜ÜÜÏİLŒŒLKXYØ™K]ŒIÎÛ™]\Ù]˜YØ™PÚ\˜Xİ\”İ[OIÌIÎÙØİ[Y[šXY˜\[™

_BŸJJ
NÂ