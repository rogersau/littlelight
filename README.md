# Little Light

Little Light is a local-first toddler sleep clock for web, Android, and iOS that uses color to teach when to stay in bed and when it’s okay to get up, with offline use in the installed native app.

> **Try it / Download**
>
> [**Web App (Live)**](https://rogersau.github.io/littlelight/) · [**Android APK (v1.0)**](https://github.com/rogersau/littlelight/releases/tag/v1.0)

## How it works — The 3 Colors

Set bedtime and wake-up, then tap **Start bedtime clock** and leave it visible. Your toddler can follow the lantern without knowing how to read a clock.

| Lantern | What it means | What to tell your toddler |
| --- | --- | --- |
| 🔴 Red moon | **Time to sleep** | Stay in bed and rest. |
| 🟡 Yellow sunrise | **Quiet time** *(optional)* | Almost morning! You can play quietly in your room. |
| 🟢 Green sun | **Time to get up** | Good morning! It’s okay to get out of bed. |

## What’s inside

- **Nursery Lantern.** A warm, dark twilight interface for bedtime check-ins without a bright app screen.
- **A light that fits the room.** Breathing moon, sunrise, and sun visuals, **Gentle to Vivid** color intensity, and an app-only dimmer.
- **Your family’s routine.** Everyday times, a separate Friday and Saturday night schedule, and optional quiet time, digital clock, and countdown.
- **Parent settings.** Hold for **1.5 seconds** in bedside mode to deter accidental toddler taps.
- **Quick naps and temporary colors.** Start a `30m`, `60m`, or `90m` nap in one tap, choose another duration in settings, or override the lantern color until the next scheduled change.
- **Sleep sounds.** Built-in **white, pink, and brown noise** loops with volume control and an auto-stop timer.
- **Local-first and private.** No accounts or tracking. Settings stay on your device, and installed Android and iOS builds work offline.

## Bedside & Device Notes

- Little Light is a **visual aid, not an alarm**. Keep the clock visible in the foreground and try **Keep screen awake** on your device before bedtime. Locking the screen or switching apps can interrupt sound.
- Hardware brightness and speaker volume are separate from the app’s dimmer and sound volume.
- The hold gesture deters casual taps. It isn’t a security lock.

## Run locally

Use a supported Node.js release (22.18+, 24.3+, or 26+). Little Light uses Expo SDK 58.

```sh
npm ci
npm start
```

Open the dev server with a matching version of Expo Go, or run `npm run web` to develop in a browser. The Expo Go preview needs the dev server. Standalone native builds do not.

## Verify

```sh
npm test
npm run typecheck
npx expo install --check
npm run export:native
```

The native export verifies the iOS and Android bundles and assets. It doesn’t install the app. GitHub Actions builds the Android APK and an unsigned iOS Simulator app, and deploys successful `main` web builds to GitHub Pages.
