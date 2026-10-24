'use strict';
/* Strict 5e standard point-buy UI. The calculation lives in CharacterSheetModel;
 * this layer enforces the 8–15 pre-bonus range and 27-point budget in the form. */
(() => {
  const abilityKeys = ['str','dex','con','int','wis','cha'];

  function form() {
    return document.getElementById('characterSheetForm');
  }

  function pointBuyEnabled() {
    return sheetSession?.data?.build?.scoreMethod === 'pointBuy';
  }

  function inputFor(key) {
    return form()?.querySelector(`[name="abilities.${key}"]`) || null;
  }

  function forceBaseModeFromControl() {
    const root = form();
    if (!root) return;
    const method = root.querySelector('[name="build.scoreMethod"]');
    const mode = root.querySelector('[name="build.scoreMode"]');
    if (!method || !mode) return;
    mode.value = 'base';
    if(sheetSession?.data?.build)sheetSession.data.build.scoreMode='base';
  }

  function applyLimitsAndValidity() {
    const root = form();
    if (!root || !sheetSession) return;
    const enabled = pointBuyEnabled();
    const calculation = CharacterSheetModel.pointBuy(sheetSession.data.abilities);

    for (const key of abilityKeys) {
      const input = inputFor(key);
      if (!input) continue;
      input.min = enabled ? '8' : '1';
      input.max = enabled ? '15' : '30';
      input.step = '1';
      input.setCustomValidity('');
    }

    if (!enabled) return;

    for (const row of calculation.rows) {
      if (row.cost !== null) continue;
      inputFor(row.key)?.setCustomValidity('Standard point buy requires every base ability score to be between 8 and 15 before bonuses.');
    }

    if (!calculation.invalid.length && calculation.spent > 27) {
      const message = `Standard point buy uses a maximum of 27 points. This build spends ${calculation.spent}; lower one or more base scores.`;
      for (const key of abilityKeys) inputFor(key)?.setCustomValidity(message);
    }
  }

  function resetToEight() {
    const root = form();
    if (!root || !sheetSession) return;
    for (const key of abilityKeys) {
      const input = inputFor(key);
      if (input) input.value = '8';
    }
    readSheetForm();
    sheetSession.dirty = true;
    updateSheetCalculations();
    sheetStatus('Point buy reset to six base scores of 8 — 27 points available.');
  }

  function setScores(scores,message) {
    if(!pointBuyEnabled())return;
    for(const [index,key] of abilityKeys.entries()){const input=inputFor(key);if(input)input.value=String(scores[index]);}
    readSheetForm();sheetSession.dirty=true;updateSheetCalculations();sheetStatus(message+' Save the sheet to keep changes.');
  }

  function presetControls(host) {
    const old=host.querySelector('[data-point-buy-presets]'),selected=old?.querySelector('[data-point-buy-preset]')?.value||'standard';
    const from=old?.querySelector('[data-point-buy-swap-from]')?.value||'str',to=old?.querySelector('[data-point-buy-swap-to]')?.value||'int';old?.remove();
    const panel=document.createElement('section');panel.className='sheet-point-buy-presets';panel.dataset.pointBuyPresets='true';
    const abilityOptions=abilityKeys.map(key=>'<option value="'+key+'">'+CharacterSheetModel.abilities[key]+'</option>').join('');
    panel.innerHTML='<h4>Start with a 27-point spread</h4><p class="sheet-help">Choose a spread, then apply it to replace the six base scores. Values start in STR, DEX, CON, INT, WIS, CHA order; swap them to suit your character. Bonuses stay separate.</p><div class="sheet-point-buy-actions"><label><span>Starting spread</span><select data-point-buy-preset aria-label="Point Buy starting spread">'+CharacterSheetModel.pointBuyPresets.map(row=>'<option value="'+row.id+'">'+row.name+' — '+row.scores.join(', ')+'</option>').join('')+'</select></label><button type="button" data-point-buy-apply>Apply spread</button></div><p class="sheet-help" data-point-buy-preview></p><div class="sheet-point-buy-actions"><label><span>Swap score from</span><select data-point-buy-swap-from>'+abilityOptions+'</select></label><label><span>With</span><select data-point-buy-swap-to>'+abilityOptions+'</select></label><button type="button" data-point-buy-swap>Swap scores</button></div>';
    const picker=panel.querySelector('[data-point-buy-preset]');picker.value=selected;
    const preview=()=>{const row=CharacterSheetModel.pointBuyPresets.find(row=>row.id===picker.value);panel.querySelector('[data-point-buy-preview]').textContent=row.description+' Costs 27 of 27 points before bonuses.';};picker.onchange=event=>{event.stopPropagation();preview();};preview();
    panel.querySelector('[data-point-buy-apply]').onclick=()=>{const row=CharacterSheetModel.pointBuyPresets.find(row=>row.id===picker.value);if(row)setScores(row.scores,row.name+' applied — 27 of 27 points used.');};
    const swapFrom=panel.querySelector('[data-point-buy-swap-from]'),swapTo=panel.querySelector('[data-point-buy-swap-to]');swapFrom.value=from;swapTo.value=to;swapFrom.onchange=swapTo.onchange=event=>event.stopPropagation();
    panel.querySelector('[data-point-buy-swap]').onclick=()=>{if(swapFrom.value===swapTo.value)return sheetStatus('Choose two different abilities to swap.',true);const scores=abilityKeys.map(key=>Number(inputFor(key)?.value)),a=abilityKeys.indexOf(swapFrom.value),b=abilityKeys.indexOf(swapTo.value);[scores[a],scores[b]]=[scores[b],scores[a]];setScores(scores,'Base scores swapped; Point Buy cost is unchanged.');};
    host.appendChild(panel);
  }

  function enhanceSummary() {
    const root = form();
    const host = document.getElementById('sheetPointBuySummary');
    if (!root || !host) return;
    const enabled = pointBuyEnabled();
    forceBaseModeFromControl();
    applyLimitsAndValidity();

    host.querySelector('[data-point-buy-core-rules]')?.remove();
    host.querySelector('[data-point-buy-reset]')?.remove();
    if (!enabled) {host.querySelector('[data-point-buy-presets]')?.remove();return;}
    presetControls(host);

    const rules = document.createElement('p');
    rules.className = 'sheet-help';
    rules.dataset.pointBuyCoreRules = 'true';
    rules.innerHTML = '<strong>Standard 27-point buy:</strong> all six abilities begin at 8; buy only base scores from 8 to 15. Race/background and feat increases are applied afterward and do not cost point-buy points.';
    host.appendChild(rules);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'toolbar-btn';
    reset.dataset.pointBuyReset = 'true';
    reset.textContent = 'Reset all base scores to 8';
    reset.addEventListener('click', resetToEight);
    host.appendChild(reset);
  }

  function setupPointBuyUI() {
    const root = form();
    if (!root) return;
    const method = root.querySelector('[name="build.scoreMethod"]');
    if (method && !method.dataset.pointBuyBound) {
      method.dataset.pointBuyBound = 'true';
      // Target listener runs before the form's bubbling change handler, so
      // readSheetForm sees Base mode immediately when Point buy is selected.
      method.addEventListener('change', () => {
        forceBaseModeFromControl();
        applyLimitsAndValidity();
      });
    }
    forceBaseModeFromControl();
    applyLimitsAndValidity();
    queueMicrotask(enhanceSummary);
  }

  function updatePointBuyUI() {
    forceBaseModeFromControl();
    applyLimitsAndValidity();
    // renderPointBuySummary runs later in the same calculation cycle.
    queueMicrotask(enhanceSummary);
  }

  const previousSetup = window.setupCharacterPlayUI;
  if (typeof previousSetup === 'function') {
    window.setupCharacterPlayUI = function setupCharacterPlayUIWithPointBuy(...args) {
      const result = previousSetup.apply(this, args);
      setupPointBuyUI();
      return result;
    };
  }

  const previousUpdate = window.updateCharacterPlayUI;
  if (typeof previousUpdate === 'function') {
    window.updateCharacterPlayUI = function updateCharacterPlayUIWithPointBuy(...args) {
      const result = previousUpdate.apply(this, args);
      updatePointBuyUI();
      return result;
    };
  }

  window.CharacterPointBuyUI = Object.freeze({ setupPointBuyUI, updatePointBuyUI, resetToEight });
})();
