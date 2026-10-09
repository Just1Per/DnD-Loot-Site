'use strict';
var SiteHelp=(()=>{
 // Versioned guide preferences and weakly held DOM badges survive UI refreshes without leaks.
 const D=SiteHelpData,VERSION='1',decorated=new WeakMap();
 let tip=null,active=null,pinned=false,hideTimer=null,refreshTimer=null,observer=null,returnFocus=null;
 const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
 function titleOf(node){const copy=node.cloneNode(true);copy.querySelectorAll('input,select,textarea,button,small,.sheet-help,.vault-help-badge').forEach(e=>e.remove());return copy.textContent.replace(/\s+/g,' ').trim();}
 function context(node){return node.closest('[data-sheet-section]')?.dataset.sheetSection|| (node.closest('#dmToolsPanel,#tab-dm')?'campaign':node.closest('#itemModal')?'item':node.closest('#userModal')?'account':node.closest('#campaignModal')?'campaign':'entry');}
 /** Prefer exact field metadata before contextual fallbacks for dynamic editors. */
 function explain(control,label=''){
  const key=control.name||'',id=control.id||'',ctx=context(control),name=norm(label||control.getAttribute('aria-label')||control.placeholder||key||id);
  if(control.closest('.campaign-workspace')){
   const field=control.dataset.recordField||key;
   const texts={title:'Names this campaign entry in search results and shared references. Renaming it retains its ID and all connections.',summary:'A short overview shown in the entry list. Keep hidden revelations in private notes.',content:'Text you can read aloud or print for players. Player preview and ordinary print include this description and omit private preparation.',privateNotes:'Hidden preparation for campaign DMs, or the approved host of this one-shot. It is stored separately from participant-readable adventure information.',targetLevel:'For a chapter, the intended milestone level; approval records it without leveling characters. For a one-shot, the server-enforced maximum character level.',rosterMode:'Choose DM pre-generated sheets, player-created sheets, or both. Only accepted participants can create their own sheets when the mode allows it.',status:'Tracks planning and progress. Completing an entry does not automatically level characters or transfer rewards.',order:'Orders chapters in the campaign story. Changing order retains their IDs and references.',combatEnabled:'Adds combat statistics to this shared creature card. Encounter instances have their own HP and conditions.',ac:'The creature template’s Armor Class, used when creating new encounter instances.',hp:'The creature template’s maximum HP. Editing the template does not heal or damage existing encounter instances.',connections:'Extra place and relationship notes. Use Connected campaign entries to create reusable references by ID.'};
   if(texts[field])return texts[field];
   if(control.hasAttribute('data-map-upload'))return 'Uploads a private PNG, JPEG or WebP image up to 5 MB. Save the entry after upload to keep the image reference. Click a map to add named location markers.';
   if(control.hasAttribute('data-print-private'))return 'Include preparation notes, configured fields and combat statistics in a DM run sheet. Leave this off for a player-facing description.';
   if(control.hasAttribute('data-shot-host'))return 'The campaign DM approves this member to prepare and run only this one-shot. It does not grant campaign-wide DM access.';
   if(control.hasAttribute('data-shot-invite'))return 'Invite an existing campaign member. They must accept before receiving assigned sheets or creating their own.';
   if(control.dataset.combatField)return 'Updates '+control.dataset.combatField+' for this encounter instance only. Save the encounter to retain it; the shared creature template stays unchanged.';
   return 'Records '+(label||field||'this choice')+' for this campaign entry. Use its Save button to retain changes. Shared references and encounter instances keep their own identities.';
  }
  if(D.fields[key])return D.fields[key];if(D.ids[id])return D.ids[id];
  if(/^abilities\./.test(key))return 'Your base '+CharacterSheetModel.abilities[key.split('.')[1]]+' score before origin and feat bonuses. It determines the ability modifier used by related rolls. Point buy uses scores from 8 to 15.';
  if(/^skills\./.test(key))return key.endsWith('.bonus')?'Adds a manual bonus to this skill, on top of ability and supported training. Use it only for effects not already calculated.':'Selects manual training for this skill. Supported automatic proficiency or expertise is retained even when your manual choice is lower.';
  if(/^saves\./.test(key))return key.endsWith('.bonus')?'Adds a manual bonus to this saving throw beyond ability and supported training.':'Marks manual proficiency in this saving throw. Automatic class saving throw training is also included.';
  if(/^coins\./.test(key))return 'Records how many '+key.split('.')[1].toUpperCase()+' coins this character owns. These totals are inventory records and do not claim campaign items.';
  if(/^adobe.hpRolls\./.test(key))return 'Enter the actual hit-die roll for this level, before Constitution. The engine adds Constitution and supported bonuses; missing rolls use the fixed value.';
  if(/^slots\./.test(key))return key.endsWith('.used')?'Records spent slots at this spell level. The available amount is total minus used.':'Shows the slot total for this spell level. Generated Spellcasting totals follow class progression; Pact Magic has separate tracking.';
  if(control.hasAttribute('data-class-feature-choice'))return 'Selects a class feature choice for this class and level, such as a Fighting Style or invocation. The builder checks its allowance and supported effects; save the sheet to retain it.';
  if(control.hasAttribute('data-subclass'))return 'Selects this class’s subclass when its class level allows it. It supplies unlocked subclass features and supported always-prepared spells.';
  if(control.hasAttribute('data-dm-member-role'))return D.labels['campaign role'];
  if(control.classList.contains('role-checkbox'))return {admin:'Grants global admin tools for accounts, DM applications and root catalogue content. Campaign access still requires membership.',dm:'Grants global DM access so this account can create campaigns. A campaign’s membership role determines management rights inside that campaign.',player:'Grants a standard player account. Campaign invitations and membership determine which campaigns and characters it can access.',viewer:'Keeps the account at viewer access. Campaign membership still determines access inside a campaign.'}[control.value];
  if(control.hasAttribute('data-dm-advancement'))return {bonusFeats:'Grants additional feat choices to this character beyond ordinary progression. The player chooses the feats on the Feats page.',bonusAsis:'Grants extra Ability Score Improvement choices for this character. This is a campaign-DM allowance, separate from normal class progression.',usedAsis:'Reserves how many of the extra choices have been used for ASIs instead of feats. It does not enter an ability score increase directly.',asiSpent:'Reserves normal advancement choices used for ASIs instead of feats. It reduces the normal feat allowance without changing base scores directly.'}[control.dataset.dmAdvancement];
  if(control.hasAttribute('data-feat-armor'))return 'Grants the custom feat’s explicit '+(control.dataset.featArmor==='shield'?'shield':control.dataset.featArmor+' armor')+' training. Supported training appears in Proficiencies & languages; description text alone does not grant it.';
  if(control.hasAttribute('data-feat-character'))return 'Chooses the campaign character that receives this custom feat. Assign feat also adds its protected bonus allowance; it does not assign the feat to every character.';
  if(control.hasAttribute('data-campaign-feat'))return 'Selects a campaign feat to edit its name, description or availability. Campaign changes do not rewrite the bundled catalogue, and existing character selections are retained.';
  if(control.hasAttribute('data-companion-skill'))return 'Chooses this creature’s skill proficiency or expertise. Wild Shape also uses supported character training when that is higher.';
  if(control.hasAttribute('data-companion-ability'))return 'Sets this creature’s ability score for its checks, attacks and saving throws. Wild Shape uses your character’s mental scores where its rules require them.';
  if(control.hasAttribute('data-companion-save'))return 'Marks this creature’s proficiency in the saving throw. Its ability modifier and proficiency bonus determine the displayed save.';
  const comp=control.dataset.companionField;
  if(comp){const texts={type:'Choose companion, familiar or Wild Shape. Wild Shape uses the character’s mental scores and supported skill training; other cards use the creature’s own statistics.',name:'Names this creature without changing its creature rules.',ac:'Sets this creature’s Armor Class, the defense used against attack rolls.',hpMax:'Sets this creature’s maximum HP. It is separate from your character’s HP.',speed:'Sets this creature’s movement speed in feet.',profBonus:D.labels['proficiency bonus'],initiativeBonus:'Adds an initiative adjustment to this creature’s Dexterity modifier.',attacks:'Records this creature’s attacks and combat reminders.',traits:D.labels.traits,notes:D.fields.notes||D.labels.notes,size:D.labels.size};return texts[comp]||'Records '+comp+' for this creature.';}
  if(/language/.test(name)||/language/i.test(key))return 'Chooses a language granted by this character choice. The selected language appears with Proficiencies & languages on Overview.';
  if(/tool/.test(name)||/tool/i.test(key))return 'Chooses tool training granted by this option. Supported training appears in the character’s proficiencies.';
  if(/skill/.test(name)||/skill/i.test(key))return 'Chooses a skill granted by this character option. Supported proficiency is included in the final skill modifier.';
  if(/ability.*(increase|choose)|asi|background.*(bonus|ability)/.test(name)||/^build\.(asi|backgroundAsi)/.test(key))return 'Chooses an ability increase granted by this option. Eligible choices and limits follow its rules; supported increases are added to base scores and shown in the ability breakdown.';
  if(/feat/.test(name)&&control.tagName==='SELECT')return 'Selects the feat for this granted choice. Review its prerequisites and complete any ability or training choices on the Feats page.';
  if(/attunement|required.*attune/.test(name))return 'Marks whether the item requires attunement. Players manage actual attunement in Active Gear; its supported magical effects depend on this requirement.';
  if(/visible/.test(name))return 'Controls whether campaign players can see this item. Visibility is separate from quantity, ownership and whether players are allowed to claim it.';
  if(/unlimited/.test(name))return 'Makes the campaign supply unlimited. Otherwise, characters share the limited stock configured by the DM.';
  if(/remaining|stock|supply/.test(name))return 'Sets the shared amount available to claim in this campaign. Existing looted copies remain owned by their characters.';
  if(/loot mode|claim/.test(name))return 'Controls whether players can claim the item themselves or whether the campaign DM assigns it. Visibility and stock are separate controls.';
  if(/search|find/.test(name))return 'Searches '+(ctx==='entry'?'the current list':ctx+' entries')+' without changing any saved records. Clear the search to see the other matching entries again.';
  const exact=D.labels[name]||D.labels[name.replace(/\s*\([^)]*\)/g,'')];if(exact)return exact;
  if(/^build\./.test(key))return 'Records the '+(label||key.split('.').slice(1).join(' '))+' choice for your character build. Supported benefits are shown in Calculated from your choices; save the sheet to keep the selection.';
  const pretty=label||control.getAttribute('aria-label')||control.placeholder||key||id||'this entry';
  return (control.tagName==='SELECT'?'Choose ':control.type==='checkbox'?'Enable or clear ':'Enter ')+pretty+' for this '+ctx+'. '+(ctx==='item'?'It is shown with the item or used by its supported configuration. Save the item to keep changes.':ctx==='account'?'It identifies or configures the account. Save the account form to keep changes.':ctx==='campaign'?'It configures the active campaign. Use this section’s save action to apply changes.':'It records this detail in the current section. Save the character sheet or form to keep changes.');
 }
 function boxText(label){const key=norm(label).replace(/^[^a-z]+/,'');return D.boxes[key]||(/spell sheet|generated spell/.test(key)?D.boxes.spells:/pact magic/.test(key)?'Warlock’s separate slot pool. Mark spent Pact Magic slots here; short or long rest restores them.':/class features|class reference|features unlocked/.test(key)?D.boxes['class reference']:/point buy/.test(key)?D.boxes['point buy']:/calculated from/.test(key)?D.boxes['calculated from your choices']:null);}
 function hide(){clearTimeout(hideTimer);if(active){active.removeAttribute('aria-describedby');active.setAttribute('aria-expanded','false');}active=null;pinned=false;if(tip)tip.hidden=true;}
 function position(){if(!active||!tip)return;const rect=active.getBoundingClientRect?.()||{left:8,right:24,top:8,bottom:24},width=tip.getBoundingClientRect?.().width||300,height=tip.getBoundingClientRect?.().height||100;const vw=window.innerWidth||360,vh=window.innerHeight||800;tip.style.left=Math.max(8,Math.min(rect.left,vw-width-8))+'px';tip.style.top=(rect.bottom+8+height<=vh?rect.bottom+8:Math.max(8,rect.top-height-8))+'px';}
 /** Put tooltips in the active native dialog’s top layer so they remain readable. */
 function show(button){clearTimeout(hideTimer);if(active!==button)hide();active=button;const modal=button.closest('dialog');(modal?.open?modal:document.body).appendChild(tip);tip.textContent=button._vaultHelp;tip.hidden=false;button.setAttribute('aria-describedby',tip.id);button.setAttribute('aria-expanded','true');position();}
 /** Help is never a form value; prevent clicks from toggling its surrounding label/summary. */
 function badge(host,title,text){
  if(!text||decorated.get(host)?.isConnected)return;
  const b=document.createElement('button');b.type='button';b.className='vault-help-badge';b.textContent='?';b.setAttribute('aria-label','Help: '+title);b.setAttribute('aria-expanded','false');b._vaultHelp=text;decorated.set(host,b);
  if(host.tagName==='INPUT'&&host.closest('#loginControls')){const group=document.createElement('span');group.className='vault-help-login-field';host.before(group);group.append(host,b);}
  else if(host.tagName==='INPUT'||host.tagName==='SELECT'||host.tagName==='TEXTAREA'||host.tagName==='BUTTON')host.after(b);else host.appendChild(b);
  b.addEventListener('pointerenter',()=>show(b));b.addEventListener('pointerleave',()=>{if(!pinned)hideTimer=setTimeout(hide,200);});b.addEventListener('focus',()=>show(b));b.addEventListener('blur',()=>{if(!pinned)hide();});
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(active===b&&pinned)hide();else{show(b);pinned=true;}});
 }
 /** Decorate new controls once, restoring badges if a renderer replaced their heading. */
 function refresh(){
  if(!tip)return;
  document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(control=>{
   if(control.closest('.vault-help-dialog,.sheet-paper-page,#test-results'))return;
   const label=control.closest('label')||[...document.querySelectorAll('label[for]')].find(l=>l.htmlFor===control.id&&control.id);
   const title=label?titleOf(label):control.getAttribute('aria-label')||control.placeholder||control.name||control.id;
   if(!title)return;const span=label?.querySelector(':scope > span');badge(span||label||control,title,explain(control,title));
  });
  document.querySelectorAll('h2,h3,h4,legend,details>summary').forEach(heading=>{
   if(heading.closest('.vault-help-dialog,.sheet-paper-page,#card-container,.sheet-progression-feature,.sheet-spell-information'))return;
   const title=titleOf(heading),text=boxText(title);if(text)badge(heading,title,text);
  });
  document.querySelectorAll('.sheet-summary-metrics>div>span,.sheet-metrics>div>span,.sheet-derived-readout>span,.sheet-companion-stat>small').forEach(node=>{
   if(node.closest('.sheet-paper-page'))return;const title=titleOf(node),text=boxText(title);if(text)badge(node,title,text);
  });
  for(const [id,text] of Object.entries(D.actions)){const node=document.getElementById(id);if(node&&!node.closest('.sheet-paper-page')){badge(node,titleOf(node)||node.textContent,text);const b=decorated.get(node),hidden=node.hidden||node.style.display==='none';if(b&&b.hidden!==hidden)b.hidden=hidden;}}
  const guide=document.getElementById('siteGuideButton');if(guide)guide.hidden=!currentUser;
  if(active&&!active.isConnected)hide();
 }
 // Static instructions and navigation actions; opening a guide does not write campaign data.
 const guides={
  player:{title:'Player guide',intro:'Join your table, build your character and keep your items and adventure records together.',steps:[
   ['Join a campaign','Ask your DM to invite the email you use to log in. On the dashboard, accept the invitation, then open the campaign. Each campaign has its own membership role.','invitations','View invitations'],
   ['Create and select your character','Open My Character and choose + Create new character. Fill in the name, class and level inside its sheet. Set the active character before saving wish-list items or claiming loot.','player','My Character'],
   ['Complete your build','Open Character sheet → Character Builder. Choose edition, species, background and class levels. Overview notices have Fix buttons that take you to unfinished choices. Use Level up for an existing class.','sheet','Character sheet'],
   ['Abilities, feats and spells','Enter base rolled scores or choose Point buy. Complete feat choices, then generate spells for each casting class. Each class has its own preparation allowance and casting ability; Warlock Pact Magic is tracked separately.','sheet','Build your sheet'],
   ['Loot and use equipment','Library shows items made visible by your DM. Claiming depends on the item’s claim mode and shared stock. Owned items appear in Active Gear: wear, take off, attune and open i for full details. Saved items are a wish list.','library','Library'],
   ['Save, play and print','Save the sheet after changes. Use Overview for play, Story for your portrait and background, and Notes for NPCs, locations, sessions and custom categories. Print lets you choose sections.','sheet','Open your sheet'],
   ['Start your own campaign','A player account can apply for global DM access from the dashboard. An admin reviews the application. After approval, New Campaign becomes available; joining another campaign does not automatically make you its DM.','application','DM access application']
  ]},
  dm:{title:'Dungeon Master guide',intro:'Create a campaign, invite your table and control its rules, items and characters.',steps:[
   ['Create or join','With global DM access you can use New Campaign on the dashboard. Creating a campaign makes you its owner. To join another DM’s campaign, accept an invitation; your membership there determines whether you manage it.','create','New Campaign'],
   ['Invite your players','Open a campaign, then DM Tools → Members. Invite account emails as players or campaign DMs. Global account roles and campaign roles are separate.','dm','DM Tools'],
   ['Choose the available rules','In DM Tools, choose 2014, 2024 or both. Disallowed catalogue choices are hidden. Edit or remove campaign feats, create custom feats, or reset standard availability. Existing character choices are preserved.','dm','Campaign rules'],
   ['Prepare campaign items','Load or copy items into your campaign and edit the campaign copies. Set visibility, claim mode and limited or unlimited stock. Players only see items you make visible.','library','Campaign Library'],
   ['Review characters and loot','DM Tools lists campaign characters and their saved/looted items. You can open sheets, assign or unloot items and grant bonus advancement to specific characters. Players manage equipment status in their own Active Gear.','dm','Characters & items'],
   ['Keep table records','You can use character sheets, Story and Notes like a player when your campaign membership permits it. Use Print to prepare readable sheets for the table. Save edits before leaving.','sheet','Character sheets']
  ]},
  admin:{title:'Admin guide',intro:'Manage website accounts and global content while keeping campaign control with campaign owners and DMs.',steps:[
   ['Manage website accounts','Use Admin for the cross-campaign user list and global account roles. Global DM access allows campaign creation, while membership controls access inside each campaign.','admin','Admin'],
   ['Review DM applications','In Admin, review requests for global DM access and approve, reject or revoke as appropriate. This does not assign the user as DM in every campaign.','admin','DM access requests'],
   ['Maintain global items','Open the global catalogue from Admin to maintain root items. Campaign DMs work with campaign copies; changing a global record does not replace their campaign management.','admin','Global catalogue'],
   ['Create or join a campaign','Admin accounts can create campaigns. In another person’s campaign, your membership determines campaign management rights; use the campaign’s own DM Tools when permitted.','create','New Campaign'],
   ['Understand the player experience','Players accept invitations, create a character, complete its Builder choices, manage gear and save sheets. Open the Player guide below for the complete path.','player-guide','Player guide']
  ]}
 };
 function accountRole(){return isAdmin()?'admin':isDM()?'dm':'player';}
 function role(){return activeCampaign&&document.getElementById('mainApp')?.style.display!=='none'?(canManageCampaign()?'dm':'player'):accountRole();}
 function roles(){return isAdmin()?['player','dm','admin']:isDM()||canManageCampaign()?['player','dm']:['player'];}
 function key(r){return 'dnd-guide-'+VERSION+'-'+(currentUser?.uid||currentUser?.id||'')+'-'+r;}
 function suppressed(r){try{return localStorage.getItem(key(r))==='hidden';}catch{return false;}}
 /** Preferences are optional: unavailable browser storage must not block navigation. */
 function rememberGuide(dialog){try{localStorage.setItem(key(dialog.dataset.guideRole),dialog.querySelector('#siteGuideRemember')?.checked?'hidden':'show');}catch{}}
 function closeGuide(){const dialog=document.getElementById('siteGuideDialog');if(!dialog)return;rememberGuide(dialog);if(dialog.open)dialog.close();dialog.remove();returnFocus?.focus?.();}
 /** Recheck live permissions before taking a guide shortcut into an existing editor. */
 function navigate(action){
  if(!currentUser)return;
  if(action==='player-guide'){closeGuide();openGuide('player');return;}
  closeGuide();
  if(action==='create'){if(isDM())openCampaignModal();else{showCampaignSelector();document.getElementById('dmApplicationPanel')?.scrollIntoView?.({block:'center'});}return;}
  if(action==='admin'){if(isAdmin())openAdminView();return;}
  if(['dm','player','sheet','library'].includes(action)&&activeCampaign){if(action==='dm'&&!canManageCampaign())return;if(action!=='dm'&&!canUseCharacters())return;showTab(action==='sheet'?'character-sheet':action);return;}
  showCampaignSelector();const target=action==='application'?'dmApplicationPanel':action==='invitations'?'dashboardInviteSection':'campaignSelectorList';document.getElementById(target)?.scrollIntoView?.({block:'center'});
 }
 function openGuide(requested=role()){
  if(!currentUser)return;hide();const allowed=roles(),r=allowed.includes(requested)?requested:role();const old=document.getElementById('siteGuideDialog');if(old){if(old.open)old.close();old.remove();}else returnFocus=document.activeElement;
  const g=guides[r],dialog=document.createElement('dialog');dialog.id='siteGuideDialog';dialog.className='vault-help-dialog';dialog.dataset.guideRole=r;dialog.setAttribute('aria-labelledby','siteGuideTitle');
  dialog.innerHTML='<header><div><small>GET STARTED · CAMPAIGNATLAS</small><h2 id="siteGuideTitle">'+g.title+'</h2><p>'+g.intro+'</p></div><button type="button" data-guide-close aria-label="Close guide">×</button></header><nav aria-label="Choose a guide">'+allowed.map(k=>'<button type="button" data-guide-role="'+k+'" aria-pressed="'+(k===r)+'">'+guides[k].title+'</button>').join('')+'</nav><ol>'+g.steps.map(([title,text,action,label])=>'<li><h3>'+title+'</h3><p>'+text+'</p><button type="button" data-guide-action="'+action+'">'+label+'</button></li>').join('')+'</ol><footer><label><input type="checkbox" id="siteGuideRemember" '+(suppressed(r)?'checked':'')+'> Don’t open this guide automatically after login</label><p>You can always reopen it with Guide in the header. The small ? buttons explain fields as you go.</p><button type="button" class="btn-primary" data-guide-close>Done</button></footer>';
  document.body.appendChild(dialog);dialog.querySelectorAll('[data-guide-role]').forEach(b=>b.onclick=()=>{rememberGuide(dialog);openGuide(b.dataset.guideRole);});dialog.querySelectorAll('[data-guide-action]').forEach(b=>b.onclick=()=>navigate(b.dataset.guideAction));dialog.querySelectorAll('[data-guide-close]').forEach(b=>b.onclick=closeGuide);dialog.addEventListener('cancel',event=>{event.preventDefault();closeGuide();});dialog.addEventListener('click',event=>{if(event.target===dialog)closeGuide();});dialog.showModal();
 }
 // Guides are opt-in: keep contextual hints and the header Guide button, but never show a modal on login.
 function onLogin(){refresh();const button=document.getElementById('siteGuideButton');if(button)button.hidden=!currentUser;}
 function onLogout(){hide();const d=document.getElementById('siteGuideDialog');if(d){if(d.open)d.close();d.remove();}const b=document.getElementById('siteGuideButton');if(b)b.hidden=true;}
 /** Install one tooltip, one Guide button and observation of dynamically rendered forms. */
 function init(){
  if(tip)return;tip=document.createElement('div');tip.id='vaultContextHelp';tip.className='vault-context-help';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.appendChild(tip);tip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));tip.addEventListener('pointerleave',()=>{if(!pinned)hideTimer=setTimeout(hide,200);});
  const button=document.createElement('button');button.id='siteGuideButton';button.type='button';button.className='toolbar-btn';button.textContent='? Guide';button.hidden=!currentUser;button.onclick=()=>openGuide();document.getElementById('logoutButton')?.before(button);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();event.stopImmediatePropagation();hide();}},true);
  document.addEventListener('pointerdown',event=>{if(active&&!event.target.closest('.vault-help-badge,#vaultContextHelp'))hide();});window.addEventListener('resize',position);window.addEventListener('scroll',position,true);window.addEventListener('beforeprint',hide);
  if(typeof MutationObserver!=='undefined'){observer=new MutationObserver(records=>{if(!records.some(r=>r.type==='attributes'?!r.target.closest('.vault-help-badge,#vaultContextHelp,.vault-help-dialog,#siteGuideButton'):[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches('.vault-help-badge,#vaultContextHelp,.vault-help-dialog'))))return;clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,30);});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','hidden']});}
  refresh();
 }
 return{init,refresh,explain,openGuide,closeGuide,onLogin,onLogout,role,roles,hide};
})();
