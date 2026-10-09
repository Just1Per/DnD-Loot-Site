'use strict';
var CampaignMonsterCatalog = (()=>{
 let catalogue=null;
 async function load(){if(catalogue)return catalogue;const response=await fetch('data/rules/monsters.json?v=1');if(!response.ok)throw Error('Could not load the SRD catalogue.');const body=await response.json();if(body.schemaVersion!==1||!Array.isArray(body.records))throw Error('Unsupported SRD catalogue format.');catalogue=body.records;return catalogue;}
 async function open(){
  if(!activeCampaign||!canManageCampaign())return;
  const campaignId=activeCampaign.id,uid=auth.currentUser.uid;
  document.getElementById('workspaceMonsterCatalog')?.remove();const dialog=document.createElement('dialog');dialog.id='workspaceMonsterCatalog';dialog.className='workspace-sheet-dialog';
  dialog.innerHTML='<header class="workspace-heading"><h2>SRD Creature Catalogue</h2><button type="button" data-close-catalog aria-label="Close creature catalogue">Close</button></header><p>Import an editable campaign copy. The global source stays unchanged. Only your campaign’s allowed editions are shown.</p><div class="workspace-fields"><label class="workspace-field">Search name, type or CR<input type="search" data-catalog-search></label><label class="workspace-field">Edition<select data-catalog-edition><option value="">All allowed editions</option><option value="2014">2014</option><option value="2024">2024</option></select></label></div><p role="status" data-catalog-status>Loading…</p><div data-catalog-results class="workspace-list"></div>';
  document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close-catalog]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
  const allowed=()=>dialog.isConnected&&activeCampaign?.id===campaignId&&auth.currentUser?.uid===uid&&canManageCampaign();
  try{const records=await load();if(!allowed()){dialog.close();return;}
   dialog.querySelectorAll('[data-catalog-edition] option').forEach(option=>{if(option.value&&!CampaignRules.editions().includes(option.value))option.remove()});
   const paint=()=>{if(!allowed()){dialog.close();return;}const q=dialog.querySelector('[data-catalog-search]').value.toLowerCase(),edition=dialog.querySelector('[data-catalog-edition]').value;
    const rows=records.filter(row=>CampaignRules.allowed(row)&&(!edition||row.edition===edition)&&(!q||[row.title,row.summary].join(' ').toLowerCase().includes(q)));
    dialog.querySelector('[data-catalog-status]').textContent=rows.length+' matching creatures; showing the first 100. Narrow the search to find more.';
    const host=dialog.querySelector('[data-catalog-results]');host.innerHTML=rows.slice(0,100).map(row=>`<button type="button" data-import-monster="${escapeHtml(row.id)}">${escapeHtml(row.title)}<small>${escapeHtml(row.summary)} · ${row.edition}</small></button>`).join('');
    host.querySelectorAll('[data-import-monster]').forEach(button=>button.onclick=()=>{if(!allowed())return;const row=records.find(row=>row.id===button.dataset.importMonster);if(!row||!CampaignRules.allowed(row))return;if(CampaignWorkspace.importCreature(row))dialog.close();});
   };dialog.querySelector('[data-catalog-search]').oninput=paint;dialog.querySelector('[data-catalog-edition]').onchange=paint;paint();
  }catch(error){if(dialog.isConnected)dialog.querySelector('[data-catalog-status]').textContent=error.message;}
 }
 return{open,load};
})();
