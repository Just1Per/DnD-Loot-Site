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
      characters[0].level = 4;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build.edition = "2014";
      d.build.scoreMode = "final";
      d.build.classId = "druid";
      d.abilities.wis = 16;
      d.abilities.con = 14;
      d.hpCurrent = 28;
      d.hpMax = 35;
      d.adobe.classLevels = [{ classId: "druid", level: 4 }];
      d.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    assert.equal(
      await page.evaluate(() => wildFetches),
      0,
      "catalogue is deferred",
    );
    await page.evaluate(() => {
      failWildFetch = true;
    });
    await page.locator("[data-open-wild-shape]").click();
    await page.waitForSelector("[data-wild-load]:not([disabled])");
    assert.match(
      await page.locator("#sheetDruidWildShape").textContent(),
      /unavailable/,
    );
    await page.evaluate(() => {
      failWildFetch = false;
    });
    await page.locator("[data-wild-load]").click();
    await page.waitForSelector("[data-wild-form]");
    assert.equal(await page.evaluate(() => wildFetches), 2);
    await page.locator("[data-wild-form]").selectOption("srd-2014-wolf");
    await page.locator("[data-wild-seen]").check();
    await page.locator("[data-wild-assume]").click();
    await page.waitForSelector(".sheet-wild-card");
    assert.match(await page.locator(".sheet-wild-card").textContent(), /Wolf/);
    assert.equal(await page.evaluate(() => sheetSession.data.hpCurrent), 28);
    await page.locator("[data-wild-health] > summary").click();
    await page.locator("[data-wild-amount]").fill("4");
    await page.locator("[data-wild-damage]").click();
    assert.equal(await page.locator("[data-wild-hp]").inputValue(), "7");
    assert.equal(
      await page.locator("[data-wild-health]").evaluate((n) => n.open),
      true,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("companion");
    });
    assert.equal(await page.locator("[data-wild-hp]").inputValue(), "7");
    await page.locator("[data-wild-health] > summary").click();
    await page.locator("[data-wild-amount]").fill("10");
    await page.locator("[data-wild-damage]").click();
    assert.equal(await page.locator(".sheet-wild-card").count(), 0);
    assert.equal(await page.evaluate(() => sheetSession.data.hpCurrent), 25);
    const original = await page.evaluate(() => ({
      abilities: structuredClone(sheetSession.data.abilities),
      equipment: structuredClone(sheetSession.data.equipmentState),
    }));
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2024";
      sheetSession.data.hpCurrent = 28;
      sheetSession.data.hpTemp = 9;
      sheetSession.data.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("companion");
    });
    assert.equal(await page.locator("[data-wild-assume]").isDisabled(), true);
    await page.locator("[data-wild-recommended]").click();
    assert.equal(await page.locator("[data-wild-known-slot]").count(), 6);
    await page.locator("[data-wild-form]").selectOption("srd-2024-wolf");
    await page.locator("[data-wild-assume]").click();
    assert.equal(await page.locator("[data-wild-hp]").inputValue(), "28");
    assert.equal(await page.locator("[data-wild-temp]").inputValue(), "9");
    assert.match(await page.locator(".sheet-wild-vitals").textContent(), /12/);
    if (!(await page.locator("[data-wild-health]").evaluate((n) => n.open)))
      await page.locator("[data-wild-health] > summary").click();
    await page.locator("[data-wild-amount]").fill("12");
    await page.locator("[data-wild-damage]").click();
    assert.equal(await page.locator("[data-wild-hp]").inputValue(), "25");
    assert.equal(await page.locator("[data-wild-temp]").inputValue(), "0");
    await page.evaluate(() =>
      CharacterSheetPrint.prepare(new Set(["companion"])),
    );
    assert.match(
      await page.locator("[data-paper-section=companion]").textContent(),
      /Active Wild Shape.*Wolf/s,
    );
    assert.ok(
      (
        await page.locator("[data-paper-section=companion]").textContent()
      ).includes(
        "HP 25 / " +
          (await page.evaluate(
            () =>
              CharacterSheetModel.derive(
                sheetSession.data,
                4,
                sheetEquipmentLoot(),
              ).hpMax,
          )),
      ),
    );
    await page.evaluate(() => CharacterSheetPrint.clear());
    await page.locator("[data-wild-end]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.hpCurrent), 25);
    assert.equal(
      await page
        .locator('[aria-label="Wild Shape uses remaining"]')
        .first()
        .textContent(),
      "1 / 2",
    );
    await page.evaluate(() => selectSheetTab("combat"));
    await page.locator("[data-combat-recover=short]").click();
    await page.locator("[data-open-wild-shape]").click();
    assert.equal(
      await page
        .locator(
          '#sheetDruidWildShape [aria-label="Wild Shape uses remaining"]',
        )
        .textContent(),
      "2 / 2",
    );
    assert.equal(await page.evaluate(() => wildFetches), 2);
    await page.locator("[data-wild-assume]").click();
    await page.evaluate(() => {
      sheetSession.data.conditions = "Stunned";
      updateSheetCalculations();
    });
    assert.equal(await page.locator(".sheet-wild-card").count(), 0);
    await page.evaluate(() => {
      sheetSession.data.conditions = "";
      updateSheetCalculations();
    });
    assert.equal(await page.locator(".sheet-wild-card").count(), 0);
    assert.deepEqual(
      await page.evaluate(() => ({
        abilities: structuredClone(sheetSession.data.abilities),
        equipment: structuredClone(sheetSession.data.equipmentState),
      })),
      original,
    );
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2024";
      sheetSession.data.adobe.classLevels = [
        { classId: "druid", level: 3, subclassId: "moon-2024" },
        { classId: "monk", level: 1 },
      ];
      sheetSession.data.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("companion");
    });
    await page.locator("[data-wild-recommended]").click();
    await page.locator("[data-wild-form]").selectOption("srd-2024-wolf");
    await page.locator("[data-wild-assume]").click();
    assert.equal(await page.locator("[data-wild-temp]").inputValue(), "9");
    assert.match(await page.locator(".sheet-wild-vitals").textContent(), /16/);
    await page.evaluate(() => {
      sheetSession.data.adobe.classLevels[0].subclassId = "";
      updateSheetCalculations();
    });
    assert.match(await page.locator(".sheet-wild-vitals").textContent(), /15/);
    await page.evaluate(() => {
      sheetSession.data.adobe.classLevels[0].subclassId = "moon-2024";
      updateSheetCalculations();
    });
    assert.match(await page.locator(".sheet-wild-vitals").textContent(), /16/);
    assert.equal(
      await page.locator("[data-wild-change]").evaluate((n) => n.open),
      false,
    );
    assert.equal(
      await page
        .locator(".sheet-wild-card")
        .evaluate(
          (n) =>
            !!(
              n.compareDocumentPosition(
                document.querySelector(".sheet-wild-setup"),
              ) & Node.DOCUMENT_POSITION_FOLLOWING
            ),
        ),
      true,
    );
    await page.evaluate(() => SiteHelp.refresh());
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page
          .locator("#sheetDruidWildShape")
          .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
        "form card fits " + width,
      );
      assert.equal(
        await page
          .locator("[data-wild-end]")
          .evaluate((n) => n.getBoundingClientRect().height >= 44),
        true,
      );
      assert.equal(
        await page
          .locator("#sheetDruidWildShape .sheet-field .vault-help-badge")
          .count(),
        0,
      );
      await page
        .locator("#sheetDruidWildShape")
        .screenshot({ path: out + "/druid-wild-shape-" + width + ".png" });
    }
    const accessibility = await page.evaluate(async () =>
      (
        await axe.run(document.querySelector("#sheetDruidWildShape"), {
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
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      sheetSession.identity.level = 20;
      sheetSession.data.build.edition = "2014";
      sheetSession.data.adobe.classLevels = [{ classId: "druid", level: 20 }];
      sheetSession.data.adobe.classFeatureChoices = {};
      renderCharacterSheet();
      selectSheetTab("overview");
    });
    assert.match(
      await page.locator("#sheetOverviewReadout").textContent(),
      /Wild Shape: Unlimited uses/,
    );
    assert.doesNotMatch(
      await page.locator("#sheetOverviewReadout").textContent(),
      /Infinity/,
    );
    await page.evaluate(() => selectSheetTab("combat"));
    assert.equal(
      await page
        .locator('#sheetFeatResources [aria-label="Wild Shape uses remaining"]')
        .textContent(),
      "Unlimited",
    );
    await page.locator("[data-open-wild-shape]").click();
    await page.locator("[data-wild-form]").selectOption("srd-2014-brown-bear");
    await page.locator("[data-wild-seen]").check();
    await page.locator("[data-wild-assume]").click();
    await page.evaluate(() =>
      CharacterSheetPrint.prepare(new Set(["companion", "combat"])),
    );
    assert.match(
      await page.locator("[data-paper-section=combat]").textContent(),
      /Unlimited/,
    );
    assert.doesNotMatch(
      await page.locator("[data-paper-section=combat]").textContent(),
      /Infinity/,
    );
    await page.emulateMedia({ media: "print" });
    assert.equal(
      await page
        .locator(".sheet-paper-wild-shape .sheet-paper-text")
        .first()
        .evaluate((n) => getComputedStyle(n).whiteSpace),
      "pre-wrap",
    );
    assert.match(
      await page.locator(".sheet-paper-wild-shape").textContent(),
      /Brown Bear/,
    );
    await page.evaluate(() => CharacterSheetPrint.clear());
    await page.emulateMedia({ media: "screen" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS Wild Shape lazy loading/retry, legacy HP/overflow, save/reopen, revised known forms and nonstacking temporary HP, normal data preservation, Moon/multiclass, condition reversion, source rest recovery, print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
