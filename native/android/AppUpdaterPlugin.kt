package com.pauta.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Capacitor plugin that performs an in-app update without leaving the app:
 * download the release APK and hand it straight to Android's package installer.
 *
 * Why this exists: the web update flow only ever did `window.open(apkUrl)`,
 * which bounces the user out to the browser to download the raw APK and then
 * tap it manually. This plugin keeps the whole flow inside the app — it streams
 * the APK into the app's own files dir and launches the system installer via a
 * FileProvider content URI. Because every build is signed with the same
 * committed debug keystore, Android treats it as an in-place UPDATE and the
 * user's data is preserved.
 *
 * JS surface:
 *   AppUpdater.canInstall()                 → { granted }   // may we install APKs?
 *   AppUpdater.openInstallSettings()                        // jump to the OS toggle
 *   AppUpdater.downloadAndInstall({ url })  → { status }    // "installing" | "needs-permission"
 *   AppUpdater.addListener("downloadProgress", ({ percent }) => …)
 *
 * Android 8+ requires the user to allow "install unknown apps" for THIS app
 * before a non-store APK can be installed; if they haven't, we open that system
 * toggle and report "needs-permission" so JS can ask them to retry.
 */
@CapacitorPlugin(name = "AppUpdater")
class AppUpdaterPlugin : Plugin() {

    // Single worker so the (potentially large) download never blocks the WebView.
    private val executor = Executors.newSingleThreadExecutor()

    @PluginMethod
    fun canInstall(call: PluginCall) {
        call.resolve(JSObject().put("granted", canRequestInstalls()))
    }

    @PluginMethod
    fun openInstallSettings(call: PluginCall) {
        promptInstallPermission()
        call.resolve()
    }

    @PluginMethod
    fun downloadAndInstall(call: PluginCall) {
        val url = call.getString("url")
        if (url.isNullOrBlank()) {
            call.reject("missing url")
            return
        }

        // Without the "install unknown apps" grant the installer intent silently
        // does nothing, so check first and send the user to the toggle instead.
        if (!canRequestInstalls()) {
            promptInstallPermission()
            call.resolve(JSObject().put("status", "needs-permission"))
            return
        }

        call.setKeepAlive(true)
        executor.execute {
            try {
                val apk = download(url) { pct ->
                    notifyListeners("downloadProgress", JSObject().put("percent", pct))
                }
                launchInstaller(apk)
                call.resolve(JSObject().put("status", "installing"))
            } catch (e: Exception) {
                call.reject(e.message ?: "download failed")
            }
        }
    }

    // ── helpers ──────────────────────────────────────────────────

    private fun canRequestInstalls(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            context.packageManager.canRequestPackageInstalls()

    private fun promptInstallPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val intent = Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:" + context.packageName),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /**
     * Stream the APK into the app-specific external files dir (no storage
     * permission needed; reachable by the installer through our FileProvider).
     * GitHub release assets 302 to a CDN host, so redirects are followed by hand.
     */
    private fun download(urlStr: String, onProgress: (Int) -> Unit): File {
        val dir = context.getExternalFilesDir(null) ?: context.filesDir
        val out = File(dir, "update.apk")
        if (out.exists()) out.delete()

        var current = urlStr
        var redirects = 0
        val conn: HttpURLConnection
        while (true) {
            val c = (URL(current).openConnection() as HttpURLConnection).apply {
                instanceFollowRedirects = false
                connectTimeout = 30_000
                readTimeout = 30_000
                setRequestProperty("Accept", "application/octet-stream")
            }
            val code = c.responseCode
            if (code in 300..399 && redirects < 5) {
                val loc = c.getHeaderField("Location")
                c.disconnect()
                if (loc.isNullOrBlank()) throw RuntimeException("redirect without Location")
                current = loc
                redirects++
                continue
            }
            if (code != HttpURLConnection.HTTP_OK) {
                c.disconnect()
                throw RuntimeException("HTTP $code")
            }
            conn = c
            break
        }

        val total = conn.contentLength.toLong() // -1 when unknown
        try {
            conn.inputStream.use { input ->
                out.outputStream().use { output ->
                    val buf = ByteArray(64 * 1024)
                    var downloaded = 0L
                    var lastPct = -1
                    while (true) {
                        val read = input.read(buf)
                        if (read == -1) break
                        output.write(buf, 0, read)
                        downloaded += read
                        if (total > 0) {
                            val pct = (downloaded * 100 / total).toInt()
                            if (pct != lastPct) {
                                lastPct = pct
                                onProgress(pct)
                            }
                        }
                    }
                }
            }
        } finally {
            conn.disconnect()
        }
        return out
    }

    private fun launchInstaller(apk: File) {
        val uri = FileProvider.getUriForFile(
            context, context.packageName + ".updateprovider", apk,
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(intent)
    }
}
