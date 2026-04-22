## Protocol

- Before handoff: run full gate (lint/typecheck/tests/docs).

## Docs

- Start: run docs list (`docs:list` script, or `bin/docs-list` here if present; ignore if not installed); open docs before coding.
- Follow links until domain makes sense; honor `Read when` hints.

## Native local builds (apps/native)

Use this loop instead of TestFlight when iterating on native changes (NFC, camera, new native modules). Based on https://codewithbeto.dev/blog/building-expo-apps-locally.

Prereqs: Xcode + Command Line Tools, a logged-in Apple ID with the team (`NYF9WZVVQ9`), CocoaPods, `bun install` run at repo root.

If CocoaPods crashes with `Unicode Normalization not appropriate for ASCII-8BIT` (Ruby 4.x + ASCII locale), export UTF-8 for the shell:

```
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

Whenever you change `apps/native/package.json` deps, `app.json` plugins/config, or anything that affects the native layer, the `ios/` and `android/` folders are stale — regenerate before building:

```
cd apps/native
bun run prebuild -- --clean   # regenerates ios/ + android/, runs pod install
```

### iOS — physical device (fastest feedback for NFC / camera)

```
cd apps/native
bun run ios -- --device --configuration Release
```

`expo run:ios` wraps prebuild + pod install + xcodebuild, installs to the selected device, and launches it. Use `--configuration Debug` for dev-server bundles. First run prompts for the device; subsequent runs remember it.

If signing fails, open `apps/native/ios/meditag.xcworkspace` in Xcode once, pick the `meditag` target → Signing & Capabilities → set Team `NYF9WZVVQ9`, then retry the CLI.

### iOS — simulator

```
cd apps/native/ios
xcodebuild \
  -workspace meditag.xcworkspace \
  -scheme meditag \
  -configuration Release \
  -sdk iphonesimulator \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  -quiet
xcrun simctl install booted build/Build/Products/Release-iphonesimulator/meditag.app
xcrun simctl launch booted com.meditag.native
```

NFC does not work on the simulator — use a physical device for NFC flows.

### Android

```
cd apps/native/android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

### When to rebuild vs hot-reload

- JS/TS only → Metro hot reload, no rebuild.
- Changed `app.json`, added/removed a native module, edited a config plugin, bumped `buildNumber` → prebuild + rebuild.
- Stuck with "module not linked" or a JS fallback value from a native module (e.g. `Device.isDevice === false` on a real device) → the native project is stale; prebuild and rebuild.
