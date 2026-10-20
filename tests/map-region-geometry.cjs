const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCampaignMapStore}=require('../js/modules/campaign-map-store');
const store=createCampaignMapStore({auth:{currentUser:{uid:'dm'}}});
const triangle=[{x:10,y:10},{x:70,y:10},{x:40,y:80}];
test('region geometry rejects malformed, crossing, duplicate and empty-area boundaries',()=>{
 for(const points of [null,'bad',[{}, {}, {}],triangle.slice(0,2),Array.from({length:13},(_,x)=>({x,y:x})),[{x:-1,y:0},...triangle],triangle.map(p=>({...p,y:NaN})),[{x:0,y:0},{x:20,y:20},{x:40,y:40}],[triangle[0],triangle[0],triangle[2]],[{x:10,y:10},{x:90,y:90},{x:10,y:90},{x:90,y:10}],triangle.map(p=>({...p,secret:'hidden'}))])assert.throws(()=>store.boundary(points,'Region'));
 assert.throws(()=>store.boundary(triangle,'City'));assert.deepEqual(store.boundary(triangle,'Region'),triangle);
 assert.deepEqual(store.boundary([...triangle].reverse(),'Region'),[...triangle].reverse());
});
test('legacy points survive normalization and each style and boundary survives saving',()=>{
 const pin={id:'place',name:'Place',description:'Public text',x:50,y:50,type:'City',revealed:true};
 const normalize=pin=>store.normalizeDraft('a',{title:'Atlas',imagePath:'campaign-maps/a/image',pins:[pin]}).pins[0];
 assert.equal(normalize(pin).markerStyle,'City');assert.deepEqual(normalize(pin).boundary,[]);
 for(const markerStyle of store.markerStyles)assert.equal(normalize({...pin,markerStyle}).markerStyle,markerStyle);
 assert.throws(()=>normalize({...pin,markerStyle:'injected'}));assert.deepEqual(normalize({...pin,type:'Region',boundary:triangle}).boundary,triangle);
});
