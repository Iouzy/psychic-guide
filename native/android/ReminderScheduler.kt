package com.pauta.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

/**
 * Schedules the daily habit/reflection reminder alarms via AlarmManager so they
 * fire even when the app (and its WebView) is fully closed — the JS-only
 * reminder loop in extras.jsx only runs while the page is open, so without this
 * a closed app never reminded the user of anything.
 *
 * State (enabled + the two HH:mm times + the localized title/body to display) is
 * mirrored to SharedPreferences so that:
 *   - the fired alarm can re-arm itself for the next day (exact alarms are
 *     one-shot; AlarmManager.setRepeating is inexact on modern Android), and
 *   - BootReceiver can re-arm everything after a reboot or app update (alarms do
 *     not survive either).
 *
 * Exactness: we use setExactAndAllowWhileIdle when allowed (Android 12+ gates it
 * behind SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM) and fall back to
 * setAndAllowWhileIdle (inexact, Doze-friendly) otherwise, so a reminder still
 * arrives — just not necessarily to the minute. Honest limitation: aggressive
 * OEM battery managers (e.g. MIUI/Xiaomi) can still delay or drop background
 * alarms unless the app is exempt from battery optimization / allowed to autostart.
 */
object ReminderScheduler {
    const val PREFS = "pauta_reminders"
    const val K_ENABLED = "enabled"

    // Each reminder kind: a stable key + a distinct alarm request code.
    enum class Kind(val key: String, val requestCode: Int, val timePref: String,
                    val titlePref: String, val bodyPref: String, val tag: String) {
        HABITS("habits", 101, "habits_time", "habits_title", "habits_body", "pauta-habits"),
        REFLECTION("reflection", 102, "reflection_time", "reflection_title", "reflection_body", "pauta-reflection"),
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** Persist the latest settings (so re-arm on fire / boot has what it needs). */
    fun save(context: Context, enabled: Boolean,
             habitsTime: String?, reflectionTime: String?,
             habitsTitle: String?, habitsBody: String?,
             reflectionTitle: String?, reflectionBody: String?) {
        prefs(context).edit()
            .putBoolean(K_ENABLED, enabled)
            .putString(Kind.HABITS.timePref, habitsTime)
            .putString(Kind.REFLECTION.timePref, reflectionTime)
            .putString(Kind.HABITS.titlePref, habitsTitle)
            .putString(Kind.HABITS.bodyPref, habitsBody)
            .putString(Kind.REFLECTION.titlePref, reflectionTitle)
            .putString(Kind.REFLECTION.bodyPref, reflectionBody)
            .apply()
    }

    /** (Re)schedule both kinds from persisted state, or cancel if disabled. */
    fun rescheduleAll(context: Context) {
        val p = prefs(context)
        if (!p.getBoolean(K_ENABLED, false)) { cancelAll(context); return }
        scheduleKind(context, Kind.HABITS, p.getString(Kind.HABITS.timePref, null))
        scheduleKind(context, Kind.REFLECTION, p.getString(Kind.REFLECTION.timePref, null))
    }

    fun cancelAll(context: Context) {
        Kind.values().forEach { cancel(context, it) }
    }

    private fun alarmManager(context: Context) =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun pendingIntent(context: Context, kind: Kind): PendingIntent {
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ReminderReceiver.ACTION_FIRE
            putExtra(ReminderReceiver.EXTRA_KIND, kind.key)
        }
        var flags = PendingIntent.FLAG_UPDATE_CURRENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags = flags or PendingIntent.FLAG_IMMUTABLE
        return PendingIntent.getBroadcast(context, kind.requestCode, intent, flags)
    }

    /** True if the OS will currently let us set exact alarms. */
    fun canExact(context: Context): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) alarmManager(context).canScheduleExactAlarms() else true

    fun scheduleKind(context: Context, kind: Kind, hhmm: String?) {
        if (hhmm.isNullOrBlank() || !hhmm.contains(":")) { cancel(context, kind); return }
        val parts = hhmm.split(":")
        val hour = parts[0].toIntOrNull() ?: return
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0
        val triggerAt = nextTrigger(hour, minute)
        val am = alarmManager(context)
        val pi = pendingIntent(context, kind)
        try {
            if (canExact(context)) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
            } else {
                // No exact-alarm permission → inexact but still wakes from Doze.
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
            }
        } catch (e: SecurityException) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
        }
    }

    fun cancel(context: Context, kind: Kind) {
        alarmManager(context).cancel(pendingIntent(context, kind))
    }

    /** Next occurrence of hh:mm: today if still ahead, otherwise tomorrow. */
    private fun nextTrigger(hour: Int, minute: Int): Long {
        val now = System.currentTimeMillis()
        val next = Calendar.getInstance().apply {
            timeInMillis = now
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        if (next.timeInMillis <= now) next.add(Calendar.DAY_OF_YEAR, 1)
        return next.timeInMillis
    }

    /** Localized title/body persisted for a kind (set from JS via the plugin). */
    fun textFor(context: Context, kind: Kind): Pair<String, String> {
        val p = prefs(context)
        return Pair(
            p.getString(kind.titlePref, "Pauta") ?: "Pauta",
            p.getString(kind.bodyPref, "") ?: ""
        )
    }

    fun kindFromKey(key: String?): Kind? = Kind.values().firstOrNull { it.key == key }
}
