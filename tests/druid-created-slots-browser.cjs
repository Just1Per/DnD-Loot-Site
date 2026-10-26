// Created Druid slots, Long Rest table rule and shared multiclass consumers.
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
        const read = window.fetch;
        window.fetch = async (url, ...args) =>
          String(url).includes("wild-shapes")
            ? { ok: true, json: async () => __testWildShapes }
            : read(url, ...args);
      },
      JSON.parse(
        fs.readFileSync(root + "/data/rules/wild-shapes-v1.json", "utf8"),
      ),
    );
    await page.evaluate(async () => {
      auditSeed("player");
      characters[0].level = 5;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build.edition = "2024";
      d.build.classId = "druid";
      d.hpCurrent = 12;
      d.hpTemp = 7;
      d.adobe.classLevels = [{ classId: "druid", level: 5 }];
      d.adobe.classFeatureChoices = { "keep:choice": ["saved"] };
      d.adobe.companions[0].name = "Preserve manual card";
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    const original = await page.evaluate(() =>
      JSON.stringify({
        hp: sheetSession.data.hpCurrent,
        temp: sheetSession.data.hpTemp,
        cards: sheetSession.data.adobe.companions,
        slots: sheetSession.data.slots,
      }),
    );
    await page.locator("[data-druid-slot-create] > summary").click();
    await page.locator('[data-druid-create="resurgence"]').click();
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.createdSlots(sheetSession.data)[0]
            .available,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 5).remaining,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          hp: sheetSession.data.hpCurrent,
          temp: sheetSession.data.hpTemp,
          cards: sheetSession.data.adobe.companions,
          slots: sheetSession.data.slots,
        }),
      ),
      original,
    );
    assert.equal(
      await page.locator('[data-druid-create="resurgence"]').isDisabled(),
      true,
    );
    await page.locator("[data-open-created-slots]").click();
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector('[data-sheet-tab][aria-selected="true"]')
            .dataset.sheetTab,
      ),
      "spells",
    );
    const slot = () =>
      page.locator('#sheetAutoSlotSummary [data-created-slot-use="1"]');
    assert.match(
      await slot().getAttribute("aria-label"),
      /created level 1 spell slot/,
    );
    await slot().click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data)[0].used,
      ),
      1,
    );
    assert.equal(
      await slot().evaluate((n) => n === document.activeElement),
      true,
    );
    await slot().click();
    await page.locator("[data-toggle-overview-slots]").click();
    await page.evaluate(() => selectSheetTab("overview"));
    const overview = () =>
      page.locator('#sheetOverviewReadout [data-created-slot-use="1"]');
    await overview().click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data)[0].used,
      ),
      1,
    );
    await overview().click();
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.createdSlots(sheetSession.data)[0]
            .available,
      ),
      1,
    );
    await page.evaluate(() => selectSheetTab("spells"));
    await slot().click();
    assert.equal(
      await slot().evaluate((n) => n === document.activeElement),
      true,
    );
    await slot().click();
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("spells");
    });
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.createdSlots(sheetSession.data)[0]
            .available,
      ),
      1,
    );
    await page.evaluate(() => selectSheetTab("companion"));
    await page.waitForSelector("[data-wc-form]");
    await page.locator("[data-wc-form]").selectOption("srd-2024-owl");
    await page.locator("[data-wc-payment]").selectOption("created-1");
    await page.locator("[data-wc-summon]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      true,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data)[0].used,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 5).remaining,
      ),
      1,
    );
    await page.evaluate(() => selectSheetTab("spells"));
    await page.locator("[data-reset-slots]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data).length,
      ),
      0,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      false,
    );
    await page.evaluate(() => selectSheetTab("combat"));
    if (
      !(await page.locator("[data-druid-slot-create]").evaluate((n) => n.open))
    )
      await page.locator("[data-druid-slot-create] > summary").click();
    await page.locator('[data-druid-create="resurgence"]').click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 5).remaining,
      ),
      0,
    );
    if (
      !(await page.locator("[data-druid-resurgence]").evaluate((n) => n.open))
    )
      await page.locator("[data-druid-resurgence] > summary").click();
    await page.locator("[data-resurgence-slot]").selectOption("created-1");
    await page.locator("[data-resurgence-own-turn]").check();
    await page.locator("[data-resurgence-regain]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data)[0].used,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 5).remaining,
      ),
      1,
    );
    await page.evaluate(() => {
      sheetSession.identity.level = 20;
      sheetSession.data.adobe.classLevels = [{ classId: "druid", level: 20 }];
      CharacterClassFeatureChoices.resetClassResources(
        sheetSession.data,
        "long",
        { level: 20 },
      );
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    if (
      !(await page.locator("[data-druid-slot-create]").evaluate((n) => n.open))
    )
      await page.locator("[data-druid-slot-create] > summary").click();
    await page.locator('[data-druid-create="resurgence"]').click();
    await page.locator("[data-nature-uses]").selectOption("4");
    assert.equal(
      await page.locator('[data-druid-create="nature"]').isDisabled(),
      true,
    );
    await page.locator("[data-nature-uses]").selectOption("3");
    assert.match(
      await page.locator('[data-druid-create="nature"]').textContent(),
      /level 6 slot/,
    );
    const beforeStale = await page.evaluate(() =>
      JSON.stringify(sheetSession.data),
    );
    await page.evaluate(() => {
      auth.currentUser = { uid: "other" };
      document.querySelector('[data-druid-create="nature"]').click();
    });
    assert.equal(
      await page.evaluate(() => JSON.stringify(sheetSession.data)),
      beforeStale,
    );
    await page.evaluate(() => {
      auth.currentUser = { uid: "player" };
    });
    await page.locator('[data-druid-create="nature"]').click();
    assert.deepEqual(
      await page.evaluate(() =>
        CharacterDruidConversions.createdSlots(sheetSession.data).map(
          (r) => r.level,
        ),
      ),
      [1, 6],
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 20).remaining,
      ),
      0,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("combat");
    });
    await page.locator("[data-combat-recover=short]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data).length,
      ),
      2,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 20).remaining,
      ),
      1,
    );
    if (
      !(await page.locator("[data-druid-slot-create]").evaluate((n) => n.open))
    )
      await page.locator("[data-druid-slot-create] > summary").click();
    assert.equal(
      await page.locator('[data-druid-create="resurgence"]').isDisabled(),
      true,
    );
    assert.equal(
      await page.locator('[data-druid-create="nature"]').isDisabled(),
      true,
    );
    await page.evaluate(() =>
      CharacterSheetPrint.prepare(new Set(["combat", "spells"])),
    );
    assert.match(
      await page.locator("[data-paper-section=spells]").textContent(),
      /Created spell slots.*Level 6.*Nature Magician/s,
    );
    assert.match(
      await page.locator("[data-paper-section=combat]").textContent(),
      /Nature Magician.*Used until Long Rest/s,
    );
    await page.evaluate(() => {
      CharacterSheetPrint.clear();
      SiteHelp.refresh();
    });
    assert.match(
      await page.locator("[data-nature-uses]").getAttribute("aria-description"),
      /two levels|two spell levels/,
    );
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const host = page.locator("[data-druid-slot-create]");
      assert.equal(
        await host.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      assert.equal(
        await page
          .locator('[data-druid-create="nature"]')
          .evaluate((n) => n.getBoundingClientRect().height >= 44),
        true,
      );
      await host.screenshot({
        path: out + "/druid-slot-creation-" + width + ".png",
      });
      await page.evaluate(() => selectSheetTab("spells"));
      await page
        .locator("#sheetAutoSlotSummary [data-created-slot-panel]")
        .screenshot({ path: out + "/druid-created-slots-" + width + ".png" });
      await page.evaluate(() => selectSheetTab("combat"));
    }
    const accessibility = await page.evaluate(async () =>
      axe.run(document.querySelector("[data-druid-slot-create]"), {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      }),
    );
    assert.deepEqual(accessibility.violations, []);
    await page.locator("[data-combat-recover=long]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data).length,
      ),
      0,
    );
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.creationStatus(
            sheetSession.data,
            "nature",
            1,
            { level: 20 },
          ).used,
      ),
      false,
    );
    await page.evaluate(() => {
      sheetSession.identity.level = 10;
      sheetSession.data.adobe.classLevels = [
        { classId: "druid", level: 5 },
        { classId: "bard", level: 5 },
      ];
      CharacterClassFeatureChoices.resetClassResources(
        sheetSession.data,
        "long",
        { level: 10 },
      );
      CharacterDruidConversions.create(sheetSession.data, "resurgence", 1, {
        level: 10,
      });
      const d = CharacterSheetModel.derive(sheetSession.data, 10);
      CharacterClassFeatureChoices.changeClassResource(
        sheetSession.data,
        "bard-inspiration",
        1,
        { level: 10, mods: d.mods },
      );
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    const beforeBard = await page.evaluate(() =>
      JSON.stringify(sheetSession.data.slots),
    );
    await page.locator("[data-bard-slot]").selectOption("created-1");
    await page.locator("[data-bard-slot-recover]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data)[0].used,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify(sheetSession.data.slots)),
      beforeBard,
    );
    await page.evaluate(() => {
      sheetSession.data.adobe.classLevels = [
        { classId: "druid", level: 5 },
        { classId: "wizard", level: 5 },
      ];
      CharacterClassFeatureChoices.resetClassResources(
        sheetSession.data,
        "long",
        { level: 10 },
      );
      CharacterDruidConversions.create(sheetSession.data, "resurgence", 1, {
        level: 10,
      });
      CharacterDruidConversions.changeCreatedUse(sheetSession.data, 1, true);
      sheetSession.data.slots[0].used = 1;
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    await page.locator("[data-arcane-options] > summary").click();
    await page.locator('[data-arcane-slot="created-1"]').selectOption("1");
    await page.locator('[data-arcane-slot="1"]').selectOption("1");
    await page.locator("[data-arcane-recover]").click();
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.createdSlots(sheetSession.data)[0]
            .available,
      ),
      1,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 0);
    await page.evaluate(() => selectSheetTab("spells"));
    await page.locator("[data-reset-slots]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterDruidConversions.createdSlots(sheetSession.data).length,
      ),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS created slots at full ordinary capacity, own ledger and Overview, Use/Undo/focus, save/reopen, familiar/recovery/Bard/Wizard payments, independent limits, Long/Short Rest, stale auth, print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
