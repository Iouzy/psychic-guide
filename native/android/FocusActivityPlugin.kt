package com.pauta.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
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
 *   FocusActivity.shouldShowRationale() → { show } (true = OS will still show dialog)
 *   FocusActivity.openAppSettings()   → void (opens system notification settings)
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

    // Detailed notification state for the on-device diagnostics, so a failure can
    // be SEEN instead of guessed at. Distinguishes the three independent things
    // that each silently suppress a notification on Android 13+/HyperOS:
    //   permission      — POST_NOTIFICATIONS runtime grant
    //   enabled         — the app's master "Show notifications" switch
    //   channelBlocked  — the Lembretes channel set to importance NONE
    @PluginMethod
    fun notifStatus(call: PluginCall) {
        val enabled = NotificationManagerCompat.from(context).areNotificationsEnabled()
        var channelImportance = -1
        var channelBlocked = false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ensureReminderChannel()
            val ch = (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .getNotificationChannel(reminderChannelId)
            if (ch != null) {
                channelImportance = ch.importance
                channelBlocked = ch.importance == NotificationManager.IMPORTANCE_NONE
            }
        }
        call.resolve(JSObject()
            .put("permission", hasNotifPermission())
            .put("enabled", enabled)
            .put("channelImportance", channelImportance)
            .put("channelBlocked", channelBlocked)
            .put("sdk", Build.VERSION.SDK_INT))
    }

    // True when the OS would still show the permission dialog; false when the user
    // has permanently denied (checked "never ask again" or denied twice on Android 13+).
    @PluginMethod
    fun shouldShowRationale(call: PluginCall) {
        val act = activity
        val show = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && act != null) {
            ActivityCompat.shouldShowRequestPermissionRationale(act, Manifest.permission.POST_NOTIFICATIONS)
        } else false
        call.resolve(JSObject().put("show", show))
    }

    // Opens system settings so the user can grant POST_NOTIFICATIONS after a
    // permanent denial. ROBUST on OEM skins (Xiaomi/HyperOS, etc.): the dedicated
    // ACTION_APP_NOTIFICATION_SETTINGS screen isn't honoured everywhere and the
    // launch can throw ActivityNotFoundException — which silently did nothing
    // before. We now try it, then fall back to the app's details page (always
    // present; on MIUI it carries the Permissions list), and prefer launching
    // from the real Activity (no NEW_TASK quirk) over the app Context.
    @PluginMethod
    fun openAppSettings(call: PluginCall) {
        val act = activity

        fun launch(intent: Intent): Boolean = try {
            if (act != null) {
                act.startActivity(intent)
            } else {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            }
            true
        } catch (e: Exception) { false }

        // 1) Per-app notification settings (Android 8+).
        val notifIntent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        // 2) Fallback: the app's "App info" page — guaranteed to exist.
        val detailsIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            .setData(Uri.fromParts("package", context.packageName, null))

        val opened =
            (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && launch(notifIntent)) ||
                launch(detailsIntent)

        call.resolve(JSObject().put("opened", opened))
    }

    // ── Plugin methods ───────────────────────────────────────────

    @PluginMethod
    fun start(call: PluginCall) {
        val title     = call.getString("title") ?: "Focus"
        val startedAt = call.getDouble("startedAt")?.toLong() ?: System.currentTimeMillis()
        val elapsedMs = call.getDouble("elapsedMs")?.toLong() ?: 0L
        val targetMs  = call.getDouble("targetMs")?.toLong() ?: 0L
        val accent    = call.getString("accent") ?: ""

        val intent = Intent(context, FocusService::class.java).apply {
            action = FocusService.ACTION_START
            putExtra(FocusService.EXTRA_TITLE,      title)
            putExtra(FocusService.EXTRA_STARTED_AT, startedAt)
            putExtra(FocusService.EXTRA_ELAPSED_MS, elapsedMs)
            putExtra(FocusService.EXTRA_TARGET_MS,  targetMs)
            putExtra(FocusService.EXTRA_ACCENT,     accent)
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

    // ── One-shot local reminders ─────────────────────────────────
    // The web Notification API and service-worker notifications don't work
    // inside the Capacitor WebView, so reminders (habits / nightly reflection)
    // are posted natively here, on their own channel separate from the ongoing
    // focus-timer service notification. `tag` gives each kind a stable id so a
    // new reminder of the same kind replaces the previous one instead of stacking.

    // Bumped to v2 so the channel is recreated with HIGH importance even for
    // users who already had the old DEFAULT-importance channel (Android won't
    // change an existing channel's importance once created).
    private val reminderChannelId = "pauta_reminders_v2"

    private fun ensureReminderChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                reminderChannelId,
                "Lembretes",
                // HIGH so the reminder pops as a heads-up and the user can't miss it.
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Avisos de hábitos pendentes e da reflexão da noite"
                setShowBadge(true)
            }
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(ch)
        }
    }

    // NOTE: named showReminder, not notify(), to avoid any ambiguity with the
    // final Object.notify() the plugin inherits — the JS bridge maps
    // FocusActivity.notify(...) onto this.
    @PluginMethod
    fun showReminder(call: PluginCall) {
        // No permission → no notification (Android 13+ silently drops it anyway).
        if (!hasNotifPermission()) {
            call.resolve(JSObject().put("shown", false).put("reason", "no-permission"))
            return
        }
        // Master switch off (or every channel blocked) → the OS drops it silently.
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            call.resolve(JSObject().put("shown", false).put("reason", "notifications-disabled"))
            return
        }
        val title = call.getString("title") ?: "Pauta"
        val body  = call.getString("body") ?: ""
        val tag   = call.getString("tag") ?: "pauta"
        val notifId = tag.hashCode()

        ensureReminderChannel()

        // Tap → bring the app to the front (same launch flags as the service one).
        val launchIntent = (context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent(context, MainActivity::class.java))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val launchPi = PendingIntent.getActivity(
            context, notifId, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val notif = NotificationCompat.Builder(context, reminderChannelId)
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
            NotificationManagerCompat.from(context).notify(notifId, notif)
            call.resolve(JSObject().put("shown", true).put("reason", "ok"))
        } catch (e: Exception) {
            // Permission revoked between the check and the post, or an OEM block —
            // surface the message so the diagnostics can show what actually failed.
            call.resolve(JSObject().put("shown", false).put("reason", "exception: ${e.message}"))
        }
    }

    // ── Scheduled background reminders (AlarmManager) ────────────
    // Unlike the in-app JS reminder loop (which only ticks while the WebView is
    // open), these fire even when the app is fully closed. JS passes the toggle
    // state, the two HH:mm times and the *already-localized* title/body strings
    // (so translation stays in the JS i18n layer); we persist + (re)schedule.
    // Returns { scheduled, exact } — exact=false means the OS denied exact alarms
    // (Android 12+), so delivery falls back to inexact and may drift by minutes.

    @PluginMethod
    fun scheduleReminders(call: PluginCall) {
        val enabled = call.getBoolean("enabled", false) ?: false
        ReminderScheduler.save(
            context, enabled,
            call.getString("habitsTime"), call.getString("reflectionTime"), call.getString("plannerTime"),
            call.getString("habitsTitle"), call.getString("habitsBody"),
            call.getString("reflectionTitle"), call.getString("reflectionBody"),
            call.getString("plannerTitle"), call.getString("plannerBody")
        )
        if (enabled) ReminderScheduler.rescheduleAll(context) else ReminderScheduler.cancelAll(context)
        call.resolve(JSObject()
            .put("scheduled", enabled)
            .put("exact", ReminderScheduler.canExact(context)))
    }

    @PluginMethod
    fun cancelReminders(call: PluginCall) {
        ReminderScheduler.save(context, false, null, null, null, null, null, null, null, null, null)
        ReminderScheduler.cancelAll(context)
        call.resolve(JSObject().put("scheduled", false))
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
