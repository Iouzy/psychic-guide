package com.pauta.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Manifest-registered BroadcastReceiver that handles notification action buttons
 * (Pause / Resume / Conclude) and forwards them to the Capacitor plugin so the
 * "action" event is emitted back to JS.
 *
 * Declared in AndroidManifest.xml with the three intent-filter actions below.
 */
class FocusActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val kind = when (intent.action) {
            ACTION_PAUSE    -> "pause"
            ACTION_RESUME   -> "resume"
            ACTION_CONCLUDE -> "conclude"
            else            -> return
        }
        FocusActivityPlugin.onAction(kind)
    }

    companion object {
        const val ACTION_PAUSE    = "com.pauta.app.FOCUS_PAUSE"
        const val ACTION_RESUME   = "com.pauta.app.FOCUS_RESUME"
        const val ACTION_CONCLUDE = "com.pauta.app.FOCUS_CONCLUDE"
    }
}
