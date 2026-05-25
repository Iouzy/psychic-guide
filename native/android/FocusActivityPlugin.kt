package com.pauta.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Capacitor plugin that bridges JS → native focus-timer service.
 *
 * JS surface:
 *   FocusActivity.start({ title, startedAt, elapsedMs })
 *   FocusActivity.update({ elapsedMs, paused })
 *   FocusActivity.stop()
 *   FocusActivity.addListener("action", ({ kind }) => …)
 *     kind: "pause" | "resume" | "conclude"
 *
 * Notification action buttons are handled by FocusActionReceiver (registered in
 * AndroidManifest). It calls onAction() on the singleton instance held here so
 * the Capacitor event can be emitted back to JS even after the user has
 * backgrounded the WebView.
 */
@CapacitorPlugin(name = "FocusActivity")
class FocusActivityPlugin : Plugin() {

    // ── Lifecycle ────────────────────────────────────────────────

    override fun load() {
        instance = this
        // Android 13+ requires POST_NOTIFICATIONS at runtime. Request it eagerly
        // on plugin load (i.e. app start) so the user sees the permission dialog
        // before they ever try to start a timer, not mid-session.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIF_PERM_REQUEST
                )
            }
        }
    }

    override fun handleOnDestroy() {
        if (instance === this) instance = null
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

        private const val NOTIF_PERM_REQUEST = 1001
    }
}
