// Injects the native focus-timer plugin into the Capacitor Android project
// that was just created by `npx cap add android`.  Run this after `cap add`
// and before `cap sync` / the Gradle build.
import { cpSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT    = new URL("..", import.meta.url).pathname;
const SRC     = join(ROOT, "native/android");
const JAVA    = join(ROOT, "android/app/src/main/java/com/pauta/app");
const DRAWABLE = join(ROOT, "android/app/src/main/res/drawable");
const XML      = join(ROOT, "android/app/src/main/res/xml");
const MANIFEST = join(ROOT, "android/app/src/main/AndroidManifest.xml");
const GRADLE   = join(ROOT, "android/app/build.gradle");

// ── 1. Copy Kotlin source files ───────────────────────────────
mkdirSync(JAVA,     { recursive: true });
mkdirSync(DRAWABLE, { recursive: true });
mkdirSync(XML,      { recursive: true });

for (const file of [
  "FocusActivityPlugin.kt",
  "FocusActionReceiver.kt",
  "FocusService.kt",
  "AppUpdaterPlugin.kt",
  "MainActivity.kt",
]) {
  cpSync(join(SRC, file), join(JAVA, file));
  console.log(`Copied ${file}`);
}

// ── 2. Copy resources (notification icon + updater FileProvider paths) ──
cpSync(join(SRC, "ic_stat_focus.xml"), join(DRAWABLE, "ic_stat_focus.xml"));
console.log("Copied ic_stat_focus.xml");
cpSync(join(SRC, "update_file_paths.xml"), join(XML, "update_file_paths.xml"));
console.log("Copied update_file_paths.xml");

// ── 3. Patch AndroidManifest.xml ─────────────────────────────
let manifest = readFileSync(MANIFEST, "utf8");

const PERMISSIONS = `
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/>`;

const COMPONENTS = `
        <service
            android:name=".FocusService"
            android:foregroundServiceType="dataSync"
            android:exported="false"/>
        <receiver
            android:name=".FocusActionReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="com.pauta.app.FOCUS_PAUSE"/>
                <action android:name="com.pauta.app.FOCUS_RESUME"/>
                <action android:name="com.pauta.app.FOCUS_CONCLUDE"/>
            </intent-filter>
        </receiver>
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.pauta.app.updateprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/update_file_paths"/>
        </provider>`;

// Guard: don't double-inject on repeated runs
if (!manifest.includes("FocusService")) {
  manifest = manifest.replace(
    /(<manifest\b[^>]*>)/,
    `$1${PERMISSIONS}`,
  );
  manifest = manifest.replace(
    /(<\/application>)/,
    `${COMPONENTS}\n    $1`,
  );
  writeFileSync(MANIFEST, manifest);
  console.log("Patched AndroidManifest.xml");
} else {
  console.log("AndroidManifest.xml already patched — skipped");
}

// ── 4. Bump versionCode/versionName in CI ────────────────────
// versionCode must be a monotonically increasing integer or Android refuses the
// update ("package conflicts with an existing package" / downgrade blocked).
// We previously used GITHUB_RUN_NUMBER — but that counter RESETS to 1 when the
// workflow is renamed or the repo is forked/transferred, which already happened
// here and produced a build with a HIGHER number than newer builds. Derive the
// code from wall-clock minutes since the epoch instead: always increasing,
// reset-proof, and well within the 2,147,483,647 ceiling for ~4000 years.
// versionName is a human date (no fake semver tied to the run number).
// Gate on CI (GITHUB_RUN_NUMBER present) so local builds keep the Capacitor default.
if (process.env.GITHUB_RUN_NUMBER) {
  const versionCode = Math.floor(Date.now() / 60000);   // epoch minutes — monotonic
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const versionName = `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}`;
  let gradle = readFileSync(GRADLE, "utf8");
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  writeFileSync(GRADLE, gradle);
  console.log(`Patched build.gradle: versionCode=${versionCode}, versionName=${versionName}`);
} else {
  console.log("No GITHUB_RUN_NUMBER set — leaving build.gradle versionCode at the Capacitor default.");
}

console.log("Native injection complete.");
