(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent);
 const check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  seed('player');
  const card=document.querySelector('#card-container .item-card');
  AiLookup.enhance(card);
  const icon=card.querySelector('.ai-lookup-icon');
  check('Every Library item gets an accessible compact book lookup control',!!icon&&icon.getAttribute('aria-label').includes('Healing Potion')&&icon.querySelector('svg'));
  const writes=testWrites.length,lootActions=callLog.length;
  icon.click();
  const dialog=document.getElementById('aiLookupDialog');
  check('Opening lookup reads item name type and source without querying Gemini',dialog.open&&
   dialog.querySelector('#aiLookupName').value==='Healing Potion'&&
   dialog.querySelector('#aiLookupKind').value==='item'&&testLookupCalls.length===0);
  check('Book icon has a Google search fallback with encoded entry',dialog.querySelector('#aiLookupGoogle').href.includes('Healing%20Potion'));
  dialog.querySelector('#aiLookupEdition').value='2024';
  dialog.querySelector('#aiLookupRun').click();
  await new Promise(r=>setTimeout(r,0));
  check('Grounded lookup explicitly sends item type edition and name only after search click',
   testLookupCalls.length===1&&testLookupCalls[0].includes('Entry name: Healing Potion')&&
   testLookupCalls[0].includes('Rules edition: 2024')&&testLookupCalls[0].includes('Rules type: magic item'));
  check('Short model output uses plain text and links only safe HTTP(S) sources',
   dialog.querySelector('#aiLookupAnswer').textContent==='A short grounded factual overview.'&&
   dialog.querySelectorAll('#aiLookupSources a').length===1&&
   dialog.querySelector('#aiLookupSources a').href.startsWith('https://'));
  check('Google-grounded suggestions are isolated in a sandboxed frame',
   !!dialog.querySelector('#aiLookupSuggestions iframe[sandbox]')&&
   !!dialog.querySelector('#aiLookupSuggestions iframe').getAttribute('srcdoc').includes('Google source suggestions'));
  check('AI Lookup never writes loot inventory or cached campaign records',
   testWrites.length===writes&&callLog.length===lootActions);
  dialog.close();
  const examples=document.createElement('section');
  const feat=CharacterCatalog.rawData.feats[0],spell=CharacterCatalog.rawData.spells[0];
  examples.innerHTML='<article><button type="button" data-feat-info="'+feat.id+'">i</button></article>'+
   '<article><button type="button" data-spell-info="'+spell.id+'">i</button></article>';
  document.body.append(examples);AiLookup.enhance(examples);
  check('Every feat and spell catalogue information row receives its own book icon',
   examples.querySelectorAll('.ai-lookup-icon').length===2);
  examples.querySelector('[data-feat-info] + .ai-lookup-icon').click();
  check('Feat lookup uses feat identity and the source edition',
   dialog.querySelector('#aiLookupKind').value==='feat'&&
   dialog.querySelector('#aiLookupName').value===feat.name&&
   dialog.querySelector('#aiLookupEdition').value===feat.edition);
  dialog.close();
  examples.querySelector('[data-spell-info] + .ai-lookup-icon').click();
  check('Spell lookup preserves the spell name and edition',
   dialog.querySelector('#aiLookupKind').value==='spell'&&
   dialog.querySelector('#aiLookupName').value===spell.name&&
   dialog.querySelector('#aiLookupEdition').value===spell.edition);
  dialog.close();examples.remove();
  const toolbar=document.querySelector('#tab-library .toolbar');
  AiLookup.enhance(toolbar);
  const custom=toolbar.querySelector('.ai-lookup-icon');
  check('Library toolbar offers manual lookup for items missing from every catalogue',
   !!custom);
  custom.click();
  check('Manual search starts empty for a non-SRD name and never auto-queries Google',
   dialog.querySelector('#aiLookupName').value===''&&
   dialog.querySelector('#aiLookupKind').value==='item'&&testLookupCalls.length===1);
  dialog.close();

  const userGuide=document.getElementById('siteGuideButton');
  check('The top Guide explains the open-book AI Lookup meaning',!!userGuide&&
   SiteHelp.openGuide&&
   (()=>{SiteHelp.openGuide('player');const found=document.getElementById('siteGuideDialog')?.textContent.includes('AI Lookup');SiteHelp.closeGuide();return found;})());
 }catch(error){results.push({name:error.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
