# Android icon/splash update

- Replaced the native splash artwork with a 1024x1024 padded asset so Android 12+ does not crop/zoom the logo.
- Updated `windowSplashScreenAnimatedIcon` path via `avd_splash_logo.xml`.
- Updated legacy `splash.xml` to the same padded artwork.
- Replaced adaptive launcher foreground with a 1080x1080 transparent padded artwork to keep the logo sharp and within Android adaptive-icon safe areas.
- PWA 192/512/maskable icons use the padded artwork as well.
- Removed the previous unpadded `mz_splash_logo.png`.
