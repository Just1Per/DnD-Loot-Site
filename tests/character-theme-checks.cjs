const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/character-vault-theme.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');

for(const token of [
  '--vault-burgundy:#5c1d1d',
  '--vault-gold:#d4af37',
  '--vault-border:#8a7355',
  '--vault-paper:#fdfbf7',
  'linear-gradient(180deg,var(--vault-brown),var(--vault-brown-soft))'
]) assert.ok(css.includes(token),'Missing Vault theme token: '+token);

for(const selector of [
  '#characterSheetPage .sheet-tabs',
  '#characterSheetDialog .sheet-tabs',
  '.sheet-field input',
  '.sheet-field select',
  '.sheet-field textarea',
  '.sheet-defense-selectors select',
  '.sheet-inventory-add select',
  '.sheet-class-level-row .sheet-subclass-select',
  '#characterSheetPage button',
  '#characterSheetDialog button',
  '.sheet-summary-identity',
  '.sheet-summary-ability',
  '.sheet-inventory-column',
  '#sheetInventoryDefense',
  '.sheet-catalog-results article',
  '.sheet-spell-generator-row',
  '.sheet-page-manager',
  '.sheet-spell-generator',
  '.sheet-personal-gear-editor',
  '.sheet-spell-information',
  '.sheet-attack-picker'
]) assert.ok(css.includes(selector),'Theme should cover '+selector);

const adobe=html.indexOf('character-adobe-integration.css');
const theme=html.indexOf('character-vault-theme.css');
assert.ok(adobe>=0&&theme>adobe,'Vault theme stylesheet must load after the Adobe integration stylesheet');
assert.ok(html.includes('character-vault-theme.css?v=20261002-vault-theme-v22'));
assert.ok(rules.includes('Firestore Rules Revision: 22'));
assert.ok(rules.includes('Character sheet schema: 14'));

let depth=0;
for(const ch of css){if(ch==='{')depth++;else if(ch==='}')depth--;assert.ok(depth>=0,'CSS closes more blocks than it opens');}
assert.equal(depth,0,'CSS braces should balance');

console.log('SUCCESS character sheet theme covers shared controls, pages, catalogues, inventory and dialogs');
