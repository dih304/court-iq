# COURT IQ — refined free iPhone Home Screen app

COURT IQ is a mobile-first progressive web app (PWA). Host it over HTTPS, open it in Safari on your iPhone, then choose **Share → Add to Home Screen**. It is not currently an App Store listing and does not require a Mac.

## What's new in this version
- A redesigned, premium dark-court interface with responsive layouts and a bottom navigation bar
- Personal profile setup: name, main skill goal, experience, training days, session length, equipment, and personal target
- Goal-specific drills for shooting, ball handling, finishing, defense, and all-around development
- Expanded step-by-step drill instructions, sets/reps, and coaching cues visible directly in the Train tab and Focus Mode
- Updated offline cache version so the latest drill instructions replace the earlier cached app
- Equipment-aware variations for ball-and-hoop, ball-without-hoop, and no-ball days
- Daily readiness check-in (ready / okay / tired) with notes and a lighter-day reminder
- Focus-mode timer with 30-second, 1-minute, 2-minute, and 5-minute presets; pause and reset controls
- Drill checklist and completed workout logging
- Six-week roadmap with completion toggles
- Weekly consistency indicator, training minutes, current and best streaks
- Shooting makes/attempts log with percentage and optional drill note
- Player journal for a win and a next focus
- CSV export of workouts, shooting stats, check-ins, and journal notes
- Offline shell caching after the first successful online load
- Responsive design, safe-area spacing, keyboard focus styles, and reduced-motion support

## Free setup with GitHub Pages
1. On your Windows computer, sign in or create a free account at https://github.com/.
2. Create a **public** repository named `court-iq`.
3. Unzip this download. Upload **everything inside** the `COURT_IQ_REFINED` folder to the repository root. You should see `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`, and an `icons` folder at the top level.
4. In the repository, open **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/(root)`, then Save.
6. Wait for the Pages URL to appear. It will look like `https://YOUR-USERNAME.github.io/court-iq/`.
7. Open that URL in **Safari on your iPhone**. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
8. Open the new COURT IQ icon once while online. After the files are cached, the app shell can load offline.

## Data and privacy
- The app does not have accounts or a backend. Profile details, check-ins, workout logs, journal entries, and stats are stored in local browser storage on your device.
- GitHub Pages hosts the app files, not your personal workout logs.
- If you clear Safari website data or remove the app, local records may be lost. Use **Progress → Export CSV** occasionally to make a backup.
- Hosting the repository publicly means the source code is public; your local training logs are not uploaded to the repository.
- This is a training organizer, not medical advice. Warm up, rest, use safe spaces, and stop any activity that causes pain. Ask a qualified coach or trusted adult for help adapting training around an injury.

## Troubleshooting
- If the page does not load, confirm the repository root contains `index.html` and that GitHub Pages deployment completed.
- If the Home Screen app looks like an older version, open the hosted site online once, close and reopen the app, or remove and re-add the Home Screen icon.
- Offline use requires one successful load while online and a browser that supports service workers.


## Blue Edition update
The latest version uses a deep-navy and electric-blue visual theme with refreshed app icons and the “1000 TIMES COOLER” branding. All existing training plans, detailed drill instructions, timers, workout tracking, shooting stats, six-week plan, journal, readiness check-ins, recovery tools, and offline storage are retained. Replace the files in your existing GitHub Pages repository with this version to update the app.
