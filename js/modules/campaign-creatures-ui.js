'use strict';
(()=>{
 const W=CampaignWorkspace,C=CampaignCreatures;
 const textFields=[['appearance','Appearance'],['personality','Personality'],['voice','Voice and mannerisms'],['goals','Goals'],['relationships','Relationships'],['saves','Saving throws'],['skills','Skills'],['resistances','Resistances'],['immunities','Immunities'],['senses','Senses'],['languages','Languages'],['cr','Challenge rating'],['actions','Attacks and actions'],['traits','Traits and special abilities'],['legendaryActions','Legendary actions'],['phases','Boss phases and story progression']];
 function card(host,s){
  if(!host)return;const draft=W.draft();if(!draft)return;
  let d;try{d=C.normalize(draft.data)}catch(error){host.textContent=error.message;return;}
  const e=escapeHtml;
  host.innerHTML=`<div class="workspace-actions"><button type="button" data-creature-catalog>Import SRD creature</button><button type="button" data-personal-creatures>My Creature Library</button><button type="button" data-save-personal-creature>Save to My Library</button></div><section class="workspace-card"><h3>${e(draft.title||'Unnamed creature')}</h3><p>${e(d.category)} · ${e(d.edition)}${d.cr?' · CR '+e(d.cr):''}</p>${d.combatEnabled?`<div class="workspace-stats"><div><strong>${d.ac}</strong><span>AC</span></div><div><strong>${d.hp}</strong><span>Maximum HP</span></div><div><strong>${d.speed}</strong><span>ft.</span></div></div><div class="workspace-abilities">${C.abilities.map(key=>`<div>${key.toUpperCase()}<strong> ${d[key]}</strong> (${Math.floor((d[key]-10)/2)>=0?'+':''}${Math.floor((d[key]-10)/2)})</div>`).join('')}</div><h4>Actions</h4><div class="workspace-prose">${e(d.actions)}</div><h4>Traits</h4><div class="workspace-prose">${e(d.traits)}</div>`:`<div class="workspace-prose">${e(d.appearance)}\n${e(d.personality)}</div>`}${d.source?`<p class="workspace-prose">${e(d.source.attribution)}<br>Source: ${e(d.source.provider)} · SRD ${e(d.source.srdVersion)}<br>Changes: ${e(d.source.changes)}</p>`:''}<h4>Additional rules</h4><div class="workspace-prose">${e([d.movement,d.saves,d.skills,d.resistances&&'Resistances: '+d.resistances,d.immunities&&'Immunities: '+d.immunities,d.vulnerabilities&&'Vulnerabilities: '+d.vulnerabilities,d.conditionImmunities&&'Condition immunities: '+d.conditionImmunities,d.senses,d.languages,d.bonusActions&&'Bonus actions: '+d.bonusActions,d.reactions&&'Reactions: '+d.reactions,d.legendaryActions,d.phases].filter(Boolean).join('\n\n'))}</div></section>`;
  host.querySelector('[data-creature-catalog]').onclick=()=>CampaignMonsterCatalog.open();
  host.querySelector('[data-save-personal-creature]').onclick=async event=>{
    const button=event.currentTarget,record=W.draft();
    if(!record?.title?.trim()){W.status('Enter a creature name first.',true);return;}
    button.disabled=true;
    try{await PersonalCreatureLibrary.add({...record,sourceCampaignId:activeCampaign.id});W.status('Saved an independent copy in your personal creature library.');}
    catch(error){W.status('Personal library save failed: '+error.message,true);}
    finally{button.disabled=false;}
  };
  host.querySelector('[data-personal-creatures]').onclick=async()=>{
    if(!activeCampaign||!canManageCampaign())return;
    const campaignId=activeCampaign.id,uid=auth.currentUser.uid;
    const dialog=document.createElement('dialog');dialog.className='workspace-sheet-dialog';
    dialog.innerHTML='<header class="workspace-heading"><h2>My Creature Library</h2><button type="button" data-personal-close>Close</button></header><p>Import an independent copy into this campaign. Your personal template remains unchanged.</p><label class="workspace-field">Search<input type="search" data-personal-search></label><p role="status" data-personal-status>Loading…</p><div class="workspace-list" data-personal-results></div>';
    document.body.append(dialog);dialog.showModal();
    dialog.querySelector('[data-personal-close]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>dialog.remove());
    const permitted=()=>dialog.isConnected&&activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canManageCampaign();
    try{
      const rows=await PersonalCreatureLibrary.list();if(!permitted()){dialog.close();return;}
      const draw=()=>{
        const q=dialog.querySelector('[data-personal-search]').value.toLowerCase();
        const matches=rows.filter(row=>[row.title,row.summary,row.data?.category].join(' ').toLowerCase().includes(q));
        dialog.querySelector('[data-personal-status]').textContent=matches.length+' saved templates';
        const list=dialog.querySelector('[data-personal-results]');
        list.innerHTML=matches.map(row=>'<button type="button" data-personal-id="'+escapeHtml(row.id)+'">'+escapeHtml(row.title)+'<small>'+escapeHtml(row.data?.category||'Creature')+'</small></button>').join('')||'<p>No matching templates.</p>';
        list.querySelectorAll('[data-personal-id]').forEach(button=>button.onclick=()=>{
          if(!permitted())return;const record=rows.find(row=>row.id===button.dataset.personalId);
          if(record&&W.importCreature(record))dialog.close();
        });
      };
      dialog.querySelector('[data-personal-search]').oninput=draw;draw();
    }catch(error){if(dialog.isConnected)dialog.querySelector('[data-personal-status]').textContent=error.message;}
  };
 }
 W.configs.creature={title:'Creatures & NPCs',tab:'dm-world',noun:'creature',categories:C.categories,normalize:C.normalize,fields:[['category','Entry type','select'],['edition','Rules edition','select',['Homebrew','2014','2024']],['combatEnabled','Include combat statistics','checkbox'],['ac','Armor class','number',null,40],['hp','Maximum hit points','number',null,10000],['speed','Speed (ft.)','number',null,600],...C.abilities.map(key=>[key,key.toUpperCase(),'number',null,30]),...textFields.map(([key,label])=>[key,label,'textarea'])],content:'Story description',secret:'Secrets and private tactics',help:'Create one master card and reuse it in world entries, chapters and encounters. Combat encounters have their own HP and conditions.',extra:card,onEdit:card};
})();
