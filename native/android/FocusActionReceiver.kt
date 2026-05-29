package com.pauta.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Manifest-registered BroadcastReceiver that handles notification action buttons
 * (Pause / Resume / Conclude / Switch). Responsibilities:
 *
 *   1. For Pause/Resume/Conclude: drive FocusService directly so the visible
 *      notification button flips immediately — this works even if the WebView
 *      has been reclaimed by the OS and the Capacitor plugin instance is gone.
 *   2. For Switch: bring the app to the front (picking a block needs UI) and
 *      leave the running block untouched until the user chooses a replacement.
 *   3. Best-effort emit an "action" event back to JS via the plugin singleton.
 *      If JS is alive it reconciles the store; if not, the native notification
 *      state stays correct on its own and JS will reconcile on next launch.
 *
 * Declared in AndroidManifest.xml with the four intent-filter actions below.
 */
class FocusActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val kind = when (intent.action) {
            ACTION_PAUSE    -> "pause"
            ACTION_RESUME   -> "resume"
            ACTION_CONCLUDE -> "conclude"
            ACTION_SWITCH   -> "switch"
            else            -> return
        }

        // "Switch" has no native service equivalent — choosing another block
        // needs the app UI. Bring the app to the front and let JS open the switch
        // sheet; the running block is left ticking until the user actually picks.
        if (kind == "switch") {
            val launch = (context.packageManager.getLaunchIntentForPackage(context.packageName)
                ?: Intent(context, MainActivity::class.java))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            try { context.startActivity(launch) } catch (e: Exception) { /* no launcher available */ }
            FocusActivityPlugin.onAction("switch")
            return
        }

        // 1. Reflect the action on the foreground service so the notification
        //    UI stays in sync regardless of WebView lifecycle.
        val svcIntent = Intent(context, FocusService::class.java)
        when (kind) {
            "pause" -> {
                svcIntent.action = FocusService.ACTION_UPDATE
                svcIntent.putExtra(FocusService.EXTRA_PAUSED, true)
            }
            "resume" -> {
                svcIntent.action = FocusService.ACTION_UPDATE
                svcIntent.putExtra(FocusService.EXTRA_PAUSED, false)
            }
            "conclude" -> {
                svcIntent.action = FocusService.ACTION_STOP
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svcIntent)
        } else {
            context.startService(svcIntent)
        }

        // 2. Best-effort notify JS. No-op if the WebView is gone — the native
        //    notification is already updated above, so the user sees the right
        //    state regardless.
        FocusActivityPlugin.onAction(kind)
    }

    companion object {
        const val ACTION_PAUSE    = "com.pauta.app.FOCUS_PAUSE"
        const val ACTION_RESUME   = "com.pauta.app.FOCUS_RESUME"
        const val ACTION_CONCLUDE = "com.pauta.app.FOCUS_CONCLUDE"
        const val ACTION_SWITCH   = "com.pauta.app.FOCUS_SWITCH"
    }
}
