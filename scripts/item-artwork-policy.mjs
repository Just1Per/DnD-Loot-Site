/** Owner instruction, recorded separately from the licence for replacement text. */
export const generatedArtworkPolicy=Object.freeze({
 mode:'preserve-generated',
 origin:'ChatGPT-generated',
 evidence:'Owner stated on 2026-10-19 that all item illustrations were generated with ChatGPT from their prompts and instructed that they be preserved. Retained items keep their art; retired items and their art go to the existing private campaign.'
});
export function assertArtworkPolicy(policy){
 if(policy?.mode!=='preserve-generated'||policy.origin!=='ChatGPT-generated'||typeof policy.evidence!=='string'||!policy.evidence.trim()
  ||Object.keys(policy).some(key=>!['mode','origin','evidence'].includes(key)))throw Error('A generated-art preservation policy is required; blanket artwork deletion is not supported.');
 return policy;
}
