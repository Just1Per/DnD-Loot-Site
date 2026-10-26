// Wild Resurgence ordinary/Pact payments, own-turn limit and private save persistence.
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
      d.adobe.companions[0].name = "Preserve companion";
      CharacterWildShape.otherUse(d, 5);
      CharacterWildShape.otherUse(d, 5);
      window.wildFetches = 0;
      const fetchBase = window.fetch;
      window.fetch = async (url, ...args) => {
        if (String(url).includes("wild-shapes")) wildFetches++;
        return fetchBase(url, ...args);
      };
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    const snapshot = await page.evaluate(() =>
      JSON.stringify({
        hp: sheetSession.data.hpCurrent,
        temp: sheetSession.data.hpTemp,
        cards: sheetSession.data.adobe.companions,
      }),
    );
    await page.locator("[data-druid-resurgence] > summary").click();
    assert.equal(
      await page.locator("[data-resurgence-regain]").isDisabled(),
      true,
    );
    await page.locator("[data-resurgence-own-turn]").check();
    assert.equal(
      await page.locator("[data-resurgence-regain]").isDisabled(),
      false,
    );
    await page.locator("[data-resurgence-regain]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 5).remaining,
      ),
      1,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 1);
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.status(sheetSession.data, { level: 5 })
            .usedThisTurn,
      ),
      true,
    );
    assert.equal(
      await page.locator("[data-resurgence-regain]").isDisabled(),
      true,
    );
    assert.equal(
      await page.locator("[data-druid-resurgence]").evaluate((n) => n.open),
      true,
    );
    await page.evaluate(() => {
      CharacterWildShape.otherUse(sheetSession.data, 5);
      updateSheetCalculations();
    });
    assert.equal(
      await page.locator("[data-resurgence-regain]").isDisabled(),
      true,
    );
    await page.locator("[data-resurgence-next-turn]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 5).remaining,
      ),
      0,
    );
    assert.equal(
      await page.locator("[data-resurgence-own-turn]").isChecked(),
      false,
    );
    await page.locator("[data-resurgence-slot]").selectOption("slot-3");
    await page.locator("[data-resurgence-own-turn]").check();
    await page.locator("[data-resurgence-regain]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.slots[2].used), 1);
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 1);
    await page.evaluate(() => CharacterSheetPrint.prepare(new Set(["combat"])));
    assert.match(
      await page.locator("[data-paper-section=combat]").textContent(),
      /Wild Resurgence.*Used on this turn/s,
    );
    await page.evaluate(() => CharacterSheetPrint.clear());
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("combat");
    });
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.status(sheetSession.data, { level: 5 })
            .usedThisTurn,
      ),
      true,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.slots[2].used), 1);
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          hp: sheetSession.data.hpCurrent,
          temp: sheetSession.data.hpTemp,
          cards: sheetSession.data.adobe.companions,
        }),
      ),
      snapshot,
    );
    await page.evaluate(() => {
      sheetSession.identity.level = 8;
      sheetSession.data.adobe.classLevels = [
        { classId: "druid", level: 5 },
        { classId: "warlock", level: 3 },
      ];
      CharacterWildShape.otherUse(sheetSession.data, 8);
      CharacterDruidConversions.onRest(sheetSession.data, "turn");
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    await page.locator("[data-druid-resurgence] > summary").click();
    await page.locator("[data-resurgence-slot]").selectOption("pact");
    await page.locator("[data-resurgence-own-turn]").check();
    const beforeStale = await page.evaluate(() =>
      JSON.stringify(sheetSession.data),
    );
    await page.evaluate(() => {
      auth.currentUser = { uid: "other" };
      document.querySelector("[data-resurgence-regain]").click();
    });
    assert.equal(
      await page.evaluate(() => JSON.stringify(sheetSession.data)),
      beforeStale,
    );
    await page.evaluate(() => {
      auth.currentUser = { uid: "player" };
    });
    await page.locator("[data-resurgence-regain]").click();
    assert.equal(
      await page.evaluate(() => sheetSession.data.adobe.pactSlotsUsed),
      1,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 1);
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
      await page.evaluate(() => sheetSession.data.adobe.pactSlotsUsed),
      1,
    );
    await page.locator("[data-reset-pact]").click();
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.status(sheetSession.data, { level: 8 })
            .usedThisTurn,
      ),
      true,
    );
    await page.locator("[data-reset-slots]").click();
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.status(sheetSession.data, { level: 8 })
            .usedThisTurn,
      ),
      false,
    );
    await page.evaluate(() => {
      CharacterDruidConversions.regain(sheetSession.data, "slot-1", {
        level: 8,
        ownTurn: true,
      });
      selectSheetTab("combat");
    });
    await page.locator("[data-combat-recover=long]").click();
    assert.equal(
      await page.evaluate(
        () =>
          CharacterDruidConversions.status(sheetSession.data, { level: 8 })
            .usedThisTurn,
      ),
      false,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 8).remaining,
      ),
      2,
    );
    await page.evaluate(() => {
      CharacterWildShape.otherUse(sheetSession.data, 8);
      CharacterWildShape.otherUse(sheetSession.data, 8);
      updateSheetCalculations();
      SiteHelp.refresh();
    });
    if (
      !(await page.locator("[data-druid-resurgence]").evaluate((n) => n.open))
    )
      await page.locator("[data-druid-resurgence] > summary").click();
    await page.locator("[data-resurgence-own-turn]").check();
    assert.equal(
      await page.locator("[data-resurgence-regain]").isDisabled(),
      false,
    );
    assert.equal(
      await page.locator("[data-druid-resurgence] .vault-help-badge").count(),
      0,
    );
    assert.match(
      await page
        .locator("[data-resurgence-own-turn]")
        .getAttribute("aria-description"),
      /once on each/,
    );
    await page.locator("[data-druid-resurgence] > summary").focus();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const host = page.locator("[data-druid-resurgence]");
      assert.equal(
        await host.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      assert.equal(
        await page
          .locator("[data-resurgence-regain]")
          .evaluate((n) => n.getBoundingClientRect().height >= 44),
        true,
      );
      await host.screenshot({
        path: out + "/druid-wild-resurgence-" + width + ".png",
      });
    }
    const accessibility = await page.evaluate(async () =>
      axe.run(document.querySelector("[data-druid-resurgence]"), {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      }),
    );
    assert.deepEqual(accessibility.violations, []);
    assert.equal(await page.evaluate(() => wildFetches), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Wild Resurgence ordinary/higher/Pact payments, own-turn gates/reset, conservation, save/reopen, rest/source state, stale account protection, print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
