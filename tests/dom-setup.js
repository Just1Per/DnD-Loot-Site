window.testSheetDocs={};window.testSheetFail=false;window.testWrites=[];window.testAlerts=[];window.testFailWrite=false;window.testAuthCallback=null;
window.testLookupCalls=[];
window.alert = text => testAlerts.push(text);
window.confirm = () => true;
const fakeAuth={currentUser:{uid:'dm',email:'dm@example.test'}};
const fakeWrite=async(path,data)=> { if(testFailWrite) throw new Error('Simulated permission-denied'); testWrites.push({path,data}); };
window.__DND_VAULT_DEPS__={db:{},auth:fakeAuth,storage:{},provider:{},
 addDoc:async(path,data)=>{const id='created-'+Object.keys(testSheetDocs).length;await fakeWrite(path+'/'+id,data);testSheetDocs[path+'/'+id]=structuredClone(data);return{id};},sendPasswordResetEmail:async(_,email)=>{testWrites.push({auth:'password-reset',email});},
 doc:(_, ...path)=>path.join('/'), collection:(_, ...path)=>path.join('/'),
 setDoc:fakeWrite,updateDoc:fakeWrite,deleteDoc:path=>fakeWrite(path,null),
 writeBatch:()=>{const writes=[];return {set:(p,d)=>writes.push([p,d]),update:(p,d)=>writes.push([p,d]),delete:p=>writes.push([p,null]),commit:async()=>{if(testFailWrite)throw Error('Simulated permission-denied');for(const [p,d] of writes) await fakeWrite(p,d);}}},
 getDocs:async()=>({docs:[]}),getDoc:async p=>{if(testSheetFail)throw Object.assign(Error('Permission denied'),{code:'permission-denied'});return {exists:()=>!!testSheetDocs[p],data:()=>structuredClone(testSheetDocs[p])};},
 runTransaction:async(_,work)=>{const pending=[];const result=await work({get:async p=>({exists:()=>!!testSheetDocs[p],data:()=>structuredClone(testSheetDocs[p])}),set:(p,d)=>pending.push([p,d]),update:(p,d)=>pending.push([p,{...testSheetDocs[p],...d}]),delete:p=>pending.push([p,null])});for(const [p,d] of pending){if(d===null)delete testSheetDocs[p];else testSheetDocs[p]=d};return result;},
 onAuthStateChanged:(_,cb)=>{window.testAuthCallback=cb;},signOut:async()=>{fakeAuth.currentUser=null;await testAuthCallback(null);},
 query:()=>{},where:()=>{},limit:()=>{},increment:n=>({__increment:n}),orderBy:()=>{},startAfter:()=>{},documentId:()=>{},ref:()=>{},getDownloadURL:async()=>'',uploadBytes:async()=>{},
 aiLookupConfigured:true,
 lookupAI:async prompt=>{testLookupCalls.push(prompt);return {text:'A short grounded factual overview.',metadata:{groundingChunks:[{web:{title:'Official source',uri:'https://www.dndbeyond.com/' }},{web:{title:'Unsafe source',uri:'javascript:alert(1)'}}],searchEntryPoint:{renderedContent:'<div>Google source suggestions</div>'}}};}
};
