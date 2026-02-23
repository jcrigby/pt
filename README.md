# pt

A minimal Pomodoro timer PWA that pops into its own small window and stays out of your way.

**Try it now:** [jcrigby.github.io/pt](https://jcrigby.github.io/pt)

One click away from focused work.

## What it does

- Launches itself into a small standalone popup window (no browser chrome)
- Runs classic Pomodoro intervals: 25 min work / 5 min break / 15 min long break
- Preset buttons to quickly switch focus duration (5, 10, 25, 30, 60 minutes)
- Tracks your session count
- Sends desktop notifications when intervals complete
- Works offline via service worker
- Installable as a PWA for a fully native-feeling experience

## Stack

- Vanilla HTML/CSS/JS — no build step, no dependencies
- Web App Manifest for PWA installability
- Service Worker for offline support
- Hosted on GitHub Pages

## Getting started

```bash
git clone https://github.com/jcrigby/pt
cd pt
# open index.html in a browser or serve locally
npx serve .
```

Deploy by pushing to `main` — GitHub Pages does the rest.
