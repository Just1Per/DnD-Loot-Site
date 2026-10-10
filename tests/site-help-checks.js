(async()=>{
 const results=JSON.parse(document.getElementById('test-results').textContent),check=(name,ok)=>{results.push({name,pass:!!ok});if(!ok)throw Error(name)};
 try{
  SiteHelp.onLogout();seed('player');testSheetDocs['campaigns/a/characters/c1']={...characters[0]};await openCharacterSheet('c1');SiteHelp.refresh();
  check('Help badges explain fields without adding editable sheet values',document.querySelector('[name="build.edition"]').closest('label').querySelector('.vault-help-badge')&&document.querySelectorAll('#characterSheetForm .vault-help-badge[name]').length===0);
  const ability=document.querySelector('[name="abilities.str"]'),help=ability.closest('label').querySelector('.vault-help-badge');
  help.click();check('Ability help states base scores and origin/feat bonuses',document.getElementById('vaultContextHelp').textContent.includes('base Strength')&&help.getAttribute('aria-expanded')==='true');
  check('Reading help never changes the ability score',Number(ability.value)===sheetSession.data.abilities.str);
  help.click();check('Clicking help again closes its tooltip',document.getElementById('vaultContextHelp').hidden&&help.getAttribute('aria-expanded')==='false');
  const xp=document.querySelector('[name="adobe.useExperience"]'),beforeXP=xp.checked;xp.closest('label').querySelector('.vault-help-badge').click();check('Reading checkbox help does not change leveling mode',xp.checked===beforeXP);SiteHelp.hide();
  selectSheetTab('inventory');SiteHelp.refresh();check('Print and personal gear actions have their own explanations',document.getElementById('sheetPrint').nextElementSibling?.classList.contains('vault-help-badge')&&document.getElementById('sheetAddBaseGear').nextElementSibling?.classList.contains('vault-help-badge'));selectSheetTab('overview');SiteHelp.refresh();
  check('Overview AC and spell DC explain calculated statistics', [...document.querySelectorAll('.sheet-summary-metrics .vault-help-badge')].some(b=>b._vaultHelp.includes('defense target'))&&[...document.querySelectorAll('.sheet-summary-metrics .vault-help-badge')].some(b=>b._vaultHelp.includes('8 + proficiency')));
  const comp=document.querySelector('[data-companion-field="hpMax"]');check('Companion help describes its separate hit points',SiteHelp.explain(comp,'Max HP').includes('separate from your character'));
  const summary=document.querySelector('[data-companion-notes="0"] > summary'),wasOpen=summary.parentElement.hasAttribute('open');summary.parentElement.parentElement.querySelector(':scope > .vault-help-badge').click();check('Help inside disclosure does not open or close the notes',summary.parentElement.hasAttribute('open')===wasOpen);SiteHelp.hide();
  const automatic=document.getElementById('sheetBuildSummaryTitle');automatic.textContent='Calculated from your choices · 2024';SiteHelp.refresh();check('Help is restored after a heading updates in place',document.querySelectorAll('#sheet-builder button[aria-label^="Help: Calculated from your choices"]').length===1);SiteHelp.refresh();check('Refreshing help never duplicates badges',document.querySelectorAll('#sheet-builder button[aria-label^="Help: Calculated from your choices"]').length===1);
  const permissions=callLog.length;SiteHelp.openGuide('player');
  check('Player guide includes joining building loot notes print and DM application', ['Join a campaign','accept the invitation','Point buy','Active Gear','Notes','Print','apply for global DM access'].every(text=>document.getElementById('siteGuideDialog').textContent.includes(text)));
  check('Player cannot switch to admin or DM guides',document.querySelectorAll('button[data-guide-role]').length===1&&document.querySelector('[data-guide-role="player"]'));
  check('Opening guide performs no writes or invitation acceptance',callLog.length===permissions);
  document.querySelector('[data-guide-close]').click();check('Close button dismisses the guide',!document.getElementById('siteGuideDialog'));
  seed('dm');SiteHelp.openGuide('dm');check('DM guide distinguishes global access from campaign roles',document.getElementById('siteGuideDialog').textContent.includes('membership there determines')&&document.getElementById('siteGuideDialog').textContent.includes('limited or unlimited stock'));
  check('Manual Guide has no misleading auto-open preference',!document.getElementById('siteGuideRemember'));SiteHelp.closeGuide();SiteHelp.onLogin();check('Login retains manual Guide without opening it or writing application data',!document.getElementById('siteGuideDialog')&&callLog.length===permissions);
  SiteHelp.openGuide('dm');check('Guide can always be reopened manually',document.getElementById('siteGuideDialog').open);SiteHelp.closeGuide();
  seed('admin');SiteHelp.openGuide('admin');check('Admin guide respects global catalogue and campaign independence',document.getElementById('siteGuideDialog').textContent.includes('Campaign DMs work with campaign copies')&&document.getElementById('siteGuideDialog').textContent.includes('does not assign the user as DM in every campaign'));
  check('Admin can review all three guides',document.querySelectorAll('button[data-guide-role]').length===3);
  SiteHelp.onLogout();check('Logout removes open help and role guide',!document.getElementById('siteGuideDialog')&&document.getElementById('vaultContextHelp').hidden&&document.getElementById('siteGuideButton').hidden);
  seed('player');closeCharacterSheet(true);
 }catch(e){results.push({name:e.stack,pass:false})}
 document.getElementById('test-results').textContent=JSON.stringify(results,null,2);
})();
