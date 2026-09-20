# MZ Tools Android Startup UX

The existing Capacitor app now opens with a short native-to-web welcome sequence rather than a blank loading state.

- Android label: **MZ Tools**
- Native splash: dark MZ-branded splash with animated logo
- App startup overlay: animated mascot video, welcome greeting and progress/wait message
- Message: **Welcome to MZ Tools — Your Smart Tool House 🏠**
- Loading message: **Getting your smart tools ready…**
- Duration: about 3.2 seconds, then a smooth fade into the existing React app
- Reduced-motion support is included
- The animation is local/bundled (no remote media request)
- The startup video is included in the PWA offline shell as well

No existing tool, route or application feature is replaced by this startup UX.
