"use strict";
var CharacterDruidConversionsUI = (() => {
  const D = CharacterDruidConversions,
    esc = (v) => sheetEscape(String(v ?? ""));
  const current = (actor) =>
    sheetSession === actor &&
    activeCampaign?.id === actor.campaignId &&
    (!actor.uid || auth.currentUser?.uid === actor.uid);
  const context = (d) => ({
    level: d?.progression?.targetLevel || sheetSession.identity.level,
    slotMax: d?.effects?.slotMax,
    pact: d?.progression?.pact,
  });
  let scope = null;
  const base = window.renderFeatCombatResources;
  window.renderFeatCombatResources = function (stats, ...args) {
    const old = document.querySelector("[data-druid-resurgence]"),
      same = scope === sheetSession;
    const ui = same
      ? {
          open: old?.open,
          payment: old?.querySelector("[data-resurgence-slot]")?.value,
          ownTurn: old?.querySelector("[data-resurgence-own-turn]")?.checked,
        }
      : {};
    const result = base?.call(this, stats, ...args),
      actor = sheetSession;
    scope = actor;
    if (!actor || !stats) return result;
    const state = D.status(actor.data, context(stats));
    if (!state.available) return result;
    const row = document
      .querySelector("[data-open-wild-shape]")
      ?.closest(".sheet-class-resource");
    if (!row) return result;
    const box = document.createElement("details");
    box.dataset.druidResurgence = "";
    box.className = "sheet-druid-conversions";
    box.open = !!ui.open;
    const selection = state.payments.some(
      (p) => p.id === ui.payment && p.available > 0,
    )
      ? ui.payment
      : state.payments.find((p) => p.available > 0)?.id;
    box.innerHTML =
      '<summary>Regain Wild Shape with a spell slot</summary><p class="sheet-help">' +
      esc(state.detail) +
      '</p><label class="sheet-field"><span>Spell slot to spend</span><select data-resurgence-slot><option value="">Choose available spell slot</option>' +
      state.payments
        .map(
          (p) =>
            '<option value="' +
            p.id +
            '" ' +
            (selection === p.id ? "selected " : "") +
            (p.available < 1 ? "disabled" : "") +
            ">" +
            esc(p.label) +
            " · " +
            p.available +
            " left</option>",
        )
        .join("") +
      '</select></label><label class="sheet-resurgence-check"><input type="checkbox" data-resurgence-own-turn ' +
      (ui.ownTurn ? "checked" : "") +
      '> This is my own turn.</label><p class="sheet-help" data-resurgence-feedback role="status"></p><div class="sheet-class-resource-actions"><button type="button" data-resurgence-regain>Spend slot · regain 1 Wild Shape</button>' +
      (state.usedThisTurn
        ? '<button type="button" data-resurgence-next-turn>Start my next turn</button>'
        : "") +
      "</div>";
    row.append(box);
    for (const event of ["input", "change"])
      box.addEventListener(event, (e) => e.stopPropagation());
    const select = box.querySelector("[data-resurgence-slot]"),
      own = box.querySelector("[data-resurgence-own-turn]"),
      button = box.querySelector("[data-resurgence-regain]");
    function refresh() {
      button.disabled =
        !!state.reason ||
        !own.checked ||
        !state.payments.some((p) => p.id === select.value && p.available > 0);
      box.querySelector("[data-resurgence-feedback]").textContent =
        state.reason ||
        (!own.checked
          ? "Confirm your own turn before spending a slot."
          : "One selected slot will be spent and one Wild Shape use restored.");
    }
    select.onchange = refresh;
    own.onchange = refresh;
    refresh();
    button.onclick = () => {
      if (!current(actor)) return;
      readSheetForm();
      const derived = CharacterSheetModel.derive(
        actor.data,
        actor.identity.level,
        typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
      );
      const applied = D.regain(actor.data, select.value, {
        ...context(derived),
        ownTurn: own.checked,
      });
      if (!applied.ok) {
        sheetStatus(applied.reason, true);
        return;
      }
      own.checked = false;
      catalogChanged(
        "Spell slot spent; regained 1 Wild Shape. Wild Resurgence is used for this turn. Save the sheet to keep both changes.",
      );
      document
        .querySelector("[data-druid-resurgence] > summary")
        ?.focus({ preventScroll: true });
    };
    box
      .querySelector("[data-resurgence-next-turn]")
      ?.addEventListener("click", () => {
        if (!current(actor)) return;
        readSheetForm();
        own.checked = false;
        if (D.onRest(actor.data, "turn"))
          catalogChanged(
            "Next own turn recorded for Wild Resurgence. HP, spell slots and Wild Shape uses are unchanged. Save to keep this change.",
          );
        document
          .querySelector("[data-druid-resurgence] > summary")
          ?.focus({ preventScroll: true });
      });
    return result;
  };
  return {};
})();
