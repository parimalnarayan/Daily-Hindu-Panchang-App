# Daily Hindu Panchang App

Public companion repository for **Daily Hindu Panchang**.

- **Website:** https://parimalnarayan.github.io/Daily-Hindu-Panchang-App/
- **Privacy Policy:** https://parimalnarayan.github.io/Daily-Hindu-Panchang-App/privacy-policy.html
- **Android source:** https://github.com/parimalnarayan/Daily-Hindu-Panchang

The project is designed around a fast, privacy-first daily Panchang experience with local calculations, Hindu calendar data, festivals/vrat and government-holiday information.

## Account, subscription and deletion pages (V6 review)

- `privacy-policy.html`: current local storage, optional accounts, Play verification, ad consent, retention and deletion, in English/Hindi.
- `subscription-terms.html`: one annual auto-renewing Premium plan, Play-authoritative pricing, ad-free benefit, renewal/cancellation/refund and offline terms.
- `account-deletion.html`: instructions and a Firebase email/password deletion portal; no app installation required. It calls the trusted `deleteOwnAccount` backend with the authenticated account, never a user-supplied UID. Google Play cancellation is separate and clearly linked.

The public support route currently uses this repository's maintainer/issues page. The owner must supply/confirm a monitored public support email before Play listing finalization; no address is invented. Do not post credentials, account email, purchase tokens or payment details in public issues.

### Deployment configuration

The pages are static and contain no tracking scripts. The deletion form lazily imports pinned Firebase JavaScript modules from Google's CDN only when submitted. Authentication uses memory-only persistence and is signed out after the request; passwords are cleared. App Check uses reCAPTCHA Enterprise. A fresh password sign-in provides the recent authentication required by the callable backend.

The existing Firebase project owner must register the website as a web app, authorize `parimalnarayan.github.io` in Firebase Auth, and register the actual domain for App Check/reCAPTCHA Enterprise. Provision the backend in the Android repository as described in its `functions/README.md`.

Copy `firebase-config.example.json` to **deployment-only** `firebase-config.json` and supply that project's public Firebase web configuration plus public App Check site key. The real file is git-ignored. These public identifiers are not service-account credentials; never put private keys, signing material, tokens or Admin credentials here. The form reports unavailable configuration when that file is absent. This prevents a false deletion-success claim before backend/web configuration is complete.

Static policy reading works without Firebase configuration. Backend deployment, approved publication of these updated pages, App Check registration and real account-deletion verification remain external gates. The existing GitHub Pages workflow is unchanged; it runs on `main` pushes/manual dispatch. **This task does not push main, dispatch Actions or publish.** Feature changes are submitted for V6 review only.

### Local verification

Run `python3 -m http.server 8008 --bind 127.0.0.1` in the repository. With Python Playwright and Chromium installed, run `python3 tests/test_site.py` (`SITE_URL` can override the local origin). Six checks cover English/Hindi at 360/390/430 widths, dark mode, local links, missing configuration, in-memory auth, deletion success/error presentation using intercepted SDK fixtures, reset-password flow and the unchanged app-ads publisher record. Browser fixtures do not establish production Firebase deletion. Actual local-browser screenshots are in `docs/evidence`; authentication SDK responses in form tests are fixtures. The 2026-11-08 rerun passes all six checks, including localized policy dates. Deletion disclosures match account-scoped temporary PNG cleanup in the Android app; externally saved/shared copies remain outside app cleanup.
