# Shared Fighting Style choices

The class builder and the legacy Feats browser spend the same class allowance: Fighter level 1, Paladin/Ranger level 2. Multiclass allowances use each actual assigned class level, capped at character level in feat availability. Normal feat/ASI choices and DM approvals remain separate.

Choose each style once. A class-selected style cannot be added again through Feats. An older style selected on Feats consumes the same allowance; its class panel says “Chosen on Feats” instead of prompting for an extra style. Remove that Feats entry before choosing its replacement in class controls. Saving retains the change.

Rendering no longer copies older feat selections into class choices. Existing copied aliases remain saved, use one allowance and do not grant the same feat effect twice. Duplicate styles across classes grant one class effect, while the later duplicate is marked for review and can be replaced. No save data is deleted or migrated. Existing excess manual feats remain preserved and flagged by the progression budget.

This fixes base class allowance reconciliation. Additional subclass/feat sources such as Champion and Fighting Initiate still need their own explicit feature support. Situational style effects marked manual remain outside this change.

Validation: engine tests cover shared controls, actual multiclass unlocks, duplicates, existing aliases, removal/replacement, edition-specific options and DM/ASI budgets. Browser coverage includes disabled duplicate options, older Feats notices, no render-time mutation, save/reopen and replacing a removed legacy style.

No Firestore or Storage rule changes, production deployment or data migration are required.
