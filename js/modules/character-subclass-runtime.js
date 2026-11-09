'use strict';
// Shared integration for later class modules; each module owns its edition and class boundaries.
var CharacterSubclassRuntime=(()=>{
 const names={monk:'CharacterMonkSubclasses',paladin:'CharacterPaladinSubclasses',ranger:'CharacterRangerSubclasses',rogue:'CharacterRogueSubclasses',sorcerer:'CharacterSorcererSubclasses',warlock:'CharacterWarlockSubclasses',wizard:'CharacterWizardSubclasses',artificer:'CharacterArtificerSubclasses'};
 function modules(){return Object.entries(names).map(([id,name])=>({id,module:globalThis[name]||(typeof require==='function'?require('./character-'+id+'-subclasses'):null)})).filter(r=>r.module);}
 function derive(d,opts={}){return modules().map(({module})=>module.derive(d,opts)).filter(r=>r.active);}
 function onEvent(d,event,opts){for(const {module}of modules())module.onEvent?.(d,event,opts);}
 function apply(d,stats,opts){for(const {module}of modules())module.apply?.(d,stats,opts);}
 function reconcileEquipment(d,opts){for(const {module}of modules())module.reconcileEquipment?.(d,opts);}
 return{reconcileEquipment,names,modules,derive,onEvent,apply};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CharacterSubclassRuntime;
