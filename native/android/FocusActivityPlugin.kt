package com.pauta.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Capacitor plugin that bridges JS → native focus-timer service.
 *
 * JS surface:
 *   FocusActivity.start({ title, startedAt, elapsedMs })
 *   FocusActivity.update({ elapsedMs, paused })
 *   FocusActivity.stop()
 *   FocusActivity.checkPermission()    → { granted }
 *   FocusActivity.requestPermission()  → { granted }
 *   FocusActivity.addListener("action", ({ kind }) => …)
 *     kind: "pause" | "resume" | "conclude"
 *
 * Notification action buttons are handled by FocusActionReceiver (registered in
 * AndroidManifest). It calls onAction() on the singleton instance held here so
 * the Capacitor event can be emitted back to JS even after the user has
 * backgrounded the WebView.
 *
 * Notification permission: on Android 13+ the foreground service still RUNS
 * without POST_NOTIFICATIONS, but its notification is silently suppressed — so
 * the timer would be invisible. We no longer fire a single eager request at
 * load() (easy to dismiss, never re-asked). Instead JS asks contextually right
 * when a block starts (and from Settings), via requestPermission() below, which
 * resolves with the resulting grant state so the UI can guide the user to
 * system Settings if Android has stopped showing the dialog.
 */
@CapacitorPlugin(
    name = "FocusActivity",
    permissions = [
        Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])
    ]
)
class FocusActivityPlugin : Plugin() {

    // ── Lifecycle ────────────────────────────────────────────────

    override fun load() {
        instance = this
    }

    override fun handleOnDestroy() {
        if (instance === this) instance = null
    }

    // ── Permissions ──────────────────────────────────────────────

    private fun hasNotifPermission(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    private fun resolveGranted(call: PluginCall, granted: Boolean) {
        call.resolve(JSObject().put("granted", granted))
    }

    @PluginMethod
    fun checkPermission(call: PluginCall) {
        resolveGranted(call, hasNotifPermission())
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (hasNotifPermission()) {
            resolveGranted(call, true)
            return
        }
        requestPermissionForAlias("notifications", call, "notifPermCallback")
    }

    @PermissionCallback
    fun notifPermCallback(call: PluginCall) {
        resolveGranted(call, hasNotifPermission())
    }

    // ── Plugin methods ───────────────────────────────────────────

    @PluginMethod
    fun start(call: PluginCall) {
        val title     = call.getString("title") ?: "Focus"
        val startedAt = call.getDouble("startedAt")?.toLong() ?: System.currentTimeMillis()
        val elapsedMs = call.getDouble("elapsedMs")?.toLong() ?: 0L

        val intent = Intent(context, FocusService::class.java).apply {
            action = FocusService.ACTION_START
            putExtra(FocusService.EXTRA_TITLE,      title)
            putExtra(FocusService.EXTRA_STARTED_AT, startedAt)
            putExtra(FocusService.EXTRA_ELAPSED_MS, elapsedMs)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun update(call: PluginCall) {
        val elapsedMs = call.getDouble("elapsedMs")?.toLong() ?: 0L
        val paused    = call.getBoolean("paused", false) ?: false

        val intent = Intent(context, FocusService::class.java).apply {
            action = FocusService.ACTION_UPDATE
            putExtra(FocusService.EXTRA_ELAPSED_MS, elapsedMs)
            putExtra(FocusService.EXTRA_PAUSED,     paused)
        }
        // Must use startForegroundService on O+; plain startService throws
        // IllegalStateException when called from background, which is the
        // common case (JS reacts to a notification button while WebView is hidden).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        val intent = Intent(context, FocusService::class.java).apply {
            action = FocusService.ACTION_STOP
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        call.resolve()
    }

    // ── Called by FocusActionReceiver when a notification button is tapped ──

    fun emitAction(kind: String) {
        val data = JSObject()
        data.put("kind", kind)
        notifyListeners("action", data)
    }

    // ── Singleton held for FocusActionReceiver access ────────────

    companion object {
        @Volatile
        var instance: FocusActivityPlugin? = null
            private set

        /** Called by FocusActionReceiver so the event is forwarded to JS. */
        fun onAction(kind: String) {
            instance?.emitAction(kind)
        }
    }
}
