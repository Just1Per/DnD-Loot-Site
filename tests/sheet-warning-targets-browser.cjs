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
      characters[0].level = 4;
      testSheetDocs["campaigns/a/characters/c1"] = { ...characters[0] };
      await openCharacterSheet("c1");
      const d = sheetSession.data;
      d.build = {
        ...d.build,
        edition: "2024",
        race: "human-2024",
        classId: "fighter",
        background: "",
        backgroundFeat: "Tough",
        humanOriginFeat: "Skilled",
        raceSkills: ["arcana", ""],
        classSkills: ["athletics", "perception", "history", "survival"],
        backgroundAbilities: ["str", "con", ""],
        standardLanguages: ["Elvish", "Orc"],
        humanFeatChoices: ["", "", ""],
      };
      d.adobe.classLevels = [{ classId: "fighter", level: 4 }];
      renderCharacterSheet();
      selectSheetTab("builder");
    });
    assert.equal(
      await page.evaluate(
        () => CharacterSheetModel.derive(sheetSession.data, 4).effects.size,
      ),
      "Medium",
    );
    assert.ok(
      !(await page.locator("#sheetOverviewReadout").textContent()).includes(
        "Choose Small or Medium",
      ),
    );
    const classSkill = page.locator('[name="build.classSkills.0"]');
    assert.equal(await classSkill.inputValue(), "athletics");
    assert.equal(
      await page.locator("#sheetClassSkills .sheet-required-marker").count(),
      0,
      "Skilled must not accuse already completed class fields",
    );
    await page.evaluate(() => selectSheetTab("overview"));
    const fix = page
      .locator(".sheet-overview-important-row")
      .filter({
        hasText: "Choose three distinct untrained skills/tools for Skilled.",
      })
      .locator("[data-build-warning-tab]");
    assert.equal(
      await fix.count(),
      1,
      "one useful setup notice, not two different locations for the same error",
    );
    await fix.click();
    assert.equal(
      await page
        .locator('[data-sheet-tab="feats"]')
        .getAttribute("aria-selected"),
      "true",
    );
    const pick = (index) =>
      page.locator(
        '[data-build-feat-array="humanFeatChoices"][data-build-feat-index="' +
          index +
          '"]',
      );
    assert.equal(
      await pick(0).evaluate((el) => el === document.activeElement),
      true,
    );
    assert.match(await page.locator("#sheetStatus").textContent(), /Skilled/);
    for (const index of [0, 1, 2]) {
      const marker = pick(index)
        .locator("xpath=..")
        .locator(".sheet-required-marker");
      assert.equal(await marker.count(), 1);
      assert.equal(
        await marker.evaluate((el) => el.parentElement.tagName),
        "SPAN",
        "marker belongs with label, not under the input",
      );
      assert.equal(await marker.getAttribute("tabindex"), "0");
      assert.match(await marker.getAttribute("title"), /Skilled/);
    }
    const invalidA11y=await page.evaluate(async()=> (await axe.run(document.querySelector('#catalogBuildFeatChoices'),{rules:{'color-contrast':{enabled:false}}})).violations);
    assert.deepEqual(invalidA11y,[]);
    await page.keyboard.press('Escape');
    await pick(0).locator('xpath=ancestor::article').screenshot({path:out+'/warning-skilled-choices-1440.png'});
    await pick(0).selectOption("skill:medicine");
    assert.equal(
      await pick(0)
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      0,
      "valid filled choice clears its marker",
    );
    assert.equal(
      await pick(1)
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      1,
    );
    await pick(1).selectOption("skill:medicine");
    assert.equal(
      await pick(0)
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      0,
    );
    assert.equal(
      await pick(1)
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      1,
      "filled duplicate remains explained",
    );
    await pick(1).selectOption("skill:nature");
    await pick(2).selectOption("tool:Flute");
    assert.equal(
      await page
        .locator('[data-build-feat-array="humanFeatChoices"]')
        .evaluateAll((nodes) =>
          nodes.reduce(
            (n, el) =>
              n +
              el.closest("label").querySelectorAll(".sheet-required-marker")
                .length,
            0,
          ),
        ),
      0,
    );
    assert.equal(
      await page.locator("#sheetClassSkills .sheet-required-marker").count(),
      0,
    );
    // Ordinary catalogue feats have an owning card too; their wording must not
    // route an unrelated warning back to completed class skill fields.
    const skilledId=await page.evaluate(()=>Object.keys(CharacterFeatRules.definitions).find(id=>CharacterFeatRules.definitions[id].name==='Skilled'&&CharacterFeatRules.definitions[id].edition==='2024'));
    await page.evaluate(id=>{sheetSession.data.rulesChoices.feats=[id];sheetCatalogSignature='';updateSheetCalculations();selectSheetTab('builder');},skilledId);
    assert.equal(await page.locator('#sheetClassSkills .sheet-required-marker').count(),0);
    await page.evaluate(id=>{document.querySelector('[data-feat-key="'+id+'"] details').open=false;selectSheetTab('overview');},skilledId);
    const ordinaryFix=page.locator('.sheet-overview-important-row').filter({hasText:'Skilled: Choose valid, distinct training.'}).locator('[data-build-warning-tab]');
    await ordinaryFix.click();assert.equal(await page.locator('[data-sheet-tab="feats"]').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('[data-feat-key="'+skilledId+'"] [data-feat-choice="training0"]').evaluate(el=>el===document.activeElement),true);
    await page.locator('[data-feat-key="'+skilledId+'"] [data-remove-feat]').click();
    // A duplicate language is a real invalid filled field: only the second receives a marker.
    await page.evaluate(() => selectSheetTab("builder"));
    await page
      .locator('[name="build.standardLanguages.1"]')
      .selectOption("Elvish");
    assert.equal(
      await page
        .locator('[name="build.standardLanguages.0"]')
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      0,
    );
    const languageMarker = page
      .locator('[name="build.standardLanguages.1"]')
      .locator("xpath=..")
      .locator(".sheet-required-marker");
    assert.equal(await languageMarker.count(), 1);
    assert.match(
      await languageMarker.getAttribute("title"),
      /different additional standard languages/,
    );
    await page
      .locator('[name="build.standardLanguages.1"]')
      .selectOption("Orc");
    assert.equal(await languageMarker.count(), 0);
    // A duplicate class choice identifies its own second slot rather than the valid first.
    await page
      .locator('[name="build.classSkills.1"]')
      .selectOption("athletics");
    assert.equal(
      await classSkill
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator('[name="build.classSkills.1"]')
        .locator("xpath=..")
        .locator(".sheet-required-marker")
        .count(),
      1,
    );
    await page
      .locator('[name="build.classSkills.1"]')
      .selectOption("perception");
    assert.equal(
      await page.locator("#sheetClassSkills .sheet-required-marker").count(),
      0,
    );
    await page.locator("#sheetSave").click();
    await page.waitForFunction(() => !sheetSession.dirty);
    await page.evaluate(async () => {
      closeCharacterSheet(true);
      await openCharacterSheet("c1");
      selectSheetTab("builder");
    });
    assert.equal(await classSkill.inputValue(), "athletics");
    assert.equal(
      await page.locator("#sheetClassSkills .sheet-required-marker").count(),
      0,
    );
    assert.deepEqual(
      await page.evaluate(() => sheetSession.data.build.humanFeatChoices),
      ["skill:medicine", "skill:nature", "tool:Flute"],
    );
    await page.evaluate(()=>markUnfinishedCharacterFields([{tab:'builder',target:'[name="build.classSkills.0"],[name="build.classSkills.1"]',message:'Review this choice group'}]));
    assert.equal(await page.locator('#sheetClassSkills .sheet-required-marker').count(),0,'a broad group notice must not arbitrarily blame a valid filled choice');
    // Two independent reasons on the same field share one marker with both explanations.
    await page.evaluate(() =>
      markUnfinishedCharacterFields([
        {
          tab: "builder",
          target: '[name="build.classSkills.0"]',
          message: "First probe",
          exactTargets: true,
        },
        {
          tab: "builder",
          target: '[name="build.classSkills.0"]',
          message: "Second probe",
          exactTargets: true,
        },
      ]),
    );
    const merged = classSkill
      .locator("xpath=..")
      .locator(".sheet-required-marker");
    assert.equal(await merged.count(), 1);
    assert.equal(
      await merged.getAttribute("title"),
      "First probe\nSecond probe",
    );
    await page.evaluate(() => updateSheetCalculations());
    assert.equal(await merged.count(), 0);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator("#sheetClassSkillEditorGroup").screenshot({
        path: out + "/warning-completed-class-" + width + ".png",
      });
      await page
        .locator('[name="build.standardLanguages.1"]')
        .selectOption("Elvish");
      assert.equal(
        await page
          .locator("#sheetCharacterLanguageChoices")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
        true,
      );
      await page.locator("#sheetCharacterLanguageChoices").screenshot({
        path: out + "/warning-duplicate-language-" + width + ".png",
      });
      await page
        .locator('[name="build.standardLanguages.1"]')
        .selectOption("Orc");
    }
    const a11y = await page.evaluate(
      async () =>
        (
          await axe.run(document.querySelector("#sheetRulesCharacterGroup"), {
            rules: { "color-contrast": { enabled: false } },
          })
        ).violations,
    );
    assert.deepEqual(a11y, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS no false class markers, exact missing/duplicate feat/race/class/language targets, label placement, Fix focus/explanation, merged reasons, clear/reopen, mobile and accessibility",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
