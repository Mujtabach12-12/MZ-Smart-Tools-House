import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const config = fs.readFileSync(path.join(root, 'capacitor.config.ts'), 'utf8');
const checks = [
  ['Capacitor core dependency', pkg.dependencies?.['@capacitor/core']],
  ['Capacitor Android dependency', pkg.dependencies?.['@capacitor/android']],
  ['Capacitor CLI dependency', pkg.devDependencies?.['@capacitor/cli']],
  ['App ID', config.includes("appId: 'com.mzsmarttoolhouse.app'"),],
  ['App name', config.includes("appName: 'MZ Tools'"),],
  ['Local webDir', config.includes("webDir: 'dist'"),],
  ['Android manifest', fs.existsSync(path.join(root, 'android/app/src/main/AndroidManifest.xml'))],
  ['Camera permission', fs.readFileSync(path.join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8').includes('android.permission.CAMERA')],
  ['Portrait orientation', fs.readFileSync(path.join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8').includes('android:screenOrientation="portrait"')],
  ['Native back integration', fs.readFileSync(path.join(root, 'src/components/pwa/PwaManager.jsx'), 'utf8').includes("CapacitorApp.addListener('backButton'")],
  ['Native file save integration', fs.readFileSync(path.join(root, 'src/lib/download.js'), 'utf8').includes("import('@capacitor/filesystem')")],
  ['Native share integration', fs.readFileSync(path.join(root, 'src/lib/download.js'), 'utf8').includes("import('@capacitor/share')")],
  ['External browser integration', fs.readFileSync(path.join(root, 'src/components/pwa/PwaManager.jsx'), 'utf8').includes('Browser.open')],
  ['Native app label is MZ Tools', fs.readFileSync(path.join(root, 'android/app/src/main/res/values/strings.xml'), 'utf8').includes('<string name="app_name">MZ Tools</string>')],
  ['Adaptive launcher icon', fs.existsSync(path.join(root, 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'))],
  ['Native splash icon', fs.existsSync(path.join(root, 'android/app/src/main/res/drawable/mz_splash_logo_padded.png')) && fs.existsSync(path.join(root, 'android/app/src/main/res/drawable/avd_splash_logo.xml'))],
  ['First-paint startup overlay', fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('id="mz-native-startup"')],
  ['Startup animation video', fs.existsSync(path.join(root, 'public/startup/mz-office-welcome.mp4'))],
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error('Capacitor audit failed:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}
console.log(`Capacitor audit passed: ${checks.length} configuration and native-integration checks.`);
console.log('Target: Capacitor 8.x / Android / com.mzsmarttoolhouse.app');

assert(fs.existsSync('public/startup/mz-office-welcome.mp4'), 'Missing office startup animation');
assert(fs.existsSync('public/startup/mz-office-welcome-poster.jpg'), 'Missing office startup poster');
console.log('Office startup animation assets: PASS');
