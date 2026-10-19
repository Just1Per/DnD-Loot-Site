'use strict';
var CampaignMonsterCatalog = (()=>{
 let catalogue=null;
 async function load(){if(catalogue)return catalogue;const response=await fetch('data/rules/monsters.json?v=1');if(!response.ok)throw Error('Could not load the SRD catalogue.');const body=await response.json();if(body.schemaVersion!==1||!Array.isArray(body.records))throw Error('Unsupported SRD catalogue format.');catalogue=body.records;return catalogue;}
 async function open(){
  if(!activeCampaign||!canManageCampaign())return;
  const campaignId=activeCampaign.id,uid=auth.currentUser.uid,session=CampaignWorkspace.session;
  if(session?.kind!=='creature'||session.campaignId!==campaignId)return;
  const selected=new Set(),destinations=new Map();let busy=false,visible=[];
  document.getElementById('workspaceMonsterCatalog')?.remove();const dialog=document.createElement('dialog');dialog.id='workspaceMonsterCatalog';dialog.className='workspace-sheet-dialog';
  dialog.innerHTML='<header class="workspace-heading"><h2>SRD Creature Catalogue</h2><button type="button" data-close-catalog aria-label="Close creature catalogue">Close</button></header><p>Select creatures to save editable copies to this campaign’s DM workspace. Stat blocks stay DM-only. To introduce an NPC to players, set its entry type to Story NPC and share its player description.</p><div class="workspace-fields"><label class="workspace-field">Search name, type or CR<input type="search" data-catalog-search></label><label class="workspace-field">Edition<select data-catalog-edition><option value="">All allowed editions</option><option value="2014">2014</option><option value="2024">2024</option></select></label></div><div class="workspace-actions catalogue-selection-actions"><button type="button" data-catalog-select-visible disabled>Select visible</button><button type="button" data-catalog-clear disabled>Clear selection</button><button type="button" data-catalog-import-selected disabled>Import selected (0)</button></div><p role="status" aria-live="polite" data-catalog-status>Loading…</p><div data-catalog-results class="workspace-list"></div>';
  document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close-catalog]').onclick=()=>{if(!busy)dialog.close();};dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});dialog.addEventListener('close',()=>dialog.remove());
  const allowed=()=>dialog.isConnected&&CampaignWorkspace.session===session&&activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canManageCampaign();
  try{const records=await load();if(!allowed()){dialog.close();return;}
   dialog.querySelectorAll('[data-catalog-edition] option').forEach(option=>{if(option.value&&!CampaignRules.editions().includes(option.value))option.remove()});
   const paint=()=>{if(!allowed()){dialog.close();return;}const q=dialog.querySelector('[data-catalog-search]').value.toLowerCase(),edition=dialog.querySelector('[data-catalog-edition]').value;
    const focusedSelection=dialog.contains(document.activeElement)?document.activeElement?.dataset.selectMonster:null;
    const rows=records.filter(row=>CampaignRules.allowed(row)&&(!edition||row.edition===edition)&&(!q||[row.title,row.summary].join(' ').toLowerCase().includes(q)));
    for(const key of selected)if(!records.some(row=>row.id===key&&CampaignRules.allowed(row)))selected.delete(key);
    visible=rows.slice(0,100);
    dialog.querySelector('[data-catalog-status]').textContent=rows.length+' matching creatures; showing '+visible.length+'. '+selected.size+' selected across filters. Up to 100 per import.';
    const host=dialog.querySelector('[data-catalog-results]');host.innerHTML=visible.map(row=>`<div class="catalogue-creature-row"><label><input type="checkbox" data-select-monster="${escapeHtml(row.id)}" ${selected.has(row.id)?'checked':''}><span>${escapeHtml(row.title)}<small>${escapeHtml(row.summary)} · ${row.edition}</small></span></label><button type="button" data-import-monster="${escapeHtml(row.id)}" aria-label="Open ${escapeHtml(row.title)} ${row.edition} as a draft">Open as draft</button></div>`).join('')||'<p>No creatures match these filters.</p>';
    host.querySelectorAll('[data-select-monster]').forEach(input=>input.onchange=()=>{if(!allowed()||busy)return;if(input.checked&&selected.size<100)selected.add(input.dataset.selectMonster);else selected.delete(input.dataset.selectMonster);paint();});
    host.querySelectorAll('[data-import-monster]').forEach(button=>button.onclick=()=>{if(!allowed()||busy)return;const row=records.find(row=>row.id===button.dataset.importMonster);if(!row||!CampaignRules.allowed(row))return;if(CampaignWorkspace.importCreature(row))dialog.close();});
    if(focusedSelection)[...host.querySelectorAll('[data-select-monster]')].find(input=>input.dataset.selectMonster===focusedSelection)?.focus({preventScroll:true});
    dialog.querySelector('[data-catalog-import-selected]').textContent=`Import selected (${selected.size})`;
    dialog.querySelector('[data-catalog-import-selected]').disabled=!selected.size||busy;
    dialog.querySelector('[data-catalog-clear]').disabled=!selected.size||busy;
    dialog.querySelector('[data-catalog-select-visible]').disabled=!visible.length||busy;
   };
   dialog.querySelector('[data-catalog-select-visible]').onclick=()=>{if(!allowed()||busy)return;for(const row of visible){if(selected.size>=100)break;selected.add(row.id);}paint();};
   dialog.querySelector('[data-catalog-clear]').onclick=()=>{if(!busy){selected.clear();paint();}};
   dialog.querySelector('[data-catalog-import-selected]').onclick=async()=>{
    if(!allowed()||busy||!selected.size)return;
    const requests=[...selected].map(key=>{if(!destinations.has(key))destinations.set(key,CampaignWorkspace.id());return {key,id:destinations.get(key),record:records.find(row=>row.id===key)};});
    busy=true;dialog.querySelectorAll('button,input,select').forEach(control=>control.disabled=true);
    let result;
    try{result=await CampaignWorkspace.importCreatures(requests,{isCurrent:allowed,onProgress:(count,total,key)=>{selected.delete(key);if(allowed())dialog.querySelector('[data-catalog-status]').textContent=`Imported ${count} of ${total}. Stat blocks stay DM-only.`;}});}
    catch(error){result={completed:[],error};}
    finally{busy=false;if(allowed())dialog.querySelectorAll('button,input,select').forEach(control=>control.disabled=false);}
    for(const key of result.completed){selected.delete(key);destinations.delete(key);}
    if(!allowed())return;
    paint();dialog.querySelector('[data-catalog-status]').textContent=`${result.completed.length} imported to the DM workspace. `+(result.error?`Import stopped: ${result.error.message} Remaining selections are kept; retry to continue.`:'Nothing was shared with players. You can import more or close this window.');
   };
   dialog.querySelector('[data-catalog-search]').oninput=()=>{if(!busy)paint();};dialog.querySelector('[data-catalog-edition]').onchange=()=>{if(!busy)paint();};paint();
  }catch(error){if(dialog.isConnected)dialog.querySelector('[data-catalog-status]').textContent=error.message;}
 }
 return{open,load};
})();
