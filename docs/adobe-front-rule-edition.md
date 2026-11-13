# Rules version on the first sheet page

The first Adobe page has a rules button at the right edge of the Player Name row. It displays the current edition (`2014` or `2024`) and opens a dedicated Rules version dialog. Player Name remains editable in the shortened field beside it.

Choose an edition and use **Apply rules** to update the sheet draft, then **Save sheet** to persist it. Cancel, Escape and the close button discard the dialog's draft. The Class/Level dialog no longer contains the edition selector.

The selector applies to the whole character, including multiclass builds, and respects campaign edition restrictions. It also works before a new character has a class. Artificers can select a compatible source version in the same dialog. Changing editions uses the existing progression validation and spent spell-slot guard; players should review class, race and background choices afterwards. Incompatible subclass selections are cleared as before, while stored feature choices and spent resources are retained.

Print includes the selected edition beside Player Name without the dropdown arrow.

Regression coverage: `tests/adobe-front-edition-browser.cjs` checks placement, keyboard access, Apply/Cancel, retained resources, save/reopen, campaign restrictions, new-character setup, mobile accessibility and actual PDF output. Existing edition, native-class, page-choice and Mithral reference suites cover the relocated workflow.
