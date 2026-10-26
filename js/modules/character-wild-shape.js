"use strict";
/* Own Wild Shape state; the normal character and manually prepared companion cards stay intact. */
var CharacterWildShape = (() => {
  const C =
      globalThis.CharacterClassFeatureChoices ||
      (typeof require === "function"
        ? require("./character-class-feature-choices")
        : null),
    P =
      globalThis.CharacterProgression ||
      (typeof require === "function"
        ? require("./character-progression")
        : null);
  const A = ["str", "dex", "con", "int", "wis", "cha"],
    ELEMENTALS = new Set([
      "srd-2014-air-elemental",
      "srd-2014-earth-elemental",
      "srd-2014-fire-elemental",
      "srd-2014-water-elemental",
    ]);
  let catalogue = null;
  const int = (v, d = 0) =>
      Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : d,
    mod = (v) => Math.floor((v - 10) / 2),
    stored = (d) => d.adobe || d.rulesChoices?.grants?.__adobe?.data || {},
    choices = (d) => C.normalize(stored(d).classFeatureChoices);
  const target = (d, level) =>
      stored(d).useExperience
        ? P.levelFromXP(d.experience)
        : Math.max(1, Math.min(20, int(level, 1))),
    cr = (v) =>
      String(v).includes("/")
        ? Number(String(v).split("/")[0]) / Number(String(v).split("/")[1])
        : Number(v);
  function entries(d, level = 1) {
    const raw = stored(d).classLevels?.length
        ? stored(d).classLevels
        : [{ classId: d.build?.classId, level: target(d, level) }],
      out = [],
      seen = new Set();
    let left = target(d, level);
    for (const row of raw) {
      const n = Math.min(left, Math.max(0, int(row?.level)));
      left -= n;
      if (n && !seen.has(row?.classId)) {
        seen.add(row.classId);
        out.push({ ...row, level: n });
      }
    }
    return out;
  }
  function limits(d, level = 1) {
    const row = entries(d, level).find((e) => e.classId === "druid"),
      n = row?.level || 0,
      edition = d.build?.edition === "2024" ? "2024" : "2014",
      modern = edition === "2024",
      moonOld = row?.subclassId === "moon" && n >= (modern ? 3 : 2),
      moonNew = modern && row?.subclassId === "moon-2024" && n >= 3;
    return {
      level: n,
      edition,
      modern,
      available: n >= 2,
      moonOld,
      moonNew,
      maxCR: moonOld
        ? n >= 6
          ? Math.floor(n / 3)
          : 1
        : moonNew
          ? Math.floor(n / 3)
          : n >= 8
            ? 1
            : n >= 4
              ? 0.5
              : 0.25,
      fly: n >= 8,
      swim: modern || n >= 4,
      knownLimit: modern ? (n >= 8 ? 8 : n >= 4 ? 6 : 4) : 0,
      maxUses:
        !modern && n >= 20
          ? Infinity
          : modern
            ? n >= 17
              ? 4
              : n >= 6
                ? 3
                : 2
            : 2,
      durationHours: modern ? n / 2 : Math.floor(n / 2),
      action: modern || moonOld ? "Bonus Action" : "Action",
      temporaryHP: modern ? n * (moonNew ? 3 : 1) : 0,
      elementals: moonOld && n >= 10,
    };
  }
  const keys = (l) =>
    Object.fromEntries(
      ["active", "hp", "spent", "known", "seen", "gear", "last"].map((name) => [
        name,
        l.edition + ":druid:wild-shape-" + name,
      ]),
    );
  function state(d, level = 1) {
    const l = limits(d, level),
      k = keys(l),
      c = choices(d),
      used = /^\d{1,3}$/.test(c[k.spent]?.[0] || "")
        ? Number(c[k.spent][0])
        : 0,
      hp = /^\d{1,6}$/.test(c[k.hp]?.[0] || "") ? Number(c[k.hp][0]) : null;
    return {
      ...l,
      keys: k,
      used,
      remaining:
        l.maxUses === Infinity ? Infinity : Math.max(0, l.maxUses - used),
      activeId: c[k.active]?.[0] || "",
      hp,
      known: c[k.known] || [],
      seen: c[k.seen] || [],
      gear: ["merged", "dropped", "worn"].includes(c[k.gear]?.[0])
        ? c[k.gear][0]
        : "merged",
      last: c[k.last]?.[0] || "",
    };
  }
  function write(d, updates) {
    const old = stored(d),
      next = { ...choices(d), ...updates };
    if (Object.keys(next).length > 100) return false;
    d.adobe = { ...old, classFeatureChoices: next };
    return true;
  }
  function setCatalogue(payload) {
    if (
      payload?.schemaVersion !== 1 ||
      !Array.isArray(payload.records) ||
      payload.records.length > 500
    )
      throw Error("Invalid Wild Shape catalogue.");
    const next = new Map();
    for (const row of payload.records) {
      const b = row.data;
      if (
        typeof row.id !== "string" ||
        !/^srd-(2014|2024)-[a-z0-9-]{1,90}$/.test(row.id) ||
        !row.id.startsWith("srd-" + row.edition + "-") ||
        typeof row.title !== "string" ||
        next.has(row.id) ||
        !["2014", "2024"].includes(row.edition) ||
        !b ||
        !Number.isFinite(cr(b.cr)) ||
        !Number.isFinite(b.ac) ||
        !Number.isFinite(b.hp) ||
        b.hp < 1 ||
        !A.every((a) => Number.isFinite(b[a]) && b[a] >= 1 && b[a] <= 30) ||
        !(
          String(b.creatureType).toLowerCase() === "beast" ||
          ELEMENTALS.has(row.id)
        )
      )
        throw Error("Invalid form record.");
      next.set(row.id, structuredClone(row));
    }
    catalogue = next;
    return next.size;
  }
  function eligible(d, id, level = 1) {
    const l = limits(d, level),
      row = catalogue?.get(id);
    if (!l.available || !row) return false;
    if (l.elementals && ELEMENTALS.has(id)) return true;
    return (
      row.edition === l.edition &&
      row.data.creatureType.toLowerCase() === "beast" &&
      cr(row.data.cr) <= l.maxCR &&
      (l.fly || !/\bfly\b/i.test(row.data.movement)) &&
      (l.swim || !/\bswim\b/i.test(row.data.movement))
    );
  }
  const forms = (d, level = 1) =>
    [...(catalogue?.values() || [])]
      .filter((r) => eligible(d, r.id, level))
      .map((r) => ({
        id: r.id,
        name: r.title,
        cr: r.data.cr,
        edition: r.edition,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  const validKnown = (d, level = 1) =>
    state(d, level)
      .known.slice(0, limits(d, level).knownLimit)
      .filter((id, i, a) => a.indexOf(id) === i && eligible(d, id, level));
  function setKnownAt(d, index, id, level) {
    const s = state(d, level),
      allowance = limits(d, level).knownLimit;
    if (
      typeof id !== "string" ||
      ELEMENTALS.has(id) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= 20 ||
      (id && (index >= allowance || !eligible(d, id, level)))
    )
      return false;
    const next = [...s.known];
    if (id && next.some((value, i) => value === id && i !== index))
      return false;
    while (next.length <= index) next.push("");
    next[index] = id;
    return write(d, { [s.keys.known]: next });
  }
  function knownChoice(d, index, id, level = 1) {
    if (!limits(d, level).modern || !limits(d, level).available) return false;
    return setKnownAt(d, index, id, level);
  }
  function recommended(d, level = 1) {
    const s = state(d, level);
    if (!s.modern || !s.available || s.known.some(Boolean)) return false;
    const ids = ["rat", "riding-horse", "spider", "wolf"].map(
      (name) => "srd-2024-" + name,
    );
    return (
      ids.every((id) => eligible(d, id, level)) &&
      write(d, { [s.keys.known]: ids })
    );
  }
  function setTemp(d, value, ctx = {}) {
    if (
      !profile(d, ctx)?.valid ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 100000
    )
      return false;
    d.hpTemp = value;
    return true;
  }
  function blocked(d, level = 1) {
    const s = limits(d, level),
      tags = String(d.conditions || "")
        .split(/[,;|\n]+/)
        .map((v) =>
          v
            .trim()
            .replace(/\s*\([^)]*\)\s*$/, "")
            .trim()
            .toLowerCase(),
        ),
      stops = s.modern
        ? [
            "incapacitated",
            "paralyzed",
            "petrified",
            "stunned",
            "unconscious",
            "dead",
          ]
        : ["unconscious", "dead"];
    return tags.find((t) => stops.includes(t)) || "";
  }
  function end(d, level = 1) {
    const s = state(d, level);
    return !!s.activeId && write(d, { [s.keys.active]: [] });
  }
  function settle(d, level = 1) {
    const s = state(d, level);
    return !!s.activeId && !!blocked(d, level) && end(d, level);
  }
  function assume(
    d,
    id,
    { level = 1, seen = false, tempHP = "higher", gear = "merged" } = {},
  ) {
    const s = state(d, level);
    if (
      !eligible(d, id, level) ||
      blocked(d, level) ||
      !["merged", "dropped", "worn"].includes(gear) ||
      !["higher", "keep", "replace"].includes(tempHP)
    )
      return false;
    if (s.modern && !validKnown(d, level).includes(id) && !ELEMENTALS.has(id))
      return false;
    if (!s.modern && !ELEMENTALS.has(id) && !seen && !s.seen.includes(id))
      return false;
    const cost = ELEMENTALS.has(id) ? 2 : 1;
    if (s.remaining < cost) return false;
    const row = catalogue.get(id);
    if (
      !write(d, {
        [s.keys.active]: [id],
        [s.keys.hp]: [String(row.data.hp)],
        [s.keys.spent]: [
          String(s.maxUses === Infinity ? s.used : s.used + cost),
        ],
        [s.keys.gear]: [gear],
        [s.keys.last]: ["transform"],
        ...(!s.modern
          ? { [s.keys.seen]: [...new Set([id, ...s.seen])].slice(0, 20) }
          : {}),
      })
    )
      return false;
    if (s.modern)
      d.hpTemp =
        tempHP === "keep"
          ? Math.max(0, int(d.hpTemp))
          : tempHP === "replace"
            ? s.temporaryHP
            : Math.max(Math.max(0, int(d.hpTemp)), s.temporaryHP);
    return true;
  }
  function otherUse(d, level = 1) {
    const s = state(d, level);
    return (
      s.available &&
      !blocked(d, level) &&
      s.remaining >= 1 &&
      write(d, {
        [s.keys.spent]: [String(s.maxUses === Infinity ? s.used : s.used + 1)],
        [s.keys.last]: ["other"],
      })
    );
  }
  function undoOther(d, level = 1) {
    const s = state(d, level);
    return (
      s.last === "other" &&
      s.used > 0 &&
      write(d, { [s.keys.spent]: [String(s.used - 1)], [s.keys.last]: [] })
    );
  }
  function setHP(d, value, ctx = {}) {
    const s = state(d, ctx.level),
      p = profile(d, ctx);
    if (!p?.valid || !Number.isInteger(value) || value < 0 || value > p.hpMax)
      return false;
    if (s.modern) {
      d.hpCurrent = value;
      return true;
    }
    if (
      !write(d, {
        [s.keys.hp]: [String(value)],
        ...(value === 0 ? { [s.keys.active]: [] } : {}),
      })
    )
      return false;
    return true;
  }
  function damage(d, amount, ctx = {}) {
    const s = state(d, ctx.level),
      p = profile(d, ctx);
    if (
      !p?.valid ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 1e6 ||
      p.hp === null
    )
      return false;
    const absorbed = Math.min(Math.max(0, int(d.hpTemp)), amount),
      remaining = amount - absorbed;
    if (s.modern) {
      d.hpTemp = Math.max(0, int(d.hpTemp)) - absorbed;
      d.hpCurrent = Math.max(0, int(d.hpCurrent) - remaining);
      return true;
    }
    const hp = Math.max(0, p.hp - remaining),
      overflow = Math.max(0, remaining - p.hp);
    if (
      !write(d, {
        [s.keys.hp]: [String(hp)],
        ...(hp === 0 ? { [s.keys.active]: [] } : {}),
      })
    )
      return false;
    d.hpTemp = Math.max(0, int(d.hpTemp)) - absorbed;
    if (overflow) d.hpCurrent = Math.max(0, int(d.hpCurrent) - overflow);
    return true;
  }
  function heal(d, amount, ctx = {}) {
    const p = profile(d, ctx);
    return (
      !!p?.valid &&
      Number.isInteger(amount) &&
      amount > 0 &&
      amount <= 1e6 &&
      p.hp !== null &&
      setHP(d, Math.min(p.hpMax, p.hp + amount), ctx)
    );
  }
  function resources(d, { level = 1 } = {}) {
    const s = state(d, level);
    if (!s.available) return [];
    const unlimited = s.maxUses === Infinity;
    return [
      {
        id: "druid-wild-shape",
        key: s.keys.spent,
        name: "Wild Shape",
        source: s.edition + " Druid",
        className: "Druid",
        level: s.level,
        max: unlimited ? 0 : s.maxUses,
        used: s.used,
        remaining: unlimited ? Infinity : s.remaining,
        unlimited,
        managedWildShape: true,
        unit: "uses",
        resets: unlimited
          ? []
          : [
              "short",
              "long",
              ...(s.modern && s.level >= 20 ? ["initiative"] : []),
            ],
        ...(s.modern ? { shortRecovery: 1 } : {}),
        recovery: unlimited
          ? "Unlimited uses"
          : s.modern
            ? "Short Rest: regain 1 use · Long Rest: all uses" +
              (s.level >= 20 ? " · Initiative: regain 1 if empty" : "")
            : "Short or Long Rest recovery",
        description:
          s.action +
          " · Up to " +
          s.durationHours +
          " hours. Choose and manage your own form under Companions. Normal scores and equipment remain saved.",
      },
    ];
  }
  function profile(d, ctx = {}) {
    const s = state(d, ctx.level);
    if (!s.activeId) return null;
    const row = catalogue?.get(s.activeId);
    if (!row || !eligible(d, s.activeId, ctx.level) || blocked(d, ctx.level))
      return {
        valid: false,
        state: s,
        name: row?.title || "Saved form",
        reason: !catalogue
          ? "Load the form catalogue to resume."
          : blocked(d, ctx.level)
            ? "Form ended: " + blocked(d, ctx.level) + "."
            : "Saved form is not eligible for the current class/source; return to normal form.",
      };
    const model =
        ctx.model ||
        globalThis.CharacterSheetModel ||
        (typeof require === "function"
          ? require("./character-sheet-model")
          : null),
      level = target(d, ctx.level),
      loot = ctx.loot || [],
      bare = model.derive(d, level, []),
      b = row.data,
      scores = Object.fromEntries(
        A.map((a) => [
          a,
          ["int", "wis", "cha"].includes(a) ? bare.scores[a] : b[a],
        ]),
      ),
      effects = structuredClone(bare.effects),
      copy = structuredClone(d);
    copy.build = { ...copy.build, race: "" };
    copy.adobe = { ...stored(d), classLevels: entries(d, level) };
    effects.race = {};
    effects.speed =
      b.speed +
      Math.max(0, bare.effects.speed - (bare.effects.race?.speed || 30));
    const magic = ctx.magic || globalThis.CharacterMagicItems,
      equipment =
        ctx.equipment ||
        globalThis.CharacterEquipment ||
        (typeof require === "function"
          ? require("./character-equipment")
          : null);
    const appliedMagic =
      s.gear === "worn" && magic?.apply
        ? magic.apply(copy, scores, effects, loot, level)
        : null;
    const mods = Object.fromEntries(A.map((a) => [a, mod(scores[a])])),
      pb = bare.pb,
      feats = bare.feats,
      rawGear =
        s.gear === "worn" && equipment?.derive
          ? equipment.derive(
              copy,
              { ...bare, scores, mods, effects, feats },
              loot,
              level,
            )
          : null,
      gear =
        rawGear && appliedMagic && magic?.augmentGear
          ? magic.augmentGear(copy, rawGear, appliedMagic)
          : rawGear,
      shield = gear?.shield || 0,
      armor = gear?.entries?.some(
        (e) => e.active && e.mechanics.kind === "armor",
      ),
      defenses = [{ name: "Beast AC", value: b.ac + mods.dex - mod(b.dex) }];
    if (armor) defenses.push({ name: gear.baseLabel, value: gear.base });
    else {
      defenses.push({ name: "Unarmored", value: 10 + mods.dex });
      const first = entries(d, level).find(
        (e) => e.classId === "monk" || e.classId === "barbarian",
      );
      if (first?.classId === "monk" && !shield)
        defenses.push({
          name: "Monk Unarmored Defense",
          value: 10 + mods.dex + mods.wis,
        });
      if (first?.classId === "barbarian")
        defenses.push({
          name: "Barbarian Unarmored Defense",
          value: 10 + mods.dex + mods.con,
        });
    }
    if (s.moonNew)
      defenses.push({ name: "Circle Forms", value: 13 + mods.wis });
    const best = defenses.sort((a, b) => b.value - a.value)[0],
      Aura =
        globalThis.CharacterPaladinAuras ||
        (typeof require === "function"
          ? require("./character-paladin-auras")
          : null),
      aura = Aura?.derive(d, { level, mods }).bonus || 0,
      flat = (bare.artificerFeatures?.saveBonus || 0) + aura,
      beastSaves = {};
    for (const m of String(b.saves || "").matchAll(
      /\b(STR|DEX|CON|INT|WIS|CHA)\s*:\s*([+−-]?\d+)/gi,
    ))
      beastSaves[m[1].toLowerCase()] = Number(m[2].replace("−", "-"));
    const saves = Object.fromEntries(
        A.map((a) => [
          a,
          Math.max(
            mods[a] +
              (d.saves?.[a]?.proficient ||
              effects.saves.includes(a) ||
              a in beastSaves
                ? pb
                : 0),
            beastSaves[a] ?? -Infinity,
          ) +
            Number(d.saves?.[a]?.bonus || 0) +
            flat +
            (s.moonNew && s.level >= 6 && a === "con" ? mods.wis : 0),
        ]),
      ),
      skills = {};
    for (const [id, [name, ability]] of Object.entries(model.skills)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        match = String(b.skills || "").match(
          new RegExp("\\b" + escaped + "\\s*:\\s*([+−-]?\\d+)", "i"),
        ),
        beast = match ? Number(match[1].replace("−", "-")) : -Infinity,
        rank = Math.max(
          d.skills?.[id]?.rank || 0,
          effects.skills.includes(id) ? 1 : 0,
          feats.expertise.includes(id) ? 2 : 0,
          bare.classExpertise?.skills.includes(id) ? 2 : 0,
          match ? 1 : 0,
          effects.halfSkillProficiency ? 0.5 : 0,
        ),
        order =
          (bare.classOrders?.reports || []).filter((r) => r.skills.includes(id))
            .length * Math.max(1, mods.wis);
      skills[id] =
        Math.max(mods[ability] + Math.floor(rank * pb), beast) +
        (d.skills?.[id]?.bonus || 0) +
        order;
    }
    const actor = ctx.derived || model.derive(d, level, loot),
      notes = [
        "Equipment: " +
          s.gear +
          ". Worn equipment requires the DM to confirm that the form can wear it.",
        "Printed beast actions retain their source DCs; conditional class and item damage is resolved at the table.",
      ];
    if (s.moonOld && s.level >= 6)
      notes.push(
        "Primal Strike: form attacks count as magical for overcoming nonmagical resistance/immunity.",
      );
    if (s.moonNew && s.level >= 6)
      notes.push(
        "Improved Circle Forms: you may use Radiant damage for a form attack.",
      );
    if (s.moonNew && s.level >= 14)
      notes.push(
        "Lunar Form: once on your turn, an eligible form hit deals an additional 2d10 Radiant damage.",
      );
    const fury = C.elementalFury(d, { level, mods });
    if (fury.choice === "potent-spellcasting") notes.push(fury.detail);
    const primalStrike =
      fury.choice === "primal-strike" &&
      String(b.creatureType).toLowerCase() === "beast"
        ? fury.detail
        : "";
    const oldPB = Math.floor((Math.max(0, cr(b.cr)) - 1) / 4) + 2,
      actions = String(b.actions || "")
        .split(/\n\n/)
        .map((text) => {
          const hit = text.match(
            /(?:Melee|Ranged)(?: Weapon)? Attack(?: Roll)?:\s*([+−-]\d+)/i,
          );
          if (!hit) return text;
          const old = Number(hit[1].replace("−", "-")),
            ranged = /^Ranged/i.test(hit[0]),
            candidates = (ranged ? ["dex", "str"] : ["str", "dex"]).filter(
              (a) => mod(b[a]) + Math.max(2, oldPB) === old,
            ),
            ability = candidates[0];
          if (!ability) return text;
          const delta = mods[ability] - mod(b[ability]);
          if (!delta) return text;
          let changed = text.replace(
            hit[0],
            hit[0].replace(
              hit[1],
              (old + delta >= 0 ? "+" : "") + (old + delta),
            ),
          );
          changed = changed.replace(
            /Hit:\s*\d+\s*\((\d+)d(\d+)(?:\s*([+−-])\s*(\d+))?\)/i,
            (all, count, die, sign, n) => {
              const total =
                  (sign === "-" || sign === "−" ? -1 : 1) * Number(n || 0) +
                  delta,
                average = Math.floor(
                  (Number(count) * (Number(die) + 1)) / 2 + total,
                );
              return (
                "Hit: " +
                average +
                " (" +
                count +
                "d" +
                die +
                (total
                  ? " " + (total < 0 ? "−" : "+") + " " + Math.abs(total)
                  : "") +
                ")"
              );
            },
          );
          return changed;
        })
        .join("\n\n");
    return {
      valid: true,
      primalStrike,
      state: s,
      id: row.id,
      name: row.title,
      source: b.source,
      size: b.size,
      scores,
      mods,
      pb,
      saves,
      skills,
      ac: best.value + shield + (gear?.bonus || 0) + (gear?.defense || 0),
      acSource: best.name,
      speed: effects.speed ?? b.speed,
      movement: b.movement,
      senses: [
        String(b.senses || "").replace(
          /passive perception:?\s*\d+/gi,
          "passive Perception: " +
            (10 +
              skills.perception +
              (d.passiveBonus || 0) +
              (feats.passiveBonus || 0)),
        ),
        ...(bare.effects.specialSenses || []).map(
          (sense) => sense.name + ": " + sense.detail,
        ),
      ]
        .filter(Boolean)
        .join(" · "),
      initiative:
        mods.dex +
        (d.initiativeBonus || 0) +
        (effects.initiativeBonus || 0) +
        (effects.halfInitiativeProficiency && !effects.initiativeProficiency
          ? Math.floor(pb / 2)
          : 0),
      hp: s.modern ? int(d.hpCurrent) : s.hp,
      hpMax: s.modern ? actor.hpMax : b.hp,
      normalHP: int(d.hpCurrent),
      normalHPMax: actor.hpMax,
      tempHP: Math.max(0, int(d.hpTemp)),
      actions,
      traits: b.traits,
      notes,
      spellNote:
        s.level >= 18
          ? s.modern
            ? "Beast Spells: spellcasting is available except for costly or consumed Material components."
            : "Beast Spells: eligible Druid spells can use Verbal/Somatic components; Material component restrictions still apply."
          : "Wild Shape normally prevents spellcasting; retained subclass exceptions follow their own source rules. Concentration on an existing spell continues.",
    };
  }
  return {
    limits,
    state,
    entries,
    blocked,
    setCatalogue,
    loaded: () => !!catalogue,
    forms,
    eligible,
    validKnown,
    setKnown: knownChoice,
    recommended,
    setTemp,
    assume,
    end,
    settle,
    otherUse,
    undoOther,
    setHP,
    damage,
    heal,
    resources,
    profile,
  };
})();
if (typeof module !== "undefined" && module.exports)
  module.exports = CharacterWildShape;
