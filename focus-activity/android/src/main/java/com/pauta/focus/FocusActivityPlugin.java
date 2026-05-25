package com.pauta.focus;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Bridges the web focus session to a foreground service so the timer keeps a
// live, glanceable notification (which HyperOS / OEM "islands" surface) and can
// be driven by notification actions while the app is in the background.
//
// Reachable from the bundler-less web layer as window.Capacitor.Plugins.FocusActivity.
@CapacitorPlugin(name = "FocusActivity")
public class FocusActivityPlugin extends Plugin {

    // Set while the WebView/process is alive, so the service can push actions back.
    public static FocusActivityPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @PluginMethod
    public void start(PluginCall call) {
        sendToService(call);
    }

    @PluginMethod
    public void update(PluginCall call) {
        // Same as start: ACTION_START rebuilds the notification in place.
        sendToService(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent i = new Intent(getContext(), FocusService.class);
        i.setAction(FocusService.ACTION_STOP);
        getContext().startService(i);
        call.resolve();
    }

    private void sendToService(PluginCall call) {
        String title = call.getString("title", "Pauta");
        String body = call.getString("body", "");
        double startedAtD = call.getDouble("startedAt", (double) System.currentTimeMillis());
        boolean paused = Boolean.TRUE.equals(call.getBoolean("paused", false));

        Intent i = new Intent(getContext(), FocusService.class);
        i.setAction(FocusService.ACTION_START);
        i.putExtra("title", title);
        i.putExtra("body", body);
        i.putExtra("startedAt", (long) startedAtD);
        i.putExtra("paused", paused);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(i);
        } else {
            getContext().startService(i);
        }
        call.resolve();
    }

    // Invoked by the service when a notification action is tapped.
    void emitAction(String kind) {
        JSObject data = new JSObject();
        data.put("kind", kind);
        notifyListeners("action", data, true);
    }
}
