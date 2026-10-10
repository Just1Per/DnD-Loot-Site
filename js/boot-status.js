"use strict";
// This small independent script also reports failures in the module's SDK imports.
(() => {
 const panel=document.getElementById('siteBootPanel'),status=document.getElementById('siteBootStatus'),retry=document.getElementById('siteBootRetry');
 const failed=()=>{if(!panel?.isConnected)return;status.textContent='CampaignAtlas could not finish loading. Check your connection and try again.';retry.hidden=false;};
 document.addEventListener('campaignatlas:ready',()=>{clearTimeout(slow);panel?.remove();});
 document.addEventListener('campaignatlas:failed',failed);
 document.addEventListener('error',event=>{if(event.target?.id==='siteAppScript')failed();},true);
 // The module follows this script, so bind its error listener once parsing finishes too.
 document.addEventListener('DOMContentLoaded',()=>document.getElementById('siteAppScript')?.addEventListener('error',failed),{once:true});
 const slow=setTimeout(()=>{if(!panel?.isConnected)return;status.textContent='Loading is taking longer than expected. You can wait or try again.';retry.hidden=false;},15000);
 retry.addEventListener('click',()=>location.reload());
})();
