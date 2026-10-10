'use strict';
(()=>{
 const W=CampaignWorkspace,C=CampaignCreatures,e=escapeHtml;
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
        list.innerHTML=matches.map(row=>'<div class="workspace-actions" data-template-row="'+escapeHtml(row.id)+'"><button type="button" data-personal-id="'+escapeHtml(row.id)+'">'+escapeHtml(row.title)+' · '+escapeHtml(row.data?.category||'Creature')+'</button><button type="button" data-edit-template="'+escapeHtml(row.id)+'" aria-label="Edit '+escapeHtml(row.title)+'">Edit</button><button type="button" data-delete-template="'+escapeHtml(row.id)+'" aria-label="Delete '+escapeHtml(row.title)+'">Delete</button></div>').join('')||'<p>No matching templates.</p>';
        list.querySelectorAll('[data-personal-id]').forEach(button=>button.onclick=()=>{
          if(!permitted())return;const record=rows.find(row=>row.id===button.dataset.personalId);
          if(record&&W.importCreature(record))dialog.close();
        });
        list.querySelectorAll('[data-edit-template]').forEach(button=>button.onclick=()=>{
          if(!permitted())return;
          const record=rows.find(row=>row.id===button.dataset.editTemplate);if(!record)return;
          const editor=document.createElement('dialog');editor.className='workspace-sheet-dialog';
          const data=C.normalize(record.data||{});
          const entries=[['category','Entry type','select'],['edition','Rules edition','select'],['combatEnabled','Include combat stats','check'],['ac','Armor class','number'],['hp','Maximum HP','number'],['speed','Speed (ft.)','number'],...C.abilities.map(key=>[key,key.toUpperCase(),'number']),...textFields.map(([key,label])=>[key,label,'text'])];
          const control=([key,label,type])=>{
            const value=data[key];
            if(type==='select'){const options=key==='category'?C.categories:['Homebrew','2014','2024'];return '<label class="workspace-field">'+e(label)+'<select data-template-field="'+key+'">'+options.map(v=>'<option value="'+e(v)+'" '+(v===value?'selected':'')+'>'+e(v)+'</option>').join('')+'</select></label>';}
            if(type==='check')return '<label class="workspace-field"><input type="checkbox" data-template-field="'+key+'" '+(value?'checked':'')+'> '+e(label)+'</label>';
            if(type==='number')return '<label class="workspace-field">'+e(label)+'<input type="number" min="0" max="'+(key==='hp'?10000:key==='speed'?600:key==='ac'?40:30)+'" data-template-field="'+key+'" value="'+Number(value??0)+'"></label>';
            return '<label class="workspace-field">'+e(label)+'<textarea data-template-field="'+key+'" maxlength="20000">'+e(value||'')+'</textarea></label>';
          };
          editor.innerHTML='<header class="workspace-heading"><h2>Edit personal creature</h2><button type="button" data-template-cancel>Close</button></header><form data-template-form><div class="workspace-fields"><label class="workspace-field workspace-full">Name<input name="title" maxlength="160" required value="'+e(record.title)+'"></label><label class="workspace-field workspace-full">Summary<textarea name="summary" maxlength="1000">'+e(record.summary||'')+'</textarea></label><label class="workspace-field workspace-full">Story description<textarea name="content" maxlength="20000">'+e(record.content||'')+'</textarea></label>'+entries.map(control).join('')+'</div><p data-template-feedback role="status"></p><div class="workspace-actions"><button type="submit">Save changes</button><button type="button" data-template-cancel>Cancel</button></div></form>';
          document.body.append(editor);editor.showModal();
          editor.querySelectorAll('[data-template-cancel]').forEach(b=>b.onclick=()=>editor.close());
          editor.addEventListener('close',()=>editor.remove());
          editor.querySelector('[data-template-form]').onsubmit=async event=>{
            event.preventDefault();if(!permitted()){editor.close();return;}
            const form=event.currentTarget;if(!form.reportValidity())return;
            const next=structuredClone(data);
            form.querySelectorAll('[data-template-field]').forEach(input=>{const key=input.dataset.templateField;next[key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;});
            const saveButton=form.querySelector('[type=submit]');saveButton.disabled=true;
            try{
              const updated={...record,title:form.elements.namedItem('title').value.trim(),summary:form.elements.namedItem('summary').value,content:form.elements.namedItem('content').value,data:C.normalize(next)};
              await PersonalCreatureLibrary.update(record.id,updated);
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
            rows.splice(rows.findIndex(row=>row.id===record.id),1);draw();
            dialog.querySelector('[data-personal-status]').textContent='Personal template deleted. Campaign copies were not changed.';
          }catch(error){dialog.querySelector('[data-personal-status]').textContent='Delete failed: '+error.message;}
          finally{button.disabled=false;}
        });
      };
      dialog.querySelector('[data-personal-search]').oninput=draw;draw();
    }catch(error){if(dialog.isConnected)dialog.querySelector('[data-personal-status]').textContent=error.message;}
  };
 }
 W.configs.creature={title:'Creatures & NPCs',tab:'dm-world',noun:'creature',categories:C.categories,normalize:C.normalize,fields:[['category','Entry type','select'],['edition','Rules edition','select',['Homebrew','2014','2024']],['combatEnabled','Include combat statistics','checkbox'],['ac','Armor class','number',null,40],['hp','Maximum hit points','number',null,10000],['speed','Speed (ft.)','number',null,600],...C.abilities.map(key=>[key,key.toUpperCase(),'number',null,30]),...textFields.map(([key,label])=>[key,label,'textarea'])],content:'Story description',secret:'Secrets and private tactics',help:'Create one master card and reuse it in world entries, chapters and encounters. Combat encounters have their own HP and conditions.',extra:card,onEdit:card};
})();
