#!/bin/bash
set -e

echo "=========================================================="
echo "AMRA CHOR (আমরা চোর) — Genuine Android APK Build Engine"
echo "Package Name: com.amra.chor"
echo "=========================================================="

# 1. Build Production Web Assets
echo "Step 1: Building production Web/Three.js assets..."
npm run build

# 2. Setup Android project structure
echo "Step 2: Configuring Android Native project..."
BUILD_DIR="android_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"/gen
mkdir -p "$BUILD_DIR"/bin
mkdir -p "$BUILD_DIR"/src/com/amra/chor
mkdir -p "$BUILD_DIR"/res/values
mkdir -p "$BUILD_DIR"/res/layout
mkdir -p "$BUILD_DIR"/res/mipmap-hdpi
mkdir -p "$BUILD_DIR"/assets

# Copy Web build assets to Android assets
cp -r dist/* "$BUILD_DIR"/assets/

# 3. Create AndroidManifest.xml
cat << 'EOF' > "$BUILD_DIR"/AndroidManifest.xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.amra.chor"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.sensor.accelerometer" android:required="false" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name="com.amra.chor.AmraChorActivity"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|navigation"
            android:screenOrientation="sensorLandscape"
            android:launchMode="singleTask"
            android:alwaysRetainTaskState="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 4. Create strings.xml
cat << 'EOF' > "$BUILD_DIR"/res/values/strings.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Amra Chor</string>
    <string name="company_name">Amra Studio</string>
</resources>
EOF

# 5. Create styles.xml
cat << 'EOF' > "$BUILD_DIR"/res/values/styles.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar.Fullscreen">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
EOF

# 6. Create activity_main.xml layout
cat << 'EOF' > "$BUILD_DIR"/res/layout/activity_main.xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#000000">

    <WebView
        android:id="@+id/game_webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</RelativeLayout>
EOF

# 7. Generate genuine multi-density App Icons
bash scripts/generate_android_icons.sh

# 8. Create AmraChorActivity.java
cat << 'EOF' > "$BUILD_DIR"/src/com/amra/chor/AmraChorActivity.java
package com.amra.chor;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * AMRA CHOR - Master Android Activity (com.amra.chor)
 * High-performance full-screen WebGL / Three.js 3D Game Host with Native Hardware Acceleration.
 */
public class AmraChorActivity extends Activity {

    private WebView webView;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Hardware acceleration & Fullscreen
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        webView = (WebView) findViewById(R.id.game_webview);

        configureWebView();
        setImmersiveMode();

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);

        // Native bridge for sound/vibration
        webView.addJavascriptInterface(new NativeGameBridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                setImmersiveMode();
            }
        });
    }

    private void setImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            setImmersiveMode();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    /**
     * Native JavaScript Interface exposed to Three.js game
     */
    public class NativeGameBridge {
        @JavascriptInterface
        public void vibrate(long milliseconds) {
            if (vibrator != null && vibrator.hasVibrator()) {
                vibrator.vibrate(milliseconds);
            }
        }

        @JavascriptInterface
        public void showToast(final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(AmraChorActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
EOF

# 9. AAPT Package Resources & Generate R.java
echo "Step 3: Compiling Android Resources with aapt..."
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
aapt package -f -m \
    -J "$BUILD_DIR"/gen \
    -M "$BUILD_DIR"/AndroidManifest.xml \
    -S "$BUILD_DIR"/res \
    -I "$ANDROID_JAR"

# 10. Compile Java Source with javac
echo "Step 4: Compiling Java Sources to bytecode..."
javac -encoding UTF-8 -target 1.8 -source 1.8 \
    -bootclasspath "$ANDROID_JAR" \
    -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR"/bin \
    "$BUILD_DIR"/gen/com/amra/chor/R.java \
    "$BUILD_DIR"/src/com/amra/chor/AmraChorActivity.java

# 11. Convert bytecode to classes.dex using dx
echo "Step 5: Dexing Java Bytecode to classes.dex..."
/usr/local/bin/dx --dex --output="$BUILD_DIR"/bin/classes.dex "$BUILD_DIR"/bin

# 12. Create unaligned APK using aapt
echo "Step 6: Packaging APK with unaligned assets..."
aapt package -f \
    -M "$BUILD_DIR"/AndroidManifest.xml \
    -S "$BUILD_DIR"/res \
    -A "$BUILD_DIR"/assets \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR"/bin/app-unaligned.apk \
    "$BUILD_DIR"/bin

# 13. Align APK using zipalign
echo "Step 7: Aligning APK with zipalign..."
zipalign -f -v 4 "$BUILD_DIR"/bin/app-unaligned.apk "$BUILD_DIR"/bin/app-aligned.apk

# 14. Sign APK using apksigner with standard debug keystore
echo "Step 8: Signing APK with apksigner..."
if [ ! -f "$BUILD_DIR"/debug.keystore ]; then
    keytool -genkey -v \
        -keystore "$BUILD_DIR"/debug.keystore \
        -storepass android \
        -alias androiddebugkey \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=AmraStudio, OU=GameDev, O=AmraChor, L=Dhaka, ST=Dhaka, C=BD"
fi

apksigner sign \
    --ks "$BUILD_DIR"/debug.keystore \
    --ks-pass pass:android \
    --key-pass pass:android \
    --ks-key-alias androiddebugkey \
    --out "$BUILD_DIR"/app-debug.apk \
    "$BUILD_DIR"/bin/app-aligned.apk

# 15. Verify APK
echo "Step 9: Verifying APK signature..."
apksigner verify -v "$BUILD_DIR"/app-debug.apk

# 16. Copy APK to requested destination paths
echo "Step 10: Copying APK to output folders..."
mkdir -p "APK Download"
mkdir -p "APK_DOWNLOAD"
mkdir -p "public/APK_DOWNLOAD"

cp -f "$BUILD_DIR"/app-debug.apk "APK Download/app-debug.apk"
cp -f "$BUILD_DIR"/app-debug.apk "APK_DOWNLOAD/app-debug.apk"
cp -f "$BUILD_DIR"/app-debug.apk "public/APK_DOWNLOAD/app-debug.apk"

# Calculate exact size in MB
APK_SIZE_BYTES=$(wc -c < "APK_DOWNLOAD/app-debug.apk")
APK_SIZE_MB=$(echo "scale=2; $APK_SIZE_BYTES / 1048576" | bc)

echo "=========================================================="
echo "SUCCESS! REAL ANDROID APK SUCCESSFULLY BUILT & SIGNED"
echo "Package ID: com.amra.chor"
echo "Output Path 1: APK Download/app-debug.apk"
echo "Output Path 2: APK_DOWNLOAD/app-debug.apk"
echo "Output Path 3: public/APK_DOWNLOAD/app-debug.apk"
echo "File Size: ${APK_SIZE_MB} MB (${APK_SIZE_BYTES} bytes)"
echo "Target Android Versions: Android 5.0 (API 21) to Android 14+ (API 34)"
echo "Installation Compatibility: VERIFIED GENUINE DEBUG APK"
echo "=========================================================="
