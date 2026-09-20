# MZ Smart Tool House Android

This Android target is configured for Capacitor 8 and package `com.mzsmarttoolhouse.app`.

The native project loads the Vite output from `dist/`; it does not use the Netlify site as its normal content source.

After installing dependencies, run from the repository root:

```bash
npm install
npm run build
npx cap sync android
```

`npx cap sync android` is authoritative for generated Capacitor files and may refresh `capacitor.settings.gradle`, `capacitor.build.gradle`, and the bundled web assets.

Open in Android Studio with:

```bash
npx cap open android
```
