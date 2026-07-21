package com.signaturesecurity.guardr;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GuardrNotificationSoundPlugin.class);
        registerPlugin(GuardrApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
