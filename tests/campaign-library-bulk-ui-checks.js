(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  seed('dm');renderCampaignToolbar();
  check('DM Library shows bulk player-loot on/off and unlimited buttons',
   !!document.querySelector('[data-bulk-item-policy="player-loot"]')&&
   !!document.querySelector('[data-bulk-item-policy="dm-only"]')&&
   !!document.querySelector('[data-bulk-item-policy="unlimited"]'));
  seed('player');renderCampaignToolbar();
  check('Players never see DM Library bulk item controls',!document.querySelector('[data-bulk-item-policy]'));
  const bookmark={id:'c1__potion',itemId:'potion',characterId:'c1',userId:'player',created:1};
  saves=[bookmark];renderMyWishes();
  const savedCard=document.querySelector('#myWishGrid .saved-item-card'),lootCard=createCard(fixtureItems[0],{inventoryEntry:{itemId:'potion',characterId:'c1',userId:'player',quantity:1}});
  check('Saved entries use the full Looted item-card markup and item description',
   savedCard?.classList.contains('item-card')&&savedCard.querySelector('.card-header,.card-body,.card-footer')&&
   savedCard.querySelector('.item-description')?.textContent===lootCard.querySelector('.item-description')?.textContent&&
   savedCard.querySelector('.property-block')?.textContent.includes('Restore health'));
  check('Saved cards expose bookmark controls, but cannot loot, use or assign inventory',
   !!savedCard.querySelector('.saved-remove-button')&&!savedCard.querySelector('.loot-button,.use-button,.assign-button,.unloot-button'));
  const inventoryBefore=JSON.stringify(inventory),actionCount=callLog.length,writesBefore=testWrites.length;
  savedCard.querySelector('.saved-remove-button').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  check('Removing Saved deletes only its bookmark, not inventory or stock',
   testWrites.slice(writesBefore).some(row=>row.path==='campaigns/a/saves/c1__potion'&&row.data===null)
   &&JSON.stringify(inventory)===inventoryBefore&&callLog.length===actionCount);
  characters.push({id:'c3',name:'Nim',class:'Rogue',userId:'player',active:true,level:2});
  saves=[bookmark];renderMyWishes();
  const select=document.querySelector('#myWishGrid .saved-character-target');select.value='c3';
  const moveWrites=testWrites.length;
  document.querySelector('#myWishGrid .saved-move-button').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  check('Moving Saved changes character bookmarks atomically without claiming stock',
   testWrites.slice(moveWrites).some(row=>row.path==='campaigns/a/saves/c1__potion'&&row.data===null)&&
   testWrites.slice(moveWrites).some(row=>row.path==='campaigns/a/saves/c3__potion'&&row.data?.characterId==='c3')&&
   JSON.stringify(inventory)===inventoryBefore&&callLog.length===actionCount);
  saves=[{...bookmark,id:'c1__unavailable',itemId:'unavailable'}];renderMyWishes();
  check('A hidden or unavailable saved item is retained with a safe removal action',
   !!document.querySelector('#myWishGrid .saved-item-unavailable')&&
   !!document.querySelector('#myWishGrid .saved-remove-button'));
  seed('dm');saves=[bookmark];await openWishModal('c1','Thorin');
  check('DM Saved page uses the same full item cards without loot actions',
   !!document.querySelector('#characterWishlistGrid .saved-item-card .property-block')&&
   !!document.querySelector('#characterWishlistGrid .saved-remove-button')&&
   !document.querySelector('#characterWishlistGrid .loot-button,#characterWishlistGrid .assign-button,#characterWishlistGrid .use-button'));
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
