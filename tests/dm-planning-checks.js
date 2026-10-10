(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent);
 const check=(name,pass)=>results.push({name,pass:!!pass});
 try{
  seed('dm');renderDMTools();SiteHelp.refresh();
  const cards=document.querySelectorAll('#dmToolsPanel .dm-planning-shortcut');
  check('DM Tools retains three compact planning shortcuts',cards.length===3&&[...cards].every(card=>card.querySelector('[data-open-dm-planning]')));
  check('Dedicated planning tabs remain available to campaign DMs',['world','chapters','one-shots'].every(id=>document.getElementById('dmPlanningTab-'+id)?.style.display!=='none'));
  const guides=renderDMPlanningCards();
  check('Guidance separates player discoveries from DM secrets',guides.includes('player-facing description')&&guides.includes('private DM notes'));
  check('Milestone guidance keeps level changes explicit',guides.includes('must not silently change sheets'));
  check('One-shot guidance covers scoped hosting and separate sheets',guides.includes('not campaign-wide DM tools or secrets')&&guides.includes('multiple sheets'));
  check('All persisted workspace kinds register their editors',['world','creature','chapter','encounter','oneShot'].every(kind=>CampaignWorkspace.configs[kind]?.tab));
  check('Planning headings retain contextual help',[...cards].every(card=>card.querySelector('h2 .vault-help-badge')));
  const before=testWrites.length;document.getElementById('dmOpenLibrary').click();
  check('Existing Library controls remain functional without planning writes',document.getElementById('tab-library').style.display!=='none'&&testWrites.length===before);
  seed('player');renderDMTools();check('Players cannot see any DM planning tab',['world','chapters','one-shots'].every(id=>document.getElementById('dmPlanningTab-'+id).style.display==='none'));
  showTab('player');for(const id of ['world','chapters','one-shots']){showTab('dm-'+id);check('Player direct navigation is blocked: '+id,document.getElementById('tab-dm-'+id).style.display==='none');}
  await CampaignWorkspace.render('oneShot');check('Player cannot render the one-shot planning editor directly',!CampaignWorkspace.session);
  seed('admin','player');renderDMTools();check('Global admin does not grant campaign planning rights',['world','chapters','one-shots'].every(id=>document.getElementById('dmPlanningTab-'+id).style.display==='none'));
  seed('dm','player');renderDMTools();check('Global DM role does not expose another campaign’s planning tabs',['world','chapters','one-shots'].every(id=>document.getElementById('dmPlanningTab-'+id).style.display==='none'));
  seed('dm','owner');renderDMTools();check('Campaign owner retains all planning tabs',['world','chapters','one-shots'].every(id=>document.getElementById('dmPlanningTab-'+id).style.display!=='none'));
  seed('dm');activeCampaign=null;renderDMTools();check('No campaign leaves a guarded planning empty state',document.getElementById('dmPlanningTab-world').style.display==='none');
 }catch(error){results.push({name:error.stack,pass:false})}
 finally{seed('dm')}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
