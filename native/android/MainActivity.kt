package com.pauta.app

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(FocusActivityPlugin::class.java)
        super.onCreate(savedInstanceState)

        // Draw edge-to-edge with transparent system bars so the app's own (themed)
        // background sits behind the status/navigation bars — instead of the
        // default light window background showing as an ugly grey/white strip at
        // the bottom. The web layer reserves room for the bars via
        // env(safe-area-inset-*) (viewport-fit=cover is set in index.html).
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }
    }
}
