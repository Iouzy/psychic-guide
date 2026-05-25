package com.pauta.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Foreground service that owns the ongoing focus-timer notification.
 *
 * Commands are delivered as startService() calls with an action string:
 *   ACTION_START  — create the notification and enter the foreground
 *   ACTION_UPDATE — refresh the notification text / chronometer base
 *   ACTION_STOP   — remove the notification and stop the service
 *
 * The notification shows a system chronometer (ticks automatically without
 * per-second JS updates) when active, and a static "Pausado" label when paused.
 * Three action buttons (Pause / Resume / Conclude) are wired to PendingIntents
 * that fire the matching broadcast, caught by FocusActionReceiver.
 */
class FocusService : Service() {

    private val CHANNEL_ID = "focus_timer_v2"
    // Distinctive ID to avoid colliding with @capacitor/local-notifications,
    // which lets the JS side pick its own IDs from a low range.
    private val NOTIF_ID   = 0xF0C05

    // Last-known state so ACTION_UPDATE can rebuild the notification without
    // repeating all the start parameters. Mirrored to SharedPreferences so it
    // survives process death — notification PendingIntents outlive the process,
    // and a user tapping Pause/Resume/Conclude after the OS reclaimed us would
    // otherwise restart the service with a zeroed chronometer.
    private var lastTitle     = "Focus"
    private var lastStartedAt = 0L
    private var lastElapsedMs = 0L
    private var lastPaused    = false

    override fun onCreate() {
        super.onCreate()
        loadPersistedState()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Mutate last-known state from intent extras (no-op if extras are absent).
        when (intent?.action) {
            ACTION_START -> {
                lastTitle     = intent.getStringExtra(EXTRA_TITLE) ?: lastTitle
                lastStartedAt = intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis())
                lastElapsedMs = intent.getLongExtra(EXTRA_ELAPSED_MS, 0L)
                lastPaused    = false
                persistState()
            }
            ACTION_UPDATE -> {
                lastElapsedMs = intent.getLongExtra(EXTRA_ELAPSED_MS, lastElapsedMs)
                lastPaused    = intent.getBooleanExtra(EXTRA_PAUSED, lastPaused)
                if (lastStartedAt == 0L) lastStartedAt = System.currentTimeMillis()
                persistState()
            }
        }

        // Always enter (or re-enter) the foreground before dispatching the action.
        // This satisfies the startForegroundService 5-second contract for every
        // delivery — including ACTION_UPDATE on a freshly-spawned process and
        // ACTION_STOP after the OS killed us — preventing
        // ForegroundServiceDidNotStartInTimeException ANRs.
        ensureChannel()
        startForeground(NOTIF_ID,
            buildNotification(lastTitle, lastStartedAt, lastElapsedMs, lastPaused))

        if (intent?.action == ACTION_STOP) {
            clearPersistedState()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
            stopSelf()
        }
        return START_NOT_STICKY
    }

    // ── State persistence (survives process death) ───────────────

    private fun prefs() = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

    private fun loadPersistedState() {
        val p = prefs()
        lastTitle     = p.getString(EXTRA_TITLE, lastTitle) ?: lastTitle
        lastStartedAt = p.getLong(EXTRA_STARTED_AT, lastStartedAt)
        lastElapsedMs = p.getLong(EXTRA_ELAPSED_MS, lastElapsedMs)
        lastPaused    = p.getBoolean(EXTRA_PAUSED, lastPaused)
    }

    private fun persistState() {
        prefs().edit()
            .putString(EXTRA_TITLE, lastTitle)
            .putLong(EXTRA_STARTED_AT, lastStartedAt)
            .putLong(EXTRA_ELAPSED_MS, lastElapsedMs)
            .putBoolean(EXTRA_PAUSED, lastPaused)
            .apply()
    }

    private fun clearPersistedState() {
        prefs().edit().clear().apply()
    }

    // ── Notification helpers ─────────────────────────────────────

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID,
                "Focus Timer",
                // DEFAULT = shows on lock screen; sound/vibration disabled below
                // so it behaves silently but is still visible on the lock screen.
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Shows the ongoing focus session and timer controls"
                setShowBadge(false)
                setSound(null, null)          // no sound
                enableVibration(false)        // no vibration
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(ch)
        }
    }

    private fun actionPendingIntent(action: String, requestCode: Int): PendingIntent {
        val broadcast = Intent(action).setPackage(packageName)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        return PendingIntent.getBroadcast(this, requestCode, broadcast, flags)
    }

    private fun buildNotification(
        title: String,
        startedAt: Long,
        elapsedMs: Long,
        paused: Boolean,
    ): Notification {

        // Tap → bring the app to the front. NEW_TASK is required when launching
        // from a non-Activity context (service / notification); SINGLE_TOP avoids
        // stacking duplicate instances. Fall back to an explicit MainActivity
        // intent if the launcher intent is null (rare OEM edge case).
        val launchIntent = (packageManager.getLaunchIntentForPackage(packageName)
            ?: Intent(this, MainActivity::class.java))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val launchPi = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_focus)
            .setContentTitle(title)
            .setOngoing(true)
            .setContentIntent(launchPi)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)

        if (paused) {
            builder.setContentText("Pausado")
        } else {
            // Chronometer base = now − elapsedMs → shows total accumulated focus time
            val base = System.currentTimeMillis() - elapsedMs
            builder
                .setUsesChronometer(true)
                .setWhen(base)
                .setContentText("Em foco")
        }

        // Action buttons — only show the contextually correct one for Pause/Resume
        if (paused) {
            builder.addAction(0, "Retomar",
                actionPendingIntent(FocusActionReceiver.ACTION_RESUME, 1))
        } else {
            builder.addAction(0, "Pausar",
                actionPendingIntent(FocusActionReceiver.ACTION_PAUSE, 0))
        }
        builder.addAction(0, "Concluir",
            actionPendingIntent(FocusActionReceiver.ACTION_CONCLUDE, 2))

        return builder.build()
    }

    companion object {
        const val ACTION_START  = "com.pauta.app.SERVICE_START"
        const val ACTION_UPDATE = "com.pauta.app.SERVICE_UPDATE"
        const val ACTION_STOP   = "com.pauta.app.SERVICE_STOP"

        const val EXTRA_TITLE      = "title"
        const val EXTRA_STARTED_AT = "startedAt"
        const val EXTRA_ELAPSED_MS = "elapsedMs"
        const val EXTRA_PAUSED     = "paused"

        private const val PREFS_NAME = "focus_service_state"
    }
}
