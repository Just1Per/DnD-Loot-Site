"use strict";
var CharacterWildShapeUI = (() => {
  const W = CharacterWildShape,
    esc = (v) => sheetEscape(String(v ?? ""));
  let loading = null,
    error = "",
    signature = "",
    scope = "",
    selected = "",
    search = "";
  const current = (s) =>
    sheetSession === s &&
    s.campaignId === activeCampaign?.id &&
    (!s.uid || auth.currentUser?.uid === s.uid);
  const context = (d) => ({
    level: d?.progression?.targetLevel || sheetSession?.identity.level || 1,
    derived: d,
    loot: typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
  });
  function setup() {
    const parent = document.getElementById("sheet-companion");
    if (!parent || document.getElementById("sheetDruidWildShape")) return;
    const panel = document.createElement("section");
    panel.id = "sheetDruidWildShape";
    panel.className = "sheet-editor-box sheet-wild-shape";
    panel.setAttribute("aria-label", "Your Wild Shape");
    parent.querySelector("#sheetCompanionCards").before(panel);
    for (const event of ["input", "change"])
      panel.addEventListener(event, (e) => e.stopPropagation());
    signature = "";
  }
  async function load() {
    if (W.loaded()) return true;
    if (loading) return loading;
    error = "";
    loading = (async () => {
      const response = await fetch(
        "data/rules/wild-shapes-v1.json?v=20261025-wild-shape-v1",
      );
      if (!response.ok) throw Error("Form catalogue unavailable.");
      const data = await response.json();
      W.setCatalogue(data);
      return true;
    })()
      .catch((e) => {
        error = e.message || "Could not load forms.";
        return false;
      })
      .finally(() => {
        loading = null;
        signature = "";
        const s = sheetSession;
        if (s && current(s) && document.getElementById("sheetDruidWildShape"))
          update(
            CharacterSheetModel.derive(
              s.data,
              s.identity.level,
              typeof sheetEquipmentLoot === "function"
                ? sheetEquipmentLoot()
                : [],
            ),
          );
      });
    return loading;
  }
  function changed(message, focus) {
    signature = "";
    catalogChanged(message + " Save to keep this change.");
    if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
  }
  function options(rows, value, placeholder = "Choose form…") {
    return (
      '<option value="">' +
      esc(placeholder) +
      "</option>" +
      rows
        .map(
          (row) =>
            '<option value="' +
            esc(row.id) +
            '" ' +
            (value === row.id ? "selected" : "") +
            ">" +
            esc(row.name) +
            " · CR " +
            esc(row.cr) +
            (row.id.includes("elemental") ? " · 2 uses" : "") +
            "</option>",
        )
        .join("")
    );
  }
  const number = (label, attr, value, max) =>
    '<label class="sheet-field"><span>' +
    esc(label) +
    '</span><input type="number" min="0" max="' +
    max +
    '" step="1" ' +
    attr +
    ' value="' +
    (value === null ? "" : value) +
    '"></label>';
  function card(p) {
    const s = p.state;
    if (!p.valid)
      return (
        '<div role="status" class="workspace-error"><strong>' +
        esc(p.name) +
        "</strong><p>" +
        esc(p.reason) +
        '</p><button type="button" data-wild-end>Return to normal form</button></div>'
      );
    return (
      '<article class="sheet-wild-card"><header><div><small>YOUR ACTIVE WILD SHAPE · ' +
      esc(s.edition) +
      "</small><h4>" +
      esc(p.name) +
      "</h4><p>" +
      esc(p.size) +
      " · " +
      esc(p.source?.srdVersion || "SRD") +
      '</p></div><button type="button" data-wild-end>Return to normal form</button></header><div class="sheet-wild-vitals"><div><strong>' +
      p.ac +
      "</strong><span>Armor Class · " +
      esc(p.acSource) +
      "</span></div><div><strong>" +
      esc(p.hp === null ? "—" : p.hp) +
      " / " +
      p.hpMax +
      "</strong><span>" +
      (s.modern ? "Character HP" : "Form HP") +
      "</span></div><div><strong>" +
      p.speed +
      ' ft</strong><span>Walk speed</span></div></div><p class="sheet-help">' +
      (s.modern
        ? "Character HP is retained."
        : "Normal character HP: " +
          p.normalHP +
          " / " +
          p.normalHPMax +
          " · preserved.") +
      " Temporary HP: " +
      p.tempHP +
      '.</p><div class="sheet-wild-abilities">' +
      Object.entries(p.scores)
        .map(
          ([a, v]) =>
            "<div><small>" +
            a.toUpperCase() +
            "</small><strong>" +
            v +
            "</strong></div>",
        )
        .join("") +
      "</div><p><strong>Initiative:</strong> " +
      CharacterSheetModel.signed(p.initiative) +
      "</p><p><strong>Movement:</strong> " +
      esc(p.movement) +
      "</p><p><strong>Senses:</strong> " +
      esc(p.senses || "Use the form’s normal senses.") +
      "</p><section><h5>Attacks & actions</h5>" +
      (p.primalStrike
        ? '<p class="sheet-help" data-druid-primal-strike>' +
          esc(p.primalStrike) +
          "</p>"
        : "") +
      '<div class="sheet-rule-text">' +
      esc(p.actions || "Use the source stat block.") +
      '</div><h5>Traits</h5><div class="sheet-rule-text">' +
      esc(p.traits || "—") +
      '</div></section><details data-wild-rolls><summary>Skills, saves & retained features</summary><div class="sheet-wild-rolls"><section><h5>Saving throws</h5>' +
      Object.entries(p.saves)
        .map(
          ([a, n]) =>
            "<p>" +
            a.toUpperCase() +
            " <strong>" +
            CharacterSheetModel.signed(n) +
            "</strong></p>",
        )
        .join("") +
      "</section><section><h5>Skills</h5>" +
      Object.entries(p.skills)
        .map(
          ([id, n]) =>
            "<p>" +
            esc(CharacterSheetModel.skills[id][0]) +
            " <strong>" +
            CharacterSheetModel.signed(n) +
            "</strong></p>",
        )
        .join("") +
      "</section></div><p>" +
      esc(p.spellNote) +
      "</p>" +
      p.notes
        .map((note) => '<p class="sheet-help">' + esc(note) + "</p>")
        .join("") +
      '</details><details data-wild-health><summary>Damage, healing & current HP</summary><div class="sheet-grid two">' +
      number(
        s.modern ? "Current character HP" : "Current form HP",
        "data-wild-hp",
        p.hp,
        p.hpMax,
      ) +
      number("Temporary HP", "data-wild-temp", p.tempHP, 100000) +
      '</div><label class="sheet-field"><span>Damage or healing amount</span><input type="number" data-wild-amount min="1" max="1000000" step="1" value="1"></label><div class="sheet-class-resource-actions"><button type="button" data-wild-damage>Apply damage</button><button type="button" data-wild-heal>Apply healing</button></div><p class="sheet-help">Damage uses temporary HP first. ' +
      (s.modern
        ? "At 0 HP, resolve Unconscious/Incapacitated; recorded incapacitation ends the form."
        : "At 0 form HP you revert; only excess damage affects your normal HP.") +
      '</p></details><p class="sheet-help">' +
      esc(p.source?.attribution || "SRD creature statistics") +
      "</p></article>"
    );
  }
  function update(d) {
    setup();
    const host = document.getElementById("sheetDruidWildShape"),
      s = sheetSession;
    if (!host || !s) return;
    const ctx = context(d),
      l = W.limits(s.data, ctx.level);
    if (W.settle(s.data, ctx.level)) {
      s.dirty = true;
      sheetStatus(
        "Wild Shape ended because of the recorded condition. Save to keep this change.",
      );
      signature = "";
    }
    const st = W.state(s.data, ctx.level);
    host.hidden = !l.available && !st.activeId;
    if (host.hidden) {
      host.innerHTML = "";
      return;
    }
    const identity = s;
    if (scope !== identity) {
      scope = identity;
      selected = "";
      search = "";
      signature = "";
      error = "";
    }
    const tab = document.querySelector("[data-sheet-tab][aria-selected=true]")
      ?.dataset.sheetTab;
    if (
      !W.loaded() &&
      (tab === "companion" || st.activeId) &&
      !error &&
      !loading
    )
      load();
    const token = JSON.stringify([
      s.campaignId,
      s.characterId,
      s.data.adobe?.classFeatureChoices,
      s.data.adobe?.classLevels,
      ctx.level,
      d.gear,
      d.effects,
      s.data.build.edition,
      s.data.conditions,
      s.data.hpCurrent,
      s.data.hpTemp,
      d.scores,
      d.saves,
      d.skills,
      d.hpMax,
      s.data.equipmentState,
      !!loading,
      error,
      W.loaded(),
    ]);
    if (signature === token) return;
    signature = token;
    const disclosures = [...host.querySelectorAll("details")].map((node) => ({
        key: [...node.attributes].find((a) => a.name.startsWith("data-wild-"))
          ?.name,
        open: node.open,
      })),
      amount = host.querySelector("[data-wild-amount]")?.value;
    host.innerHTML =
      '<div class="sheet-repeat-title"><div><small>YOUR CHARACTER’S FORM</small><h4>Wild Shape</h4></div><strong aria-label="Wild Shape uses remaining">' +
      (st.maxUses === Infinity
        ? "Unlimited"
        : st.remaining + " / " + st.maxUses) +
      '</strong></div><p class="sheet-help">Druid ' +
      st.level +
      " · " +
      esc(st.edition) +
      " · " +
      st.action +
      " · Up to " +
      st.durationHours +
      " hours of game time. Your normal scores, inventory and existing companion cards stay saved.</p>";
    if (!W.loaded()) {
      host.insertAdjacentHTML(
        "beforeend",
        '<p role="status">' +
          esc(error || "Loading eligible form catalogue…") +
          '</p><button type="button" data-wild-load ' +
          (loading ? "disabled" : "") +
          ">" +
          (error ? "Retry loading forms" : "Load forms") +
          "</button>" +
          (st.activeId
            ? '<button type="button" data-wild-end>Return to normal form</button>'
            : ""),
      );
      host.querySelector("[data-wild-load]").onclick = () => {
        signature = "";
        error = "";
        load();
        update(d);
      };
      bind(host, ctx);
      return;
    }
    const all = W.forms(s.data, ctx.level),
      learnable = all.filter((r) => !r.id.includes("elemental")),
      known = W.validKnown(s.data, ctx.level),
      usable = st.modern
        ? all.filter((r) => known.includes(r.id) || r.id.includes("elemental"))
        : all;
    if (!usable.some((r) => r.id === selected))
      selected = usable.some((r) => r.id === st.activeId)
        ? st.activeId
        : st.modern
          ? usable[0]?.id || ""
          : "";
    const match = usable.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()),
    );
    host.insertAdjacentHTML(
      "beforeend",
      '<div class="sheet-wild-setup"><label class="sheet-field"><span>Find animal form</span><input type="search" data-wild-search value="' +
        esc(search) +
        '" placeholder="Search eligible forms"></label><label class="sheet-field"><span>' +
        (st.modern ? "Known form" : "Seen form") +
        "</span><select data-wild-form>" +
        options(match, selected) +
        '</select></label><p class="sheet-help">' +
        usable.length +
        " eligible " +
        (st.modern ? "known " : "") +
        "forms · max CR " +
        st.maxCR +
        (st.fly ? " · flying allowed" : " · no flying") +
        (st.swim ? "" : " · no swimming") +
        "</p>" +
        (!st.modern
          ? '<label class="sheet-wild-check"><input type="checkbox" data-wild-seen ' +
            (st.seen.includes(selected) || selected.includes("elemental")
              ? "checked"
              : "") +
            "> I have seen this form</label>"
          : "") +
        '<details data-wild-equipment><summary>Equipment and temporary HP</summary><label class="sheet-field"><span>Equipment in this form</span><select data-wild-gear><option value="merged">Merged · no worn item effects</option><option value="dropped">Dropped · no worn item effects</option><option value="worn">Wear current loadout · DM approves fit</option></select></label>' +
        (st.modern
          ? '<label class="sheet-field"><span>New temporary HP: ' +
            st.temporaryHP +
            " · current: " +
            Math.max(0, intValue(s.data.hpTemp)) +
            '</span><select data-wild-temp-choice><option value="higher">Keep whichever is higher</option><option value="replace">Take the new temporary HP</option><option value="keep">Keep current temporary HP</option></select></label>'
          : "") +
        '<p class="sheet-help">The normal loadout stays saved. Worn mode uses its currently equipped items; the DM confirms that the form can wear them. Conditional attack effects follow their own rules.</p></details><button type="button" data-wild-assume ' +
        (!selected ||
        st.remaining < (selected.includes("elemental") ? 2 : 1) ||
        W.blocked(s.data, ctx.level)
          ? "disabled"
          : "") +
        ">Assume selected form · " +
        (st.maxUses === Infinity
          ? "unlimited"
          : selected.includes("elemental")
            ? "2 uses"
            : "1 use") +
        "</button></div>",
    );
    host.querySelector("[data-wild-gear]").value = st.gear;
    if (st.modern) {
      const length = Math.max(st.known.length, st.knownLimit);
      host.insertAdjacentHTML(
        "beforeend",
        "<details data-wild-known " +
          (!known.length ? "open" : "") +
          "><summary>Known forms · " +
          known.length +
          " / " +
          st.knownLimit +
          '</summary><p class="sheet-help">Choose forms when this feature grants them. After a Long Rest, you may replace one known form. Saved choices above the current limit remain stored.</p>' +
          Array.from({ length }, (_, i) => {
            const value = st.known[i] || "",
              normal = learnable.some((r) => r.id === value);
            return (
              '<label class="sheet-field"><span>Known form ' +
              (i + 1) +
              (i >= st.knownLimit ? " · inactive saved choice" : "") +
              '</span><select data-wild-known-slot="' +
              i +
              '">' +
              options(
                i >= st.knownLimit ? [] : learnable,
                value,
                "Choose / clear known form",
              ) +
              (value && !normal
                ? '<option value="' +
                  esc(value) +
                  '" selected>Saved form · currently unavailable</option>'
                : "") +
              (value && normal && i >= st.knownLimit
                ? '<option value="' +
                  esc(value) +
                  '" selected>Saved form · above current limit</option>'
                : "") +
              "</select></label>"
            );
          }).join("") +
          (!st.known.some(Boolean)
            ? '<button type="button" data-wild-recommended>Use recommended forms</button>'
            : "") +
          "</details>",
      );
    }
    const p = W.profile(s.data, ctx);
    if (p) {
      const controls = host.querySelector(".sheet-wild-setup");
      controls.insertAdjacentHTML("beforebegin", card(p));
      const activeCard = host.querySelector(".sheet-wild-card");
      if (activeCard) {
        const health = activeCard.querySelector("[data-wild-health]");
        activeCard.querySelector(".sheet-wild-abilities").before(health);
      }
      const change = document.createElement("details");
      change.setAttribute("data-wild-change", "");
      change.innerHTML = "<summary>Change form or known forms</summary>";
      controls.before(change);
      change.append(controls);
      const knownEditor = host.querySelector("[data-wild-known]");
      if (knownEditor) change.append(knownEditor);
    } else
      host.insertAdjacentHTML(
        "beforeend",
        "<p data-wild-normal><strong>Normal form</strong> · Your normal character values are unchanged.</p>",
      );
    host.insertAdjacentHTML(
      "beforeend",
      '<details data-wild-other-features><summary>Other features using this pool</summary><p class="sheet-help">For an unlocked feature such as Wild Companion or a circle feature, spend its use here and resolve that feature separately. This button does not assume a form or change HP.</p><div class="sheet-class-resource-actions"><button type="button" data-wild-other ' +
        (st.remaining < 1 ? "disabled" : "") +
        '>Spend 1 use for another feature</button><button type="button" data-wild-undo ' +
        (st.last !== "other" || !st.used ? "disabled" : "") +
        ">Undo other-feature use</button></div></details>",
    );
    host.querySelector("[data-wild-search]").oninput = (e) => {
      search = e.target.value;
      const select = host.querySelector("[data-wild-form]");
      select.innerHTML = options(
        usable.filter((r) =>
          r.name.toLowerCase().includes(search.toLowerCase()),
        ),
        selected,
      );
      refreshAssume(host, st);
    };
    host.querySelector("[data-wild-form]").onchange = (e) => {
      selected = e.target.value;
      const seen = host.querySelector("[data-wild-seen]");
      if (seen)
        seen.checked =
          st.seen.includes(selected) || selected.includes("elemental");
      refreshAssume(host, st);
    };
    host
      .querySelector("[data-wild-seen]")
      ?.addEventListener("change", () => refreshAssume(host, st));
    bind(host, ctx);
    refreshAssume(host, st);
    for (const saved of disclosures) {
      const node = saved.key && host.querySelector("[" + saved.key + "]");
      if (node) node.open = saved.open;
    }
    if (amount && host.querySelector("[data-wild-amount]"))
      host.querySelector("[data-wild-amount]").value = amount;
  }
  const intValue = (v) =>
    Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0;
  function refreshAssume(host, s) {
    const id = host.querySelector("[data-wild-form]").value;
    host.querySelector("[data-wild-assume]").disabled =
      !id ||
      s.remaining < (id.includes("elemental") ? 2 : 1) ||
      !!W.blocked(sheetSession.data, context().level) ||
      (!s.modern && !host.querySelector("[data-wild-seen]")?.checked);
  }
  function bind(host, ctx) {
    const actor = sheetSession;
    host.querySelectorAll("[data-wild-end]").forEach(
      (b) =>
        (b.onclick = () => {
          readSheetForm();
          if (W.end(actor.data, ctx.level))
            changed(
              "Returned to normal form. Uses are not refunded.",
              "#sheetDruidWildShape [data-wild-form]",
            );
        }),
    );
    const assume = host.querySelector("[data-wild-assume]");
    if (assume)
      assume.onclick = () => {
        readSheetForm();
        const id = host.querySelector("[data-wild-form]").value;
        if (
          W.assume(actor.data, id, {
            level: ctx.level,
            seen: host.querySelector("[data-wild-seen]")?.checked,
            tempHP:
              host.querySelector("[data-wild-temp-choice]")?.value || "higher",
            gear: host.querySelector("[data-wild-gear]").value,
          })
        ) {
          selected = id;
          changed(
            "Wild Shape assumed. Use its card under Companions.",
            "[data-wild-end]",
          );
          host
            .querySelector(".sheet-wild-card")
            ?.scrollIntoView({ block: "start" });
        } else
          sheetStatus(
            "Choose an eligible known/seen form and enough remaining uses. Recorded incapacitation prevents transforming.",
            true,
          );
      };
    host.querySelectorAll("[data-wild-known-slot]").forEach(
      (input) =>
        (input.onchange = () => {
          readSheetForm();
          if (
            W.setKnown(
              actor.data,
              Number(input.dataset.wildKnownSlot),
              input.value,
              ctx.level,
            )
          )
            changed(
              "Known form updated.",
              '[data-wild-known-slot="' + input.dataset.wildKnownSlot + '"]',
            );
          else {
            sheetStatus(
              "That form is already known or is not eligible for this slot.",
              true,
            );
            signature = "";
            update(ctx.derived);
          }
        }),
    );
    host
      .querySelector("[data-wild-recommended]")
      ?.addEventListener("click", () => {
        readSheetForm();
        if (W.recommended(actor.data, ctx.level))
          changed("Recommended forms selected.", "[data-wild-form]");
      });
    host.querySelector("[data-wild-other]")?.addEventListener("click", () => {
      readSheetForm();
      if (W.otherUse(actor.data, ctx.level))
        changed(
          "Spent one Wild Shape use for the chosen other feature.",
          "[data-wild-other]",
        );
    });
    host.querySelector("[data-wild-undo]")?.addEventListener("click", () => {
      readSheetForm();
      if (W.undoOther(actor.data, ctx.level))
        changed("Other-feature use undone.", "[data-wild-other]");
    });
    for (const [attr, fn] of [
      ["data-wild-hp", W.setHP],
      ["data-wild-temp", W.setTemp],
    ]) {
      const input = host.querySelector("[" + attr + "]");
      if (input)
        input.onchange = () => {
          if (!input.checkValidity()) return;
          readSheetForm();
          if (fn(actor.data, Number(input.value), ctx))
            changed("HP updated.", "[" + attr + "]");
        };
    }
    for (const [attr, fn] of [
      ["data-wild-damage", W.damage],
      ["data-wild-heal", W.heal],
    ])
      host.querySelector("[" + attr + "]")?.addEventListener("click", () => {
        const input = host.querySelector("[data-wild-amount]");
        if (!input.checkValidity()) return;
        readSheetForm();
        if (fn(actor.data, Number(input.value), ctx))
          changed(
            attr === "data-wild-damage"
              ? "Damage applied to the active form."
              : "Healing applied.",
            "[data-wild-amount]",
          );
      });
  }
  function open() {
    if (!sheetSession) return;
    readSheetForm();
    sheetSession.data.adobe.pages.companion = true;
    catalogChanged("Companions opened. Choose and manage Wild Shape here.");
    selectSheetTab("companion");
    update(
      CharacterSheetModel.derive(
        sheetSession.data,
        sheetSession.identity.level,
        typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
      ),
    );
    document
      .getElementById("sheetDruidWildShape")
      ?.scrollIntoView({ block: "start" });
  }
  function print(data, d) {
    const state = W.state(
      data,
      d.progression?.targetLevel || sheetSession?.identity.level || 1,
    );
    if (!state.activeId) return "";
    const p = W.profile(data, { ...context(d), derived: d });
    if (!p?.valid)
      return (
        "<section><h3>Wild Shape</h3><p>" +
        esc(
          p?.reason ||
            "Open Companions to load the active form before printing.",
        ) +
        "</p></section>"
      );
    return (
      '<section class="sheet-paper-wild-shape"><h3>Active Wild Shape · ' +
      esc(p.name) +
      "</h3><p>" +
      esc(p.state.edition) +
      " · AC " +
      p.ac +
      " · HP " +
      p.hp +
      " / " +
      p.hpMax +
      " · Temporary HP " +
      p.tempHP +
      " · Walk " +
      p.speed +
      " ft · Initiative " +
      CharacterSheetModel.signed(p.initiative) +
      " · " +
      p.state.durationHours +
      " hours</p><p>Normal character HP: " +
      p.normalHP +
      " / " +
      p.normalHPMax +
      "</p><table><thead><tr><th>Ability</th><th>Score</th><th>Save</th></tr></thead><tbody>" +
      Object.entries(p.scores)
        .map(
          ([a, n]) =>
            "<tr><td>" +
            a.toUpperCase() +
            "</td><td>" +
            n +
            "</td><td>" +
            CharacterSheetModel.signed(p.saves[a]) +
            "</td></tr>",
        )
        .join("") +
      "</tbody></table><h4>Skills</h4><p>" +
      Object.entries(p.skills)
        .map(
          ([k, n]) =>
            esc(CharacterSheetModel.skills[k][0]) +
            ": " +
            CharacterSheetModel.signed(n),
        )
        .join(" · ") +
      "</p><h4>Attacks & actions</h4>" +
      (p.primalStrike ? "<p>" + esc(p.primalStrike) + "</p>" : "") +
      '<p class="sheet-paper-text">' +
      esc(p.actions) +
      '</p><h4>Traits</h4><p class="sheet-paper-text">' +
      esc(p.traits) +
      "</p><p>" +
      esc(p.spellNote) +
      "</p>" +
      p.notes.map((n) => "<p>" + esc(n) + "</p>").join("") +
      "<p>" +
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
    if (tab === "companion" && sheetSession)
      update(
        CharacterSheetModel.derive(
          sheetSession.data,
          sheetSession.identity.level,
          typeof sheetEquipmentLoot === "function" ? sheetEquipmentLoot() : [],
        ),
      );
    return result;
  };
  return { open, update, load, print };
})();
