package com.pauta.focus;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;

// Foreground service that owns the focus-session notification. A running
// session uses an ongoing notification with a native chronometer (ticks on its
// own, no per-second updates) plus pause/conclude actions; a paused session
// shows the accumulated time with resume/conclude.
public class FocusService extends Service {

    public static final String ACTION_START = "com.pauta.focus.START";
    public static final String ACTION_STOP = "com.pauta.focus.STOP";
    public static final String ACTION_PAUSE = "com.pauta.focus.PAUSE";
    public static final String ACTION_RESUME = "com.pauta.focus.RESUME";
    public static final String ACTION_CONCLUDE = "com.pauta.focus.CONCLUDE";

    private static final String CHANNEL_ID = "pauta_focus";
    private static final int NOTIF_ID = 4202;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP.equals(action)) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) { emit("pause"); return START_STICKY; }
        if (ACTION_RESUME.equals(action)) { emit("resume"); return START_STICKY; }
        if (ACTION_CONCLUDE.equals(action)) { emit("conclude"); return START_STICKY; }

        // ACTION_START (default): (re)build the notification.
        String title = intent != null && intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "Pauta";
        String body = intent != null && intent.getStringExtra("body") != null ? intent.getStringExtra("body") : "";
        long startedAt = intent != null ? intent.getLongExtra("startedAt", System.currentTimeMillis()) : System.currentTimeMillis();
        boolean paused = intent != null && intent.getBooleanExtra("paused", false);

        Notification n = buildNotification(title, body, startedAt, paused);
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIF_ID, n);
        }
        return START_STICKY;
    }

    private void emit(String kind) {
        if (FocusActivityPlugin.instance != null) {
            FocusActivityPlugin.instance.emitAction(kind);
        }
    }

    private Notification buildNotification(String title, String body, long startedAt, boolean paused) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Foco", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(getApplicationInfo().icon)
                .setOngoing(!paused)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(launchIntent());

        if (paused) {
            b.setUsesChronometer(false).setShowWhen(false);
            b.addAction(0, "Retomar", servicePI(ACTION_RESUME));
        } else {
            // Chronometer counts up from startedAt (in System.currentTimeMillis() terms).
            b.setUsesChronometer(true).setShowWhen(true).setWhen(startedAt);
            b.addAction(0, "Pausar", servicePI(ACTION_PAUSE));
        }
        b.addAction(0, "Concluir", servicePI(ACTION_CONCLUDE));
        return b.build();
    }

    private PendingIntent servicePI(String action) {
        Intent i = new Intent(this, FocusService.class);
        i.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getService(this, action.hashCode(), i, flags);
    }

    private PendingIntent launchIntent() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) launch = new Intent();
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(this, 0, launch, flags);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // If the app is swiped away, drop the notification too.
        stopForeground(true);
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }
}
