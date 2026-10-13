# COURT IQ — Free iPhone Home Screen App

COURT IQ is a lightweight progressive web app (PWA). It can be hosted for free and added to an iPhone Home Screen so it opens from an app-style icon. It is not an App Store app and does not need a Mac to publish.

## Included
- Personalized training plan based on your main goal, experience, weekly schedule, session length, equipment, and optional notes
- Daily workout with drill descriptions and a timer
- Six-week roadmap with week completion toggles
- Workout history, sessions/minutes/streak tracking
- Shooting makes/attempts log and percentage feedback
- Export training history to CSV
- Warm-up, quality-reps, and recovery reminders
- Offline caching after the first successful load on a supported browser
- Data saved locally in the browser on your device

## Publish for free with GitHub Pages
1. On your computer, go to https://github.com and sign in or create an account.
2. Create a new **public** repository named `court-iq`.
3. Upload all files and folders inside this ZIP's `COURT_IQ_PWA` folder (upload `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, `README.md`, and the `icons` folder; do not upload only the ZIP).
4. In the repository, open **Settings → Pages**.
5. Under build/deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish and open the website URL it gives you. It typically looks like `https://YOUR-USERNAME.github.io/court-iq/`.
7. Open that URL in **Safari on your iPhone**. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
8. Open COURT IQ from the new Home Screen icon. Open it once while online so it can cache its files for offline use.

## Important
- Hosting is free on GitHub Pages for a public repository. Anyone who has the URL can access the app, but the training data itself is stored locally in the browser on your device and is not uploaded to GitHub.
- Browser/site data can be lost if you clear Safari website data or remove the app. Export CSV backups occasionally.
- This version does not sync between devices, have accounts, or automatically import phone health data.
- iPhone installation requires the app to be served over HTTPS; opening `index.html` directly from a file manager is not enough for install/offline features.
- Plans are general training suggestions, not medical advice. Use safe spaces, warm up, rest when needed, and stop if you feel pain. Adapt drills with a coach/guardian if you have an injury or health concern.
