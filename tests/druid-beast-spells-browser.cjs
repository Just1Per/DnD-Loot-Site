// Beast Spells component status in both Druid editions and legacy Archdruid.
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
      characters[0].level = 18;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      window.beastSeed = (edition, level, active = true) => {
        const d = sheetSession.data;
        sheetSession.identity.level = level;
        d.build = { ...d.build, edition, classId: "druid", scoreMode: "final" };
        d.abilities.wis = 16;
        d.hpCurrent = 30;
        d.adobe.pages.companion = true;
        d.adobe.pages.spells = true;
        d.adobe.classLevels = [{ classId: "druid", level }];
        d.adobe.classFeatureChoices = {};
        d.spells = ["Guidance", "Goodberry", "Revivify"].map((name) => ({
          ...CharacterCatalog.spellRow(
            __testCatalog.spells.find(
              (s) => s.edition === edition && s.name === name,
            ),
          ),
          classId: "druid",
        }));
        const id = "srd-" + edition + "-wolf";
        if (edition === "2024") CharacterWildShape.setKnown(d, 0, id, level);
        if (active && !CharacterWildShape.assume(d, id, { seen: true, level }))
          throw Error("Could not activate test Wild Shape");
        renderCharacterSheet();
        selectSheetTab("companion");
      };
      await CharacterWildShapeUI.load();
      beastSeed("2024", 18);
    });
    assert.match(
      await page.locator(".sheet-wild-spellcasting").innerText(),
      /costly or consumed/,
    );
    await page.locator("[data-wild-spells]").click();
    assert.equal(await page.locator("#sheet-spells").isVisible(), true);
    const spellRow = (name) =>
      page
        .locator("[data-class-spell-index]")
        .filter({
          has: page.locator(".sheet-class-spell-name > strong", {
            hasText: name,
          }),
        });
    assert.match(
      await spellRow("Goodberry").innerText(),
      /Permitted by Beast Spells/,
    );
    assert.match(
      await spellRow("Revivify").innerText(),
      /Costly Material component/,
    );
    assert.equal(
      await spellRow("Goodberry")
        .locator("[data-beast-spell-status]")
        .getAttribute("data-beast-spell-status"),
      "allowed",
    );
    assert.equal(
      await spellRow("Revivify")
        .locator("[data-beast-spell-status]")
        .getAttribute("data-beast-spell-status"),
      "blocked",
    );
    await spellRow("Revivify").locator("[data-generated-spell-info]").click();
    assert.match(
      await page
        .locator("#sheetSpellInformation [data-spell-component-rule]")
        .innerText(),
      /Costly Material component/,
    );
    await page.locator("#sheetSpellInformation button").click();
    const before = await page.evaluate(() =>
      JSON.stringify({
        spells: sheetSession.data.spells,
        slots: sheetSession.data.slots,
      }),
    );
    await page.evaluate(() => {
      selectSheetTab("companion");
      CharacterWildShape.end(sheetSession.data, 18);
      renderCharacterSheet();
      selectSheetTab("spells");
    });
    assert.equal(await page.locator("[data-beast-spell-status]").count(), 0);
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          spells: sheetSession.data.spells,
          slots: sheetSession.data.slots,
        }),
      ),
      before,
    );
    await page.evaluate(() => beastSeed("2014", 18));
    await page.locator("[data-wild-spells]").click();
    assert.match(
      await spellRow("Guidance").innerText(),
      /Permitted by Beast Spells/,
    );
    assert.match(
      await spellRow("Goodberry").innerText(),
      /Material component unavailable/,
    );
    await page.evaluate(() => beastSeed("2014", 20, false));
    await page.evaluate(() => selectSheetTab("spells"));
    assert.match(
      await spellRow("Goodberry").innerText(),
      /Components waived · Archdruid/,
    );
    assert.match(
      await spellRow("Revivify").innerText(),
      /Provide costly Material component/,
    );
    await page.evaluate(async () => {
      await saveCharacterSheet();
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("spells");
    });
    assert.match(
      await spellRow("Goodberry").innerText(),
      /Components waived · Archdruid/,
    );
    const printed = await page.evaluate(() => {
      CharacterSheetPrint.prepare(new Set(["spells"]));
      const text = document.querySelector(
        "[data-paper-section=spells]",
      ).textContent;
      CharacterSheetPrint.clear();
      return text;
    });
    assert.match(printed, /Components waived · Archdruid/);
    assert.match(printed, /Provide costly Material component/);
    await page.evaluate(() => beastSeed("2014", 20));
    assert.match(
      await page.locator(".sheet-wild-spellcasting").innerText(),
      /normal form or Wild Shape/,
    );
    const formPrinted = await page.evaluate(() =>
      CharacterWildShapeUI.print(
        sheetSession.data,
        CharacterSheetModel.derive(
          sheetSession.data,
          sheetSession.identity.level,
        ),
      ),
    );
    assert.match(formPrinted, /Archdruid/);
    // These are derived reminders; reviewing, printing and changing tabs never spends slots or changes spells.
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const box = page.locator(".sheet-wild-spellcasting");
      await box.scrollIntoViewIfNeeded();
      assert.equal(
        await box.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      await box.screenshot({
        path: out + "/druid-beast-spells-" + width + ".png",
      });
    }
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector(".sheet-wild-spellcasting"), {
            rules: { "color-contrast": { enabled: false } },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Beast Spells both editions, ordinary/costly materials, legacy Archdruid in both forms, spell information, linked navigation, derived-only state, save/reopen, print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
