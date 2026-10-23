'use strict';
(()=>{
 const W=CampaignWorkspace,C=CampaignCreatures,e=escapeHtml;
 const textFields=[['appearance','Appearance'],['personality','Personality'],['voice','Voice and mannerisms'],['goals','Goals'],['relationships','Relationships'],['size','Size'],['creatureType','Creature type'],['movement','Movement modes'],['saves','Saving throws'],['skills','Skills'],['resistances','Resistances'],['immunities','Immunities'],['vulnerabilities','Vulnerabilities'],['conditionImmunities','Condition immunities'],['senses','Senses'],['languages','Languages'],['cr','Challenge rating'],['actions','Attacks and actions'],['traits','Traits and special abilities'],['bonusActions','Bonus actions'],['reactions','Reactions'],['legendaryActions','Legendary actions'],['phases','Boss phases and story progression']];
 const fields=[['category','Entry type','select',C.categories],['edition','Rules edition','select',['Homebrew','2014','2024']],['combatEnabled','Use combat statistics','checkbox'],['ac','Armor class','number',null,40],['hp','Maximum hit points','number',null,10000],['speed','Speed (ft.)','number',null,600],...C.abilities.map(key=>[key,key.toUpperCase(),'number',null,30]),...textFields.map(([key,label])=>[key,label,['size','creatureType','cr'].includes(key)?'text':'textarea'])];
 function field(key,data,template=false){
  const [,label,type,options,max]=fields.find(row=>row[0]===key),attr=`data-${template?'template':'record'}-field="${key}"`,value=data[key];
  const input=type==='select'?`<select ${attr}>${options.map(v=>`<option value="${e(v)}" ${v===value?'selected':''}>${e(v)}</option>`).join('')}</select>`:type==='checkbox'?`<input type="checkbox" ${attr} ${value?'checked':''}>`:type==='number'?`<input type="number" ${attr} min="${key==='hp'||C.abilities.includes(key)?1:0}" max="${max}" step="1" value="${Number(value)}">`:type==='text'?`<input type="text" ${attr} maxlength="20000" value="${e(String(value??''))}">`:`<textarea ${attr} maxlength="20000">${e(String(value??''))}</textarea>`;
  return `<label class="workspace-field${type==='checkbox'?' creature-combat-choice':''}"><span>${e(label)}</span>${input}</label>`;
 }
 const textarea=(name,label,value,max=20000)=>`<label class="workspace-field"><span>${e(label)}</span><textarea name="${name}" maxlength="${max}">${e(value||'')}</textarea></label>`;
 function editorBody(record,template=false){
  // Fill missing legacy fields without hiding invalid saved values; validation
  // must let the DM correct those values instead of preventing the editor opening.
  const d={...C.normalize(),...structuredClone(record.data||{})},group=keys=>keys.map(key=>field(key,d,template)).join('');
  return `<section class="creature-editor-section"><h3>Identity &amp; introduction</h3><div class="workspace-fields"><label class="workspace-field workspace-full"><span>Name</span><input name="title" required maxlength="160" value="${e(record.title||'')}"></label>${group(['category','edition'])}</div>${textarea('summary','Short summary',record.summary,1000)}${textarea('content','Story description',record.content)}<p>${template?'Personal templates create independent campaign copies when imported.':'Saving keeps this entry in the DM workspace. Use Publish to players at the top to share this Story NPC, its illustration and caption.'}</p></section>
   <section class="creature-editor-section creature-editor-private"><h3>Roleplaying &amp; private preparation</h3><p>Prepare how this person looks, speaks and acts. Goals and relationships stay private when you reveal an NPC.</p><div class="workspace-fields">${group(['appearance','personality','voice','goals','relationships'])}</div>${template?'':textarea('privateNotes','Secrets and private tactics',record.privateNotes)}</section>
   <section class="creature-editor-section creature-editor-private"><h3>Combat preparation</h3>${field('combatEnabled',d,template)}<p data-creature-combat-help></p><details data-creature-combat ${d.combatEnabled?'open':''}><summary data-creature-combat-summary>Combat statistics</summary><div class="workspace-fields">${group(['size','creatureType','cr','ac','hp','speed','movement'])}</div><div class="workspace-fields creature-ability-fields">${group(C.abilities)}</div><details data-creature-defenses><summary>Defenses, skills &amp; senses</summary><div class="workspace-fields">${group(['saves','skills','resistances','immunities','vulnerabilities','conditionImmunities','senses','languages'])}</div></details><details data-creature-actions ${d.combatEnabled?'open':''}><summary>Actions &amp; special abilities</summary><div class="workspace-fields">${group(['traits','actions','bonusActions','reactions'])}</div></details><details data-creature-advanced ${d.category==='Boss'||d.legendaryActions||d.phases?'open':''}><summary>Legendary actions &amp; boss phases</summary><div class="workspace-fields">${group(['legendaryActions','phases'])}</div></details></details></section>
   ${template?'':`<section class="creature-editor-section creature-editor-private"><h3>Connected campaign entries</h3><section data-workspace-links></section></section><section class="creature-editor-section creature-editor-private"><h3>DM reference</h3><p>The reference card is private preparation. Players receive only the saved name, summary and story description when you publish a Story NPC.</p><div data-extra-editor></div></section><label class="workspace-field" data-private-print><span><input type="checkbox" data-print-private> Include private preparation and statistics in print</span></label>`}`;
 }
 function bindEditor(form,template=false){
  if(!form||form.dataset.creatureEditorBound)return;form.dataset.creatureEditorBound='true';
  const find=key=>form.querySelector(`[data-${template?'template':'record'}-field="${key}"]`);
  const update=()=>{
   const required=['Monster','Boss'].includes(find('category').value),checkbox=find('combatEnabled');
   if(required)checkbox.checked=true;checkbox.disabled=required;
   form.querySelector('[data-creature-combat]').open=checkbox.checked;
   if(checkbox.checked)form.querySelector('[data-creature-actions]').open=true;
   if(find('category').value==='Boss')form.querySelector('[data-creature-advanced]').open=true;
   form.querySelector('[data-creature-combat-summary]').textContent=checkbox.checked?'Combat statistics':'Stored combat statistics (not in use)';
   form.querySelector('[data-creature-combat-help]').textContent=required?'Monsters and bosses always use combat statistics.':'Combat is optional for Story NPCs and Companions. Turning it off keeps all stored statistics, actions and phases.';
  };
  form.addEventListener('change',event=>{if(event.target===find('category')||event.target===find('combatEnabled'))update();});
  // Native validation must be able to focus invalid fields inside closed sections.
  form.addEventListener('invalid',event=>{for(let parent=event.target.parentElement;parent&&parent!==form;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;},true);
  update();
 }
 async function openPersonalLibrary(){
    if(!activeCampaign||!canManageCampaign())return;
    const campaignId=activeCampaign.id,uid=auth.currentUser.uid;
    document.getElementById('workspacePersonalCreatures')?.remove();
    const dialog=document.createElement('dialog');dialog.id='workspacePersonalCreatures';dialog.className='workspace-sheet-dialog';
    dialog.innerHTML='<header class="workspace-heading"><h2>My Creature Library</h2><button type="button" data-personal-close>Close</button></header><p>Import an independent copy into this campaign. Your personal template remains unchanged.</p><label class="workspace-field">Search<input type="search" data-personal-search></label><p role="status" data-personal-status>Loading…</p><div class="workspace-list" data-personal-results></div>';
    const previousFocus=document.activeElement;
    document.body.append(dialog);dialog.showModal();
    dialog.querySelector('[data-personal-close]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{dialog.remove();if(previousFocus?.isConnected)previousFocus.focus();});
    dialog.querySelector('[data-personal-search]')?.focus();
    const permitted=()=>dialog.isConnected&&activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canManageCampaign();
    try{
      const rows=await PersonalCreatureLibrary.list();if(!permitted()){dialog.close();return;}
      const draw=()=>{
        if(!permitted())return;
        const q=dialog.querySelector('[data-personal-search]').value.toLowerCase();
        const matches=rows.filter(row=>[row.title,row.summary,row.data?.category].join(' ').toLowerCase().includes(q));
        dialog.querySelector('[data-personal-status]').textContent=matches.length+' saved templates';
        const list=dialog.querySelector('[data-personal-results]');
        list.innerHTML=matches.map(row=>'<div class="workspace-actions" data-template-row="'+escapeHtml(row.id)+'"><button type="button" data-personal-id="'+escapeHtml(row.id)+'">'+escapeHtml(row.title)+' · '+escapeHtml(row.data?.category||'Creature')+'</button><button type="button" data-duplicate-template="'+escapeHtml(row.id)+'" aria-label="Duplicate '+escapeHtml(row.title)+'">Duplicate</button><button type="button" data-edit-template="'+escapeHtml(row.id)+'" aria-label="Edit '+escapeHtml(row.title)+'">Edit</button><button type="button" data-delete-template="'+escapeHtml(row.id)+'" aria-label="Delete '+escapeHtml(row.title)+'">Delete</button></div>').join('')||'<p>No matching templates.</p>';
        list.querySelectorAll('[data-personal-id]').forEach(button=>button.onclick=()=>{
          if(!permitted())return;const record=rows.find(row=>row.id===button.dataset.personalId);
          if(record&&W.importCreature(record))dialog.close();
        });
        list.querySelectorAll('[data-duplicate-template]').forEach(button=>button.onclick=async()=>{
          if(!permitted())return;
          const record=rows.find(row=>row.id===button.dataset.duplicateTemplate);if(!record)return;
          button.disabled=true;
          try{
            const title=(record.title.slice(0,153)+' (Copy)').slice(0,160);
            const id=await PersonalCreatureLibrary.add({...record,title});
            if(!permitted()){dialog.close();return;}
            rows.push({...structuredClone(record),id,title});rows.sort((a,b)=>a.title.localeCompare(b.title));draw();
            dialog.querySelector('[data-personal-status]').textContent='Independent personal copy created.';
          }catch(error){if(permitted())dialog.querySelector('[data-personal-status]').textContent='Duplicate failed: '+error.message;}
          finally{button.disabled=false;}
        });
        list.querySelectorAll('[data-edit-template]').forEach(button=>button.onclick=()=>{
          if(!permitted())return;
          const record=rows.find(row=>row.id===button.dataset.editTemplate);if(!record)return;
          const editor=document.createElement('dialog');editor.id='workspacePersonalCreatureEditor';editor.className='workspace-sheet-dialog';
          const data={...C.normalize(),...structuredClone(record.data||{})};
          editor.innerHTML='<header class="workspace-heading"><h2>Edit personal creature</h2><button type="button" data-template-cancel>Close</button></header><form data-template-form>'+editorBody(record,true)+'<p data-template-feedback role="status"></p><div class="workspace-actions"><button type="submit">Save changes</button><button type="button" data-template-cancel>Cancel</button></div></form>';
          const editTrigger=button;
          document.body.append(editor);editor.showModal();
          bindEditor(editor.querySelector('form'),true);
          editor.querySelector('[name=title]')?.focus();
          editor.querySelectorAll('[data-template-cancel]').forEach(b=>b.onclick=()=>editor.close());
          editor.addEventListener('close',()=>{editor.remove();if(editTrigger.isConnected)editTrigger.focus();});
          editor.querySelector('[data-template-form]').onsubmit=async event=>{
            event.preventDefault();if(!permitted()){editor.close();return;}
            const form=event.currentTarget;if(!form.reportValidity())return;
            const next=structuredClone(data);
            form.querySelectorAll('[data-template-field]').forEach(input=>{const key=input.dataset.templateField;next[key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;});
            const saveButton=form.querySelector('[type=submit]');saveButton.disabled=true;
            try{
              const updated={...record,title:form.elements.namedItem('title').value.trim(),summary:form.elements.namedItem('summary').value,content:form.elements.namedItem('content').value,data:C.normalize(next)};
              await PersonalCreatureLibrary.update(record.id,updated);
              if(!permitted()){editor.close();dialog.close();return;}
              Object.assign(record,updated);draw();editor.close();
              dialog.querySelector('[data-personal-status]').textContent='Template updated. Campaign copies remain unchanged.';
            }catch(error){form.querySelector('[data-template-feedback]').textContent='Save failed: '+error.message;}
            finally{saveButton.disabled=false;}
          };
        });
        list.querySelectorAll('[data-delete-template]').forEach(button=>button.onclick=async()=>{
          if(!permitted())return;
          const record=rows.find(row=>row.id===button.dataset.deleteTemplate);if(!record||!confirm('Delete personal template "'+record.title+'"? Campaign copies will stay unchanged.'))return;
          button.disabled=true;
          try{
            await PersonalCreatureLibrary.remove(record.id);
            if(!permitted()){dialog.close();return;}
            rows.splice(rows.findIndex(row=>row.id===record.id),1);draw();
            dialog.querySelector('[data-personal-status]').textContent='Personal template deleted. Campaign copies were not changed.';
          }catch(error){dialog.querySelector('[data-personal-status]').textContent='Delete failed: '+error.message;}
          finally{button.disabled=false;}
        });
      };
      dialog.querySelector('[data-personal-search]').oninput=draw;draw();
    }catch(error){if(dialog.isConnected)dialog.querySelector('[data-personal-status]').textContent=error.message;}
 }
 let catalogueOpening=0;
 async function openCreatureCatalogue(button,feedback){
  const session=W.session,campaignId=activeCampaign?.id,uid=auth.currentUser?.uid;
  if(!session||session.kind!=='creature'||session.campaignId!==campaignId||!uid||!canManageCampaign())return;
  const record=session.record,request=++catalogueOpening;
  const active=()=>request===catalogueOpening&&W.session===session&&session.record===record&&activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canManageCampaign()&&button.isConnected;
  const report=text=>{feedback.hidden=!text;feedback.textContent=text;};
  button.disabled=true;report('Loading creature catalogue…');
  try{
   if(typeof CampaignMonsterCatalog==='undefined'){
    if(!window.CampaignOptionalFeatures)throw Error('Catalogue loader unavailable.');
    await window.CampaignOptionalFeatures.ensure('creatureCatalogue');
   }
   if(!active())return;
   report('');await CampaignMonsterCatalog.open();
  }catch(error){if(active())report('Could not load the creature catalogue. Choose Import SRD creature to try again.');}
  finally{if(button.isConnected)button.disabled=false;if(!active()&&feedback.isConnected)report('');}
 }
 function toolbar(host){
  host.innerHTML='<div class="workspace-actions"><button type="button" data-workspace-catalog>Import SRD creature</button><button type="button" data-workspace-personal>My Creature Library</button></div><p data-creature-catalog-feedback hidden role="status" aria-live="polite"></p>';
  host.querySelector('[data-workspace-catalog]').onclick=event=>openCreatureCatalogue(event.currentTarget,host.querySelector('[data-creature-catalog-feedback]'));
  host.querySelector('[data-workspace-personal]').onclick=openPersonalLibrary;
 }
 function card(host,s){
  if(!host)return;const draft=W.draft();if(!draft)return;
  bindEditor(host.closest('form'));
  let d;try{d=C.normalize(draft.data)}catch(error){host.textContent=error.message;return;}
  const e=escapeHtml;
  const rules=[d.movement,d.saves,d.skills,d.resistances&&'Resistances: '+d.resistances,d.immunities&&'Immunities: '+d.immunities,d.vulnerabilities&&'Vulnerabilities: '+d.vulnerabilities,d.conditionImmunities&&'Condition immunities: '+d.conditionImmunities,d.senses,d.languages,d.bonusActions&&'Bonus actions: '+d.bonusActions,d.reactions&&'Reactions: '+d.reactions,d.legendaryActions,d.phases].filter(Boolean).join('\n\n');
  host.innerHTML=`<div class="workspace-actions"><button type="button" data-creature-catalog>Import SRD creature</button><button type="button" data-personal-creatures>My Creature Library</button><button type="button" data-save-personal-creature>Save to My Library</button></div><p data-creature-catalog-feedback hidden role="status" aria-live="polite"></p><section class="workspace-card"><h3>${e(draft.title||'Unnamed creature')}</h3><p>${e(d.category)} · ${e(d.edition)}${d.combatEnabled&&d.cr?' · CR '+e(d.cr):''}</p>
   <div class="workspace-prose">${e([draft.content,d.appearance,d.personality].filter(Boolean).join('\n\n'))}</div>
   ${d.combatEnabled?`<div class="workspace-stats"><div><strong>${d.ac}</strong><span>AC</span></div><div><strong>${d.hp}</strong><span>Maximum HP</span></div><div><strong>${d.speed}</strong><span>ft.</span></div></div><div class="workspace-abilities">${C.abilities.map(key=>`<div>${key.toUpperCase()}<strong> ${d[key]}</strong> (${Math.floor((d[key]-10)/2)>=0?'+':''}${Math.floor((d[key]-10)/2)})</div>`).join('')}</div><h4>Actions</h4><div class="workspace-prose">${e(d.actions)}</div><h4>Traits</h4><div class="workspace-prose">${e(d.traits)}</div>${rules?`<h4>Additional rules</h4><div class="workspace-prose">${e(rules)}</div>`:''}`:''}
   ${d.source?`<p class="workspace-prose">${e(d.source.attribution)}<br>Source: ${e(d.source.provider)} · SRD ${e(d.source.srdVersion)}<br>Changes: ${e(d.source.changes)}</p>`:''}</section>`;
  host.querySelector('[data-creature-catalog]').onclick=event=>openCreatureCatalogue(event.currentTarget,host.querySelector('[data-creature-catalog-feedback]'));
  host.querySelector('[data-save-personal-creature]').onclick=async event=>{
    const button=event.currentTarget,record=W.draft();
    if(!record?.title?.trim()){W.status('Enter a creature name first.',true);return;}
    const campaignId=activeCampaign?.id,uid=auth.currentUser?.uid;
    if(!campaignId||!uid||!canManageCampaign())return;
    button.disabled=true;
    try{await PersonalCreatureLibrary.add({...record,sourceCampaignId:campaignId});if(activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid)W.status('Saved an independent copy in your personal creature library.');}
    catch(error){W.status('Personal library save failed: '+error.message,true);}
    finally{button.disabled=false;}
  };
  host.querySelector('[data-personal-creatures]').onclick=openPersonalLibrary;
 }
 W.configs.creature={title:'Creatures & NPCs',tab:'dm-creatures',noun:'creature',categories:C.categories,normalize:C.normalize,fields,editorBody,content:'Story description',secret:'Secrets and private tactics',help:'Start with the story and roleplaying. Add combat preparation when needed, then reuse the saved master in chapters and independent encounters.',toolbar,extra:card,onEdit:card};
})();
