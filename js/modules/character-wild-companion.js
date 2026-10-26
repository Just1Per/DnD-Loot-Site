"use strict";
// Own Wild Companion record: independent of the character and existing manual cards.
var CharacterWildCompanion = (() => {
  const C =
      globalThis.CharacterClassFeatureChoices ||
      (typeof require === "function"
        ? require("./character-class-feature-choices")
        : null),
    W =
      globalThis.CharacterWildShape ||
      (typeof require === "function"
        ? require("./character-wild-shape")
        : null),
    P =
      globalThis.CharacterProgression ||
      (typeof require === "function"
        ? require("./character-progression")
        : null);
  const attributes = ["str", "dex", "con", "int", "wis", "cha"],
    stored = (d) => d.adobe || d.rulesChoices?.grants?.__adobe?.data || {},
    choices = (d) => C.normalize(stored(d).classFeatureChoices),
    int = (v, fallback = 0) =>
      Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : fallback;
  const keys = Object.fromEntries(
    [
      "form",
      "edition",
      "level",
      "status",
      "hp",
      "max",
      "temp",
      "payment",
      "slot",
      "reason",
    ].map((id) => [id, "druid:wild-companion:" + id]),
  );
  function state(d) {
    const c = choices(d),
      value = (id) => c[keys[id]]?.[0] || "",
      status = value("status"),
      edition = value("edition"),
      id = value("form");
    return {
      id,
      status,
      edition,
      level: int(value("level")),
      hp: /^\d{1,6}$/.test(value("hp")) ? Number(value("hp")) : null,
      maximum: /^\d{1,6}$/.test(value("max")) ? Number(value("max")) : null,
      temp: /^\d{1,6}$/.test(value("temp")) ? Number(value("temp")) : 0,
      payment: value("payment"),
      slot: int(value("slot")),
      reason: value("reason"),
      alive:
        !!id && edition === "2024" && ["active", "pocket"].includes(status),
    };
  }
  function write(d, updates, extra = {}) {
    const map = { ...choices(d), ...updates };
    if (Object.keys(map).length > 100) return false;
    d.adobe = { ...stored(d), ...extra, classFeatureChoices: map };
    return true;
  }
  function blocked(d) {
    const tags = String(d.conditions || "")
      .split(/[,;|\n]+/)
      .map((v) =>
        v
          .trim()
          .replace(/\s*\([^)]*\)\s*$/, "")
          .trim()
          .toLowerCase(),
      );
    return (
      tags.find((t) =>
        [
          "incapacitated",
          "paralyzed",
          "petrified",
          "stunned",
          "unconscious",
          "dead",
        ].includes(t),
      ) || ""
    );
  }
  function capability(d, ctx = {}) {
    const l = W.limits(d, ctx.level || 1),
      available = l.modern && l.level >= 2;
    return {
      available,
      level: l.level,
      reason: !available
        ? "Wild Companion is a 2024 Druid feature from class level 2."
        : blocked(d)
          ? "The recorded " + blocked(d) + " condition prevents casting."
          : W.state(d, ctx.level || 1).activeId && l.level < 18
            ? "Return to normal form before casting Find Familiar."
            : "",
      manualFamiliars: (stored(d).companions || []).filter(
        (c) => c?.type === "familiar",
      ).length,
    };
  }
  function eligible(id) {
    const row = W.creature(id);
    return (
      !!row &&
      row.edition === "2024" &&
      String(row.data.creatureType).toLowerCase() === "beast" &&
      Number(row.data.cr) === 0
    );
  }
  function forms() {
    return W.catalogueRows()
      .filter(
        (r) =>
          r.edition === "2024" &&
          String(r.type).toLowerCase() === "beast" &&
          Number(r.cr) === 0,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  function payments(d, ctx = {}) {
    const level = ctx.level || 1,
      entries = W.entries(d, level),
      maxima =
        ctx.slotMax ||
        ctx.derived?.effects?.slotMax ||
        P.spellSlots(
          entries.filter(
            (e) => e.classId !== "artificer" || C.artificerSource(d).eligible,
          ),
          d.build?.edition,
        ),
      s = W.state(d, level),
      rows = [
        {
          id: "wild-shape",
          label: "1 Wild Shape use",
          available: s.remaining,
          max: s.maxUses,
        },
      ];
    for (let i = 0; i < 9; i++) {
      const max = Math.max(0, int(maxima?.[i]));
      if (max)
        rows.push({
          id: "slot-" + (i + 1),
          label: "1 level " + (i + 1) + " spell slot",
          level: i + 1,
          max,
          available: Math.max(0, max - Math.max(0, int(d.slots?.[i]?.used))),
        });
    }
    const warlock = entries.find((e) => e.classId === "warlock")?.level || 0;
    if (warlock) {
      const max = warlock >= 17 ? 4 : warlock >= 11 ? 3 : warlock >= 2 ? 2 : 1,
        pact = ctx.pact || ctx.derived?.progression?.pact;
      const count = Math.max(0, int(pact?.count, max)),
        slot = Math.max(
          1,
          Math.min(5, int(pact?.slotLevel, Math.ceil(warlock / 2))),
        );
      rows.push({
        id: "pact",
        label: "1 Pact Magic slot (level " + slot + ")",
        level: slot,
        max: count,
        available: Math.max(
          0,
          count - Math.max(0, int(stored(d).pactSlotsUsed)),
        ),
      });
    }
    return rows;
  }
  function summon(d, { formId, payment, confirmed = false } = {}, ctx = {}) {
    const cap = capability(d, ctx),
      s = state(d);
    if (cap.reason) return { ok: false, reason: cap.reason };
    if (!W.loaded())
      return { ok: false, reason: "Load the familiar forms before summoning." };
    if (!eligible(formId))
      return {
        ok: false,
        reason: "Choose a 2024 Beast with challenge rating 0.",
      };
    if ((s.alive || cap.manualFamiliars) && !confirmed)
      return {
        ok: false,
        reason:
          "Confirm that you will keep only one familiar. Existing manual cards stay as records.",
      };
    const pay = payments(d, ctx).find((r) => r.id === payment);
    if (!pay || pay.available < 1)
      return {
        ok: false,
        reason: "Choose an available Wild Shape use or spell slot.",
      };
    const row = W.creature(formId),
      updates = {
        [keys.form]: [formId],
        [keys.edition]: ["2024"],
        [keys.level]: [String(cap.level)],
        [keys.status]: ["active"],
        [keys.hp]: [String(row.data.hp)],
        [keys.max]: [String(row.data.hp)],
        [keys.temp]: ["0"],
        [keys.payment]: [payment],
        [keys.slot]: [String(pay.level || 0)],
        [keys.reason]: [],
      },
      extra = {};
    let nextSlots = null;
    if (payment === "wild-shape") {
      const pool = W.state(d, ctx.level || 1);
      updates[pool.keys.spent] = [String(pool.used + 1)];
      updates[pool.keys.last] = ["companion"];
    } else if (payment === "pact") {
      extra.pactSlotsUsed = Math.max(0, int(stored(d).pactSlotsUsed)) + 1;
      extra.pactSlotsSeparated = true;
    } else {
      nextSlots = (d.slots || []).map((r) => ({ ...r }));
      const i = pay.level - 1;
      while (nextSlots.length <= i) nextSlots.push({ max: 0, used: 0 });
      nextSlots[i] = {
        ...nextSlots[i],
        max: pay.max,
        used: Math.max(0, int(nextSlots[i]?.used)) + 1,
      };
    }
    if (!write(d, updates, extra))
      return {
        ok: false,
        reason:
          "The sheet has no room for additional class-choice records. Nothing was spent.",
      };
    if (nextSlots) d.slots = nextSlots;
    return { ok: true };
  }
  function onRest(d, event) {
    const s = state(d);
    return (
      event === "long" &&
      s.alive &&
      write(d, { [keys.status]: ["ended"], [keys.reason]: ["long-rest"] })
    );
  }
  function changePresence(d, action) {
    const s = state(d);
    if (!s.alive || blocked(d)) return false;
    if (action === "pocket" && s.status === "active")
      return write(d, { [keys.status]: ["pocket"] });
    if (action === "return" && s.status === "pocket")
      return write(d, { [keys.status]: ["active"] });
    if (action === "dismiss")
      return write(d, {
        [keys.status]: ["ended"],
        [keys.reason]: ["dismissed"],
      });
    return false;
  }
  function setHP(d, value) {
    const p = profile(d);
    if (
      !p?.valid ||
      p.state.status !== "active" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > p.hpMax
    )
      return false;
    return write(d, {
      [keys.hp]: [String(value)],
      ...(value === 0
        ? { [keys.status]: ["ended"], [keys.reason]: ["zero-hp"] }
        : {}),
    });
  }
  function setMaximum(d, value) {
    const p = profile(d);
    if (
      !p?.valid ||
      p.state.status !== "active" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 100000
    )
      return false;
    return write(d, {
      [keys.max]: [String(value)],
      ...(p.hp !== null ? { [keys.hp]: [String(Math.min(p.hp, value))] } : {}),
      ...(value === 0
        ? { [keys.status]: ["ended"], [keys.reason]: ["zero-hp"] }
        : {}),
    });
  }
  function setTemp(d, value) {
    return (
      state(d).status === "active" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 100000 &&
      write(d, { [keys.temp]: [String(value)] })
    );
  }
  function damage(d, value) {
    const p = profile(d);
    if (
      !p?.valid ||
      p.state.status !== "active" ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 1e6 ||
      p.hp === null
    )
      return false;
    const absorbed = Math.min(p.temp, value),
      hp = Math.max(0, p.hp - value + absorbed);
    return write(d, {
      [keys.hp]: [String(hp)],
      [keys.temp]: [String(p.temp - absorbed)],
      ...(hp === 0
        ? { [keys.status]: ["ended"], [keys.reason]: ["zero-hp"] }
        : {}),
    });
  }
  function heal(d, value) {
    const p = profile(d);
    return (
      !!p?.valid &&
      p.state.status === "active" &&
      Number.isInteger(value) &&
      value > 0 &&
      value <= 1e6 &&
      p.hp !== null &&
      setHP(d, Math.min(p.hpMax, p.hp + value))
    );
  }
  function profile(d) {
    const s = state(d);
    if (!s.id) return null;
    const row = W.creature(s.id);
    if (!row || !eligible(s.id) || s.edition !== "2024")
      return {
        valid: false,
        state: s,
        name: row?.title || "Saved familiar",
        reason: "Load the familiar catalogue, or summon an eligible form.",
      };
    const b = row.data,
      scores = Object.fromEntries(attributes.map((k) => [k, b[k]]));
    return {
      valid: true,
      state: s,
      id: row.id,
      name: row.title,
      creatureType: "Fey",
      scores,
      ac: b.ac,
      hp: s.hp,
      hpMax: s.maximum ?? b.hp,
      baseHP: b.hp,
      temp: s.temp,
      size: b.size,
      movement: b.movement,
      senses: b.senses,
      traits: b.traits,
      skills: b.skills,
      saves: b.saves,
      initiative: Math.floor((b.dex - 10) / 2),
      source: b.source,
      actionNote:
        "A familiar cannot attack. It acts on its own Initiative and can take other actions. Within 100 ft, telepathy and touch-spell delivery are available; delivering the touch uses its Reaction. Seeing through its senses uses your Bonus Action.",
      duration: "Disappears when you finish a Long Rest.",
    };
  }
  return {
    state,
    capability,
    eligible,
    forms,
    payments,
    summon,
    onRest,
    changePresence,
    setHP,
    setTemp,
    setMaximum,
    damage,
    heal,
    profile,
    keys,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterWildCompanion;
