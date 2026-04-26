# Mjeksia Online

An interactive digital platform built for medical students, helping them prepare for their exams.

## Platforms

- ✅ Android app
- ✅ Web (including installable PWA)
- ⚠️ iOS support is still limited

## Downloading

For the time being this app is not available in the Google Play Store. You can download the APK file from the [Releases](https://github.com/Notava1ble/mjeksia-online/releases) page, after which you will need to manually sideload it on your device.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)

### Setup

```bash
pnpm install
```

### Run the app

```bash
# Web
pnpm web

# Android
pnpm android
```

> If `expo start --web` shows `expo: command not found`, that means Expo CLI is not installed globally.
> Use `pnpm web` (recommended) or `pnpm exec expo start --web` instead.

### Build web static output (PWA)

```bash
pnpm exec expo export -p web
```

This generates a deployable web build in `dist/`.

### Codespaces note (SharedArrayBuffer)

`expo-sqlite` on web requires cross-origin isolation headers:

- `Cross-Origin-Embedder-Policy: credentialless`
- `Cross-Origin-Opener-Policy: same-origin`

These are configured in `app.config.ts` via the `expo-router` plugin headers.
If a preview proxy strips these headers, web SQLite will still fail and you should test via a deployment target that preserves response headers.

### Features

- **Arena (Pyetje të Çfarëdoshme / Random Questions):** Practice your knowledge by answering random questions on the go. Every question comes with a comprehensive explanation.
- **Mock Exams (Model Testi):** Simulate a real testing environment. Sit down and test yourself under time pressure.
- **Test History (Historia e Testeve):** Keep track of your past test attempts, analyze your final scores, and monitor your overall progress to identify areas that need more focus.
- **In-depth Explanations:** For every choice you make (right or wrong), the app immediately provides the reasoning behind it to reinforce the optimal learning path.

### Frequently Asked Questions (FAQ)

**1. Who is this application for?**
This app is for medical students in Albania preparing for their state exams.

**2. Does it require an internet connection?**
No, it does not require an internet connection. The question bank and test history are stored locally on your device. The PWA can also be installed on web browsers for a native-like experience.

**3. How does the "Mock Exam" work?**
When you start a "Model Testi", the application generates a comprehensive session with a set number of questions. It tracks the time left and calculates your final score based on your selected answers, mimicking the pressure of an actual medical exam.

**4. Can I see what mistakes I've made?**
Yes! The system tracks your session history, giving you the ability to review past tests and eventually revisit questions you got wrong to solidify your reasoning.

**5. Where are the questions from?**
The questions are gathered from the official question bank provided by [QSHA](https://qsha.gov.al/). You can view the official question bank [here](https://qsha.gov.al/provimi-i-informatizuar-i-mjekesise/).

## How to Contribute

All kinds of feedback and contributions are welcomed!

- **Report Inaccuracies:** If you spot a question with an incorrect explanation, please let me know!
- **Open an Issue:** All feedback and bug reports can be tracked via [the GitHub repository Issues page](https://github.com/Notava1ble/mjeksia-online/issues). When reporting, please provide as much context as possible (e.g., question ID, screenshot).
- **Suggest Improvements**

### Opening an Issue

1. Navigate to the **Issues** tab in [our GitHub repository](https://github.com/Notava1ble/mjeksia-online/issues).
2. Click on **New Issue**.
3. Provide a clear and descriptive title.
4. Describe the problem in detail.
5. Click **Submit**, and we will review your ticket as soon as possible.
