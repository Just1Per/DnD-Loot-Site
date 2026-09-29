(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
 try{
 closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
 const field=n=>document.querySelector(`[name="${n}"]`),change=(n,v)=>{field(n).value=v;field(n).dispatchEvent(new Event('change',{bubbles:true}));};
 check('Inventory removes claiming and refresh controls but retains pack preview',!document.getElementById('sheetRefreshLoot')&&!document.getElementById('sheetLootGear')&&!!document.getElementById('sheetPackContents'));
 check('Overview has six decorative themed ability icons without source breakdowns',document.querySelectorAll('.sheet-summary-ability svg').length===6&&!document.querySelector('#sheetOverviewReadout [data-ability-breakdown]'));
 for(const [k,v] of Object.entries({str:15,dex:15,con:15,int:8,wis:8,cha:8}))change('abilities.'+k,v);
 change('build.scoreMethod','pointBuy');check('Point buy shows the 27-point budget without changing scores',document.getElementById('sheetPointBuySummary').textContent.includes('27 / 27')&&sheetSession.data.abilities.str===15);
 change('abilities.cha',9);check('Over-budget choices receive an explicit warning',document.getElementById('sheetPointBuySummary').textContent.includes('1 points over budget'));
 change('abilities.str',16);check('Out-of-range scores are preserved and flagged',sheetSession.data.abilities.str===16&&document.getElementById('sheetPointBuySummary').textContent.includes('Check STR'));
 change('build.scoreMode','total');check('Final totals are not incorrectly priced as base scores',document.getElementById('sheetPointBuySummary').textContent.includes('final totals cannot be priced reliably'));
 change('build.scoreMode','base');change('build.background','custom');change('build.race','');change('identity.level',4);change('abilities.str',19);
 const id=Object.keys(CharacterFeatRules.definitions).find(k=>CharacterFeatRules.definitions[k].name==='Ability Score Improvement'&&CharacterFeatRules.definitions[k].source==='XPHB');
 sheetSession.data.rulesChoices.feats=[id];sheetSession.data.rulesChoices.effects[id]={option:0,abilities:['str']};updateSheetCalculations();
 check('Ability tab identifies the feat source and capped increase',document.querySelector('[data-ability-breakdown="str"]').textContent.includes('Ability Score Improvement (2024) +1 · capped'));
 // Rerender controls so save reads the actual feat state rather than stale named fields.
 renderCharacterSheet();await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();
 check('Point-buy preference survives saving and reopening',sheetSession.data.build.scoreMethod==='pointBuy'&&field('build.scoreMethod').value==='pointBuy');
 closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
