/* Explicit publication marker shared by catalogue queries and import boundaries. */
(function(root){
 'use strict';
 const STATUS='approved-v1';
 const approved=item=>!!item&&item.catalogueStatus===STATUS;
 const audience=admin=>admin?'administrator':'reviewed-v1';
 const api=Object.freeze({STATUS,approved,audience});
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.SharedCataloguePolicy=api;
})(typeof window==='object'?window:globalThis);
