/** Explicit source/destination binding and read-only archive privacy checks. */
export const validBucket=name=>typeof name==='string'&&name.length>=3&&name.length<=222&&/^[a-z0-9][a-z0-9._-]+[a-z0-9]$/.test(name);
export function assertArchiveStorage(storage){
 if(!storage||Object.keys(storage).some(key=>!['sourceBucket','archiveBucket'].includes(key))||!validBucket(storage.sourceBucket)||!validBucket(storage.archiveBucket)||storage.sourceBucket===storage.archiveBucket)throw Error('Pin distinct source and private archive buckets.');
 return storage;
}
export async function verifyArchiveBucket(source,archive,{separate=false}={}){
 const [metadata]=await archive.getMetadata();
 if(metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled!==true)throw Error('Private archive requires uniform bucket-level access');
 if(separate){
  const [original]=await source.getMetadata();
  if(!metadata.projectNumber||String(metadata.projectNumber)!==String(original.projectNumber))throw Error('Private archive bucket must belong to the source project.');
  if(metadata.iamConfiguration?.publicAccessPrevention!=='enforced')throw Error('Separate private archive requires enforced public access prevention.');
 }
 const [policy]=await archive.iam.getPolicy({requestedPolicyVersion:3});
 if(!Array.isArray(policy.bindings)||policy.bindings.some(binding=>(binding.members||[]).some(member=>['allUsers','allAuthenticatedUsers'].includes(member))))throw Error('Private archive has a public IAM grant or unavailable policy; privacy cannot be guaranteed');
}
