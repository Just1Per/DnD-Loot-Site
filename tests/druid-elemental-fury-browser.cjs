// Divine class effect choices, legacy shared pool and modern independent counters.
const fs = require("node:fs"),
  path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const root = path.resolve(__dirname, ".."),
  out =
    process.env.UI_OUTPUT_DIR ||
    require("node:os").tmpdir() + "/campaignatlas-ui-checks";
fs.mkdirSync(out, { recursive: true });
const assert = require("node:assert/strict");
const errors = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.setDefaultTimeout(7000);
    page.on("pageerror", (error) => errors.push(error.message));
    let html = fs
      .readFileSync(path.join(root, "index.html"), "utf8")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi, (tag, href) =>
        href.startsWith("css/")
          ? '<style data-audit-file="' +
            href.split("?")[0] +
            '">' +
            fs.readFileSync(path.join(root, href.split("?")[0]), "utf8") +
            "\n/*# sourceURL=" +
            href.split("?")[0] +
            " */</style>"
          : tag,
      );
    await page.route("https://fixture.example.test/**", (route) => {
      const rel = new URL(route.request().url()).pathname.slice(1),
        file = path.join(root, rel);
      return route.fulfill(
        rel && fs.existsSync(file) && fs.statSync(file).isFile()
          ? { path: file }
          : { contentType: "text/html", body: html },
      );
    });
    await page.goto("https://fixture.example.test/", {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(
      (data) => {
        window.__testCatalog = data;
        window.print = () => {};
        window.fetch = async () => ({
          ok: true,
          json: async () => window.__testCatalog,
        });
        window.alert = (text) => {
          window.auditAlerts ||= [];
          auditAlerts.push(text);
        };
        window.confirm = () => true;
        window.prompt = () => "Sample note";
      },
      JSON.parse(fs.readFileSync(root + "/data/rules/catalog.json", "utf8")),
    );
    for (const file of ["dom-setup.js", "dom-fixture.js"])
      await page.addScriptTag({ path: root + "/tests/" + file });
    await page.evaluate(() => {
      const d = window.__DND_VAULT_DEPS__;
      d.where = (field, op, value) => ({ field, op, value });
      d.query = (path, ...filters) => ({ path, filters });
      d.getDocs = async (q) => {
        const p = typeof q === "string" ? q : q.path,
          f = q.filters || [];
        return {
          docs: Object.entries(testSheetDocs)
            .filter(
              ([key, data]) =>
                key.startsWith(p + "/") &&
                !key.slice(p.length + 1).includes("/") &&
                f.every((f) => {
                  const v = f.field.split(".").reduce((d, k) => d?.[k], data);
                  return f.op === "array-contains"
                    ? v?.includes(f.value)
                    : v === f.value;
                }),
            )
            .map(([key, data]) => ({
              id: key.split("/").at(-1),
              data: () => structuredClone(data),
            })),
        };
      };
      d.ref = (_, p) => p;
      d.getBlob = async () => new Blob();
      d.uploadBytes = async () => {};
    });
    await page.evaluate(() => {
      const sdk = window.__DND_VAULT_DEPS__,
        original = sdk.runTransaction;
      window.journalWatchers = [];
      window.failJournalWrite = false;
      sdk.runTransaction = async (...args) => {
        if (window.failJournalWrite) throw Error("Simulated save failure");
        return original(...args);
      };
      sdk.onSnapshot = (path, next, error) => {
        const watch = { path, next, error, active: true };
        journalWatchers.push(watch);
        return () => {
          watch.active = false;
        };
      };
    });
    await page.evaluate(() => {
      const sdk = __DND_VAULT_DEPS__,
        read = sdk.getDocs;
      window.recapReads = [];
      sdk.getDocs = async (q) => {
        const p = typeof q === "string" ? q : q.path;
        recapReads.push(p);
        if (window.failRecapRead === p) {
          failRecapRead = null;
          throw Error("Temporary journal connection failure");
        }
        return read(q);
      };
    });
    await page.addScriptTag({
      content:
        "function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}",
    });
    const modules = JSON.parse(
      fs
        .readFileSync(root + "/tests/dom.cjs", "utf8")
        .match(/for\(const name of (\[[^\n]+?\])\)await run/)[1]
        .replaceAll("'", '"'),
    );
    for (const name of modules)
      await page.addScriptTag({ path: root + "/js/modules/" + name + ".js" });
    await page.evaluate(() => {
      CharacterCatalog.set(__testCatalog);
      document.getElementById("siteBootPanel")?.remove();
    });
    await page.addScriptTag({ path: root + "/tests/dom-state.js" });
    await page.evaluate(
      (data) => {
        window.__testMonsters = data;
        window.fetch = async (u) => ({
          ok: true,
          json: async () =>
            String(u).includes("monsters.json")
              ? __testMonsters
              : __testCatalog,
        });
        window.auditSeed = (role) => {
          closeCharacterSheet(true);
          CampaignWorkspace.clear(true);
          SiteHelp.onLogout();
          seed(role, role === "other" ? "player" : role);
          document.getElementById("loginControls").style.display = "none";
          document.getElementById("logoutButton").style.display =
            "inline-block";
          document.getElementById("adminTab").style.display =
            role === "admin" ? "inline-block" : "none";
          document.getElementById("userDisplay").textContent = "Sample " + role;
          document.getElementById("activeCampaignName").textContent =
            activeCampaign.name;
          renderDMTools();
          SiteHelp.onLogin();
        };
      },
      JSON.parse(fs.readFileSync(root + "/data/rules/monsters.json", "utf8")),
    );
    await page.addScriptTag({
      path: require.resolve(process.env.AXE_PATH || "axe-core/axe.min.js"),
    });

    await page.evaluate(
      (data) => {
        window.__testWildShapes = data;
        window.wildFetches = 0;
        window.failWildFetch = false;
        window.fetch = async (u) => {
          if (String(u).includes("wild-shapes")) {
            wildFetches++;
            if (failWildFetch) return { ok: false };
            return { ok: true, json: async () => __testWildShapes };
          }
          return {
            ok: true,
            json: async () =>
              String(u).includes("monsters.json")
                ? __testMonsters
                : __testCatalog,
          };
        };
      },
      JSON.parse(
        fs.readFileSync(root + "/data/rules/wild-shapes-v1.json", "utf8"),
      ),
    );

    await page.evaluate(async () => {
      auditSeed("player");
      characters[0].level = 15;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build.edition = "2024";
      d.build.classId = "druid";
      d.build.scoreMode = "final";
      d.abilities.wis = 16;
      d.adobe.classLevels = [{ classId: "druid", level: 15 }];
      d.adobe.classFeatureChoices = {};
      d.spells = ["Starry Wisp", "Druidcraft"].map((n) => ({
        ...CharacterCatalog.spellRow(
          CharacterCatalog.rawData.spells.find(
            (s) => s.name === n && s.edition === "2024",
          ),
        ),
        classId: "druid",
      }));
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    const choice = page.locator("[data-choice-group=elemental-fury]");
    await choice.selectOption("potent-spellcasting");
    assert.match(
      await page
        .locator("#sheetAdobeClasses [data-druid-elemental-fury]")
        .textContent(),
      /\+3.*300 ft/,
    );
    await page.evaluate(() => selectSheetTab("spells"));
    const spell = await page.evaluate(
      () =>
        CharacterCatalog.rawData.spells.find(
          (s) => s.name === "Starry Wisp" && s.edition === "2024",
        ).id,
    );
    assert.match(
      await page
        .locator('[data-cantrip-modifier="' + spell + '"]')
        .textContent(),
      /Potent Spellcasting \+3 damage.*360 feet/,
    );
    await page.evaluate(() => {
      sheetSession.data.actions = [
        {
          kind: "spell",
          ref: sheetSession.data.spells[0].catalogId + "::druid",
          ability: "auto",
          slot: 0,
          name: "",
        },
      ];
      renderCharacterSheet();
      selectSheetTab("overview");
    });
    assert.match(
      await page.locator("#sheetOverviewReadout").textContent(),
      /360 feet/,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("builder");
    });
    assert.equal(await choice.inputValue(), "potent-spellcasting");
    await page.evaluate(() => {
      sheetSession.identity.level = 20;
      const d = sheetSession.data;
      d.abilities.cha = 18;
      d.adobe.classLevels = [
        { classId: "druid", level: 15 },
        { classId: "warlock", level: 5 },
      ];
      const spell = CharacterCatalog.rawData.spells.find(
        (s) => s.name === "Poison Spray" && s.edition === "2024",
      );
      d.spells.push(
        { ...CharacterCatalog.spellRow(spell), classId: "druid" },
        { ...CharacterCatalog.spellRow(spell), classId: "warlock" },
      );
      const w = d.adobe.classLevels[1];
      CharacterClassFeatureChoices.set(
        d,
        w,
        "eldritch-invocations",
        0,
        "eldritch-spear",
      );
      CharacterClassFeatureChoices.set(
        d,
        w,
        "eldritch-invocations",
        1,
        "agonizing-blast",
      );
      CharacterClassFeatureChoices.setCantripInvocation(
        d,
        "2024:warlock:eldritch-spear-cantrips",
        0,
        spell.id,
        { level: 20, mods: { cha: 4 } },
      );
      CharacterClassFeatureChoices.setCantripInvocation(
        d,
        "2024:warlock:agonizing-blast-cantrips",
        1,
        spell.id,
        { level: 20, mods: { cha: 4 } },
      );
      renderCharacterSheet();
      selectSheetTab("spells");
    });
    const shared = await page.evaluate(
      () =>
        CharacterCatalog.rawData.spells.find(
          (s) => s.name === "Poison Spray" && s.edition === "2024",
        ).id,
    );
    assert.match(
      await page
        .locator(
          '[data-spell-sheet-class=druid] [data-cantrip-modifier="' +
            shared +
            '"]',
        )
        .textContent(),
      /\+3 damage.*330 feet/,
    );
    assert.match(
      await page
        .locator(
          '[data-spell-sheet-class=warlock] [data-cantrip-modifier="' +
            shared +
            '"]',
        )
        .textContent(),
      /\+4 damage.*180 feet/,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("spells");
    });
    assert.match(
      await page
        .locator(
          '[data-spell-sheet-class=druid] [data-cantrip-modifier="' +
            shared +
            '"]',
        )
        .textContent(),
      /330 feet/,
    );
    assert.match(
      await page
        .locator(
          '[data-spell-sheet-class=warlock] [data-cantrip-modifier="' +
            shared +
            '"]',
        )
        .textContent(),
      /180 feet/,
    );
    await page.evaluate(() => {
      sheetSession.identity.level = 15;
      sheetSession.data.adobe.classLevels = [{ classId: "druid", level: 15 }];
      sheetSession.data.spells = sheetSession.data.spells.filter(
        (s) => s.classId !== "warlock",
      );
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    await choice.selectOption("primal-strike");
    await page.evaluate(() => selectSheetTab("combat"));
    assert.match(
      await page
        .locator("#sheetFeatResources [data-druid-elemental-fury]")
        .textContent(),
      /own turn.*2d8 Cold/,
    );
    await page.locator("[data-open-wild-shape]").click();
    await page.waitForSelector("[data-wild-recommended]");
    await page.locator("[data-wild-recommended]").click();
    await page.locator("[data-wild-form]").selectOption("srd-2024-wolf");
    await page.locator("[data-wild-assume]").click();
    assert.match(
      await page.locator("[data-druid-primal-strike]").textContent(),
      /own turn.*2d8 Cold, Fire, Lightning or Thunder/,
    );
    await page.evaluate(() =>
      CharacterSheetPrint.prepare(new Set(["combat", "companion"])),
    );
    assert.match(
      await page.locator("[data-paper-section=combat]").textContent(),
      /Primal Strike.*2d8/,
    );
    assert.match(
      await page.locator("[data-paper-section=companion]").textContent(),
      /Primal Strike.*2d8/,
    );
    await page.evaluate(() => {
      CharacterSheetPrint.clear();
      selectSheetTab("builder");
    });
    await page.evaluate(() => SiteHelp.refresh());
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page
          .locator("#sheetAdobeClasses")
          .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      assert.equal(
        await choice.evaluate((n) => n.getBoundingClientRect().height >= 44),
        true,
      );
      assert.equal(
        await choice.locator("xpath=..").locator(".vault-help-badge").count(),
        0,
      );
      await page
        .locator("[data-choice-group=elemental-fury]")
        .locator("xpath=../../..")
        .screenshot({ path: out + "/druid-elemental-fury-" + width + ".png" });
    }
    const accessibility = await page.evaluate(async () =>
      (
        await axe.run(document.querySelector("#sheet-builder"), {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "best-practice"],
          },
        })
      ).violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    );
    assert.deepEqual(accessibility, []);
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2014";
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(await choice.count(), 0);
    assert.equal(
      await page.evaluate(
        () =>
          sheetSession.data.adobe.classFeatureChoices[
            "2024:druid:elemental-fury"
          ][0],
      ),
      "primal-strike",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Elemental Fury choice, live cantrip damage/range, save/reopen, conditional Beast-form hit reminder, source isolation, Combat/Companion print, inline help, responsive controls and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
