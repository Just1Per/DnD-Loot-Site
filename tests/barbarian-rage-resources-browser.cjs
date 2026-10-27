// Barbarian Rage uses in the existing feature-resource panel.
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
      characters[0] = { ...characters[0], class: "Barbarian", level: 15 };
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      sheetSession.data.build = {
        ...sheetSession.data.build,
        classId: "barbarian",
        edition: "2024",
        scoreMode: "final",
      };
      sheetSession.data.adobe.classLevels = [
        { classId: "barbarian", level: 15 },
      ];
      sheetSession.data.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    const pool = page.locator('output[aria-label="Rage uses remaining"]'),
      use = page.locator(
        '[data-class-resource="barbarian-rage"][data-delta="1"]',
      ),
      undo = page.locator(
        '[data-class-resource="barbarian-rage"][data-delta="-1"]',
      );
    assert.equal(await pool.textContent(), "5 / 5");
    assert.equal(await undo.isDisabled(), true);
    const originalHP = await page.evaluate(() => sheetSession.data.hpCurrent);
    await use.click();
    await use.click();
    assert.equal(await pool.textContent(), "3 / 5");
    await page.locator('[data-combat-recover="short"]').click();
    assert.equal(await pool.textContent(), "4 / 5");
    await page.locator("[data-rage-initiative]").click();
    assert.equal(await pool.textContent(), "5 / 5");
    assert.equal(await use.evaluate(n=>n===document.activeElement),true,"recovery retains useful keyboard focus");
    assert.equal(
      await page.locator("[data-rage-initiative]").isDisabled(),
      true,
    );
    await use.click();
    await page.evaluate(async () => {
      await saveCharacterSheet({ reportValidation: false });
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("combat");
    });
    assert.equal(await pool.textContent(), "4 / 5");
    assert.equal(
      await page.locator("[data-rage-initiative]").isDisabled(),
      true,
    );
    const rules = page.locator('[data-resource-rules="barbarian-rage"]');
    await rules.locator("summary").click();
    assert.match(await rules.textContent(), /without extending each round/);
    assert.match(await rules.textContent(), /cannot cast spells/);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const resource = page
        .locator(".sheet-class-resource")
        .filter({ has: pool });
      assert.equal(
        await resource.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      await resource.screenshot({
        path: out + "/barbarian-rage-" + width + ".png",
      });
    }
    const a11y = await page.evaluate(async () =>
      (
        await axe.run("#sheetFeatResources", {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations.map((v) => v.id),
    );
    assert.deepEqual(a11y, []);
    await page.locator('[data-combat-recover="long"]').click();
    assert.equal(await pool.textContent(), "5 / 5");
    await use.click();
    assert.equal(
      await page.locator("[data-rage-initiative]").isDisabled(),
      false,
    );
    const printed = await page.evaluate(() => {
      CharacterSheetPrint.prepare(new Set(["combat"]));
      const text = document.querySelector(
        "[data-paper-section=combat]",
      ).textContent;
      CharacterSheetPrint.clear();
      return text;
    });
    assert.match(printed, /Rage/);
    assert.match(printed, /4 \/ 5 uses/);
    assert.match(printed, /Resistance to Bludgeoning/);
    assert.equal(
      await page.evaluate(() => sheetSession.data.hpCurrent),
      originalHP,
    );
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2014";
      sheetSession.data.adobe.classLevels = [
        { classId: "barbarian", level: 20 },
      ];
      sheetSession.identity.level = 20;
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    assert.equal(await pool.textContent(), "Unlimited");
    assert.equal(await use.count(), 0);
    assert.equal(await page.locator("[data-rage-initiative]").count(), 0);
    await page.evaluate(() => {
      sheetSession.data.adobe.classLevels = [
        { classId: "barbarian", level: 1 },
      ];
      sheetSession.identity.level = 1;
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    assert.equal(await pool.textContent(), "2 / 2");
    await use.click();
    assert.equal(await pool.textContent(), "1 / 2");
    assert.equal(
      await page.locator('[data-combat-recover="short"]').count(),
      0,
    );
    await undo.click();
    assert.equal(await pool.textContent(), "2 / 2");
    assert.deepEqual(errors, []);
    console.log(
      "PASS Rage spend/undo, actual source/level, optional Persistent Rage recovery, rest limits, save/reopen, legacy unlimited, HP isolation, print and responsive/accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
