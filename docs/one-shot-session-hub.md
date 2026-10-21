# One Shot session hub and guidance

One Shots resumes under the owner’s October 21 instruction to continue the agreed campaign experience plan. The existing records, approval, participant and character namespaces are preserved.

## Adventure flow

- DMs use **DM Workspace → One Shots**. The sidebar list shows the invitation summary, status, level limit and intended duration before opening an adventure.
- Write the invitation in **The adventure** and configure **Session & characters**. **Private preparation** starts collapsed. **Save adventure** stays visible while scrolling; preview, archive/restore and print are under **More options**.
- Save before **Host approval & invitations**. Only campaign DMs can approve a host and invite current campaign members. Approved player hosts prepare and run that adventure through **My Character → My One Shots** without campaign-wide DM access.
- Participants receive a reading page with the introduction, session facts, invitation response and their own character-sheet cards. They accept before opening assigned sheets or creating sheets when the creation mode allows it. Private preparation is not fetched for ordinary participants.
- Pre-generated sheets have a collapsed assignment area. Adventure encounters are independent copies; their damage, rounds and conditions never change a campaign encounter or creature master.
- Roster actions require saved preparation. Failed roster loads offer **Retry roster**. Responses from a previous campaign/account/record are discarded, including reloads after a successful roster action.

Status, duration and intended party size are planning metadata. They do not schedule a date, send external notifications, lock completed adventures, auto-level sheets or transfer rewards. Archiving retains records and can be reversed; it is not campaign deletion.

## Guide and contextual help

The header **Guide** now uses current navigation and explains Journal reading, deliberate World/NPC text-and-image publishing, four World layouts, five point-marker styles and 3–12-corner regions, chapter recaps/milestones, One Shot approval/invitations/sheets, reusable Library content and recoverable campaign removal. Guide destinations recheck campaign permissions and use existing unsaved-change guards.

One Shot sections, host/invitation controls, level/duration/player settings, roster assignments, World layouts/publication and map marker/region fields have specific explanations. Section help describes who can see each kind of content and which save/publish action applies.

Repeated character-sheet fields use hover/focus explanations instead of individual question-mark badges: saving-throw proficiency/bonuses, ability base scores, additional skill bonuses and repeated spell-slot totals/usage. Saving throws retains one section help button. Keyboard focus shows the same tooltip, Escape dismisses it, and controls retain their normal input behavior and an accessible text description. These fields add no help-button tab stops. Existing section explanations and individual help for less repetitive choices remain available.

## Rules and rollout

**This PR requires no new Firestore or Storage rules and no migration.** It uses the existing One Shot permissions, verified by ten real emulator groups: DM approval, scoped hosting, invitation acceptance, isolated sheets/combat, level limits, query boundaries, proposal approval denial and revoked access.

The earlier World-layout PR #167 independently requires its included Firestore rules. The owner confirmed those rules are not yet published; publishing a World post with a saved layout may fail until they are. Do not confuse this prerequisite with a new One Shot rules change. No production deployment, rules publication or data migration is performed here.

## Validation

`test:one-shot-hub` exercises creation, approval, invitation, assignment, failed-save recovery, unsaved navigation, host/participant views, private-read isolation, print, sheet entry, roster retry/stale loads, hover/focus/Escape help, working numeric/checkbox controls and WCAG at 1440, 390 and 320 pixels. CI runs it early. Screenshots are in the browser artifact as `one-shot-{host,player}-{1440,390}.png` and `sheet-compact-help-{1440,390}.png`.

Existing workspace-browser covers full separate sheet save/inventory and approved-host combat. DM workspace, guide/DOM, shared publishing, World layouts, packaging and One Shot emulator tests cover affected behavior.
