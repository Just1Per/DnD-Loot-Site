const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCampaignMapStore}=require('../js/modules/campaign-map-store');
const store=createCampaignMapStore({auth:{currentUser:{uid:'dm'}}});
const triangle=[{x:10,y:10},{x:70,y:10},{x:40,y:80}];
test('region geometry rejects malformed, crossing, duplicate and empty-area boundaries',()=>{
 for(const points of [null,'bad',[{}, {}, {}],triangle.slice(0,2),Array.from({length:257},(_,x)=>({x,y:x})),[{x:-1,y:0},...triangle],triangle.map(p=>({...p,y:NaN})),[{x:0,y:0},{x:20,y:20},{x:40,y:40}],[triangle[0],triangle[0],triangle[2]],[{x:10,y:10},{x:90,y:90},{x:10,y:90},{x:90,y:10}],triangle.map(p=>({...p,secret:'hidden'}))])assert.throws(()=>store.boundary(points,'Region'));
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

test('large detailed regions preserve every point and enforce 256 corners',()=>{
 const points=Array.from({length:256},(_,i)=>({x:50+35*Math.cos(i*2*Math.PI/256),y:50+35*Math.sin(i*2*Math.PI/256)}));
 assert.equal(store.maxRegionCorners,256);assert.deepEqual(store.boundary(points,'Region'),points);
 const packed=store.encodeBoundary(points);assert.deepEqual(store.decodeBoundary(packed),points);
 assert.throws(()=>store.boundary([...points,{x:1,y:1}],'Region'),/256/);
 for(const replacement of [{x:101,y:50},{x:NaN,y:50},{x:50,y:50,secret:'PRIVATE'}])assert.throws(()=>store.boundary([...points.slice(0,-1),replacement],'Region'));
 for(const invalid of ['1,2;3,4','1,2;3,4;101,5','1,2;3,4;5,6;PRIVATE','1,2;3,4;5,6\n',Array(257).fill('1,2').join(';')])assert.throws(()=>store.decodeBoundary(invalid));
 const tiny=[{x:1e-8,y:0},{x:20,y:0},{x:20,y:20},{x:1e-8,y:20}];assert.deepEqual(store.decodeBoundary(store.encodeBoundary(tiny)),tiny,'small coordinates are expanded without rounding');
});

test('region appearance validates exact colour and opacity without changing legacy pins',()=>{
 const pin={id:'region',name:'Region',description:'',x:50,y:50,type:'Region',boundary:triangle,revealed:true},normalize=pin=>store.normalizeDraft('a',{title:'Atlas',imagePath:'campaign-maps/a/image',pins:[pin]}).pins[0];
 assert.equal('regionStyle' in normalize(pin),false);assert.deepEqual(store.regionStyle(),{color:'#b68d45',opacity:.25});
 for(const opacity of [0,.25,.8,1])assert.deepEqual(normalize({...pin,regionStyle:{color:'#AbC012',opacity}}).regionStyle,{color:'#abc012',opacity});
 for(const regionStyle of [null,[],{}, {color:'#fff',opacity:.5},{color:'red',opacity:.5},{color:'#ff0000;display:none',opacity:.5},{color:'#ffffff',opacity:'0.5'},{color:'#ffffff',opacity:-.1},{color:'#ffffff',opacity:1.1},{color:'#ffffff',opacity:NaN},{color:'#ffffff',opacity:Infinity},{color:'#ffffff',opacity:.5,privateNotes:'SECRET'}])assert.throws(()=>normalize({...pin,regionStyle}));
 assert.throws(()=>normalize({...pin,type:'City',boundary:[],regionStyle:{color:'#ffffff',opacity:.5}}));
});
