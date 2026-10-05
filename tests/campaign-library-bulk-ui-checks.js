(()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  seed('dm');renderCampaignToolbar();
  check('DM Library shows bulk player-loot on/off and unlimited buttons',
    !!document.querySelector('[data-bulk-item-policy="player-loot"]')&&
    !!document.querySelector('[data-bulk-item-policy="dm-only"]')&&
    !!document.querySelector('[data-bulk-item-policy="unlimited"]'));
  seed('player');renderCampaignToolbar();
  check('Players never see DM Library bulk item controls',!document.querySelector('[data-bulk-item-policy]'));
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();