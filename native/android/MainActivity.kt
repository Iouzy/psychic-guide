package com.pauta.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(FocusActivityPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
