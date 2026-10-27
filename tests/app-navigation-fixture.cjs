// Follow the public navigation, opening its group only when the destination is hidden.
async function navigate(page,tab){
 const button=page.locator('.tab[data-tab="'+tab+'"]');
 const compact=page.locator('[data-dm-workspace-select]');
 const useCompact=async()=>{if((tab==='dm'||tab.startsWith('dm-'))&&await compact.isVisible()&&await compact.locator('option[value="'+tab+'"]').count()){await compact.selectOption(tab);return true;}return false;};
 if(await useCompact())return;
 if(!await button.isVisible()){
  const group=['campaign-journal','campaign-map','campaign-information','campaign-npcs','campaign-chapters'].includes(tab)?'journal':tab==='character-sheet'?'player':tab.startsWith('dm-')&&tab!=='dm-settings'?'dm':tab;
  await page.locator('#primaryNavigation .tab[data-tab="'+group+'"]').click();
 }
 if(await useCompact())return;
 if(tab==='dm-one-shots'&&!await button.isVisible()){await page.locator('[data-dm-legacy-adventures] > summary').click();}
 await button.click();
}
async function expandWorldTools(page){
 await openEditorOptions(page);
 const shotPrivate=page.locator('.one-shot-private');if(await shotPrivate.count()&&!await shotPrivate.evaluate(n=>n.open))await shotPrivate.locator(':scope > summary').click();
 if(await page.locator('[data-world-basics]').count()){
  for(const detail of await page.locator('[data-world-advanced], details[data-world-option], [data-entry-sharing] details').all())if(!await detail.evaluate(node=>node.open))await detail.locator(':scope > summary').click();
 }
}
async function openEditorOptions(page){const options=page.locator('.workspace-editor-options,.one-shot-more');if(await options.count()&&!await options.evaluate(n=>n.open))await options.locator(':scope > summary').click();}
async function archiveEntry(page){
 await expandWorldTools(page);await openEditorOptions(page);
 await page.locator('[data-archive-record]').click();
 await page.locator('#siteConfirmationDialog [data-site-confirm]').click();
}
module.exports={navigate,expandWorldTools,archiveEntry,openEditorOptions};
