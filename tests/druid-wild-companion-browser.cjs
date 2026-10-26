// Wild Companion lifecycle, independent resources and asynchronous sheet context.
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
            if (window.holdWildFetch)
              await new Promise(
                (resolve) => (window.releaseWildFetch = resolve),
              );
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
      characters[0].level = 2;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build.edition = "2024";
      d.build.classId = "druid";
      d.hpCurrent = 20;
      d.hpTemp = 7;
      d.adobe.classLevels = [{ classId: "druid", level: 2 }];
      d.adobe.classFeatureChoices = {};
      d.adobe.companions[0].type = "familiar";
      d.adobe.companions[0].name = "Existing reference";
      d.adobe.companions[0].notes = "Keep these private notes";
      renderCharacterSheet();
      selectSheetTab("combat");
    });
    const originals = await page.evaluate(() =>
      JSON.stringify({
        hp: sheetSession.data.hpCurrent,
        temp: sheetSession.data.hpTemp,
        cards: sheetSession.data.adobe.companions,
      }),
    );
    assert.equal(await page.evaluate(() => wildFetches), 0);
    await page.evaluate(() => (failWildFetch = true));
    await page.locator("[data-open-wild-companion]").click();
    await page.waitForSelector("[data-wc-load]:not([disabled])");
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 2).remaining,
      ),
      2,
    );
    await page.evaluate(() => {
      failWildFetch = false;
      window.holdWildFetch = true;
    });
    await page.locator("[data-wc-load]").click();
    await page.waitForFunction(
      () => typeof window.releaseWildFetch === "function",
    );
    await page.evaluate(() => {
      window.pendingActor = sheetSession;
      window.pendingActorSnapshot = JSON.stringify(sheetSession.data);
      sheetSession = {
        ...sheetSession,
        data: structuredClone(sheetSession.data),
      };
      renderCharacterSheet();
      selectSheetTab("companion");
      window.holdWildFetch = false;
      window.releaseWildFetch();
    });
    await page.waitForSelector("[data-wc-form]");
    assert.equal(
      await page.evaluate(() => JSON.stringify(pendingActor.data)),
      await page.evaluate(() => pendingActorSnapshot),
    );
    assert.equal(await page.evaluate(() => wildFetches), 2);
    await page.locator("[data-wc-form]").selectOption("srd-2024-owl");
    assert.equal(await page.locator("[data-wc-summon]").isDisabled(), true);
    await page.locator("[data-wc-confirm]").check();
    await page.locator("[data-wc-summon]").click();
    assert.match(
      await page.locator(".sheet-wc-card").textContent(),
      /Owl.*Familiar HP/s,
    );
    assert.match(
      await page.locator(".sheet-wc-card").textContent(),
      /cannot attack/,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 2).remaining,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          hp: sheetSession.data.hpCurrent,
          temp: sheetSession.data.hpTemp,
          cards: sheetSession.data.adobe.companions,
        }),
      ),
      originals,
    );
    await page.locator("[data-wc-health] > summary").click();
    await page.locator("[data-wc-max]").fill("8");
    await page.locator("[data-wc-max]").dispatchEvent("change");
    await page.locator("[data-wc-hp]").fill("6");
    await page.locator("[data-wc-hp]").dispatchEvent("change");
    await page.locator("[data-wc-temp]").fill("2");
    await page.locator("[data-wc-temp]").dispatchEvent("change");
    await page.locator("[data-wc-amount]").fill("3");
    await page.locator("[data-wc-damage]").click();
    assert.equal(await page.locator("[data-wc-hp]").inputValue(), "5");
    assert.equal(await page.locator("[data-wc-temp]").inputValue(), "0");
    assert.equal(
      await page.locator("[data-wc-health]").evaluate((n) => n.open),
      true,
    );
    await page.locator("[data-wc-presence=pocket]").click();
    assert.match(
      await page.locator(".sheet-wc-card").textContent(),
      /In pocket dimension/,
    );
    await page.locator("[data-wc-presence=return]").click();
    await page.locator("#sheetSave").click();
    await page.waitForFunction(
      () => !sheetSession.saving && !sheetSession.dirty,
    );
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("companion");
    });
    assert.equal(await page.locator("[data-wc-hp]").inputValue(), "5");
    assert.equal(await page.locator("[data-wc-max]").inputValue(), "8");
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 2).remaining,
      ),
      1,
    );
    await page.locator("[data-wc-presence=dismiss]").click();
    assert.equal(await page.locator("#siteConfirmationDialog").count(), 1);
    await page.locator("[data-site-cancel]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      true,
    );
    const recordBefore = await page.evaluate(() =>
      JSON.stringify(sheetSession.data.adobe.classFeatureChoices),
    );
    await page.locator("[data-wc-presence=dismiss]").click();
    await page.evaluate(() => {
      auth.currentUser = { uid: "other" };
    });
    await page.locator("[data-site-confirm]").click();
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify(sheetSession.data.adobe.classFeatureChoices),
      ),
      recordBefore,
    );
    await page.evaluate(() => {
      auth.currentUser = { uid: "player" };
    });
    await page.evaluate(() =>
      CharacterSheetPrint.prepare(new Set(["companion"])),
    );
    assert.match(
      await page.locator("[data-paper-section=companion]").textContent(),
      /Wild Companion.*Owl.*Fey familiar/s,
    );
    assert.match(
      await page.locator("[data-paper-section=companion]").textContent(),
      /cannot attack/,
    );
    await page.evaluate(() => CharacterSheetPrint.clear());
    await page.evaluate(() => SiteHelp.refresh());
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page
          .locator("#sheetDruidWildCompanion")
          .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        true,
      );
      assert.equal(
        await page
          .locator("[data-wc-presence=pocket]")
          .evaluate((n) => n.getBoundingClientRect().height >= 44),
        true,
      );
      assert.equal(
        await page
          .locator("#sheetDruidWildCompanion .sheet-field .vault-help-badge")
          .count(),
        0,
      );
      await page
        .locator("#sheetDruidWildCompanion")
        .screenshot({ path: out + "/druid-wild-companion-" + width + ".png" });
    }
    const accessibility = await page.evaluate(async () =>
      (
        await axe.run(document.querySelector("#sheetDruidWildCompanion"), {
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
    await page.locator("[data-wc-rest]").click();
    await page.locator("[data-site-confirm]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      false,
    );
    assert.match(
      await page.locator(".sheet-wc-card").textContent(),
      /Gone after Long Rest/,
    );
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 2).remaining,
      ),
      1,
    );
    await page.locator("[data-wc-options] > summary").click();
    await page.locator("[data-wc-payment]").selectOption("slot-1");
    await page.locator("[data-wc-confirm]").check();
    await page.locator("[data-wc-summon]").click();
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 1);
    assert.equal(
      await page.evaluate(
        () => CharacterWildShape.state(sheetSession.data, 2).remaining,
      ),
      1,
    );
    await page.evaluate(() => selectSheetTab("spells"));
    await page.locator("[data-reset-slots]").click();
    await page.evaluate(() => selectSheetTab("companion"));
    assert.equal(
      await page.evaluate(
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      false,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 0);
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({
          hp: sheetSession.data.hpCurrent,
          temp: sheetSession.data.hpTemp,
          cards: sheetSession.data.adobe.companions,
        }),
      ),
      originals,
    );
    await page.evaluate(() => {
      sheetSession.identity.level = 5;
      sheetSession.data.adobe.classLevels = [
        { classId: "druid", level: 2 },
        { classId: "warlock", level: 3 },
      ];
      renderCharacterSheet();
      selectSheetTab("companion");
    });
    if (!(await page.locator("[data-wc-options]").evaluate((n) => n.open)))
      await page.locator("[data-wc-options] > summary").click();
    await page.locator("[data-wc-payment]").selectOption("pact");
    await page.locator("[data-wc-confirm]").check();
    await page.locator("[data-wc-summon]").click();
    assert.equal(
      await page.evaluate(() => sheetSession.data.adobe.pactSlotsUsed),
      1,
    );
    assert.equal(await page.evaluate(() => sheetSession.data.slots[0].used), 0);
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
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      true,
    );
    await page.evaluate(() => selectSheetTab("combat"));
    await page.locator("[data-combat-recover=long]").click();
    assert.equal(
      await page.evaluate(
        () => CharacterWildCompanion.state(sheetSession.data).alive,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Wild Companion form/payment, familiar-only HP/max/temp, pocket return, save/reopen, confirmation, one-familiar acknowledgement, manual-card/owner preservation, print, long-rest expiry, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
