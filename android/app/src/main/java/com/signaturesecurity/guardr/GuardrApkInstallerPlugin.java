package com.signaturesecurity.guardr;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "GuardrApkInstaller")
public class GuardrApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("url is required");
            return;
        }

        new Thread(() -> {
            try {
                File apkFile = downloadApk(url.trim());
                getActivity().runOnUiThread(() -> {
                    try {
                        launchInstaller(apkFile);
                        call.resolve();
                    } catch (Exception error) {
                        call.reject("Install failed: " + error.getMessage(), error);
                    }
                });
            } catch (Exception error) {
                call.reject("Download failed: " + error.getMessage(), error);
            }
        }).start();
    }

    private File downloadApk(String urlString) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(30000);
        connection.setReadTimeout(120000);
        connection.connect();

        int responseCode = connection.getResponseCode();
        if (responseCode < 200 || responseCode >= 300) {
            throw new Exception("HTTP " + responseCode);
        }

        File cacheDir = new File(getContext().getCacheDir(), "apk-updates");
        if (!cacheDir.exists() && !cacheDir.mkdirs()) {
            throw new Exception("Could not create cache directory");
        }

        File apkFile = new File(cacheDir, "guardr-update.apk");
        if (apkFile.exists() && !apkFile.delete()) {
            throw new Exception("Could not replace existing update file");
        }

        try (InputStream input = connection.getInputStream();
             FileOutputStream output = new FileOutputStream(apkFile)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            output.flush();
        } finally {
            connection.disconnect();
        }

        return apkFile;
    }

    private void launchInstaller(File apkFile) {
        Uri apkUri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            apkFile
        );

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }

        getContext().startActivity(intent);
    }
}
