// Injects the native focus-timer plugin into the Capacitor Android project
// that was just created by `npx cap add android`.  Run this after `cap add`
// and before `cap sync` / the Gradle build.
import { cpSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT    = new URL("..", import.meta.url).pathname;
const SRC     = join(ROOT, "native/android");
const JAVA    = join(ROOT, "android/app/src/main/java/com/pauta/app");
const DRAWABLE = join(ROOT, "android/app/src/main/res/drawable");
const MANIFEST = join(ROOT, "android/app/src/main/AndroidManifest.xml");
const GRADLE   = join(ROOT, "android/app/build.gradle");

// ── 1. Copy Kotlin source files ───────────────────────────────
mkdirSync(JAVA,     { recursive: true });
mkdirSync(DRAWABLE, { recursive: true });

for (const file of [
  "FocusActivityPlugin.kt",
  "FocusActionReceiver.kt",
  "FocusService.kt",
  "MainActivity.kt",
]) {
  cpSync(join(SRC, file), join(JAVA, file));
  console.log(`Copied ${file}`);
}

// ── 2. Copy notification icon ─────────────────────────────────
cpSync(join(SRC, "ic_stat_focus.xml"), join(DRAWABLE, "ic_stat_focus.xml"));
console.log("Copied ic_stat_focus.xml");

// ── 3. Patch AndroidManifest.xml ─────────────────────────────
let manifest = readFileSync(MANIFEST, "utf8");

const PERMISSIONS = `
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`;

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
        </receiver>`;

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

// ── 4. Bump versionCode/versionName from CI env ──────────────
// Without this, every CI build ships versionCode 1, so Android refuses to
// install the new APK over an existing copy with "package conflicts with an
// existing package". Using GITHUB_RUN_NUMBER makes each build strictly newer
// than the previous one, so the OS treats it as a real update.
const run = Number(process.env.GITHUB_RUN_NUMBER || 0);
if (run > 0) {
  let gradle = readFileSync(GRADLE, "utf8");
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${run}`);
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "1.0.${run}"`);
  writeFileSync(GRADLE, gradle);
  console.log(`Patched build.gradle: versionCode=${run}, versionName=1.0.${run}`);
} else {
  console.log("No GITHUB_RUN_NUMBER set — leaving build.gradle versionCode at the Capacitor default.");
}

console.log("Native injection complete.");
