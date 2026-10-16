'use strict';
// Navigation groups existing, independently authorized routes. No campaign data lives here.
var AppShell=(()=>{
 const journal=['campaign-information','campaign-npcs','campaign-chapters'];
 const dm=['dm','dm-world','dm-creatures','dm-chapters','dm-party','dm-one-shots'];
 let route='campaign-home',lastJournal='campaign-information';
 const titles={'campaign-home':'Home','campaign-information':'Campaign guide','campaign-npcs':'Known NPCs','campaign-chapters':'Completed chapters',player:'My Character','character-sheet':'Character sheet','character-loot':'Gear & Loot','character-wishlist':'Wishlist',library:'Library',dm:'DM Workspace','dm-world':'World','dm-creatures':'Creatures & NPCs','dm-chapters':'Chapters','dm-party':'Party & Loot','dm-settings':'Campaign settings','dm-one-shots':'One Shots','player-adventures':'My One Shots'};
 function primary(tab){return journal.includes(tab)?'journal':['player','character-sheet','character-loot','character-wishlist','player-adventures'].includes(tab)?'player':dm.includes(tab)?'dm':tab;}
 function resolve(tab){return tab==='journal'?lastJournal:tab;}
 function ensure(){
  const main=document.getElementById('mainApp'),navigation=document.getElementById('campaignSectionNavigation');if(!main||!navigation)return;
  const group=navigation.querySelector('[data-section-group="dm"]');
  if(!document.getElementById('dmPartyTab')){const button=document.createElement('button');button.id='dmPartyTab';button.type='button';button.className='tab';button.dataset.tab='dm-party';button.textContent='Party & Loot';button.onclick=()=>showTab('dm-party');group.append(button);}
  if(!document.getElementById('tab-dm-party')){const panel=document.createElement('section');panel.id='tab-dm-party';panel.className='tab-content';panel.style.display='none';panel.setAttribute('aria-label','Party & Loot');panel.innerHTML='<div id="dmPartyPanel"><h2>Party &amp; Loot</h2><p>Character sheets, inventories, saved items and campaign loot.</p><div class="dm-tools-grid"></div></div>';main.append(panel);}
  for(const tab of dm){
   let button=document.querySelector('.tab[data-tab="'+tab+'"]');
   if(tab==='dm'){
    if(button)button.textContent='DM Workspace';
    if(!group.querySelector('[data-dm-overview]')){const overview=document.createElement('button');overview.type='button';overview.dataset.dmOverview='';overview.textContent='Overview';overview.onclick=()=>showTab('dm');group.prepend(overview);}
   }else if(button&&button.parentElement!==group)group.append(button);
  }
  const characterButton=document.getElementById('characterSheetTab');if(characterButton)characterButton.style.display=canUseCharacters()||canManageCampaign()?'inline-block':'none';
  const player=document.getElementById('playerTab');if(player)player.style.display=canUseCharacters()?'inline-block':'none';
  const settings=document.getElementById('campaignSettingsButton');if(settings)settings.style.display=canManageCampaign()?'inline-flex':'none';
  navigation.querySelector('[data-character-list]').onclick=()=>showTab('player');
  if(!document.getElementById('tab-dm-settings')){
   const panel=document.createElement('section');panel.id='tab-dm-settings';panel.className='tab-content';panel.style.display='none';panel.setAttribute('aria-label','Campaign settings');panel.innerHTML='<div id="campaignSettingsPanel"><h2>Campaign settings</h2><p>Manage campaign defaults, members and invitations.</p><div class="dm-tools-grid"></div></div>';main.append(panel);
  }
 }
 function organizeDMTools(){
  const target=document.querySelector('#campaignSettingsPanel .dm-tools-grid');if(!target)return;
  document.querySelectorAll('#dmToolsPanel [data-dm-settings-card]').forEach(card=>target.append(card));
 }
 function update(tab){
  ensure();route=tab;if(journal.includes(tab))lastJournal=tab;
  const selected=primary(tab),group=journal.includes(tab)?'journal':['player','character-sheet','character-loot','character-wishlist','player-adventures'].includes(tab)?'character':dm.includes(tab)?'dm':null;
  const secondary=document.getElementById('campaignSectionNavigation');
  if(secondary){secondary.hidden=!group;secondary.setAttribute('aria-label',group==='dm'?'DM workspace sections':group==='journal'?'Journal sections':'Character sections');
   secondary.querySelectorAll('[data-section-group]').forEach(node=>node.hidden=node.dataset.sectionGroup!==group);
  }
  document.querySelectorAll('.tab').forEach(button=>{
   const active=button.closest('#primaryNavigation')?button.dataset.tab===selected:button.dataset.tab===tab;
   button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  const overview=document.querySelector('[data-dm-overview]');if(overview){overview.classList.toggle('active',tab==='dm');if(tab==='dm')overview.setAttribute('aria-current','page');else overview.removeAttribute('aria-current');}
  const title=document.getElementById('siteScreenTitle');if(title)title.textContent=(titles[tab]||'Campaign')+' · CampaignAtlas';
 }
 return{ensure,update,organizeDMTools,resolve,primary,get route(){return route;}};
})();
