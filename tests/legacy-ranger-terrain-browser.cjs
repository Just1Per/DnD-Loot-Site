// Source-aware Natural Explorer choices in the existing class builder.
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
      characters[0] = { ...characters[0], class: "Ranger", level: 10 };
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build.edition = "2014";
      d.build.classId = "ranger";
      d.adobe.classLevels = [{ classId: "ranger", level: 10 }];
      d.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    const terrain = page.locator(
      'select[data-choice-group="natural-explorer"]',
    );
    assert.equal(await terrain.count(), 3);
    await terrain.nth(0).selectOption("forest");
    assert.equal(await terrain.nth(0).locator("xpath=..").locator(".sheet-required-marker").count(),0,"a valid terrain is not marked as missing");
    assert.equal(await terrain.nth(1).locator("xpath=..").locator(".sheet-required-marker").count(),1,"the missing terrain has the setup marker");
    await terrain.nth(1).selectOption("coast");
    await terrain.nth(2).selectOption("underdark");
    assert.match(
      await page.locator("[data-natural-explorer]").textContent(),
      /Forest, Coast, Underdark/,
    );
    assert.match(
      await page.locator("[data-natural-explorer-rules]").textContent(),
      /does not add again to Expertise/,
    );
    assert.equal(
      await terrain
        .nth(1)
        .locator('option[value="forest"]')
        .evaluate((n) => n.disabled),
      true,
    );
    assert.equal(await terrain.nth(0).locator('xpath=..').locator('.vault-help-badge').count(),0,'terrain inputs share their header help');
    assert.equal(await terrain.nth(0).locator('option[value=forest]').textContent(),'Forest');
    const terrainRules=page.locator('[data-natural-explorer-rules]');
    assert.equal(await terrainRules.evaluate(n=>n.open),false);assert.ok((await terrainRules.locator('summary').boundingBox()).height>=44);await terrainRules.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await terrainRules.evaluate(n=>n.open),true);await page.keyboard.press('Enter');assert.equal(await terrainRules.evaluate(n=>n.open),false);
    await page.evaluate(async () => {
      await saveCharacterSheet({ reportValidation: false });
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("builder");
    });
    assert.equal(await terrain.nth(2).inputValue(), "underdark");
    await page.evaluate(() => selectSheetTab("overview"));
    assert.match(
      await page.locator("#sheetOverviewReadout").textContent(),
      /Favored terrain: Forest, Coast, Underdark/,
    );
    await page.evaluate(() =>
      CharacterSheetPrint.prepare(new Set(["builder", "combat"])),
    );
    const printed = (await page.locator("#characterSheetPrintSurface").count())
      ? await page.locator("#characterSheetPrintSurface").textContent()
      : await page.locator("[data-paper-section=builder]").textContent();
    assert.match(printed, /Forest, Coast, Underdark/);
    await page.evaluate(() => CharacterSheetPrint.clear());
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2024";
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(await terrain.count(), 0);
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2014";
      sheetSession.data.adobe.classLevels[0].level = 6;
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(await terrain.count(), 2);
    assert.equal(await terrain.nth(1).inputValue(), "coast");
    await page.evaluate(() => {
      sheetSession.data.adobe.classLevels[0].level = 10;
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(await terrain.count(), 3);
    assert.equal(await terrain.nth(2).inputValue(), "underdark");
    await page.evaluate(()=>{sheetSession.data.adobe.classLevels[0].level=1;renderCharacterSheet();selectSheetTab('builder')});
    assert.equal(await terrain.count(),1);assert.equal(await terrain.first().inputValue(),'forest');
    assert.equal(await terrain.first().locator('xpath=..').locator('.sheet-required-marker').count(),0,'inactive higher-level choices do not blame a valid current terrain');
    assert.match(await page.evaluate(()=>CharacterBuildValidation.check(sheetSession.data,CharacterSheetModel.derive(sheetSession.data,sheetSession.identity.level),sheetSession.identity).issues.find(x=>x.groupNotice&&x.message.includes('Natural Explorer'))?.message),/current choices are valid/);
    await page.evaluate(()=>{sheetSession.data.adobe.classLevels[0].level=10;renderCharacterSheet();selectSheetTab('builder')});
    const card = terrain
      .first()
      .locator(
        'xpath=ancestor::article[contains(@class,"sheet-class-choice-card")]',
      );
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await card.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      const a11y = await card.evaluate(async (n) =>
        (
          await axe.run(n, { rules: { "color-contrast": { enabled: false } } })
        ).violations.map((v) => v.id),
      );
      assert.deepEqual(a11y, []);
      await card.screenshot({
        path: out + "/ranger-terrain-" + width + ".png",
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS legacy terrain selections, duplicate prevention, explanation, actual source/levels, inactive retention, save/reopen, Overview/print and responsive/accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
