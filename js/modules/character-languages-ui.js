"use strict";
var CharacterLanguagesUI = (() => {
  const L = CharacterLanguages,
    esc = (v) => sheetEscape(String(v ?? ""));
  let scope = null;
  const current = (actor) =>
    sheetSession === actor &&
    activeCampaign?.id === actor.campaignId &&
    (!actor.uid || auth.currentUser?.uid === actor.uid);
  function render(stats) {
    const actor = sheetSession,
      parent = document.getElementById("sheetCharacterLanguageChoices");
    if (!actor || !parent) return;
    let host = document.getElementById("sheetLearnedLanguages");
    const previous =
        scope === actor
          ? host?.querySelector("[data-learned-language]")?.value
          : "",
      customOpen =
        scope === actor ? host?.querySelector("details")?.open : false;
    scope = actor;
    if (!host) {
      host = document.createElement("section");
      host.id = "sheetLearnedLanguages";
      parent.append(host);
    }
    const r = stats.languageTraining,
      manual = L.learned(actor.data),
      known = stats.effects.languages || [];
    const options = (all, selected, exclude = []) =>
      '<option value="">Choose language</option>' +
      L.groups(actor.data.build.edition, all)
        .map(
          (group) =>
            '<optgroup label="' +
            esc(group.name) +
            '">' +
            group.values
              .map(
                (name) =>
                  '<option value="' +
                  esc(name) +
                  '" ' +
                  (name === selected ? "selected " : "") +
                  (exclude.some((v) => L.nameFor(v) === name)
                    ? "disabled"
                    : "") +
                  ">" +
                  esc(name) +
                  "</option>",
              )
              .join("") +
            "</optgroup>",
        )
        .join("");
    host.innerHTML =
      (r?.available
        ? '<div class="sheet-language-class"><label class="sheet-field"><span>Thieves’ Cant · additional language</span><select data-rogue-language>' +
          options(true, r.choice, r.known) +
          '</select></label><p class="sheet-help">Rogue 1 · 2024 rules · Choose one language from the Standard or Rare tables. Thieves’ Cant itself is included automatically.</p></div>'
        : "") +
      '<h5 data-context-help="additional learned languages">Additional learned languages</h5><p class="sheet-help">Record languages gained through another feature, training or your DM’s approval. These do not replace your starting language choices.</p><div class="sheet-language-add"><label class="sheet-field"><span>Add a learned language</span><select data-learned-language>' +
      options(false, previous, [...known, ...manual]) +
      '</select></label><button type="button" data-language-add>Add language</button></div><ul class="sheet-language-chips">' +
      manual
        .map(
          (name) =>
            "<li><span>" +
            esc(name) +
            '</span><button type="button" data-language-remove="' +
            esc(name) +
            '" aria-label="Remove learned language ' +
            esc(name) +
            '">Remove</button></li>',
        )
        .join("") +
      '</ul><details><summary>Custom languages & saved text</summary><label class="sheet-field"><span>Additional languages</span><textarea name="languages" rows="3" maxlength="12000"></textarea></label><p class="sheet-help">Existing custom language text is preserved. Enter table-specific languages here; Druidic and Thieves’ Cant normally come from a class feature.</p></details>';
    host.querySelector("details").open = !!customOpen;
    host.querySelector("textarea").value = actor.data.languages || "";
    host.querySelector("textarea").addEventListener("input", (event) => {
      event.stopPropagation();
      if (!current(actor)) return;
      actor.data.languages = event.target.value;
      actor.dirty = true;
      sheetStatus("Unsaved language changes");
    });
    const select = host.querySelector("[data-learned-language]"),
      button = host.querySelector("[data-language-add]");
    function refresh() {
      button.disabled =
        !select.value ||
        [...known, ...manual].some((v) => L.nameFor(v) === select.value);
    }
    select.onchange = refresh;
    refresh();
    button.onclick = () => {
      if (!current(actor)) return;
      readSheetForm();
      const now = CharacterSheetModel.derive(actor.data, actor.identity.level);
      if (L.add(actor.data, select.value, now.effects.languages)) {
        host.querySelector("textarea").value = actor.data.languages;
        catalogChanged("Language added. Save the sheet to keep it.");
        document
          .querySelector("[data-learned-language]")
          ?.focus({ preventScroll: true });
      }
    };
    host.querySelectorAll("[data-language-remove]").forEach(
      (b) =>
        (b.onclick = () => {
          if (!current(actor)) return;
          readSheetForm();
          if (L.remove(actor.data, b.dataset.languageRemove)) {
            host.querySelector("textarea").value = actor.data.languages;
            catalogChanged(
              "Learned language removed. Class and starting languages are unchanged. Save to keep the change.",
            );
            document
              .querySelector("[data-learned-language]")
              ?.focus({ preventScroll: true });
          }
        }),
    );
    host
      .querySelector("[data-rogue-language]")
      ?.addEventListener("change", (event) => {
        if (!current(actor)) return;
        readSheetForm();
        const now = CharacterSheetModel.derive(
            actor.data,
            actor.identity.level,
          ),
          r = now.languageTraining;
        if (
          L.setRogue(actor.data, event.target.value, {
            level: now.progression?.targetLevel || actor.identity.level,
            known: r?.known || [],
          })
        )
          catalogChanged(
            "Thieves’ Cant language selected. Save the sheet to keep it.",
          );
      });
    // These transient selectors are actions, not serialized form paths.
    host.querySelectorAll("select").forEach((field) => {
      for (const event of ["input", "change"])
        field.addEventListener(event, (e) => e.stopPropagation());
    });
  }
  return { render };
})();
