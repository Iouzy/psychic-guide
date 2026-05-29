package com.pauta.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Fires when a scheduled reminder alarm goes off — crucially, even with the app
 * (and WebView) closed. It posts the reminder notification on the shared
 * HIGH-importance "Lembretes" channel, then re-arms the SAME kind for the next
 * day (exact alarms are one-shot, so each occurrence must reschedule the next).
 *
 * The notification id is tag.hashCode() using the SAME tags the in-app JS path
 * uses ("pauta-habits" / "pauta-reflection"), so a background reminder and an
 * in-app one replace each other instead of stacking — the user only ever sees
 * one notification per kind.
 *
 * Honest limitation: with the app closed we cannot read localStorage to know how
 * many habits are still pending, so the background body is a generic, neutral
 * nudge (the in-app reminder, when the app is open, can still be specific).
 */
class ReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_FIRE) return
        val kind = ReminderScheduler.kindFromKey(intent.getStringExtra(EXTRA_KIND)) ?: return

        val (title, body) = ReminderScheduler.textFor(context, kind)
        if (body.isNotEmpty()) postNotification(context, kind, title, body)

        // Re-arm for tomorrow from the persisted time (only if still enabled).
        val p = context.getSharedPreferences(ReminderScheduler.PREFS, Context.MODE_PRIVATE)
        if (p.getBoolean(ReminderScheduler.K_ENABLED, false)) {
            ReminderScheduler.scheduleKind(context, kind, p.getString(kind.timePref, null))
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Same id/importance as FocusActivityPlugin.showReminder so heads-up
            // behaviour is identical whether the app is open or closed.
            val ch = NotificationChannel(CHANNEL_ID, "Lembretes", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Avisos de hábitos pendentes e da reflexão da noite"
                setShowBadge(true)
            }
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(ch)
        }
    }

    private fun postNotification(context: Context, kind: ReminderScheduler.Kind, title: String, body: String) {
        ensureChannel(context)
        val notifId = kind.tag.hashCode()

        val launch = (context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent(context, MainActivity::class.java))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        var piFlags = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) piFlags = piFlags or PendingIntent.FLAG_IMMUTABLE
        val launchPi = PendingIntent.getActivity(context, notifId, launch, piFlags)

        val notif = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_focus)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(launchPi)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        try {
            // POST_NOTIFICATIONS may be missing on 13+; if so the post is silently
            // dropped by the system (we cannot prompt from a receiver).
            NotificationManagerCompat.from(context).notify(notifId, notif)
        } catch (e: SecurityException) { /* permission revoked — ignore */ }
    }

    companion object {
        const val ACTION_FIRE = "com.pauta.app.REMINDER_FIRE"
        const val EXTRA_KIND  = "kind"
        private const val CHANNEL_ID = "pauta_reminders_v2"
    }
}
