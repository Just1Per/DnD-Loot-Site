const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/modules/campaign-appearance'),{createCampaignAppearanceStore}=require('../js/modules/campaign-appearance-store');
test('Legacy campaigns retain the exact default palette; corrupt future values safely fall back',()=>{
 assert.deepEqual(M.tokens(M.read()),{});assert.deepEqual(M.tokens(M.read({schemaVersion:55,primary:'red'})),{});
 assert.equal(M.normalize({...M.preset('ocean'),primary:'#ABCDEF'}).primary,'#abcdef');
 for(const patch of [{primary:'red'},{background:'url(https://example.test/x)'},{accent:'#fff'},{preset:'<style>'},{schemaVersion:2},{revision:-1}])assert.throws(()=>M.normalize({...M.preset(),...patch}));
});
test('All three editable colours derive safe text, button, hover, heading and header pairs',()=>{
 const colours=['#000000','#ffffff','#777777','#ff0000','#00ff00','#0000ff','#ffff00','#808080','#858585','#00ffff'];
 for(const primary of colours)for(const background of colours)for(const accent of colours){
  const t=M.tokens({...M.preset('ocean'),preset:'custom',primary,background,accent});
  for(const [a,b]of [['on-primary','primary'],['on-primary','primary-hover'],['heading','paper'],['accent-ink','paper'],['header-accent','header'],['canvas-ink','canvas'],['canvas-ink','canvas-end']])assert.ok(M.contrast(t['--theme-'+a],t['--theme-'+b]||'#fdfbf7')>=4.5,a+'/'+b+' '+[primary,background,accent]);
  assert.equal(t['--theme-canvas'],background);assert.equal(t['--theme-paper'],undefined,'paper stays controlled by the readable shared surface');
 }
});
function fixture(){
 const records={'campaigns/a':{name:'Coast',ownerId:'owner',description:'Keep me'},'campaigns/a/members/dm':{role:'dm',status:'active'},'campaigns/a/members/player':{role:'player',status:'active'},'campaigns/a/members/removed':{role:'dm',status:'inactive'}},writes=[];
 const sdk={db:{},auth:{currentUser:{uid:'owner'}},doc:(_, ...p)=>p.join('/'),runTransaction:async(_,fn)=>{const pending=[];const result=await fn({get:async p=>({exists:()=>!!records[p],data:()=>structuredClone(records[p])}),update:(p,d)=>pending.push([p,d])});for(const [p,d]of pending){records[p]={...records[p],...structuredClone(d)};writes.push({p,d});}return result;}};
 return {records,writes,sdk,store:createCampaignAppearanceStore(sdk)};
}
test('Owner and active DM save only appearance and updatedAt; stale edits preserve the newer look',async()=>{
 const {records,writes,sdk,store}=fixture();const first=await store.save('a',M.preset('ocean'));assert.equal(first.revision,1);
 sdk.auth.currentUser.uid='dm';const second=await store.save('a',M.preset('horror',1));assert.equal(second.revision,2);
 await assert.rejects(store.save('a',M.preset('forest',1)),/another window/);
 assert.equal(writes.length,2);assert.equal(records['campaigns/a'].description,'Keep me');assert.deepEqual(Object.keys(writes[0].d).sort(),['appearance','updatedAt']);
});
test('Players, removed DMs, outsiders and signed-out accounts cannot save',async()=>{
 const {sdk,store,writes}=fixture();for(const uid of ['player','removed','outsider']){sdk.auth.currentUser={uid};await assert.rejects(store.save('a',M.preset('ocean')),/Only this campaign/);}
 sdk.auth.currentUser=null;await assert.rejects(store.save('a',M.preset()),/Sign in/);assert.equal(writes.length,0);
});
test('Invalid inputs, deleted campaigns and campaign changes never mutate a different record',async()=>{
 const {records,store,writes}=fixture();await assert.rejects(store.save('a/b',M.preset()));await assert.rejects(store.save('a',{...M.preset(),primary:'background:red'}));
 records['campaigns/a'].deletedAt=1;await assert.rejects(store.save('a',M.preset()),/no longer/);await assert.rejects(store.save('b',M.preset()),/no longer/);assert.equal(writes.length,0);
});
test('An account change during a transaction aborts the write',async()=>{
 const {sdk,writes}=fixture(),original=sdk.runTransaction;
 sdk.runTransaction=(_,fn)=>original(_,tx=>fn({...tx,get:async p=>{const row=await tx.get(p);sdk.auth.currentUser={uid:'other'};return row;}}));
 await assert.rejects(createCampaignAppearanceStore(sdk).save('a',M.preset('ocean')),/Account changed/);assert.equal(writes.length,0);
});
