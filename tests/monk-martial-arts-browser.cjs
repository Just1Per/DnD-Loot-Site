// Automatic base Monk Martial Arts values in the existing action picker.
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
      characters[0] = { ...characters[0], class: "Monk", level: 5 };
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build = {
        ...d.build,
        classId: "monk",
        edition: "2024",
        scoreMode: "final",
      };
      d.abilities = { ...d.abilities, str: 12, dex: 18, wis: 16 };
      d.adobe.classLevels = [{ classId: "monk", level: 5 }];
      d.adobe.classFeatureChoices = {};
      d.actions = [];
      d.equipmentState.loadout = [];
      renderCharacterSheet();
      selectSheetTab("overview");
    });
    await page.locator("#sheetOverviewAddAttack").click();
    await page.locator("#attackKind").selectOption("unarmed");
    assert.match(
      await page.locator("#attackPreview").innerText(),
      /1d8 \+ 4 bludgeoning/,
    );
    assert.match(
      await page.locator("#attackPreview").innerText(),
      /15 \(Dexterity\)/,
    );
    await page.locator("#attackConfirm").click();
    await page.locator("#sheetOverviewAddAttack").click();
    await page.locator("#attackKind").selectOption("weapon");
    await page.locator("#attackRef").selectOption("quarterstaff");
    assert.match(
      await page.locator("#attackPreview").innerText(),
      /1d8 \+ 4 bludgeoning/,
    );
    await page.locator("#attackAbility").selectOption("str");
    assert.match(
      await page.locator("#attackPreview").innerText(),
      /1d8 \+ 1 bludgeoning/,
    );
    await page.locator("#attackAbility").selectOption("auto");
    await page.locator("#attackConfirm").click();
    assert.match(
      await page.locator("[data-monk-martial-arts]").innerText(),
      /1d8/,
    );
    const raw = await page.evaluate(() =>
      JSON.stringify(sheetSession.data.actions),
    );
    await page.evaluate(async () => {
      await saveCharacterSheet({ reportValidation: false });
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("overview");
    });
    assert.equal(
      await page.evaluate(() => JSON.stringify(sheetSession.data.actions)),
      raw,
    );
    assert.equal(
      await page.evaluate(
        () =>
          CharacterSheetModel.derive(sheetSession.data, 5, sheetEquipmentLoot())
            .actions[0].damage,
      ),
      "1d8 + 4 bludgeoning",
    );
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2014";
      renderCharacterSheet();
      selectSheetTab("overview");
    });
    await page.locator('[data-edit-action="0"]').click();
    assert.match(
      await page.locator("#attackPreview").innerText(),
      /1d6 \+ 4 bludgeoning/,
    );
    assert.match(
      await page.locator("#attackPreview").innerText(),
      /after an Attack action/,
    );
    await page.locator("[data-close-attack]").click();
    await page.evaluate(() => {
      sheetSession.data.build.edition = "2024";
      inventory.push({
        id: "monk-test-armor",
        characterId: "c1",
        userId: "player",
        quantity: 1,
        item: { name: "Leather Armor" },
      });
      sheetSession.data.equipmentState.loadout.push({
        id: "monk-test-armor",
        equipped: true,
      });
      renderCharacterSheet();
      selectSheetTab("overview");
    });
    assert.match(
      await page.locator("[data-monk-martial-arts]").innerText(),
      /Remove worn armor/,
    );
    assert.equal(
      await page.evaluate(
        () =>
          CharacterSheetModel.derive(sheetSession.data, 5, sheetEquipmentLoot())
            .actions[0].damage,
      ),
      "2 bludgeoning",
    );
    await page.evaluate(() => {
      sheetSession.data.equipmentState.loadout.find(
        (e) => e.id === "monk-test-armor",
      ).equipped = false;
      sheetSession.identity.level = 17;
      sheetSession.data.adobe.classLevels[0].level = 17;
      renderCharacterSheet();
      selectSheetTab("overview");
    });
    assert.equal(
      await page.evaluate(
        () =>
          CharacterSheetModel.derive(
            sheetSession.data,
            17,
            sheetEquipmentLoot(),
          ).actions[0].damage,
      ),
      "1d12 + 4 bludgeoning",
    );
    const printed = await page.evaluate(() => {
      CharacterSheetPrint.prepare(new Set(["combat"]));
      const text = document.querySelector(
        "[data-paper-section=combat]",
      ).textContent;
      CharacterSheetPrint.clear();
      return text;
    });
    assert.match(printed, /1d12 \+ 4 bludgeoning/);
    assert.match(printed, /Martial Arts 1d12/);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const text = page.locator("[data-monk-martial-arts]");
      await text.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        SiteHelp.hide();
        document.activeElement?.blur();
      });
      assert.equal(
        await text.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      await text.screenshot({
        path: out + "/monk-martial-arts-" + width + ".png",
      });
    }
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector("#sheetOverviewReadout"), {
            rules: { "color-contrast": { enabled: false } },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS real Monk unarmed/weapon picker, automatic and explicit ability, saved references, source editions, armor suppression/recovery, level17 die, print, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
