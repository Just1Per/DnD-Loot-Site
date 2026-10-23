// Character workspace integration against local deterministic Firebase data.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}}), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link\b[^>]*href="([^"]*)"[^>]*>/gi, (_tag, href) => href.startsWith('css/') ? '<style>' + fs.readFileSync(path.join(root, href.split('?')[0]), 'utf8') + '</style>' : '');
    await page.route('https://fixture.example.test/**', route => route.fulfill({contentType: 'text/html', body: html}));
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/catalog.json'), 'utf8'));
    const modules = JSON.parse(fs.readFileSync(path.join(__dirname, 'dom.cjs'), 'utf8').match(/for\(const name of (\[[^\n]+?\])\)await run/)[1].replaceAll("'", '"'));
    const item = (id, name, visible = true) => ({id, name, visible, category: 'Potion', rarity: 'Common', description: name + ' description', properties: [{title: 'Effect', text: 'Preserved item detail'}], classes: [], campaignId: 'a', lootMode: 'player', available: true});
    const tonic = item('tonic', 'Thorin tonic'), ring = item('ring', 'Rook ring'), relic = item('relic', 'Hidden keepsake', false), other = item('other', 'Elara relic');
    let docs = {
      'users/player': {name: 'Mira', role: ['player']}, 'users/dm': {name: 'Campaign DM', role: ['dm']},
      'users/player/campaigns/a': {status: 'active', role: 'player'}, 'users/dm/campaigns/a': {status: 'active', role: 'dm'},
      'campaigns/a': {name: 'Storm Coast', ownerId: 'dm', inventoryVersion: 2},
      'campaigns/a/members/player': {status: 'active', role: 'player', displayName: 'Mira'}, 'campaigns/a/members/dm': {status: 'active', role: 'dm', displayName: 'DM'},
      'campaigns/a/members/other': {status: 'active', role: 'player', displayName: 'Elara player'},
      'campaigns/a/characters/c1': {name: 'Thorin', class: 'Fighter', level: 7, userId: 'player', active: true, lastSelectedAt: 20},
      'campaigns/a/characters/c2': {name: 'Rook', class: 'Rogue', level: 3, userId: 'player', active: true, lastSelectedAt: 10},
      'campaigns/a/characters/c3': {name: 'Elara', class: 'Wizard', level: 4, userId: 'other', active: true},
      'campaigns/a/characters/cdm': {name: 'DM adventurer', class: 'Bard', level: 2, userId: 'dm', active: true},
      'campaigns/a/items/tonic': tonic, 'campaigns/a/items/ring': ring, 'campaigns/a/items/relic': relic, 'campaigns/a/items/other': other,
      'campaigns/a/inventory/e1': {characterId: 'c1', userId: 'player', itemId: tonic.id, item: tonic, quantity: 2},
      'campaigns/a/inventory/e2': {characterId: 'c2', userId: 'player', itemId: ring.id, item: ring, quantity: 3},
      'campaigns/a/inventory/e3': {characterId: 'c3', userId: 'other', itemId: other.id, item: other, quantity: 2},
      'campaigns/a/inventory/e4': {characterId: 'c1', userId: 'player', itemId: relic.id, item: relic, quantity: 1},
      'campaigns/a/saves/s1': {characterId: 'c1', userId: 'player', itemId: 'tonic'},
      'campaigns/a/saves/s2': {characterId: 'c2', userId: 'player', itemId: 'ring'},
      'campaigns/a/saves/s3': {characterId: 'c3', userId: 'other', itemId: 'other'}
    };
    async function boot(uid = 'player', reload = false) {
      if (reload) await page.reload(); else await page.goto('https://fixture.example.test/');
      await page.evaluate(catalog => { window.__testCatalog = catalog; window.fetch = async () => ({ok: true, json: async () => __testCatalog}); window.print = () => {window.testPrinted = true;}; window.confirm = () => true; }, catalog);
      for (const file of ['dom-setup.js', 'dom-fixture.js']) await page.addScriptTag({path: path.join(__dirname, file)});
      await page.evaluate(() => {
        const sdk = window.__DND_VAULT_DEPS__, getDoc = sdk.getDoc, call = sdk.vaultCall;
        sdk.getDoc = async key => {
          if (window.pauseSheetId && key === 'campaigns/a/characterSheets/' + window.pauseSheetId) { window.pauseSheetId = null; await new Promise(resolve => window.finishSheetRead = resolve); }
          return {...await getDoc(key), id: key.split('/').at(-1), ref: key};
        };
        sdk.query = (path, ...filters) => ({path, filters}); sdk.where = (field, op, value) => ({field, op, value});
        window.workspaceReads = [];
        sdk.getDocs = async query => {
          const p = typeof query === 'string' ? query : query.path, filters = (query.filters || []).filter(row => row?.field);
          workspaceReads.push(p);
          if (window.workspaceFailCollection === p) throw Error('Simulated panel read failure');
          if (p === 'campaigns/a/inventory' && window.pauseInventoryRead) {window.pauseInventoryRead = false; await new Promise(resolve => window.finishInventoryRead = resolve);}
          return {docs: Object.entries(testSheetDocs).filter(([key, data]) => key.startsWith(p + '/') && !key.slice(p.length + 1).includes('/') && filters.every(f => {const value = f.field.split('.').reduce((d, key) => d?.[key], data); return f.op === 'array-contains' ? value?.includes(f.value) : value === f.value;}))
            .map(([key, data]) => ({id: key.split('/').at(-1), ref: key, data: () => structuredClone(data)}))};
        };
        sdk.setDoc = async (key, data) => {testSheetDocs[key] = structuredClone(data);};
        sdk.updateDoc = async (key, data) => {testSheetDocs[key] = {...testSheetDocs[key], ...structuredClone(data)};};
        sdk.deleteDoc = async key => {delete testSheetDocs[key];};
        sdk.writeBatch = () => {const operations=[];return {set:(key,data)=>operations.push([key,data]),delete:key=>operations.push([key,null]),commit:async()=>{for(const [key,data] of operations){if(data===null)delete testSheetDocs[key];else testSheetDocs[key]=structuredClone(data);}}};};
        sdk.vaultCall = async (name, data) => {
          if (name !== 'vaultInventoryAction') return call(name, data);
          callLog.push({name, data: structuredClone(data)});
          const found = Object.entries(testSheetDocs).find(([key, entry]) => key.startsWith('campaigns/a/inventory/') && entry.characterId === data.characterId && entry.itemId === data.itemId);
          if (!found || found[1].quantity < data.quantity) throw Error('Insufficient owned quantity');
          found[1].quantity -= data.quantity;
          if (data.action === 'transfer') {
            const target = testSheetDocs['campaigns/a/characters/' + data.targetCharacterId];
            testSheetDocs['campaigns/a/inventory/transferred'] = {...structuredClone(found[1]), characterId: data.targetCharacterId, userId: target.userId, quantity: data.quantity};
          }
          return {};
        };
      });
      await page.addScriptTag({content: 'function createCampaignStore(){return window.__DND_VAULT_DEPS__.vaultCall}'});
      for (const name of modules) await page.addScriptTag({path: path.join(root, 'js/modules', name + '.js')});
      await page.evaluate(() => {CharacterCatalog.set(__testCatalog); window.actualLoaders = {loadCharacters, loadSaves, loadCampaignItems, loadCampaignInventory, loadCampaignSupply};});
      await page.addScriptTag({path: path.join(__dirname, 'dom-state.js')});
      await page.evaluate(async ({uid, docs}) => {Object.assign(window, actualLoaders); testSheetDocs = docs; auth.currentUser = {uid, email: uid + '@example.test'}; await testAuthCallback(auth.currentUser);}, {uid, docs});
    }
    const section = tab => page.locator('[data-section-group="character"] [data-tab="' + tab + '"]');
    const picker = () => page.locator('#characterWorkspacePicker');
    async function assertContext(id) {
      assert.equal(await picker().inputValue(), id);
      assert.equal(await page.evaluate(() => CharacterWorkspace.context.characterId), id);
    }
    async function rememberDocs() {docs = await page.evaluate(() => structuredClone(testSheetDocs));}

    await boot(); await page.evaluate(() => enterCampaign(campaigns[0]));
    await page.locator('#primaryNavigation [data-tab="player"]').click();
    await page.waitForSelector('#characterSheetForm');
    await assertContext('c1');
    assert.equal(await page.evaluate(() => sheetSession.characterId), 'c1');
    assert.deepEqual(await page.locator('[data-section-group="character"] .tab:visible').evaluateAll(rows => rows.map(row => row.textContent.trim())), ['Character Sheet', 'Gear & Loot', 'Wishlist']);
    assert.deepEqual(await picker().locator('option').evaluateAll(rows => rows.map(row => row.value).filter(Boolean)), ['c1', 'c2']);
    for (const tab of ['overview', 'skills', 'combat', 'spells', 'inventory', 'builder', 'feats', 'story']) assert.equal(await page.locator('[data-sheet-tab="' + tab + '"]').count(), 1, 'existing sheet engine sections remain available');
    await page.locator('#sheetPrint').click(); assert.equal(await page.locator('#sheetPrintDialog').isVisible(), true); await page.locator('[data-print-cancel]').click();
    const requests = await page.evaluate(async () => {
      items = []; savedItemLoadKey = ''; workspaceReads = [];
      await CharacterWorkspace.open('c1', 'character-wishlist');
      const wishlist = [...workspaceReads];
      testSheetDocs['campaigns/a/saves/missing-performance'] = {userId:'player',characterId:'c1',itemId:'removed'};
      workspaceReads = []; await CharacterWorkspace.refresh();
      const missing = [...workspaceReads];
      delete testSheetDocs['campaigns/a/saves/missing-performance'];
      workspaceReads = []; await CharacterWorkspace.open('c1', 'character-loot');
      const loot = [...workspaceReads];
      return {wishlist, missing, loot};
    });
    assert.deepEqual(requests.wishlist.sort(), ['campaigns/a/items', 'campaigns/a/saves']);
    assert.deepEqual(requests.missing.sort(), ['campaigns/a/items', 'campaigns/a/saves'], 'unavailable saved records do not trigger a duplicate item read');
    assert.deepEqual(requests.loot.sort(), ['campaigns/a/inventory', 'campaigns/a/items'], 'player gear needs neither saves nor DM supply');
    await page.evaluate(async () => {workspaceFailCollection='campaigns/a/items';try{await CharacterWorkspace.refresh();throw Error('Expected read failure');}catch(error){if(error.message!=='Simulated panel read failure')throw error;}finally{workspaceFailCollection=null;}workspaceReads=[];await CharacterWorkspace.refresh();});
    assert.deepEqual(await page.evaluate(() => workspaceReads.sort()), ['campaigns/a/inventory', 'campaigns/a/items'], 'failed reads remain retryable');
    console.log('PASS Wishlist reads only items/saves without duplicate missing-item queries; player loot reads only items/inventory; failed refresh retries');
    await section('character-loot').click();
    assert.deepEqual(await page.locator('#characterLootGrid .item-name').allTextContents(), ['Thorin tonic', 'Hidden keepsake']);
    assert.equal(await page.locator('#characterLootGrid .use-button').count(), 2);
    assert.equal(await page.locator('#characterLootGrid .unloot-button').count(), 0);
    await picker().focus(); await picker().selectOption('c2'); await assertContext('c2');
    assert.equal(await picker().evaluate(control => control === document.activeElement), true, 'changing character preserves keyboard focus');
    assert.deepEqual(await page.locator('#characterLootGrid .item-name').allTextContents(), ['Rook ring']);
    assert.equal(await page.evaluate(() => selectedCharacter.id), 'c1', 'viewing another own character must not silently change the active save/loot target');
    assert.equal(await page.evaluate(() => testSheetDocs['campaigns/a/characters/c2'].lastSelectedAt), 10);
    await section('character-wishlist').click();
    assert.match(await page.locator('#characterWishlistGrid').textContent(), /Rook ring/);
    assert.doesNotMatch(await page.locator('#characterWishlistGrid').textContent(), /Thorin tonic|Elara relic/);
    assert.equal(await page.locator('#characterWishlistGrid .saved-remove-button').count(),1);
    assert.equal(await page.locator('#characterWishlistGrid .loot-button,#characterWishlistGrid .use-button').count(),0);
    await page.locator('#characterWishlistGrid .saved-character-target').selectOption('c1');
    await page.locator('#characterWishlistGrid .saved-move-button').click();
    await page.waitForFunction(()=>saves.some(save=>save.characterId==='c1'&&save.itemId==='ring'));
    assert.match(await page.locator('#characterWishlistGrid').textContent(),/No saved items/);
    await picker().selectOption('c1');
    const movedCard=page.locator('#characterWishlistGrid [data-item-id="ring"]');
    await movedCard.locator('.saved-remove-button').click();
    await page.waitForFunction(()=>!saves.some(save=>save.itemId==='ring'));
    await page.evaluate(async()=>{testSheetDocs['campaigns/a/saves/missing']={userId:'player',characterId:'c1',itemId:'removed'};await CharacterWorkspace.refresh();});
    const missingCard=page.locator('#characterWishlistGrid [data-item-id="removed"]');
    assert.match(await missingCard.textContent(),/Saved item unavailable/);
    await missingCard.locator('.saved-remove-button').click();
    await page.waitForFunction(()=>!testSheetDocs['campaigns/a/saves/missing']);
    await picker().selectOption('c2');
    console.log('PASS Full Saved cards retain Move/Remove actions and removable unavailable bookmarks');
    console.log('PASS Shared picker and full sheet/print remain intact; gear/wishlist filter the displayed character without changing active targeting');

    await section('character-sheet').click(); await page.waitForFunction(() => sheetSession?.characterId === 'c2');
    await page.locator('[data-sheet-tab="story"]').click(); await page.locator('[name="appearance"]').fill('Rook protected draft');
    await picker().focus(); await picker().selectOption('c1'); assert.equal(await page.locator('#sheetLeaveDialog').isVisible(), true); await assertContext('c2');
    await page.locator('[data-sheet-leave-stay]').click(); assert.equal(await page.locator('[name="appearance"]').inputValue(), 'Rook protected draft');
    assert.equal(await picker().evaluate(control => control === document.activeElement), true, 'Stay returns focus to the shared picker');
    assert.equal(await page.evaluate(() => CharacterWorkspace.open('c3', 'character-loot')), false, 'players cannot directly open another player character');
    await assertContext('c2');
    await section('character-loot').click(); await page.locator('[data-sheet-leave-save]').click(); await page.waitForSelector('#sheetLeaveDialog', {state: 'detached'});
    assert.equal(await page.evaluate(() => testSheetDocs['campaigns/a/characterSheets/c2'].data.appearance), 'Rook protected draft');
    await assertContext('c2');
    await page.locator('[data-character-equipment]').click(); await page.waitForFunction(() => sheetSession?.characterId === 'c2');
    assert.equal(await page.locator('[data-sheet-tab="inventory"]').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#sheetAddCustomGear').isVisible(), true, 'manual gear editing must open the real sheet inventory');
    await page.waitForFunction(()=>document.querySelector('#sheetGearPicker .vault-help-badge'));
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:1000});
      const bounds=await page.evaluate(()=>{
        const rect=id=>document.getElementById(id).getBoundingClientRect(),gear=rect('sheetBaseGear'),pack=rect('sheetGearPack'),addGear=rect('sheetAddBaseGear'),addPack=rect('sheetAddGearPack');
        return {gearAligned:Math.abs(gear.left-addGear.left)<2,packAligned:Math.abs(pack.left-addPack.left)<2,gearBelow:addGear.top>=gear.bottom,packBelow:addPack.top>=pack.bottom,fit:document.documentElement.scrollWidth<=innerWidth};
      });
      assert.ok(Object.values(bounds).every(Boolean),'gear and pack actions stay beneath their own selectors at '+width+': '+JSON.stringify(bounds));
      if(width===390||width===1440)await page.locator('#sheetGearPicker').screenshot({path:require('node:os').tmpdir()+'/inventory-gear-picker-'+width+'.png'});
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#sheetAddBaseGear').click(); assert.equal(await page.evaluate(() => sheetSession.dirty), true);
    await section('character-wishlist').click(); await page.locator('[data-sheet-leave-discard]').click(); await page.waitForSelector('#sheetLeaveDialog', {state: 'detached'});
    assert.equal(await page.evaluate(() => testSheetDocs['campaigns/a/characterSheets/c2'].data.personalGear.length), 0, 'discard must not save manual gear');
    await section('character-loot').click(); await rememberDocs(); await boot('player', true);
    await assertContext('c2'); assert.equal(await page.locator('#tab-character-loot').isVisible(), true);
    assert.equal(await page.evaluate(() => selectedCharacter.id), 'c1');
    await page.locator('#characterLootGrid .use-button').click(); await page.locator('#confirmInventoryAction').click();
    await page.waitForFunction(() => testSheetDocs['campaigns/a/inventory/e2'].quantity === 2);
    await page.waitForFunction(() => document.querySelector('#characterLootGrid .inventory-quantity')?.textContent.includes('2'));
    const action = await page.evaluate(() => callLog.at(-1)); assert.equal(action.name, 'vaultInventoryAction'); assert.equal(action.data.characterId, 'c2'); assert.equal(action.data.action, 'use');
    assert.equal(await page.evaluate(() => testSheetDocs['campaigns/a/inventory/e1'].quantity), 2);
    await picker().selectOption('c1');
    await page.evaluate(() => {window.pauseInventoryRead = true; window.pendingWorkspaceRefresh = CharacterWorkspace.refresh();});
    await page.waitForFunction(() => !!window.finishInventoryRead);
    await picker().selectOption('c2');
    await page.evaluate(async () => {testSheetDocs['campaigns/a/inventory/e2'].quantity = 4; window.finishInventoryRead(); await window.pendingWorkspaceRefresh;});
    await assertContext('c2');
    assert.match(await page.locator('#characterLootGrid .inventory-quantity').textContent(), /4/, 'a refresh finishing after a picker change must update the currently viewed character');
    await page.locator('[data-character-manage]').click();
    assert.equal(await page.locator('#playerCreateCharBtn').isVisible(), true);
    for (const selector of ['.btn-sheet-char', '.btn-select-char', '.btn-archive-char', '.btn-hard-delete-own-char']) assert.ok(await page.locator('#myCharacterList ' + selector + ':visible').count(), 'Manage characters retains ' + selector);
    assert.equal(await page.locator('#myLootGrid').isVisible(), false); assert.equal(await page.locator('#myWishGrid').isVisible(), false);
    console.log('PASS Save/discard/stay, real equipment editing, concrete character reload and existing inventory actions/management controls');

    await page.evaluate(async () => {closeCharacterSheet(true); window.pauseSheetId = 'c2'; window.pendingSheetOpen = CharacterWorkspace.open('c2', 'inventory');});
    await page.waitForFunction(() => !!window.finishSheetRead);
    await page.evaluate(() => CharacterWorkspace.open('c1', 'character-sheet'));
    await page.evaluate(async () => {window.finishSheetRead(); await window.pendingSheetOpen;});
    await assertContext('c1'); assert.equal(await page.evaluate(() => sheetSession.characterId), 'c1');
    assert.equal(await page.locator('[data-sheet-tab="overview"]').getAttribute('aria-selected'), 'true', 'a superseded inventory-open callback cannot alter the new sheet section');
    await rememberDocs();
    await page.evaluate(async () => {auth.currentUser = {uid: 'dm', email: 'dm@example.test'}; await testAuthCallback(auth.currentUser); await enterCampaign(campaigns[0]);});
    await page.locator('#primaryNavigation [data-tab="dm"]').click(); await page.locator('[data-tab="dm-party"]').click();
    await page.locator('[data-dm-sheet="c3"]').click(); await page.waitForFunction(() => sheetSession?.characterId === 'c3'); await assertContext('c3');
    assert.equal(await page.evaluate(() => selectedCharacter.id), 'cdm');
    await section('character-loot').click();
    assert.deepEqual(await page.evaluate(async () => {workspaceReads=[];await CharacterWorkspace.refresh();return workspaceReads.sort();}), ['campaigns/a/inventory','campaigns/a/items','campaigns/a/supply'], 'DM gear retains supply but does not reload saves');
    assert.deepEqual(await page.locator('#characterLootGrid .item-name').allTextContents(), ['Elara relic']);
    for (const selector of ['.edit-button', '.clone-button', '.visibility-toggle-btn', '.highlight-button', '.unloot-button', '.transfer-button', '.use-button']) assert.equal(await page.locator('#characterLootGrid ' + selector).count(), 1, 'DM loot cards must retain ' + selector);
    assert.equal(await page.locator('#characterLootGrid .delete-item-button').count(),0,'Assigned inventory uses return/transfer controls; source removal belongs in Library');
    await page.locator('#characterLootGrid .transfer-button').click(); await page.locator('#actionCharacter').selectOption('c2'); await page.locator('#confirmInventoryAction').click();
    await page.waitForFunction(() => testSheetDocs['campaigns/a/inventory/e3'].quantity === 1);
    assert.equal(await page.evaluate(() => callLog.at(-1).data.characterId), 'c3'); assert.equal(await page.evaluate(() => callLog.at(-1).data.targetCharacterId), 'c2');
    assert.deepEqual(await page.evaluate(async () => {workspaceReads=[];await CharacterWorkspace.open('c3','character-wishlist');return workspaceReads.sort();}), ['campaigns/a/items','campaigns/a/saves'], 'DM wishlist does not read supply or inventory');
    await section('character-wishlist').click(); assert.match(await page.locator('#characterWishlistGrid').textContent(), /Elara relic/); assert.doesNotMatch(await page.locator('#characterWishlistGrid').textContent(), /Rook ring/);
    console.log('PASS Superseded sheet loads cannot change context; DM Party opens others and preserves full inventory transfer controls');

    await page.addScriptTag({content: require('axe-core').source}); await page.setViewportSize({width: 390, height: 844});
    for (const tab of ['character-loot', 'character-wishlist']) {
      await section(tab).focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#tab-' + tab).isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'character workspace must fit mobile');
      const violations = await page.evaluate(async tab => (await axe.run(['#characterWorkspaceHeader', '#tab-' + tab], {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}})).violations, tab);
      assert.deepEqual(violations.map(row => row.id), [], 'workspace accessibility');
    }
    await picker().focus(); await page.keyboard.press('Tab'); assert.equal(await page.locator('[data-character-manage]').evaluate(button => button === document.activeElement), true);
    await rememberDocs(); docs['campaigns/a'].ownerId = 'someone-else'; docs['campaigns/a/members/dm'].role = 'player'; await boot('dm', true);
    assert.notEqual(await page.evaluate(() => CharacterWorkspace.context?.characterId), 'c3', 'a remembered other-player context must not be restored after DM access is removed');
    assert.notEqual(await page.evaluate(() => sheetSession?.characterId), 'c3');
    assert.doesNotMatch(await page.locator('#characterWishlistGrid').textContent(), /Elara relic/);
    assert.equal(await page.evaluate(() => CharacterWorkspace.open('c3', 'character-wishlist')), false);
    await page.locator('#primaryNavigation [data-tab="player"]').click(); await page.waitForFunction(() => sheetSession?.characterId === 'cdm'); await assertContext('cdm');
    assert.deepEqual(await picker().locator('option').evaluateAll(rows => rows.map(row => row.value).filter(Boolean)), ['cdm']);
    console.log('PASS Mobile/keyboard/WCAG checks and fresh role checks keep character contexts private');
    assert.deepEqual(errors, [], 'no unexpected browser errors');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
