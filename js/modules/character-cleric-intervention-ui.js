"use strict";
var CharacterClericInterventionUI = (() => {
  const I = CharacterClericIntervention,
    esc = (value) => sheetEscape(String(value ?? ""));
  let scope = null;
  const current = (actor) =>
    sheetSession === actor &&
    activeCampaign?.id === actor.campaignId &&
    (!actor.uid || auth.currentUser?.uid === actor.uid);
  const base = window.renderFeatCombatResources;
  window.renderFeatCombatResources = function (stats, ...args) {
    const old = document.querySelector("[data-cleric-intervention]");
    const ui =
      scope === sheetSession
        ? {
            open: old?.querySelector("details")?.open,
            spell: old?.querySelector("[data-intervention-spell]")?.value,
            roll: old?.querySelector("[data-intervention-roll]")?.value,
            rests: old?.querySelector("[data-intervention-rests]")?.value,
            confirmed: old?.querySelector("[data-intervention-confirm]")
              ?.checked,
          }
        : {};
    const result = base?.call(this, stats, ...args),
      actor = sheetSession;
    scope = actor;
    if (!actor) return result;
    const context = {
      level: stats.progression?.targetLevel || actor.identity.level,
    };
    const state = I.status(actor.data, context),
      host = document.getElementById("sheetFeatResources");
    if (!state.available || !host) return result;
    host.hidden = false;
    const section = document.createElement("section");
    section.className = "sheet-intervention";
    section.dataset.clericIntervention = "";
    const modern = state.edition === "2024",
      rows = I.spells(actor.data, context);
    const last = modern
      ? (CharacterCatalog.rawData?.spells || []).find(
          (row) => row.id.toLowerCase() === state.record.last,
        )?.name
      : state.record.last === "automatic"
        ? "Automatic success"
        : state.record.last.replace("roll-", "Percentile result: ");
    section.innerHTML =
      '<header><div><h4 data-context-help="divine intervention">Divine Intervention</h4><small>Cleric ' +
      state.level +
      " · " +
      state.edition +
      ' rules</small></div><strong class="sheet-intervention-status">' +
      esc(state.ready ? "Ready" : "Recovering") +
      '</strong></header><p class="sheet-help" role="status">' +
      esc(
        state.reason ||
          (modern
            ? "One Magic action. No spell slot spent."
            : "One action. Your DM decides the effect."),
      ) +
      "</p>" +
      (last
        ? '<p class="sheet-help">Last recorded: ' + esc(last) + "</p>"
        : "") +
      "<details><summary>" +
      (state.ready
        ? modern
          ? "Choose a spell to cast"
          : "Record your request for divine help"
        : "Recovery & feature rules") +
      '</summary><div data-intervention-controls></div><details class="sheet-intervention-rules"><summary>How Divine Intervention works</summary><p class="sheet-help">' +
      esc(state.detail) +
      "</p></details></details>";
    host.append(section);
    const details = section.querySelector("details"),
      controls = section.querySelector("[data-intervention-controls]");
    details.open = !!ui.open;
    for (const event of ["input", "change"])
      section.addEventListener(event, (e) => e.stopPropagation());
    if (!state.ready) {
      if (
        state.record.valid &&
        state.record.kind === "days" &&
        state.record.remaining
      ) {
        controls.innerHTML =
          '<label class="sheet-intervention-confirm"><input type="checkbox" data-intervention-day-confirm> One campaign day has passed since the last recorded day.</label><button type="button" data-intervention-day disabled>Record one completed campaign day</button>';
        const confirm = controls.querySelector("input"),
          button = controls.querySelector("button");
        confirm.onchange = () => {
          button.disabled = !confirm.checked;
        };
        button.onclick = () => {
          if (!current(actor) || !confirm.checked) return;
          readSheetForm();
          if (I.campaignDay(actor.data)) {
            catalogChanged(
              "One campaign day recorded for Divine Intervention. Save to keep the countdown.",
            );
            document
              .querySelector("[data-cleric-intervention] summary")
              ?.focus({ preventScroll: true });
          }
        };
      } else if (state.record.valid)
        controls.innerHTML =
          '<p class="sheet-help">When you actually finish a Long Rest, use Combat’s Long Rest recovery button once. Each recorded rest advances this wait by one. A Short Rest has no effect.</p>';
      return result;
    }
    controls.innerHTML = modern
      ? '<label class="sheet-field"><span>Cleric spell</span><select data-intervention-spell><option value="">Choose a spell</option>' +
        rows
          .map(
            (row) =>
              '<option value="' +
              esc(row.choiceId) +
              '">' +
              esc(row.name) +
              " · " +
              (row.level ? "Level " + row.level : "Cantrip") +
              "</option>",
          )
          .join("") +
        '</select></label><div class="sheet-intervention-spell" data-intervention-preview hidden><p class="sheet-help" data-intervention-detail></p><button type="button" data-intervention-info>Read spell information</button></div><label class="sheet-field" data-intervention-wish hidden><span>Wish recovery · rolled 2d4 total</span><input type="number" min="2" max="8" step="1" inputmode="numeric" data-intervention-rests></label>'
      : state.level >= 20
        ? '<p class="sheet-help">Cleric 20: automatic success. No percentile roll needed.</p>'
        : '<label class="sheet-field"><span>Percentile result · 1–100</span><input type="number" min="1" max="100" step="1" inputmode="numeric" data-intervention-roll><small>Read 00 as 100. Success requires ' +
          state.level +
          " or less.</small></label>";
    controls.insertAdjacentHTML(
      "beforeend",
      '<label class="sheet-intervention-confirm"><input type="checkbox" data-intervention-confirm> ' +
        (modern
          ? "I am using the Magic action to cast this spell."
          : "I used my action to request divine help.") +
        '</label><p class="sheet-help" role="status" data-intervention-feedback></p><button type="button" data-intervention-use>' +
        (modern
          ? "Cast with Divine Intervention"
          : "Record intervention attempt") +
        "</button>",
    );
    const spell = controls.querySelector("[data-intervention-spell]"),
      roll = controls.querySelector("[data-intervention-roll]"),
      rests = controls.querySelector("[data-intervention-rests]"),
      confirm = controls.querySelector("[data-intervention-confirm]"),
      button = controls.querySelector("[data-intervention-use]"),
      feedback = controls.querySelector("[data-intervention-feedback]");
    if (spell)
      spell.value = rows.some((row) => row.choiceId === ui.spell)
        ? ui.spell
        : "";
    if (roll) roll.value = ui.roll || "";
    if (rests) rests.value = ui.rests || "";
    confirm.checked = !!ui.confirmed;
    function refresh() {
      const selected = rows.find((row) => row.choiceId === spell?.value),
        wish = selected?.choiceId === I.wishId;
      if (modern) {
        controls.querySelector("[data-intervention-preview]").hidden =
          !selected;
        controls.querySelector("[data-intervention-wish]").hidden = !wish;
        controls.querySelector("[data-intervention-detail]").textContent =
          selected
            ? selected.name +
              " · " +
              selected.range +
              " · " +
              selected.duration +
              ". Cast as one Magic action; no Material components or spell slot."
            : "";
      }
      const validNumber = (field, min, max) =>
        field &&
        field.value.trim() !== "" &&
        Number.isInteger(Number(field.value)) &&
        Number(field.value) >= min &&
        Number(field.value) <= max;
      button.disabled =
        !confirm.checked ||
        (modern
          ? !selected || (wish && !validNumber(rests, 2, 8))
          : state.level < 20 && !validNumber(roll, 1, 100));
      feedback.textContent = modern
        ? wish
          ? "Roll 2d4 and enter the total. This locks all Divine Intervention until that many Long Rests. Resolve Wish’s effects and any stress at the table."
          : "Resolve spell effects, targets and concentration at the table."
        : state.level >= 20
          ? "Automatic success starts a wait of 7 campaign days."
          : "Record the roll at the table. Failure waits for Long Rest; success waits 7 campaign days.";
    }
    for (const field of [spell, roll, rests, confirm].filter(Boolean))
      field.oninput = field.onchange = refresh;
    controls
      .querySelector("[data-intervention-info]")
      ?.addEventListener("click", () => {
        if (!current(actor)) return;
        const row = rows.find((row) => row.choiceId === spell.value);
        if (row) openSpellInformation({ catalogId: row.id });
      });
    refresh();
    button.onclick = () => {
      if (!current(actor)) return;
      readSheetForm();
      const derived = CharacterSheetModel.derive(
        actor.data,
        actor.identity.level,
        typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
      );
      const context = {
        level: derived.progression?.targetLevel || actor.identity.level,
      };
      const applied = modern
        ? I.cast(
            actor.data,
            {
              spellId: spell.value,
              wishRests: Number(rests.value),
              confirmed: confirm.checked,
            },
            context,
          )
        : I.attempt(
            actor.data,
            { roll: Number(roll?.value), confirmed: confirm.checked },
            context,
          );
      if (!applied.ok) {
        feedback.textContent = applied.reason;
        sheetStatus(applied.reason, true);
        return;
      }
      confirm.checked = false;
      catalogChanged(applied.message);
      document
        .querySelector("[data-cleric-intervention] summary")
        ?.focus({ preventScroll: true });
    };
    return result;
  };
  return {};
})();
