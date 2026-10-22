const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const script=path.resolve(__dirname,'../.github/scripts/prepare-browser-apt.sh');
test('CI setup replaces stalled Ubuntu mirror in mirror lists and source formats, preserves signatures and other repositories, and is repeatable',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'campaignatlas-apt-'));
 try{
  fs.mkdirSync(path.join(root,'sources.list.d'));
  const files={
   'apt-mirrors.txt':'http://azure.archive.ubuntu.com/ubuntu priority:1\nhttps://archive.ubuntu.com/ubuntu priority:2\n',
   'sources.list':'deb http://azure.archive.ubuntu.com/ubuntu noble main\n',
   'sources.list.d/ubuntu.sources':'Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-updates\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n',
   'sources.list.d/direct.sources':'Types: deb\nURIs: https://azure.archive.ubuntu.com/ubuntu\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n',
   'sources.list.d/third-party.list':'deb [signed-by=/usr/share/keyrings/vendor.gpg] https://packages.microsoft.com/ubuntu/24.04/prod noble main\n'
  };
  for(const [name,value] of Object.entries(files))fs.writeFileSync(path.join(root,name),value);
  execFileSync('bash',[script,root]);
  for(const [name,value] of Object.entries(files))assert.equal(fs.readFileSync(path.join(root,name),'utf8'),value.replace(/https?:\/\/azure\.archive\.ubuntu\.com\/ubuntu/g,'https://archive.ubuntu.com/ubuntu'));
  const config=fs.readFileSync(path.join(root,'apt.conf.d/80campaignatlas-network'),'utf8');
  assert.match(config,/Acquire::Retries "2"/);assert.match(config,/Acquire::http::Timeout "20"/);assert.match(config,/Acquire::https::Timeout "20"/);assert.doesNotMatch(config,/Verify-Peer|AllowUnauthenticated|AllowInsecure/);
  execFileSync('bash',[script,root]);assert.equal(fs.readFileSync(path.join(root,'apt.conf.d/80campaignatlas-network'),'utf8'),config);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('CI setup also handles an existing empty APT directory',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'campaignatlas-apt-empty-'));
 try{execFileSync('bash',[script,root]);assert.ok(fs.existsSync(path.join(root,'apt.conf.d/80campaignatlas-network')));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
