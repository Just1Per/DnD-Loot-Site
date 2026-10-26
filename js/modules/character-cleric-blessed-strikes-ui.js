"use strict";
var CharacterClericBlessedStrikesUI = (() => {
  const C = CharacterClassFeatureChoices,
    esc = (value) => sheetEscape(String(value ?? ""));
  let scope = null;
  const current = (actor) =>
    sheetSession === actor &&
    activeCampaign?.id === actor.campaignId &&
    (!actor.uid || auth.currentUser?.uid === actor.uid);
  const base = window.renderFeatCombatResources;
  window.renderFeatCombatResources = function (stats, ...args) {
    const old = document.querySelector("[data-cleric-vitality]"),
      ui =
        scope === sheetSession
          ? {
              open: old?.open,
              spell: old?.querySelector("[data-vitality-spell]")?.value,
              target: old?.querySelector("[data-vitality-target]")?.value,
              mode: old?.querySelector("[data-vitality-mode]")?.value,
              confirmed: old?.querySelector("[data-vitality-confirmed]")
                ?.checked,
            }
          : {};
    const result = base?.call(this, stats, ...args),
      actor = sheetSession;
    scope = actor;
    const feature = stats?.clericBlessedStrikes,
      host = document.getElementById("sheetFeatResources");
    if (!actor || !feature?.available || !host) return result;
    host.hidden = false;
    const section = document.createElement("section");
    section.className = "sheet-blessed-strikes";
    section.dataset.clericBlessedStrikes = "";
    section.innerHTML =
      '<h4>Blessed Strikes</h4><p class="sheet-help">' +
      esc(feature.detail) +
      '</p><p class="sheet-help">Use your chosen benefit instead of an older subclass’s Divine Strike or Potent Spellcasting; do not stack them.</p>';
    host.append(section);
    if (!feature.choice) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Choose Blessed Strikes in Character Builder";
      button.onclick = () => {
        if (!current(actor)) return;
        selectSheetTab("builder");
        document
          .querySelector('[data-choice-group="blessed-strikes"]')
          ?.focus();
      };
      section.append(button);
    }
    if (!feature.vitalityAvailable) return result;
    const context = {
        level: stats.progression?.targetLevel || actor.identity.level,
        mods: stats.mods,
      },
      state = C.clericVitality(actor.data, context),
      box = document.createElement("details");
    box.dataset.clericVitality = "";
    box.open = !!ui.open;
    box.innerHTML =
      '<summary>Grant temporary HP after cantrip damage</summary><p class="sheet-help">Improved Blessed Strikes · After a Cleric cantrip damages a creature, grant twice your current Wisdom modifier as temporary HP. Choose yourself or another creature within 60 ft. Temporary HP replaces an existing amount or is declined; it never adds to it.</p><div class="sheet-vitality-grid"><label class="sheet-field"><span>Cleric cantrip that dealt damage</span><select data-vitality-spell><option value="">Choose the damaging cantrip</option>' +
      state.cantrips
        .map(
          (row) =>
            '<option value="' +
            esc(row.id) +
            '">' +
            esc(row.name) +
            "</option>",
        )
        .join("") +
      '</select></label><label class="sheet-field"><span>Recipient</span><select data-vitality-target><option value="self">My character</option><option value="other">Another creature within 60 ft</option></select></label><label class="sheet-field" data-vitality-mode-field><span>Existing temporary HP</span><select data-vitality-mode><option value="higher">Keep the higher amount</option><option value="keep">Keep my existing amount</option><option value="replace">Replace with this benefit</option></select></label></div><label class="sheet-vitality-check"><input type="checkbox" data-vitality-confirmed> This Cleric cantrip dealt damage to a creature.</label><p class="sheet-help" role="status" data-vitality-feedback></p><button type="button" data-vitality-apply></button>';
    section.append(box);
    const spell = box.querySelector("[data-vitality-spell]"),
      target = box.querySelector("[data-vitality-target]"),
      mode = box.querySelector("[data-vitality-mode]"),
      confirmed = box.querySelector("[data-vitality-confirmed]"),
      button = box.querySelector("[data-vitality-apply]"),
      feedback = box.querySelector("[data-vitality-feedback]");
    spell.value = state.cantrips.some((row) => row.id === ui.spell)
      ? ui.spell
      : "";
    target.value = ui.target === "other" ? "other" : "self";
    mode.value = ["keep", "replace"].includes(ui.mode) ? ui.mode : "higher";
    confirmed.checked = !!ui.confirmed;
    function refresh() {
      box.querySelector("[data-vitality-mode-field]").hidden =
        target.value === "other";
      button.disabled = !!state.reason || !confirmed.checked || !spell.value;
      button.textContent =
        target.value === "other"
          ? "Show recipient instructions · " + state.amount + " temporary HP"
          : "Apply to my character · " + state.amount + " temporary HP";
      feedback.textContent =
        state.reason ||
        (!spell.value || !confirmed.checked
          ? "Choose the Cleric cantrip and confirm its damage before granting temporary HP."
          : target.value === "other"
            ? "The recipient chooses whether to keep or replace existing temporary HP. Their sheet will not be changed."
            : "This changes only temporary HP. It does not heal or revive your character.");
    }
    for (const event of ["input", "change"])
      box.addEventListener(event, (e) => e.stopPropagation());
    for (const field of [spell, target, mode, confirmed])
      field.onchange = refresh;
    refresh();
    button.onclick = () => {
      if (!current(actor)) return;
      readSheetForm();
      const derived = CharacterSheetModel.derive(
          actor.data,
          actor.identity.level,
          typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
        ),
        applied = C.applyClericVitality(
          actor.data,
          {
            spellId: spell.value,
            confirmed: confirmed.checked,
            target: target.value,
            mode: mode.value,
          },
          {
            level: derived.progression?.targetLevel || actor.identity.level,
            mods: derived.mods,
          },
        );
      if (!applied.ok) {
        feedback.textContent = applied.reason;
        sheetStatus(applied.reason, true);
        return;
      }
      confirmed.checked = false;
      refresh();
      if (applied.target === "other") {
        feedback.textContent =
          "Choose another creature within 60 ft: offer " +
          applied.amount +
          " temporary HP. That creature keeps its existing temporary HP or replaces it with this amount; the amounts never stack. Record the choice on the recipient’s sheet.";
        return;
      }
      const message =
        "Temporary HP: " + applied.tempHP + ". Normal HP is unchanged.";
      if (applied.changed)
        catalogChanged(message + " Save the sheet to keep this change.");
      else {
        updateSheetCalculations();
        sheetStatus(message);
      }
      document
        .querySelector("[data-cleric-vitality] > summary")
        ?.focus({ preventScroll: true });
    };
    return result;
  };
  return {};
})();
