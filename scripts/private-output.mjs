/** Local export protection: POSIX modes or Windows DACLs, never chmod on Windows. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);
const windowsScript=fileURLToPath(new URL('./private-output-windows.ps1',import.meta.url));
export function validateWindowsAcl(report,{directory}={}){
 const trusted=new Set([report?.currentSid,'S-1-5-18','S-1-5-32-544']);
 if(!/^S-1-/.test(report?.currentSid||'')||!trusted.has(report?.ownerSid)||report.reparse!==false||report.directory!==directory||typeof report.protected!=='boolean'||!Array.isArray(report.rules))throw Error('Private Windows path has an invalid owner, type or reparse point.');
 if(report.rules.some(rule=>typeof rule.sid!=='string'||typeof rule.allow!=='boolean'||typeof rule.inheritOnly!=='boolean'||!Number.isSafeInteger(rule.rights)||rule.rights<0))throw Error('Invalid Windows ACL rule metadata.');
 const allows=report.rules.filter(rule=>rule.allow&&!rule.inheritOnly&&rule.rights!==0);
 if(!allows.length||!allows.some(rule=>rule.sid===report.currentSid)||allows.some(rule=>!trusted.has(rule.sid)))throw Error('Private Windows ACL must grant access only to the current user, SYSTEM and Administrators.');
 // Directory inheritance must not give an untrusted principal access to later files.
 if(report.rules.some(rule=>rule.allow&&rule.rights!==0&&!trusted.has(rule.sid)))throw Error('Private Windows ACL grants inherited access to another account.');
 return report;
}
async function windowsAcl(target,action,directory){
 for(const root of [process.env.OneDrive,process.env.OneDriveConsumer,process.env.OneDriveCommercial,path.join(os.homedir(),'OneDrive')].filter(Boolean)){const sync=path.resolve(root).toLowerCase(),value=path.resolve(target).toLowerCase();if(value===sync||value.startsWith(sync+path.sep))throw Error('Private exports must be outside OneDrive. Use the default local output directory.');}
 const binary=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
 let result;try{result=await execute(binary,['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',windowsScript,'-Action',action,'-LiteralPath',target],{windowsHide:true,timeout:30000,maxBuffer:128*1024});}
 catch{throw Error('Could not verify/create the private Windows directory or file. Use a local NTFS profile folder without junctions or shared ACLs; do not use OneDrive.');}
 let report;try{report=JSON.parse(result.stdout.trim());}catch{throw Error('Windows ACL inspection returned an invalid result. No private output was written.');}
 validateWindowsAcl(report,{directory});return target;
}
export async function assertPrivateDirectory(directory){
 const target=path.resolve(directory),stat=await fs.lstat(target);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Private directory must be a real directory, not a link.');
 if(process.platform==='win32')return windowsAcl(target,'Inspect',true);
 if((stat.mode&0o077)!==0)throw Error('Private directory must have permissions 0700.');
 return target;
}
export async function createPrivateDirectory(directory,{allowExisting=false}={}){
 const target=path.resolve(directory);
 try{await fs.lstat(target);if(!allowExisting)throw Error('Private directory already exists; choose a new directory.');return await assertPrivateDirectory(target);}
 catch(error){if(error.code!=='ENOENT')throw error;}
 if(process.platform==='win32')await windowsAcl(target,'Create',true);else await fs.mkdir(target,{mode:0o700});
 return assertPrivateDirectory(target);
}
export async function assertPrivateFile(file){
 const target=path.resolve(file),stat=await fs.lstat(target);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Private file must be a regular file, not a link.');
 if(process.platform==='win32'){await assertPrivateDirectory(path.dirname(target));return windowsAcl(target,'Inspect',false);}
 if((stat.mode&0o077)!==0)throw Error('Private file must have permissions 0600.');return target;
}
export async function writePrivateBytes(file,content){
 if(process.platform==='win32')await assertPrivateDirectory(path.dirname(path.resolve(file)));
 const handle=await fs.open(file,'wx',0o600);
 try{await assertPrivateFile(file);await handle.writeFile(content);await handle.sync();}finally{await handle.close();}
}
export async function privateOutputBase(){
 const base=process.platform==='win32'?path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'CampaignAtlas-Private'):os.homedir();
 if(process.platform==='win32')await createPrivateDirectory(base,{allowExisting:true});return base;
}
