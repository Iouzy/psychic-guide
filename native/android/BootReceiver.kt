package com.pauta.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-arms the scheduled reminder alarms after a reboot or an app update —
 * AlarmManager alarms do not survive either event. Reads the persisted
 * enabled/time/text state via ReminderScheduler, so no JS round-trip is needed
 * (the WebView isn't running at boot).
 *
 * Declared in AndroidManifest with android:exported="true" and the
 * RECEIVE_BOOT_COMPLETED-guarded intent filters below.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            "android.intent.action.QUICKBOOT_POWERON" ->
                ReminderScheduler.rescheduleAll(context)
        }
    }
}
