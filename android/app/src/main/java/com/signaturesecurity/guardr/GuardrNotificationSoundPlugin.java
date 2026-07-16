package com.signaturesecurity.guardr;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.activity.result.ActivityResult;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GuardrNotificationSound")
public class GuardrNotificationSoundPlugin extends Plugin {

    public static final String CHANNEL_ID = "guardr_alerts";
    private static final String PREFS_NAME = "guardr_notification_sound";
    private static final String PREF_MODE = "mode";
    private static final String PREF_URI = "custom_uri";

    private static final String MODE_GUARDR = "guardr";
    private static final String MODE_SYSTEM_DEFAULT = "system_default";
    private static final String MODE_SYSTEM_CUSTOM = "system_custom";

    @PluginMethod
    public void applyPreference(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.unavailable();
            return;
        }

        String mode = call.getString("mode", MODE_GUARDR);
        String uri = call.getString("uri", null);
        if (!MODE_GUARDR.equals(mode) && !MODE_SYSTEM_DEFAULT.equals(mode) && !MODE_SYSTEM_CUSTOM.equals(mode)) {
            call.reject("Invalid notification sound mode");
            return;
        }
        if (MODE_SYSTEM_CUSTOM.equals(mode) && (uri == null || uri.trim().isEmpty())) {
            call.reject("Custom notification sound requires a uri");
            return;
        }

        createAlertsChannel(mode, uri);
        savePreference(mode, uri);
        call.resolve(buildPreferenceResult(mode, uri));
    }

    @PluginMethod
    public void getPreference(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.unavailable();
            return;
        }

        String mode = getSavedMode();
        String uri = getSavedUri();
        call.resolve(buildPreferenceResult(mode, uri));
    }

    @PluginMethod
    public void pickSystemSound(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.unavailable();
            return;
        }

        Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Notification sound");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);

        String savedUri = getSavedUri();
        if (MODE_SYSTEM_CUSTOM.equals(getSavedMode()) && savedUri != null && !savedUri.isEmpty()) {
            intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(savedUri));
        } else {
            intent.putExtra(
                RingtoneManager.EXTRA_RINGTONE_EXISTING_URI,
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            );
        }

        startActivityForResult(call, intent, "pickSystemSoundResult");
    }

    @ActivityCallback
    private void pickSystemSoundResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            call.reject("Cancelled");
            return;
        }

        Intent data = result.getData();
        Uri pickedUri = data != null ? data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI) : null;
        if (pickedUri == null) {
            call.reject("No sound selected");
            return;
        }

        String uri = pickedUri.toString();
        createAlertsChannel(MODE_SYSTEM_CUSTOM, uri);
        savePreference(MODE_SYSTEM_CUSTOM, uri);
        call.resolve(buildPreferenceResult(MODE_SYSTEM_CUSTOM, uri));
    }

    @PluginMethod
    public void previewSound(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.unavailable();
            return;
        }

        Uri soundUri = resolveSoundUri(getSavedMode(), getSavedUri());
        if (soundUri == null) {
            call.resolve();
            return;
        }

        Ringtone ringtone = RingtoneManager.getRingtone(getContext(), soundUri);
        if (ringtone != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                ringtone.setAudioAttributes(attrs);
            }
            ringtone.play();
        }

        call.resolve();
    }

    @PluginMethod
    public void ensureChannel(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.unavailable();
            return;
        }

        createAlertsChannel(getSavedMode(), getSavedUri());
        call.resolve();
    }

    private void createAlertsChannel(String mode, String customUri) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = getNotificationManager();
        manager.deleteNotificationChannel(CHANNEL_ID);

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Guardr alerts",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Operational alerts from Guardr");
        channel.enableVibration(true);
        channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        Uri soundUri = resolveSoundUri(mode, customUri);
        if (soundUri != null) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
            channel.setSound(soundUri, audioAttributes);
        }

        manager.createNotificationChannel(channel);
    }

    private Uri resolveSoundUri(String mode, String customUri) {
        if (MODE_GUARDR.equals(mode)) {
            return Uri.parse(
                "android.resource://" + getContext().getPackageName() + "/raw/guardr_notification"
            );
        }
        if (MODE_SYSTEM_CUSTOM.equals(mode) && customUri != null && !customUri.isEmpty()) {
            return Uri.parse(customUri);
        }
        if (MODE_SYSTEM_DEFAULT.equals(mode)) {
            return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }

    private NotificationManager getNotificationManager() {
        Context context = getContext();
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private void savePreference(String mode, String uri) {
        SharedPreferences.Editor editor = prefs().edit().putString(PREF_MODE, mode);
        if (MODE_SYSTEM_CUSTOM.equals(mode) && uri != null) {
            editor.putString(PREF_URI, uri);
        } else {
            editor.remove(PREF_URI);
        }
        editor.apply();
    }

    private String getSavedMode() {
        return prefs().getString(PREF_MODE, MODE_GUARDR);
    }

    private String getSavedUri() {
        return prefs().getString(PREF_URI, null);
    }

    private JSObject buildPreferenceResult(String mode, String uri) {
        JSObject result = new JSObject();
        result.put("mode", mode);
        if (MODE_SYSTEM_CUSTOM.equals(mode) && uri != null) {
            result.put("uri", uri);
        }
        result.put("label", resolveLabel(mode, uri));
        return result;
    }

    private String resolveLabel(String mode, String uri) {
        if (MODE_GUARDR.equals(mode)) {
            return "Guardr tone";
        }
        if (MODE_SYSTEM_DEFAULT.equals(mode)) {
            return "System default";
        }
        if (MODE_SYSTEM_CUSTOM.equals(mode) && uri != null) {
            return resolveRingtoneTitle(Uri.parse(uri));
        }
        return "System default";
    }

    private String resolveRingtoneTitle(Uri uri) {
        Ringtone ringtone = RingtoneManager.getRingtone(getContext(), uri);
        if (ringtone == null) {
            return "Custom tone";
        }
        String title = ringtone.getTitle(getContext());
        return title != null && !title.trim().isEmpty() ? title : "Custom tone";
    }
}
