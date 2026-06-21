# TODOIST

A React Native / Expo task manager app with local persistence and optional Firebase backend sync.

## What’s included

- Local device persistence via `expo-file-system`
- Firebase Firestore cloud sync support via `firebaseService.js`
- Web build support using `expo export:web`
- Firebase Hosting deploy config in `firebase.json`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Fill in your Firebase settings in `firebaseConfig.js`.
   - Use a Firebase project with Firestore enabled.
   - If Firebase config is not updated, app still uses local storage.

3. Start the app locally using LAN:
   ```bash
   npm run start
   ```

If your mobile device is on the same network but cannot connect, try local loopback instead:
   ```bash
   npm run start:localhost
   ```

Avoid `npx expo start --tunnel` unless you absolutely need tunnel mode. If you must use it, run:
   ```bash
   npm run start:tunnel
   ```

## Build & deploy

- Build web assets:
  ```bash
  npm run build:web
  ```

- Deploy to Firebase Hosting:
  ```bash
  npm run deploy:web
  ```

## Notes for real-world deployment

- Replace the placeholder values in `firebaseConfig.js` with your Firebase project credentials.
- Add authentication and per-user access controls before issuing a public production release.
- Run `npm audit fix` regularly to keep dependencies secure.
