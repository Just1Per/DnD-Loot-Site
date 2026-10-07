(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name);};
 try{
 closeCharacterSheet(true);seed('player');delete testSheetDocs['campaigns/a/characterSheets/c1'];testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');await Promise.resolve();
 const field=n=>document.querySelector(`[name="${n}"]`),change=(n,v)=>{field(n).value=v;field(n).dispatchEvent(new Event('change',{bubbles:true}));};
 check('Inventory removes claiming and refresh controls but retains pack preview',!document.getElementById('sheetRefreshLoot')&&!document.getElementById('sheetLootGear')&&!!document.getElementById('sheetPackContents'));
 check('Overview has six decorative themed ability icons without source breakdowns',document.querySelectorAll('.sheet-summary-ability svg').length===6&&!document.querySelector('#sheetOverviewReadout [data-ability-breakdown]'));

 for(const [k,v] of Object.entries({str:15,dex:15,con:15,int:8,wis:8,cha:8}))change('abilities.'+k,v);
 change('build.scoreMethod','pointBuy');await Promise.resolve();
 check('Standard point buy uses the 27-point budget',document.getElementById('sheetPointBuySummary').textContent.includes('27 / 27'));
 check('Point buy forces pre-bonus Base mode',sheetSession.data.build.scoreMode==='base'&&field('build.scoreMode').value==='base'&&field('build.scoreMode').type==='hidden');
 check('Point buy constrains all six base fields to 8 through 15',[...document.querySelectorAll('[name^="abilities."]')].every(input=>input.min==='8'&&input.max==='15'));
 check('Point buy explains that later bonuses are free',document.getElementById('sheetPointBuySummary').textContent.includes('applied afterward')&&document.getElementById('sheetPointBuySummary').textContent.includes('do not cost point-buy points'));

 change('abilities.cha',9);await Promise.resolve();
 check('Over-budget choices receive an explicit warning',document.getElementById('sheetPointBuySummary').textContent.includes('1 points over budget'));
 check('Over-budget point buy cannot pass form validation',!document.getElementById('characterSheetForm').checkValidity());
 change('abilities.cha',8);

 change('abilities.str',16);await Promise.resolve();
 check('Scores above 15 are invalid in point-buy mode',!field('abilities.str').checkValidity()&&field('abilities.str').max==='15');
 change('abilities.str',15);
 change('abilities.int',7);await Promise.resolve();
 check('Scores below 8 are invalid in point-buy mode',!field('abilities.int').checkValidity()&&field('abilities.int').min==='8');
 change('abilities.int',8);

 const reset=document.querySelector('[data-point-buy-reset]');
 check('Point buy provides a reset-to-8 control',!!reset);
 reset.click();await Promise.resolve();
 check('Reset starts all six abilities at 8 with all 27 points available',Object.values(sheetSession.data.abilities).every(v=>v===8)&&document.getElementById('sheetPointBuySummary').textContent.includes('Points remaining')&&document.getElementById('sheetPointBuySummary').textContent.includes('27'));

 // Standard point buy prices only the pre-racial values. A 2014 Hill Dwarf's
 // CON increase is applied after buying the base score and does not change its cost.
 change('build.edition','2014');change('build.race','hill-dwarf');change('abilities.con',15);await Promise.resolve();
 const priced=CharacterSheetModel.pointBuy(sheetSession.data.abilities),derived=CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level);
 check('Racial bonuses are applied after point buy',priced.rows.find(r=>r.key==='con').cost===9&&derived.scores.con===17);

 change('build.edition','2024');change('build.background','custom');change('build.race','');change('identity.level',4);change('abilities.str',15);
 const id=Object.keys(CharacterFeatRules.definitions).find(k=>CharacterFeatRules.definitions[k].name==='Ability Score Improvement'&&CharacterFeatRules.definitions[k].source==='XPHB');
 sheetSession.data.rulesChoices.feats=[id];sheetSession.data.rulesChoices.effects[id]={option:0,abilities:['str']};updateSheetCalculations();
 check('Ability tab identifies the feat source and post-buy increase',document.querySelector('[data-ability-breakdown="str"]').textContent.includes('Ability Score Improvement (2024)'));

 // Rerender controls so save reads the actual feat state rather than stale named fields.
 renderCharacterSheet();await Promise.resolve();await saveCharacterSheet();closeCharacterSheet(true);await openCharacterSheet('c1');await Promise.resolve();
 check('Point-buy preference survives saving and reopening',sheetSession.data.build.scoreMethod==='pointBuy'&&field('build.scoreMethod').value==='pointBuy');
 check('Saved point-buy sheets reopen in Base mode',sheetSession.data.build.scoreMode==='base'&&field('build.scoreMode').type==='hidden');
 closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false});}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
