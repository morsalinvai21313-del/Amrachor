#!/bin/bash
set -e

SOURCE_IMG="public/assets/aistudio/file_00000000b0548210b869988ab75d2848_8d600dd4.png"
if [ ! -f "$SOURCE_IMG" ]; then
    SOURCE_IMG="public/assets/aistudio/file_0000000089d48210828f715302f8faf5_400cb4ef.png"
fi

echo "Generating genuine Android App Icons from $SOURCE_IMG..."

# Generate master 512x512 icon
mkdir -p public
convert "$SOURCE_IMG" -crop 210x210+240+0 +repage -filter Lanczos -resize 512x512 public/app_icon.png

# Generate master round icon with circular mask
convert public/app_icon.png \( -size 512x512 xc:none -fill white -draw "circle 256,256 256,0" \) -compose DstIn -composite public/app_icon_round.png

# Generate 48x48 favicon
convert public/app_icon_round.png -resize 48x48 public/favicon.png

# Target Android densities
declare -A SIZES=(
    ["mdpi"]="48x48 24"
    ["hdpi"]="72x72 36"
    ["xhdpi"]="96x96 48"
    ["xxhdpi"]="144x144 72"
    ["xxxhdpi"]="192x192 96"
)

BUILD_RES="android_build/res"
for DENSITY in "${!SIZES[@]}"; do
    INFO=(${SIZES[$DENSITY]})
    DIM="${INFO[0]}"
    RADIUS="${INFO[1]}"
    TARGET_DIR="$BUILD_RES/mipmap-$DENSITY"
    mkdir -p "$TARGET_DIR"

    # Square / squircle launcher icon
    convert public/app_icon.png -filter Lanczos -resize "$DIM" "$TARGET_DIR/ic_launcher.png"

    # Circular launcher icon
    convert public/app_icon_round.png -filter Lanczos -resize "$DIM" "$TARGET_DIR/ic_launcher_round.png"

    echo "Generated $DENSITY ($DIM) icons in $TARGET_DIR"
done

echo "Android Launcher Icons successfully created for all densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)!"
