// Consolidated app navigation against an isolated Firebase fixture; never production.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const root = path.resolve(__dirname, '..');
const journalTabs = ['campaign-journal','campaign-information', 'campaign-npcs', 'campaign-chapters'];
const workspaceTabs = ['dm-world', 'dm-creatures', 'dm-chapters'];

(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi, (_tag, href) => href.startsWith('css/')
        ? '<style>' + fs.readFileSync(path.join(root, href.split('?')[0]), 'utf8') + '</style>' : '');
    await page.route('https://fixture.example.test/**', route => route.fulfill({contentType: 'text/html', body: html}));
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/catalog.json'), 'utf8'));
    const monsters = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/monsters.json'), 'utf8'));
    // Use the real fixture's module order, including AppShell before ui-auth.
    const modules = JSON.parse(fs.readFileSync(path.join(__dirname, 'dom.cjs'), 'utf8')
      .match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'", '"'));
    let docs = {
      'users/player': {name: 'Mira', role: ['player']},
      'users/dm': {name: 'Campaign DM', role: ['dm']},
      'users/player/campaigns/a': {status: 'active', role: 'player'},
      'users/dm/campaigns/a': {status: 'active', role: 'dm'},
      'campaigns/a': {name: 'Storm Coast', ownerId: 'dm', inventoryVersion: 2},
      'campaigns/a/members/player': {status: 'active', role: 'player', displayName: 'Mira'},
      'campaigns/a/members/dm': {status: 'active', role: 'dm', displayName: 'Campaign DM'},
      'campaigns/a/characters/c1': {name: 'Thorin', class: 'Fighter', level: 7, userId: 'player', active: true},
      'campaigns/a/characters/cdm': {name: 'Orin', class: 'Rogue', level: 3, userId: 'dm', active: true}
    };

    async function boot(uid = 'player', reload = false) {
      if (reload) await page.reload(); else await page.goto('https://fixture.example.test/');
      await page.evaluate(({catalog, monsters}) => {
        window.__testCatalog = catalog;
        window.__testMonsters = monsters;
        window.fetch = async url => ({ok: true, json: async () => String(url).includes('monsters.json') ? __testMonsters : __testCatalog});
        window.print = () => {};
        window.alert = () => {};
        window.confirm = () => true;
      }, {catalog, monsters});
      for (const file of ['dom-setup.js', 'dom-fixture.js']) await page.addScriptTag({path: path.join(__dirname, file)});
      await page.evaluate(() => {
        const sdk = window.__DND_VAULT_DEPS__, getDoc = sdk.getDoc;
        sdk.getDoc = async documentPath => ({...await getDoc(documentPath), id: documentPath.split('/').at(-1)});
        sdk.query = (collectionPath, ...filters) => ({path: collectionPath, filters});
        sdk.where = (field, op, value) => ({field, op, value});
        sdk.getDocs = async query => {
          const collectionPath = typeof query === 'string' ? query : query.path;
          const filters = (query.filters || []).filter(filter => filter?.field);
          return {docs: Object.entries(testSheetDocs).filter(([key, data]) =>
            key.startsWith(collectionPath + '/') && !key.slice(collectionPath.length + 1).includes('/') &&
            filters.every(filter => {
              const value = filter.field.split('.').reduce((data, key) => data?.[key], data);
              return filter.op === 'array-contains' ? value?.includes(filter.value) : value === filter.value;
            })).map(([key, data]) => ({id: key.split('/').at(-1), data: () => structuredClone(data)}))};
        };
      });
      await page.addScriptTag({content: 'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
      for (const name of modules) await page.addScriptTag({path: path.join(root, 'js/modules', name + '.js')});
      await page.evaluate(() => {
        CharacterCatalog.set(__testCatalog);
        window.actualLoaders = {loadCharacters, loadSaves, loadCampaignItems, loadCampaignInventory, loadCampaignSupply};
      });
      await page.addScriptTag({path: path.join(__dirname, 'dom-state.js')});
      await page.evaluate(async ({uid, docs}) => {
        Object.assign(window, actualLoaders);
        testSheetDocs = docs;
        auth.currentUser = {uid, email: uid + '@example.test'};
        await testAuthCallback(auth.currentUser);
      }, {uid, docs});
    }

    const primary = tab => page.locator('#primaryNavigation [data-tab="' + tab + '"]');
    const secondary = tab => page.locator('.tab[data-tab="' + tab + '"]');
    const settings = () => page.locator('[data-tab="dm-settings"]');
    async function rememberDocs() { docs = await page.evaluate(() => structuredClone(testSheetDocs)); }
    async function assertPrimary(tab) {
      assert.deepEqual(await page.locator('#primaryNavigation .active').evaluateAll(rows => rows.map(row => row.dataset.tab)), [tab], 'one primary destination must remain selected');
      assert.equal(await primary(tab).getAttribute('aria-current'), 'page', 'primary selection must be exposed to assistive technology');
    }
    async function assertPanel(tab) {
      assert.equal(await page.locator('#tab-' + tab).isVisible(), true, tab + ' panel must be visible');
    }
    async function primaryLabels() {
      return page.locator('#primaryNavigation button:visible').evaluateAll(rows => rows.map(row => row.textContent.trim()));
    }

    await boot();
    await page.evaluate(() => enterCampaign(campaigns[0]));
    assert.deepEqual(await primaryLabels(), ['Home', 'Journal', 'My Character', 'Library']);
    assert.equal(await settings().isVisible(), false, 'players must not receive the campaign settings gear');
    assert.equal(await page.locator('#primaryNavigation [data-tab="character-sheet"]').count(), 0, 'the sheet must not be a competing primary destination');
    assert.equal(await page.locator('#primaryNavigation [data-tab="dm-one-shots"]').count(), 0, 'the paused one-shot feature must not be promoted in primary navigation');
    await assertPanel('campaign-home');
    await assertPrimary('campaign-home');
    assert.equal(await page.locator('#campaignSectionNavigation').isVisible(), false);

    await primary('journal').click();
    await assertPanel('campaign-journal');
    await assertPrimary('journal');
    assert.deepEqual(await page.locator('#campaignSectionNavigation button:visible').evaluateAll(rows => rows.map(row => row.dataset.tab)), journalTabs);
    for (const tab of journalTabs) {
      await secondary(tab).click();
      await assertPanel(tab);
      await assertPrimary('journal');
      assert.equal(await secondary(tab).evaluate(button => button.classList.contains('active')), true, 'the actual Journal subsection must be selected');
      assert.equal(await secondary(tab).getAttribute('aria-current'), 'page');
      assert.equal(await page.evaluate(() => AppNavigation.read(auth.currentUser.uid).tab), tab, 'remember the concrete subsection rather than its Journal alias');
      await rememberDocs();
      await boot('player', true);
      await assertPanel(tab);
      await assertPrimary('journal');
      assert.equal(await secondary(tab).evaluate(button => button.classList.contains('active')), true, 'reload must preserve the selected Journal subsection');
      assert.equal(await secondary(tab).getAttribute('aria-current'), 'page');
      await primary('campaign-home').click();
      await page.locator('[data-home-tab="' + tab + '"]').click();
      await assertPanel(tab);
      await assertPrimary('journal');
      assert.equal(await secondary(tab).evaluate(button => button.classList.contains('active')), true, 'Home shortcuts must select their Journal subsection');
    }
    console.log('PASS Player primary navigation, Journal aliases, Home shortcuts and real subsection reloads');

    await secondary('campaign-information').click();
    await primary('player').click();
    await page.waitForSelector('#characterSheetForm');
    await assertPanel('character-sheet');
    await assertPrimary('player');
    await page.evaluate(() => showTab('character-sheet'));
    await page.waitForSelector('#characterSheetForm');
    await assertPanel('character-sheet');
    await assertPrimary('player');
    await page.locator('[data-sheet-tab="story"]').click();
    await page.locator('[name="appearance"]').fill('A red cloak');
    await primary('journal').click();
    assert.equal(await page.locator('#sheetLeaveDialog').isVisible(), true);
    await assertPanel('character-sheet');
    await assertPrimary('player');
    assert.equal(await page.evaluate(() => AppNavigation.read('player').tab), 'character-sheet');
    await page.locator('[data-sheet-leave-stay]').click();
    assert.equal(await page.locator('[name="appearance"]').inputValue(), 'A red cloak');
    await primary('journal').click();
    await page.locator('[data-sheet-leave-save]').click();
    await page.waitForSelector('#sheetLeaveDialog', {state: 'detached'});
    await assertPanel('campaign-journal');
    await assertPrimary('journal');
    assert.equal(await page.evaluate(() => testSheetDocs['campaigns/a/characterSheets/c1'].data.appearance), 'A red cloak');
    await page.evaluate(() => showTab('character-sheet'));
    await page.waitForSelector('#characterSheetForm');
    await page.locator('[data-sheet-tab="story"]').click();
    await page.locator('[name="appearance"]').fill('An unwanted Journal draft');
    await primary('journal').click();
    await page.locator('[data-sheet-leave-discard]').click();
    await page.waitForSelector('#sheetLeaveDialog', {state: 'detached'});
    await assertPanel('campaign-journal');
    assert.equal(await page.evaluate(() => testSheetDocs['campaigns/a/characterSheets/c1'].data.appearance), 'A red cloak');
    for (const tab of ['dm', 'dm-settings', ...workspaceTabs, 'dm-one-shots']) {
      await page.evaluate(tab => showTab(tab), tab);
      await assertPanel('campaign-journal');
      await assertPrimary('journal');
    }
    console.log('PASS My Character remains selected for the sheet; Journal save/discard/stay and direct private route restrictions');

    await rememberDocs();
    await page.evaluate(async () => {
      auth.currentUser = {uid: 'dm', email: 'dm@example.test'};
      await testAuthCallback(auth.currentUser);
      await enterCampaign(campaigns[0]);
    });
    assert.deepEqual(await primaryLabels(), ['Home', 'Journal', 'My Character', 'Library', 'DM Workspace']);
    assert.equal(await settings().isVisible(), true);
    assert.match((await settings().getAttribute('aria-label')) || (await settings().textContent()), /settings/i, 'the settings gear needs a useful accessible name');
    await primary('dm').click();
    await assertPrimary('dm');
    for (const tab of workspaceTabs) {
      const button = page.locator('[data-tab="' + tab + '"]');
      assert.equal(await button.isVisible(), true, tab + ' must remain reachable as secondary navigation');
      assert.equal(await button.evaluate(button => !!button.closest('#primaryNavigation')), false);
      await button.click();
      await assertPanel(tab);
      await assertPrimary('dm');
      assert.equal(await button.evaluate(button => button.classList.contains('active')), true);
      assert.equal(await button.getAttribute('aria-current'), 'page');
    }
    await page.evaluate(() => showTab('dm-one-shots'));
    await assertPanel('dm-one-shots');
    await page.waitForFunction(() => CampaignWorkspace.session?.kind === 'oneShot');
    await assertPrimary('dm');
    assert.equal(await page.locator('#primaryNavigation [data-tab="dm-one-shots"]').count(), 0);

    await settings().click();
    await assertPanel('dm-settings');
    assert.equal(await page.locator('#tab-dm-settings #campaignSettingsPanel').isVisible(), true, 'settings must open the preserved management surface');
    assert.equal(await page.locator('#tab-dm-settings #dmMemberList').isVisible(), true);
    assert.match(await page.locator('#tab-dm-settings #dmMemberList').textContent(), /Mira/, 'settings must render the existing campaign membership data');
    assert.equal(await page.locator('#tab-dm-settings #dmPendingInvites').isVisible(), true);
    assert.equal(await page.locator('#tab-dm-settings #dmCampaignName').count(), 1);
    assert.equal(await page.locator('#tab-dm-settings #dmInviteMember').isVisible(), true);
    assert.equal(await settings().evaluate(button => button.classList.contains('active')), true);
    assert.equal(await settings().getAttribute('aria-current'), 'page');
    assert.equal(await page.evaluate(() => AppNavigation.read('dm').tab), 'dm-settings');
    await rememberDocs();
    await boot('dm', true);
    await assertPanel('dm-settings');
    assert.equal(await settings().evaluate(button => button.classList.contains('active')), true, 'reload must distinguish settings from workspace');
    console.log('PASS Authentication role switch, retained DM subsections/one-shots and remembered settings/members/invitations surface');

    await page.evaluate(() => showTab('character-sheet'));
    await page.waitForSelector('#characterSheetForm');
    await assertPrimary('player');
    await page.locator('[data-sheet-tab="story"]').click();
    const dmCharacter = await page.evaluate(() => sheetSession.characterId);
    const sheetPath = 'campaigns/a/characterSheets/' + dmCharacter;
    await page.locator('[name="appearance"]').fill('A DM settings draft');
    await settings().click();
    assert.equal(await page.locator('#sheetLeaveDialog').isVisible(), true);
    await assertPanel('character-sheet');
    await assertPrimary('player');
    await page.locator('[data-sheet-leave-stay]').click();
    assert.equal(await page.locator('[name="appearance"]').inputValue(), 'A DM settings draft');
    await settings().click();
    await page.locator('[data-sheet-leave-save]').click();
    await page.waitForSelector('#sheetLeaveDialog', {state: 'detached'});
    await assertPanel('dm-settings');
    assert.equal(await page.evaluate(sheetPath => testSheetDocs[sheetPath].data.appearance, sheetPath), 'A DM settings draft');
    await page.evaluate(() => showTab('character-sheet'));
    await page.waitForSelector('#characterSheetForm');
    await page.locator('[data-sheet-tab="story"]').click();
    await page.locator('[name="appearance"]').fill('Discard this settings draft');
    await settings().click();
    await page.locator('[data-sheet-leave-discard]').click();
    await page.waitForSelector('#sheetLeaveDialog', {state: 'detached'});
    await assertPanel('dm-settings');
    assert.equal(await page.evaluate(sheetPath => testSheetDocs[sheetPath].data.appearance, sheetPath), 'A DM settings draft');
    console.log('PASS The settings gear retains the character sheet save/discard/stay guard');

    await page.addScriptTag({content: require('axe-core').source});
    await page.setViewportSize({width: 390, height: 844});
    await primary('campaign-home').focus();
    for (const tab of ['journal', 'player', 'library', 'dm']) {
      await page.keyboard.press('Tab');
      assert.equal(await primary(tab).evaluate(button => button === document.activeElement), true, 'primary destinations must be reachable in order using Tab');
    }
    for (const tab of ['campaign-home', 'journal', 'dm']) {
      await primary(tab).focus();
      await page.keyboard.press('Enter');
      await assertPrimary(tab);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, tab + ' navigation must fit on mobile');
      const violations = await page.evaluate(async () => (await axe.run(['#primaryNavigation', '#campaignSectionNavigation', '[data-tab="dm-settings"]'], {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}})).violations);
      assert.deepEqual(violations.map(row => ({id:row.id,nodes:row.nodes.map(node=>({target:node.target,reason:node.failureSummary}))})), [], tab + ' navigation must meet WCAG A/AA checks');
    }
    await primary('journal').focus();
    await page.keyboard.press('Enter');
    await secondary('campaign-npcs').focus();
    await page.keyboard.press('Space');
    await assertPanel('campaign-npcs');
    await assertPrimary('journal');
    await primary('dm').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-tab="dm-chapters"]').focus();
    await page.keyboard.press('Space');
    await assertPanel('dm-chapters');
    await settings().focus();
    await page.keyboard.press('Enter');
    await assertPanel('dm-settings');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'settings must fit on mobile');
    console.log('PASS Mobile primary/secondary navigation, WCAG A/AA and keyboard activation');

    await rememberDocs();
    docs['campaigns/a'].ownerId = 'another-owner';
    docs['campaigns/a/members/dm'].role = 'player';
    // Re-authentication on reload must use fresh membership, never stale global DM capability.
    await boot('dm', true);
    await assertPanel('campaign-home');
    await assertPrimary('campaign-home');
    assert.deepEqual(await primaryLabels(), ['Home', 'Journal', 'My Character', 'Library']);
    assert.equal(await primary('dm').isVisible(), false);
    assert.equal(await settings().isVisible(), false);
    for (const tab of ['dm', 'dm-settings', ...workspaceTabs, 'dm-one-shots']) {
      await page.evaluate(tab => showTab(tab), tab);
      await assertPanel('campaign-home');
      await assertPrimary('campaign-home');
    }
    console.log('PASS Fresh campaign membership removes DM controls and rejects remembered/direct private destinations');
    assert.deepEqual(errors, [], 'no unexpected browser errors');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
