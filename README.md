# Little Light

Little Light is a local-first children's sleep and wake clock for iOS, Android, and [the web](https://rogersau.github.io/littlelight/), built with Expo, React Native, and TypeScript. The installed native app bundles its artwork and sounds and runs offline. It has no accounts, analytics, or server.

- Red moon for sleep, yellow sunrise for quiet time, and green sun for getting up.
- Everyday or Friday/Saturday-night weekend routines, with optional quiet time.
- Clock and countdown, app-only dimming, and Gentle to Vivid color intensity with live previews.
- Hold-to-open parent settings, a foreground stay-awake mode, naps, and temporary colors.
- User-started white, pink, and brown noise with volume and a stop timer.

## Run

Use Node.js 22.18+ or 24.3+ on a supported Node release. This project uses Expo SDK 58.

```sh
npm ci
npm start
```

Open the project in a matching version of Expo Go or use `npm run android` with an Android emulator or `npm run ios` with an iOS simulator on macOS. Expo Go needs the development server, while an installed standalone build can launch without it. [Expo device and simulator setup](https://docs.expo.dev/get-started/set-up-your-environment/)

Run `npm run web` to develop in a browser. `npm run build:web` exports the site to `dist/`. Set `EXPO_WEB_BASE_PATH=/littlelight` to reproduce the GitHub Pages build locally.

## Verify

```sh
npm test
npm run typecheck
npx expo install --check
npm run export:native
```

Tests cover local-time scheduling, weekend anchoring, daylight-saving gaps and repeated hours, rollover dates, settings validation and recovery, color intensity, timer expiry, and the bundled audio files. The export command verifies both native JavaScript bundles and their assets. It does not build or install an app.

GitHub Actions runs the checks and builds the web site, an Android APK signed with the default development key, and an unsigned Apple Silicon iOS Simulator app. Native artifacts are available from each successful workflow run and are for testing, not store distribution. Successful web builds from `main` deploy to GitHub Pages.

On a physical device, check the time pickers and routine persistence, portrait and landscape layouts, the hold-to-open control, stay-awake after the normal Auto-Lock interval, sound playback and stop behavior, and launch in airplane mode with an installed build. To regenerate the bundled noise loops, run `node scripts/generate-noise.mjs`.

## Device behavior

The clock follows the device’s local time. A night belongs to its bedtime date, so Friday and Saturday weekend routines carry into the following mornings. Daylight-saving gaps advance skipped times and repeated times use the first occurrence. Nap and sound timers use actual deadlines, and the clock recomputes the current stage when the app returns to the foreground.

Settings are stored locally in the app or browser. They are not synced across browsers or devices, and the native app does not automatically import settings from the previous web app. Restarting Little Light clears the active clock session, temporary colors, and sound, while keeping the saved routine.

Little Light is a visual aid, not an alarm. Keep it in the foreground on a safely powered device and test it before bedtime. Locking the screen, leaving the app, or system interruptions can pause playback. Use **Resume sound** when needed. The app’s dimmer does not change hardware brightness, and relative volume is not a measurement of sound level. The hold gesture deters casual taps and is not a security lock.
