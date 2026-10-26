// Cleric Divine Intervention: both editions, recovery and private-sheet integration.
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
      characters[0].level = 20;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build = {
        ...d.build,
        edition: "2024",
        classId: "cleric",
        scoreMode: "final",
      };
      d.abilities.wis = 16;
      d.adobe.classLevels = [{ classId: "cleric", level: 20 }];
      d.adobe.classFeatureChoices = { "keep:choice": ["saved"] };
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    const box = page.locator("[data-cleric-intervention]");
    await page.evaluate(() => SiteHelp.refresh());
    await box.locator('button[aria-label="Help: Divine Intervention"]').click();
    assert.match(
      await page.locator("#vaultContextHelp").innerText(),
      /campaign days/,
    );
    await box.locator('button[aria-label="Help: Divine Intervention"]').click();
    await box.locator(":scope > details > summary").click();
    assert.equal(
      await box.locator("[data-intervention-use]").isDisabled(),
      true,
    );
    const revivify = await page.evaluate(() =>
      __testCatalog.spells
        .find((s) => s.name === "Revivify" && s.edition === "2024")
        .id.toLowerCase(),
    );
    await box.locator("[data-intervention-spell]").selectOption(revivify);
    assert.match(
      await box.locator("[data-intervention-detail]").innerText(),
      /Revivify.*Material components or spell slot/,
    );
    await box.locator("[data-intervention-info]").click();
    assert.match(
      await page.locator("#sheetSpellInformation").innerText(),
      /Revivify/,
    );
    await page.evaluate(() =>
      document.getElementById("sheetSpellInformation").close(),
    );
    const pools = await page.evaluate(() =>
      JSON.stringify({
        slots: sheetSession.data.slots,
        pact: sheetSession.data.adobe.pactSlotsUsed,
        hp: sheetSession.data.hpCurrent,
        spells: sheetSession.data.spells,
      }),
    );
    await box.locator("[data-intervention-confirm]").check();
    await box.locator("[data-intervention-use]").click();
    assert.match(await box.innerText(), /1 completed Long Rest remaining/);
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          slots: sheetSession.data.slots,
          pact: sheetSession.data.adobe.pactSlotsUsed,
          hp: sheetSession.data.hpCurrent,
          spells: sheetSession.data.spells,
        }),
      ),
      pools,
    );
    await page.evaluate(async () => {
      await saveCharacterSheet();
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("combat");
    });
    assert.match(await box.innerText(), /1 completed Long Rest remaining/);
    await page.locator('[data-combat-recover="short"]').click();
    assert.match(await box.innerText(), /1 completed Long Rest remaining/);
    await page.locator('[data-combat-recover="long"]').click();
    assert.match(await box.innerText(), /Ready/);
    if (!(await box.locator(":scope > details").evaluate((e) => e.open)))
      await box.locator(":scope > details > summary").click();
    await box
      .locator("[data-intervention-spell]")
      .selectOption("spell-xphb-091e606752615c91");
    await box.locator("[data-intervention-confirm]").check();
    assert.equal(
      await box.locator("[data-intervention-use]").isDisabled(),
      true,
    );
    await box.locator("[data-intervention-rests]").fill("4");
    await box.locator("[data-intervention-use]").click();
    assert.match(await box.innerText(), /4 completed Long Rests/);
    await page.locator('[data-combat-recover="long"]').click();
    assert.match(await box.innerText(), /3 completed Long Rests/);
    await page.evaluate(() => {
      selectSheetTab("spells");
    });
    await page.locator("[data-reset-slots]").click();
    await page.evaluate(() => selectSheetTab("combat"));
    assert.match(await box.innerText(), /2 completed Long Rests/);
    const print = await page.evaluate(
      () => (
        CharacterSheetPrint.prepare(new Set(["combat"])),
        document.querySelector('[data-paper-section="combat"]').textContent
      ),
    );
    assert.match(print, /Divine Intervention.*2 completed Long Rests/s);
    await page.evaluate(() => CharacterSheetPrint.clear());
    // A retained handler must not mutate another actor’s sheet after account changes.
    await page.evaluate(() => {
      window.retainedInterventionDay = null;
      sheetSession.data.build.edition = "2014";
      sheetSession.data.adobe.classFeatureChoices["2014:cleric:intervention"] =
        [];
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    await box.locator(":scope > details > summary").click();
    assert.match(await box.innerText(), /automatic success/i);
    await box.locator("[data-intervention-confirm]").check();
    await box.locator("[data-intervention-use]").click();
    assert.match(await box.innerText(), /7 campaign days/);
    await page.locator('[data-combat-recover="long"]').click();
    assert.match(await box.innerText(), /7 campaign days/);
    assert.equal(
      await box.locator("[data-intervention-day]").isDisabled(),
      true,
    );
    await box.locator("[data-intervention-day-confirm]").check();
    await box.locator("[data-intervention-day]").click();
    assert.match(await box.innerText(), /6 campaign days/);
    assert.equal(
      await box.locator("[data-intervention-day]").isDisabled(),
      true,
    );
    await box.locator("[data-intervention-day-confirm]").check();
    assert.equal(
      await page.evaluate(() => {
        const b = document.querySelector("[data-intervention-day]");
        const original = auth.currentUser.uid;
        const before = JSON.stringify(sheetSession.data);
        auth.currentUser.uid = "other";
        b.onclick();
        auth.currentUser.uid = original;
        return before === JSON.stringify(sheetSession.data);
      }),
      true,
    );
    await page.evaluate(async () => {
      await saveCharacterSheet();
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("combat");
    });
    assert.match(await box.innerText(), /6 campaign days/);
    // Level-10 legacy percentile form and explicit failure recovery.
    await page.evaluate(() => {
      sheetSession.identity.level = 10;
      sheetSession.data.adobe.classLevels = [{ classId: "cleric", level: 10 }];
      sheetSession.data.adobe.classFeatureChoices["2014:cleric:intervention"] =
        [];
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    await box.locator(":scope > details > summary").click();
    await box.locator("[data-intervention-roll]").fill("100");
    await box.locator("[data-intervention-confirm]").check();
    await box.locator("[data-intervention-use]").click();
    assert.match(await box.innerText(), /1 completed Long Rest/);
    await page.locator('[data-combat-recover="long"]').click();
    // Leave a full, selected modern form for visual checks.
    await page.evaluate(() => {
      sheetSession.identity.level = 20;
      sheetSession.data.adobe.classLevels = [{ classId: "cleric", level: 20 }];
      sheetSession.data.build.edition = "2024";
      sheetSession.data.adobe.classFeatureChoices["2024:cleric:intervention"] =
        [];
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    await box.locator(":scope > details > summary").click();
    await box.locator("[data-intervention-spell]").selectOption(revivify);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await box.scrollIntoViewIfNeeded();
      assert.equal(
        await box.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      const bounds = await box.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
      await box.screenshot({
        path: out + "/cleric-divine-intervention-" + width + ".png",
      });
    }
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector("[data-cleric-intervention]"), {
            rules: { "color-contrast": { enabled: false } },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Divine Intervention spell information, slot preservation, source-specific recovery, Wish countdown once per rest, legacy days/percentile, stale auth, save/reopen, print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
