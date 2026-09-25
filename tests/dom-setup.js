window.testSheetDocs={};window.testSheetFail=false;window.testWrites=[];window.testAlerts=[];window.testFailWrite=false;window.testAuthCallback=null;
window.alert = text => testAlerts.push(text);
window.confirm = () => true;
const fakeAuth={currentUser:{uid:'dm',email:'dm@example.test'}};
const fakeWrite=async(path,data)=> { if(testFailWrite) throw new Error('Simulated permission-denied'); testWrites.push({path,data}); };
window.__DND_VAULT_DEPS__={db:{},auth:fakeAuth,storage:{},provider:{},
 doc:(_, ...path)=>path.join('/'), collection:(_, ...path)=>path.join('/'),
 setDoc:fakeWrite,updateDoc:fakeWrite,deleteDoc:path=>fakeWrite(path,null),
 writeBatch:()=>{const writes=[];return {set:(p,d)=>writes.push([p,d]),delete:p=>writes.push([p,null]),commit:async()=>{if(testFailWrite)throw Error('Simulated permission-denied');for(const [p,d] of writes) await fakeWrite(p,d);}}},
 getDocs:async()=>({docs:[]}),getDoc:async p=>{if(testSheetFail)throw Object.assign(Error('Permission denied'),{code:'permission-denied'});return {exists:()=>!!testSheetDocs[p],data:()=>structuredClone(testSheetDocs[p])};},
 runTransaction:async(_,work)=>{const pending=[];const result=await work({get:async p=>({exists:()=>!!testSheetDocs[p],data:()=>structuredClone(testSheetDocs[p])}),set:(p,d)=>pending.push([p,d]),update:(p,d)=>pending.push([p,{...testSheetDocs[p],...d}])});for(const [p,d] of pending)testSheetDocs[p]=d;return result;},
 onAuthStateChanged:(_,cb)=>{window.testAuthCallback=cb;},signOut:async()=>{fakeAuth.currentUser=null;await testAuthCallback(null);},
 query:()=>{},where:()=>{},limit:()=>{},ref:()=>{},getDownloadURL:async()=>'',uploadBytes:async()=>{}
};
