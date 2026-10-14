// Follow the public navigation, opening its group only when the destination is hidden.
async function navigate(page,tab){
 const button=page.locator('.tab[data-tab="'+tab+'"]');
 if(!await button.isVisible()){
  const group=['campaign-information','campaign-npcs','campaign-chapters'].includes(tab)?'journal':tab==='character-sheet'?'player':tab.startsWith('dm-')&&tab!=='dm-settings'?'dm':tab;
  await page.locator('#primaryNavigation .tab[data-tab="'+group+'"]').click();
 }
 await button.click();
}
module.exports={navigate};
