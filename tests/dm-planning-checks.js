(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent);
 const check=(name,pass)=>results.push({name,pass:!!pass});
 try{
  seed('dm');renderDMTools();SiteHelp.refresh();
  const row=document.querySelector('#dmToolsPanel .dm-planning-grid');
  check('DM Tools has four adjacent campaign planning cards',row?.querySelectorAll(':scope > section').length===4&&row.querySelector('h2').textContent.replace('?','').trim()==='Item Controls');
  check('All three planning cards have readable guides',row.querySelectorAll('[data-dm-planning-guide]').length===3&&[...row.querySelectorAll('[data-dm-planning-guide]')].every(d=>d.querySelector('summary')&&d.querySelectorAll('li').length===4));
  check('World guide separates player discoveries from DM secrets',row.textContent.includes('player-facing description')&&row.textContent.includes('private DM notes'));
  check('Chapter guidance keeps milestone level changes explicit',row.textContent.includes('Character Builder')&&row.textContent.includes('must not silently change sheets'));
  check('One-shots cover player hosts, multiple sheets and mixed rosters',row.textContent.includes('invite a player')&&row.textContent.includes('multiple sheets')&&row.textContent.includes('combine both'));
  check('One-shot outcomes do not silently affect main campaign characters',row.textContent.includes('HP, resources, loot and leveling stay on its own sheets'));
  check('Planning cards include contextual help and honest availability',row.querySelectorAll('.dm-planning-card h2 .vault-help-badge').length===3&&row.querySelectorAll('.dm-planning-status').length===3);
  const before=testWrites.length;document.getElementById('dmOpenLibrary').click();
  check('Existing Library controls remain functional without planning writes',document.getElementById('tab-library').style.display!=='none'&&testWrites.length===before);
  seed('player');renderDMTools();check('Players cannot access campaign planning through DM Tools',!document.querySelector('#dmToolsPanel .dm-planning-grid')&&document.getElementById('dmToolsPanel').textContent.includes('do not have DM access'));
  seed('admin','player');renderDMTools();check('Global admin access does not grant campaign planning rights',!document.querySelector('#dmToolsPanel .dm-planning-grid'));
  seed('dm','viewer');renderDMTools();check('Global DM access does not bypass campaign membership',!document.querySelector('#dmToolsPanel .dm-planning-grid'));
  seed('dm');activeCampaign=null;renderDMTools();check('No campaign leaves a guarded planning empty state',!document.querySelector('#dmToolsPanel .dm-planning-grid'));
 }catch(error){results.push({name:error.stack,pass:false})}
 finally{seed('dm')}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
