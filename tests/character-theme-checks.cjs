const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/character-vault-theme.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const tokenCss=fs.readFileSync(path.join(root,'css/theme-tokens.css'),'utf8');
const paletteNames=new Set([...tokenCss.matchAll(/(--theme-[\w-]+)\s*:/g)].map(match=>match[1]));
for(const file of fs.readdirSync(path.join(root,'css')).filter(name=>name.endsWith('.css'))){
  const source=fs.readFileSync(path.join(root,'css',file),'utf8');
  for(const [,name]of source.matchAll(/var\((--theme-[\w-]+)/g))assert.ok(paletteNames.has(name),file+' references an undefined palette token: '+name);
}

for(const page of ['index.html','404.html','rules-attribution.html']){
  const markup=fs.readFileSync(path.join(root,page),'utf8');
  const palette=markup.indexOf('css/theme-tokens.css');
  const component=markup.search(/css\/(?:style|site-identity)\.css/);
  assert.ok(palette>=0&&palette<component,page+' loads the shared palette before component styles');
}

for(const token of [
  '--vault-burgundy:var(--theme-heading)',
  '--vault-gold:var(--theme-accent)',
  '--vault-border:var(--theme-border)',
  '--vault-paper:var(--theme-paper)',
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
assert.ok(/character-vault-theme\.css\?v=[^\"\s]+/.test(html));

let depth=0;
for(const ch of css){if(ch==='{')depth++;else if(ch==='}')depth--;assert.ok(depth>=0,'CSS closes more blocks than it opens');}
assert.equal(depth,0,'CSS braces should balance');

console.log('SUCCESS character sheet theme covers shared controls, pages, catalogues, inventory and dialogs');
