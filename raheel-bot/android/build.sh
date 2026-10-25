#!/usr/bin/env bash
# Builds Pilot.apk without Gradle using the Ubuntu-packaged Android tools:
#   sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
set -euo pipefail
cd "$(dirname "$0")"
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
OUT=build
rm -rf "$OUT" && mkdir -p "$OUT/classes" "$OUT/assets/www/icons" "$OUT/assets/www/fonts" "$OUT/gen"

# Web app goes in as assets (service worker isn't used inside the APK).
cp ../index.html ../styles.css ../app.js ../manifest.webmanifest "$OUT/assets/www/"
cp ../icons/* "$OUT/assets/www/icons/"
cp ../fonts/*.woff2 "$OUT/assets/www/fonts/"

aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR"
javac -nowarn -Xlint:-options --release 8 -classpath "$ANDROID_JAR" -d "$OUT/classes" \
  $(find src "$OUT/gen" -name '*.java')
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/classes"

aapt package -f -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$ANDROID_JAR" -0 arsc -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

# Same key every build so new versions install over old ones without losing data.
apksigner sign --ks pilot-release.keystore --ks-pass pass:pilot-lynxify --key-pass pass:pilot-lynxify \
  --out Pilot.apk "$OUT/aligned.apk"
apksigner verify Pilot.apk
echo "Built $(pwd)/Pilot.apk"
