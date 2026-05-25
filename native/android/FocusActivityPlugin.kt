package com.pauta.app

import android.content.Intent
import android.os.Build
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
        context.startService(intent)
        call.resolve()
    }

    @PluginMethod
    fun stop(call: PluginCall) {
        val intent = Intent(context, FocusService::class.java).apply {
            action = FocusService.ACTION_STOP
        }
        context.startService(intent)
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
