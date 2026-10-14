# Enable AI Lookup (Firebase Gemini)

This PR adds a small open-book icon beside Library items, spells, feats, subclass selectors and creature names. The top Guide explains it. A user can edit the entry name, type, rules edition and sourcebook, then explicitly request a source-grounded overview.

**Until the owner completes setup, the Gemini request is disabled and the lookup displays an ordinary Google Search link. All other site functions continue working.**

## Owner setup — exact steps

1. Sign into https://console.firebase.google.com/ and choose **dnd-loot-site**. Navigate to **AI Services → AI Logic → Get started**.
2. Select **Gemini Developer API** and complete the API enablement. Review the Gemini billing, terms, usage quota and Google Search grounding fees. The app uses **gemini-3.8-flash**, configured in js/app.js; verify model availability for your project. Grounding isn't necessarily free.
3. In https://console.cloud.google.com/ (same project), create a **reCAPTCHA Enterprise score-based Web key**. Register actual hosting domains such as **dnd-loot-site.web.app**, **dnd-loot-site.firebaseapp.com**, and your custom domain if any. Do not add localhost to a production key.
4. In Firebase Console → **Security → App Check → Apps**, register your Web app (Firebase app ID: **1:345641251366:web:081fe07bc2cc859901ace7**) with **reCAPTCHA Enterprise**, using the same public Web site key. The Firebase AI Logic onboarding flow may enforce App Check automatically; verify legitimate requests are accepted.
5. In your GitHub repository edit **js/firebase.js**: replace the empty string in **const AI_LOOKUP_RECAPTCHA_SITE_KEY = "";** with your **public reCAPTCHA Enterprise Web site key**. Do not commit a Gemini API secret, any private service credential, or a reCAPTCHA secret. Site keys are public and designed to be embedded in browser scripts.
6. Review/merge the PR and deploy Hosting, or deploy the configuration as part of the merge. Sign in, open an item/spell/feat with the little open-book icon, review the parameters, click **Search with Gemini**, and confirm answer, source links and Google Search suggestions work.
7. Set API/billing quotas and budget alerts in Google Cloud/Firebase before inviting many players. App Check limits abuse but is not a per-user rate limit. The included 15-second client cooldown is only a usability safeguard, not secure enforcement. Hard per-user budgets would require an authenticated server proxy or quota service.
8. Update your site's privacy notice if necessary: the lookup sends the entry name, edition, type and book reference to Google's AI service only after Search with Gemini is clicked.

For local testing after App Check enforcement, use the Firebase App Check debug provider with a console-registered debug token in local-only development. Do not commit debug tokens or allow localhost on the production reCAPTCHA key:
https://firebase.google.com/docs/app-check/web/debug-provider

## Behaviour and limitations

- **Lookup never runs automatically.** Opening the dialog makes no Gemini request.
- Gemini can use Google Search grounding. If sources are available, the result shows separate source links and the provider-generated Google Search suggestions. If no sources are returned, the site explicitly labels the answer **unverified**.
- The prompt requests brief independently worded factual overviews, not original non-SRD descriptions, full stat blocks or complete sourcebook text. This doesn't confer an automatic copyright exemption; legal review remains advisable.
- Answers are **not stored** in Firestore, in the SRD catalogue, or in a client cache. Original spells/items and inventories are unchanged.
- When a character edition is selected, it is passed through (2014 or 2024); for an item without edition metadata, the search explicitly says edition not specified until the user chooses one.
- AI prose is rendered as plain text; external source links accept only HTTPS/HTTP URLs. Google's suggestion markup is isolated in a sandboxed iframe.
- No Cloud Functions or Firestore/Storage rule changes are required. AI Logic enablement, App Check registration and billing setup happen separately in Google's consoles.

Official sources:
- Firebase AI Logic web: https://firebase.google.com/docs/ai-logic/get-started?platform=web
- Grounding with Google Search: https://firebase.google.com/docs/ai-logic/grounding-google-search
- Firebase App Check with reCAPTCHA Enterprise: https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider
- AI Logic pricing: https://firebase.google.com/docs/ai-logic/pricing
