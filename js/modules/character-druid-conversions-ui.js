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
  function renderCreatedSlots(actor) {
    document
      .querySelectorAll("[data-created-slot-panel]")
      .forEach((node) => node.remove());
    const rows = D.createdSlots(actor.data);
    if (!rows.length) return;
    const parents = [document.getElementById("sheetAutoSlotSummary")];
    if (actor.data.adobe?.showSpellSlotsOnOverview)
      parents.push(
        document.querySelector(
          "#sheetOverviewReadout .sheet-overview-spell-slots",
        ) || document.getElementById("sheetOverviewReadout"),
      );
    for (const parent of parents.filter(Boolean)) {
      const section = document.createElement("section");
      section.dataset.createdSlotPanel = "";
      section.className = "sheet-created-slots";
      section.innerHTML =
        '<h4>Created spell slots</h4><p class="sheet-help">Extra slots, separate from ordinary Spellcasting and Pact Magic. They expire at Long Rest under the agreed table rule.</p><div class="sheet-created-slot-list">' +
        rows
          .map(
            (row) =>
              "<article><small>" +
              esc(row.source) +
              "</small><strong>Level " +
              row.level +
              "</strong><output>" +
              (row.valid
                ? row.available + " / 1 available"
                : "Saved record unavailable") +
              "</output>" +
              (row.valid
                ? '<button type="button" data-created-slot-use="' +
                  row.level +
                  '" data-created-slot-spent="' +
                  !row.used +
                  '" aria-label="' +
                  (row.used
                    ? "Undo use of created level "
                    : "Use created level ") +
                  row.level +
                  ' spell slot" title="Record or correct this slot’s use; this does not undo another feature’s effect.">' +
                  (row.used ? "Undo slot use" : "Use created slot") +
                  "</button>"
                : '<p class="sheet-help">This invalid record will clear at Long Rest.</p>') +
              "</article>",
          )
          .join("") +
        "</div>";
      parent.append(section);
      section.querySelectorAll("[data-created-slot-use]").forEach(
        (button) =>
          (button.onclick = () => {
            if (!current(actor)) return;
            readSheetForm();
            if (
              D.changeCreatedUse(
                actor.data,
                Number(button.dataset.createdSlotUse),
                button.dataset.createdSlotSpent === "true",
              )
            ) {
              const level = button.dataset.createdSlotUse;
              const area = section.closest("#sheet-overview")
                ? "#sheetOverviewReadout"
                : "#sheetAutoSlotSummary";
              catalogChanged(
                "Created level " +
                  level +
                  " slot use updated. Other features and ordinary/Pact slots are unchanged. Save to keep this change.",
              );
              document
                .querySelector(
                  area + ' [data-created-slot-use="' + level + '"]',
                )
                ?.focus({ preventScroll: true });
            }
          }),
      );
    }
  }
  function renderCreation(row, stats, actor, ui) {
    const box = document.createElement("details");
    box.dataset.druidSlotCreate = "";
    box.className = "sheet-druid-conversions";
    box.open = !!ui.open;
    const ctx = context(stats),
      basic = D.creationStatus(actor.data, "resurgence", 1, ctx),
      nature = D.creationStatus(actor.data, "nature", 1, ctx);
    box.innerHTML =
      '<summary>Create a spell slot with Wild Shape</summary><p class="sheet-help">No action required. These are extra slots: ordinary slots can already be full. Each feature can create one slot per Long Rest. Extra slots expire at Long Rest under the agreed table rule.</p><div class="sheet-slot-creation-grid"><article><h4>Wild Resurgence</h4><p class="sheet-help">Spend 1 Wild Shape use → one level 1 spell slot.</p><p role="status" class="sheet-help" data-create-feedback="resurgence">' +
      esc(basic.reason || "Ready to create one extra level 1 slot.") +
      '</p><button type="button" data-druid-create="resurgence" ' +
      (basic.reason ? "disabled" : "") +
      ">Spend 1 Wild Shape · create level 1 slot</button></article>" +
      (nature.available
        ? '<article><h4>Nature Magician</h4><label class="sheet-field"><span>Wild Shape uses to convert</span><select data-nature-uses>' +
          [1, 2, 3, 4]
            .map(
              (n) =>
                '<option value="' +
                n +
                '" ' +
                (Number(ui.uses || 1) === n ? "selected" : "") +
                ">" +
                n +
                " use" +
                (n > 1 ? "s" : "") +
                " → one level " +
                2 * n +
                " slot</option>",
            )
            .join("") +
          '</select></label><p role="status" class="sheet-help" data-create-feedback="nature"></p><button type="button" data-druid-create="nature"></button></article>'
        : "") +
      "</div>" +
      (D.createdSlots(actor.data).length
        ? '<button type="button" data-open-created-slots>View created slots in Spells</button>'
        : "");
    row.append(box);
    for (const event of ["input", "change"])
      box.addEventListener(event, (e) => e.stopPropagation());
    const select = box.querySelector("[data-nature-uses]");
    function refreshNature() {
      if (!select) return;
      const chosen = D.creationStatus(
          actor.data,
          "nature",
          Number(select.value),
          ctx,
        ),
        button = box.querySelector('[data-druid-create="nature"]');
      button.disabled = !!chosen.reason;
      button.textContent =
        "Spend " +
        chosen.uses +
        " Wild Shape · create level " +
        chosen.level +
        " slot";
      box.querySelector('[data-create-feedback="nature"]').textContent =
        chosen.reason ||
        "Creates one extra level " +
          chosen.level +
          " slot. Uses Nature Magician’s own Long Rest limit.";
    }
    if (select) {
      select.onchange = refreshNature;
      refreshNature();
    }
    box.querySelectorAll("[data-druid-create]").forEach(
      (button) =>
        (button.onclick = () => {
          if (!current(actor)) return;
          readSheetForm();
          const derived = CharacterSheetModel.derive(
            actor.data,
            actor.identity.level,
            typeof sheetEquipmentLoot === "function"
              ? sheetEquipmentLoot()
              : [],
          );
          const result = D.create(
            actor.data,
            button.dataset.druidCreate,
            button.dataset.druidCreate === "nature" ? Number(select.value) : 1,
            context(derived),
          );
          if (!result.ok) {
            sheetStatus(result.reason, true);
            return;
          }
          catalogChanged(
            "Created one extra level " +
              result.level +
              " spell slot. It expires at Long Rest. Save the sheet to keep the slot and spent Wild Shape uses.",
          );
          document
            .querySelector("[data-druid-slot-create] > summary")
            ?.focus({ preventScroll: true });
        }),
    );
    box
      .querySelector("[data-open-created-slots]")
      ?.addEventListener("click", () => {
        if (!current(actor)) return;
        readSheetForm();
        if (!actor.data.adobe.pages.spells) {
          actor.data.adobe.pages.spells = true;
          catalogChanged("Spells page enabled. Save to keep this preference.");
        }
        selectSheetTab("spells");
        document
          .querySelector("#sheetAutoSlotSummary [data-created-slot-panel]")
          ?.scrollIntoView({ block: "center" });
      });
  }
  let scope = null;
  const base = window.renderFeatCombatResources;
  window.renderFeatCombatResources = function (stats, ...args) {
    const oldCreate = document.querySelector("[data-druid-slot-create]");
    const createUI =
      scope === sheetSession
        ? {
            open: oldCreate?.open,
            uses: oldCreate?.querySelector("[data-nature-uses]")?.value,
          }
        : {};
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
    renderCreatedSlots(actor);
    const state = D.status(actor.data, context(stats));
    if (!state.available) return result;
    const row = document
      .querySelector("[data-open-wild-shape]")
      ?.closest(".sheet-class-resource");
    if (!row) return result;
    renderCreation(row, stats, actor, createUI);
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
