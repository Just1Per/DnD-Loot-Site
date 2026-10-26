"use strict";
var CharacterWildCompanionUI = (() => {
  const C = CharacterWildCompanion,
    W = CharacterWildShape,
    esc = (v) => sheetEscape(String(v ?? ""));
  let signature = "",
    scope = null,
    selection = "",
    payment = "",
    loading = false,
    error = "";
  const current = (s) =>
    sheetSession === s &&
    activeCampaign?.id === s.campaignId &&
    (!s.uid || auth.currentUser?.uid === s.uid);
  const context = (d) => ({
    level: d?.progression?.targetLevel || sheetSession?.identity.level || 1,
    derived: d,
    loot: typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
  });
  const derive = () =>
    sheetSession &&
    CharacterSheetModel.derive(
      sheetSession.data,
      sheetSession.identity.level,
      typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
    );
  function setup() {
    const parent = document.getElementById("sheet-companion");
    if (!parent || document.getElementById("sheetDruidWildCompanion")) return;
    const box = document.createElement("section");
    box.id = "sheetDruidWildCompanion";
    box.className = "sheet-editor-box sheet-wild-companion";
    box.setAttribute("aria-label", "Wild Companion familiar");
    parent.querySelector("#sheetCompanionCards").before(box);
    for (const event of ["input", "change"])
      box.addEventListener(event, (e) => e.stopPropagation());
    signature = "";
  }
  async function load() {
    if (loading || W.loaded()) return;
    loading = true;
    error = "";
    try {
      if (!(await CharacterWildShapeUI.load()))
        error =
          "The familiar forms could not load. Your saved card and resources are retained.";
    } catch (e) {
      error = "The familiar forms could not load.";
    } finally {
      loading = false;
      signature = "";
      const active = sheetSession;
      if (active && current(active)) update(derive());
    }
  }
  function changed(text, focus) {
    signature = "";
    catalogChanged(text + " Save the sheet to keep this change.");
    const host = document.getElementById("sheetDruidWildCompanion");
    (
      (focus && host?.querySelector(focus)) ||
      host?.querySelector("[data-wc-form]")
    )?.focus({ preventScroll: true });
  }
  function statusText(s) {
    return s.status === "active"
      ? "With you"
      : s.status === "pocket"
        ? "In pocket dimension"
        : s.reason === "long-rest"
          ? "Gone after Long Rest"
          : s.reason === "zero-hp"
            ? "Gone at 0 HP"
            : "Dismissed";
  }
  function card(p) {
    const s = p.state;
    if (!p.valid)
      return (
        '<div role="status"><strong>' +
        esc(p.name) +
        "</strong><p>" +
        esc(p.reason) +
        "</p></div>"
      );
    return (
      '<article class="sheet-wc-card"><header><div><small>YOUR WILD COMPANION · FEY FAMILIAR</small><h4>' +
      esc(p.name) +
      "</h4><p>" +
      esc(p.size) +
      " · " +
      esc(statusText(s)) +
      '</p></div><span class="sheet-wc-badge">' +
      esc(statusText(s)) +
      '</span></header><div class="sheet-wc-vitals"><div><strong>' +
      p.ac +
      "</strong><span>Armor Class</span></div><div><strong>" +
      esc(p.hp === null ? "—" : p.hp) +
      " / " +
      p.hpMax +
      "</strong><span>Familiar HP</span></div><div><strong>" +
      CharacterSheetModel.signed(p.initiative) +
      '</strong><span>Own Initiative</span></div></div><p class="sheet-help">Temporary HP: ' +
      p.temp +
      ". " +
      esc(p.duration) +
      " Your character’s HP and Wild Shape form are separate.</p><p><strong>Movement:</strong> " +
      esc(p.movement) +
      "</p><p><strong>Senses:</strong> " +
      esc(p.senses) +
      '</p><p class="sheet-help">' +
      esc(p.actionNote) +
      '</p><details data-wc-stats><summary>Ability scores, training & traits</summary><div class="sheet-wc-abilities">' +
      Object.entries(p.scores)
        .map(
          ([k, n]) =>
            "<div><small>" +
            k.toUpperCase() +
            "</small><strong>" +
            n +
            "</strong></div>",
        )
        .join("") +
      "</div><p><strong>Skills:</strong> " +
      esc(p.skills || "Use the form’s ability modifiers.") +
      "</p><p><strong>Saves:</strong> " +
      esc(p.saves || "Use the form’s ability modifiers.") +
      '</p><div class="sheet-rule-text">' +
      esc(p.traits || "No additional creature traits.") +
      "</div></details>" +
      (s.status === "active"
        ? '<details data-wc-health><summary>Familiar damage, healing & HP</summary><div class="sheet-grid two"><label class="sheet-field"><span>Current familiar HP</span><input data-wc-hp type="number" required min="0" max="' +
          p.hpMax +
          '" step="1" value="' +
          (p.hp === null ? "" : p.hp) +
          '"></label><label class="sheet-field"><span>Familiar temporary HP</span><input data-wc-temp type="number" required min="0" max="100000" step="1" value="' +
          p.temp +
          '"></label><label class="sheet-field"><span>Maximum familiar HP · table effects</span><input data-wc-max type="number" required min="0" max="100000" step="1" value="' +
          p.hpMax +
          '"></label></div><label class="sheet-field"><span>Damage or healing amount</span><input data-wc-amount type="number" required min="1" max="1000000" step="1" value="1"></label><div class="sheet-class-resource-actions"><button type="button" data-wc-damage>Apply familiar damage</button><button type="button" data-wc-heal>Apply familiar healing</button></div><p class="sheet-help">Damage uses the familiar’s temporary HP first. At 0 HP it disappears; summon again to bring it back. These controls never alter your character’s HP.</p></details>'
        : "") +
      (s.alive
        ? '<div class="sheet-class-resource-actions sheet-wc-presence"><button type="button" data-wc-presence="' +
          (s.status === "pocket" ? "return" : "pocket") +
          '">' +
          (s.status === "pocket"
            ? "Bring familiar back"
            : "Send to pocket dimension") +
          '</button><button type="button" data-wc-presence="dismiss">Dismiss familiar permanently</button><button type="button" data-wc-rest>Record Long Rest expiry</button></div><p class="sheet-help">Pocket return and dismissal use a Magic action. Returning preserves HP and uses no new resource. Permanent dismissal requires another casting; Long Rest expiry is automatic.</p>'
        : '<p class="sheet-help">A new summoning requires an available payment; the old casting is not refunded.</p>') +
      '<p class="sheet-help">' +
      esc(p.source?.attribution || "SRD creature statistics") +
      "</p></article>"
    );
  }
  function update(d) {
    setup();
    const host = document.getElementById("sheetDruidWildCompanion"),
      actor = sheetSession;
    if (!host || !actor || !d) return;
    const ctx = context(d),
      cap = C.capability(actor.data, ctx),
      s = C.state(actor.data);
    host.hidden = !cap.available && !s.id;
    if (host.hidden) {
      host.innerHTML = "";
      return;
    }
    const fresh = scope !== actor;
    if (fresh) {
      scope = actor;
      selection = "";
      payment = "";
      signature = "";
      error = "";
    }
    const tab = document.querySelector("[data-sheet-tab][aria-selected=true]")
      ?.dataset.sheetTab;
    if (!W.loaded() && (tab === "companion" || s.alive) && !loading && !error)
      load();
    const token = JSON.stringify([
      actor.campaignId,
      actor.characterId,
      actor.data.adobe?.classFeatureChoices,
      actor.data.adobe?.classLevels,
      actor.data.adobe?.pactSlotsUsed,
      actor.data.adobe?.companions,
      actor.data.slots,
      actor.data.build.edition,
      actor.data.conditions,
      ctx.level,
      d.effects.slotMax,
      d.progression?.pact,
      loading,
      error,
      W.loaded(),
    ]);
    if (token === signature) return;
    signature = token;
    const opened = new Map(
        fresh
          ? []
          : [...host.querySelectorAll("details")].map((n) => [
              [...n.attributes].find((a) => a.name.startsWith("data-wc-"))
                ?.name,
              n.open,
            ]),
      ),
      amount = host.querySelector("[data-wc-amount]")?.value;
    host.innerHTML =
      '<div class="sheet-repeat-title"><div><small>DRUID · 2024</small><h4>Wild Companion</h4></div><span>Magic action · Fey familiar</span></div><p class="sheet-help">Summon a familiar with one Wild Shape use or a spell slot. No material components are needed. You can have only one familiar; existing manual cards remain as records.</p>';
    if (cap.reason)
      host.insertAdjacentHTML(
        "beforeend",
        '<p role="status" class="sheet-help">' + esc(cap.reason) + "</p>",
      );
    if (!W.loaded()) {
      host.insertAdjacentHTML(
        "beforeend",
        '<p role="status">' +
          esc(error || "Loading familiar forms…") +
          '</p><button type="button" data-wc-load ' +
          (loading ? "disabled" : "") +
          ">" +
          (error ? "Retry familiar forms" : "Load familiar forms") +
          "</button>" +
          (s.alive
            ? '<button type="button" data-wc-presence="dismiss">Dismiss saved familiar</button><button type="button" data-wc-rest>Record Long Rest expiry</button>'
            : ""),
      );
      host.querySelector("[data-wc-load]").onclick = () => {
        error = "";
        load();
        signature = "";
        update(d);
      };
      bind(host, ctx, actor);
      return;
    }
    const forms = C.forms(),
      payments = C.payments(actor.data, ctx);
    if (!forms.some((f) => f.id === selection))
      selection = forms.some((f) => f.id === s.id)
        ? s.id
        : forms.find((f) => f.id === "srd-2024-owl")?.id || forms[0]?.id || "";
    if (!payments.some((p) => p.id === payment && p.available > 0))
      payment = payments.find((p) => p.available > 0)?.id || "";
    const profile = C.profile(actor.data);
    if (profile) host.insertAdjacentHTML("beforeend", card(profile));
    const container = document.createElement(s.id ? "details" : "div");
    container.dataset.wcOptions = "";
    if (s.id)
      container.innerHTML =
        "<summary>" +
        (s.alive
          ? "Change familiar form · new casting"
          : "Summon familiar again") +
        "</summary>";
    container.insertAdjacentHTML(
      "beforeend",
      '<div class="sheet-wc-summon-grid"><label class="sheet-field"><span>Familiar animal form</span><select data-wc-form>' +
        forms
          .map(
            (f) =>
              '<option value="' +
              esc(f.id) +
              '" ' +
              (selection === f.id ? "selected" : "") +
              ">" +
              esc(f.name) +
              " · " +
              esc(f.size) +
              " · CR 0</option>",
          )
          .join("") +
        '</select></label><label class="sheet-field"><span>Pay for this casting</span><select data-wc-payment><option value="">Choose available payment</option>' +
        payments
          .map(
            (p) =>
              '<option value="' +
              p.id +
              '" ' +
              (payment === p.id ? "selected" : "") +
              (p.available < 1 ? " disabled" : "") +
              ">" +
              esc(p.label) +
              " · " +
              p.available +
              " left</option>",
          )
          .join("") +
        "</select></label></div>" +
        (s.alive || cap.manualFamiliars
          ? '<label class="sheet-wc-check"><input type="checkbox" data-wc-confirm> I will keep only one familiar. This casting changes my active familiar; previous manual cards stay as records.</label>'
          : "") +
        '<button type="button" data-wc-summon ' +
        (cap.reason || !payment || !selection || s.alive || cap.manualFamiliars
          ? "disabled"
          : "") +
        ">" +
        (s.alive ? "Cast again & change form" : "Summon familiar") +
        "</button>",
    );
    host.append(container);
    host.querySelector("[data-wc-form]").onchange = (e) => {
      selection = e.target.value;
      refresh(host, cap);
    };
    host.querySelector("[data-wc-payment]").onchange = (e) => {
      payment = e.target.value;
      refresh(host, cap);
    };
    host
      .querySelector("[data-wc-confirm]")
      ?.addEventListener("change", () => refresh(host, cap));
    bind(host, ctx, actor);
    for (const [key, open] of opened) {
      if (key)
        host.querySelector("[" + key + "]")?.toggleAttribute("open", open);
    }
    if (amount && host.querySelector("[data-wc-amount]"))
      host.querySelector("[data-wc-amount]").value = amount;
  }
  function refresh(host, cap) {
    host.querySelector("[data-wc-summon]").disabled =
      !!cap.reason ||
      !host.querySelector("[data-wc-form]").value ||
      !host.querySelector("[data-wc-payment]").value ||
      (!!host.querySelector("[data-wc-confirm]") &&
        !host.querySelector("[data-wc-confirm]").checked);
  }
  function bind(host, ctx, actor) {
    host.querySelector("[data-wc-summon]")?.addEventListener("click", () => {
      if (!current(actor)) return;
      readSheetForm();
      const result = C.summon(
        actor.data,
        {
          formId: host.querySelector("[data-wc-form]").value,
          payment: host.querySelector("[data-wc-payment]").value,
          confirmed: !!host.querySelector("[data-wc-confirm]")?.checked,
        },
        context(derive()),
      );
      if (result.ok) {
        changed(
          "Fey familiar summoned. Payment spent; it disappears at Long Rest.",
          "[data-wc-presence]",
        );
        host
          .querySelector(".sheet-wc-card")
          ?.scrollIntoView({ block: "start" });
      } else sheetStatus(result.reason, true);
    });
    host.querySelectorAll("[data-wc-presence]").forEach(
      (button) =>
        (button.onclick = async () => {
          const action = button.dataset.wcPresence,
            snapshot = JSON.stringify(C.state(actor.data)),
            valid = () =>
              current(actor) &&
              JSON.stringify(C.state(actor.data)) === snapshot;
          if (
            action === "dismiss" &&
            !(await SiteConfirmation.ask({
              title: "Dismiss this familiar?",
              paragraphs: [
                "The familiar disappears. Summoning it again will cost another Wild Shape use or spell slot.",
                "Your character and existing manual companion cards are retained.",
              ],
              confirmLabel: "Dismiss familiar",
              isCurrent: valid,
            }))
          )
            return;
          if (!valid()) return;
          readSheetForm();
          if (C.changePresence(actor.data, action))
            changed(
              action === "pocket"
                ? "Familiar sent to its pocket dimension."
                : action === "return"
                  ? "Familiar returned with its saved HP; no resource spent."
                  : "Familiar dismissed. The casting is not refunded.",
              "[data-wc-presence]",
            );
          else
            sheetStatus(
              "The recorded condition prevents this Magic action.",
              true,
            );
        }),
    );
    host
      .querySelector("[data-wc-rest]")
      ?.addEventListener("click", async () => {
        const snapshot = JSON.stringify(C.state(actor.data)),
          valid = () =>
            current(actor) && JSON.stringify(C.state(actor.data)) === snapshot;
        if (
          !(await SiteConfirmation.ask({
            title: "Record Long Rest expiry?",
            paragraphs: [
              "Confirm that a Long Rest has finished. This Wild Companion disappears, including if it was in a pocket dimension.",
              "Only the familiar expires here. Use the other rest controls to restore spell slots or feature uses.",
            ],
            confirmLabel: "Mark familiar expired",
            isCurrent: valid,
          }))
        )
          return;
        if (!valid()) return;
        readSheetForm();
        if (C.onRest(actor.data, "long"))
          changed(
            "Wild Companion expired after Long Rest.",
            "[data-wc-options] > summary",
          );
      });
    for (const [attr, fn] of [
      ["data-wc-hp", C.setHP],
      ["data-wc-temp", C.setTemp],
      ["data-wc-max", C.setMaximum],
    ]) {
      const input = host.querySelector("[" + attr + "]");
      if (input)
        input.onchange = () => {
          if (!input.checkValidity()) {
            input.reportValidity();
            return;
          }
          if (!current(actor)) return;
          readSheetForm();
          if (fn(actor.data, Number(input.value)))
            changed("Familiar HP updated.", "[" + attr + "]");
        };
    }
    for (const [attr, fn] of [
      ["data-wc-damage", C.damage],
      ["data-wc-heal", C.heal],
    ])
      host.querySelector("[" + attr + "]")?.addEventListener("click", () => {
        const input = host.querySelector("[data-wc-amount]");
        if (!input.checkValidity()) {
          input.reportValidity();
          return;
        }
        if (!current(actor)) return;
        readSheetForm();
        if (fn(actor.data, Number(input.value)))
          changed(
            attr === "data-wc-damage"
              ? "Familiar damage recorded."
              : "Familiar healing recorded.",
            "[data-wc-amount]",
          );
      });
  }
  function open() {
    if (!sheetSession) return;
    readSheetForm();
    if (!sheetSession.data.adobe.pages.companion) {
      sheetSession.data.adobe.pages.companion = true;
      catalogChanged("Companions page added. Save to keep this preference.");
    }
    selectSheetTab("companion");
    update(derive());
    document
      .getElementById("sheetDruidWildCompanion")
      ?.scrollIntoView({ block: "start" });
  }
  function print(data) {
    const p = C.profile(data);
    if (!p) return "";
    if (!p.valid)
      return (
        "<section><h3>Wild Companion</h3><p>" + esc(p.reason) + "</p></section>"
      );
    return (
      '<section class="sheet-paper-wild-companion"><h3>Wild Companion · ' +
      esc(p.name) +
      "</h3><p>Fey familiar · " +
      esc(statusText(p.state)) +
      " · AC " +
      p.ac +
      " · HP " +
      p.hp +
      " / " +
      p.hpMax +
      " · Temporary HP " +
      p.temp +
      " · Own Initiative " +
      CharacterSheetModel.signed(p.initiative) +
      "</p><p>" +
      esc(p.duration) +
      "</p><p>" +
      esc(p.movement) +
      " · " +
      esc(p.senses) +
      "</p><p>" +
      Object.entries(p.scores)
        .map(([k, n]) => k.toUpperCase() + " " + n)
        .join(" · ") +
      "</p><p>" +
      esc(p.actionNote) +
      '</p><p class="sheet-paper-text">' +
      esc(p.traits || "") +
      "</p><p>" +
      esc(p.source?.attribution || "SRD creature statistics") +
      "</p></section>"
    );
  }
  const setupBase = window.setupCharacterPlayUI;
  window.setupCharacterPlayUI = function (...args) {
    const result = setupBase?.apply(this, args);
    setup();
    return result;
  };
  const updateBase = window.updateCharacterPlayUI;
  window.updateCharacterPlayUI = function (d, ...args) {
    const result = updateBase?.call(this, d, ...args);
    update(d);
    return result;
  };
  const tabBase = window.selectSheetTab;
  window.selectSheetTab = function (tab, ...args) {
    const result = tabBase?.call(this, tab, ...args);
    if (tab === "companion" && sheetSession) update(derive());
    return result;
  };
  return { open, update, print };
})();
