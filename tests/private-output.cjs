const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const ready=import('../scripts/private-output.mjs');
const windows=process.platform==='win32';
const ps=(source,args=[])=>execFileSync(path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-Command',source,...args],{encoding:'utf8'});
function report(){return {currentSid:'S-1-5-21-123',ownerSid:'S-1-5-21-123',directory:true,reparse:false,protected:true,rules:[{sid:'S-1-5-21-123',allow:true,inheritOnly:false,rights:2032127}]};}
test('Windows ACL validation fails closed on foreign grants/owners, inherited future grants and malformed metadata',async()=>{
 const {validateWindowsAcl}=await ready;assert.ok(validateWindowsAcl(report(),{directory:true}));
 for(const update of [r=>r.ownerSid='S-1-5-21-999',r=>r.reparse=true,r=>r.rules.push({sid:'S-1-1-0',allow:true,inheritOnly:false,rights:1}),r=>r.rules.push({sid:'S-1-5-11',allow:true,inheritOnly:true,rights:1}),r=>r.rules=[],r=>r.rules[0].rights='full',r=>delete r.reparse,r=>r.directory=false]){const r=report();update(r);assert.throws(()=>validateWindowsAcl(r,{directory:true}));}
});
test('new private directories/files are verified, durable and never overwrite existing captures',async()=>{
 const {createPrivateDirectory,assertPrivateDirectory,writePrivateBytes,assertPrivateFile}=await ready,dir=path.join(os.tmpdir(),'campaignatlas-private-'+crypto.randomUUID());
 try{await createPrivateDirectory(dir);await assertPrivateDirectory(dir);const file=path.join(dir,'Synthetic data $ (not code).json');await writePrivateBytes(file,'Synthetic private export');await assertPrivateFile(file);assert.equal(await fs.readFile(file,'utf8'),'Synthetic private export');await assert.rejects(writePrivateBytes(file,'Replacement'));await assert.rejects(createPrivateDirectory(dir),/already exists/);await createPrivateDirectory(dir,{allowExisting:true});if(!windows){assert.equal((await fs.stat(dir)).mode&0o077,0);assert.equal((await fs.stat(file)).mode&0o077,0);}}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('POSIX shared directories/files and symlinks remain rejected',{skip:windows},async()=>{
 const {createPrivateDirectory,assertPrivateDirectory,assertPrivateFile}=await ready,base=await fs.mkdtemp(path.join(os.tmpdir(),'campaignatlas-posix-'));
 try{const dir=path.join(base,'shared');await fs.mkdir(dir,{mode:0o755});await fs.chmod(dir,0o755);await assert.rejects(assertPrivateDirectory(dir),/0700/);await assert.rejects(createPrivateDirectory(dir,{allowExisting:true}),/0700/);const file=path.join(base,'public');await fs.writeFile(file,'Synthetic');await fs.chmod(file,0o644);await assert.rejects(assertPrivateFile(file),/0600/);const link=path.join(base,'link');await fs.symlink(base,link);await assert.rejects(assertPrivateDirectory(link),/link/);}
 finally{await fs.rm(base,{recursive:true,force:true});}
});
test('native Windows ACL inspection rejects broad folder/file access and junction parents',{skip:!windows},async()=>{
 const {createPrivateDirectory,assertPrivateDirectory,writePrivateBytes,assertPrivateFile}=await ready,base=path.join(os.tmpdir(),'campaignatlas-acl-'+crypto.randomUUID());await createPrivateDirectory(base);
 const envBefore=process.env.CAMPAIGNATLAS_ACL_TEST_PATH;
 const widen=target=>{process.env.CAMPAIGNATLAS_ACL_TEST_PATH=target;ps("$p=$env:CAMPAIGNATLAS_ACL_TEST_PATH; $a=Get-Acl -LiteralPath $p; $sid=New-Object System.Security.Principal.SecurityIdentifier('S-1-5-32-545'); $r=New-Object System.Security.AccessControl.FileSystemAccessRule($sid,[System.Security.AccessControl.FileSystemRights]::Read,[System.Security.AccessControl.AccessControlType]::Allow); $a.AddAccessRule($r); Set-Acl -LiteralPath $p -AclObject $a");};
 try{const dir=path.join(base,'folder');await createPrivateDirectory(dir);const file=path.join(dir,'capture.json');await writePrivateBytes(file,'Synthetic');widen(file);await assert.rejects(assertPrivateFile(file),/ACL/);widen(dir);await assert.rejects(assertPrivateDirectory(dir),/ACL/);await assert.rejects(writePrivateBytes(path.join(dir,'must-not-exist'),'Synthetic'),/ACL/);await assert.rejects(fs.access(path.join(dir,'must-not-exist')));
 const safe=path.join(base,'safe');await createPrivateDirectory(safe);const junction=path.join(base,'junction');await fs.symlink(safe,junction,'junction');await assert.rejects(assertPrivateDirectory(junction));await assert.rejects(createPrivateDirectory(path.join(junction,'child')));await assert.rejects(fs.access(path.join(safe,'child')));}
 finally{if(envBefore===undefined)delete process.env.CAMPAIGNATLAS_ACL_TEST_PATH;else process.env.CAMPAIGNATLAS_ACL_TEST_PATH=envBefore;await fs.rm(base,{recursive:true,force:true});}
});
test('Windows PowerShell files parse and launcher rejects missing identity without loading Firebase',{skip:!windows},()=>{
 const script=path.resolve(__dirname,'../Start-ItemMigration.ps1'),helper=path.resolve(__dirname,'../scripts/private-output-windows.ps1');
 for(const file of [script,helper]){process.env.CAMPAIGNATLAS_ACL_TEST_SCRIPT=file;ps("$tokens=$null;$errors=$null;[void][System.Management.Automation.Language.Parser]::ParseFile($env:CAMPAIGNATLAS_ACL_TEST_SCRIPT,[ref]$tokens,[ref]$errors);if($errors.Count){throw ($errors | Out-String)}");}
 delete process.env.CAMPAIGNATLAS_ACL_TEST_SCRIPT;
 assert.throws(()=>execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script],{stdio:'pipe'}),/Command failed/);
});
