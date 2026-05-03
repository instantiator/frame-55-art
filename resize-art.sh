#!/bin/bash

# defaults
TARGET="./art/output"
JSON_PATH="./data/dimensions.json"
DEVICE=".samsung.frame55"
IMAGE_TYPES="*.jpg *.jpeg *.png"

# a function to print the usage of the script
usage() {
  echo "Resizes art images for a given device."
  echo
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  -t, --target    Target directory for resized images (default: $TARGET)"
  echo "  -j, --json      Path to dimensions json (default: $JSON_PATH)"
  echo "  -d, --device    jq path to the device in dimensions json (default: $DEVICE)"
  echo "  -h, --help      Show this help message and exit"
  echo
}

# if the magick command is not present, install imagemagick
if ! command -v magick &> /dev/null
then
  echo "magick could not be found, installing imagemagick..."
  brew install imagemagick
  echo
fi

# if the jq command is not present, install jq
if ! command -v jq &> /dev/null
then
  echo "jq could not be found, installing jq..."
  brew install jq
  echo
fi

# iterate through the arguments
while [[ "$1" == -* ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -d|--device)
      DEVICE="$2"
      shift 2
      ;;
    -s|--source)
      SOURCE="$2"
      shift 2
      ;;
    -t|--target)
      TARGET="$2"
      shift 2
      ;;
    -j|--json)
      JSON_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

# if the SOURCE variable is not set, exit with an error
if [ -z "$SOURCE" ]; then
  echo "Error: Source directory not specified. Use -s or --source to specify the source directory."
  echo
  usage
  exit 1
fi

# use jq to get the dimensions (width, height) from the dimensions.json file
WIDTH=$(jq -r "$DEVICE.width" $JSON_PATH)
HEIGHT=$(jq -r "$DEVICE.height" $JSON_PATH)
NAME=$(jq -r "$DEVICE.name" $JSON_PATH)

# if width, height, or name could not be found, exit with an error
if [ -z "$WIDTH" ] || [ -z "$HEIGHT" ] || [ -z "$NAME" ]; then
  echo "Error: Could not find dimensions for device: $DEVICE in $JSON_PATH"
  echo
  exit 1
fi

echo "Resizing images to ${WIDTH}x${HEIGHT} for device: $NAME"
echo

# iterate through all image files in SOURCE
for IMAGE_TYPE in $IMAGE_TYPES; do
  for IMAGE_FILENAME in "$SOURCE"/$IMAGE_TYPE; do
    echo "Processing $IMAGE_FILENAME..."
    if [ ! -f "$IMAGE_FILENAME" ]; then
      echo "No files found for pattern: $SOURCE/$IMAGE_TYPE"
      echo
      continue
    fi
    
    # use magick to resize the image to the dimensions specified in dimensions.json
    # equivalent to object-fit: cover in css (ie. resize to fill dimensions, crop if necessary)
    # save the file as: TARGET/directories/from/DEVICE/IMAGE
    OUTPUT_FILENAME="$TARGET/$NAME/$(basename "$IMAGE_FILENAME")"
    mkdir -p "$(dirname "$OUTPUT_FILENAME")"
    magick convert "$IMAGE_FILENAME" -resize "${WIDTH}x${HEIGHT}^" -gravity center -extent "${WIDTH}x${HEIGHT}" "$OUTPUT_FILENAME"
    echo
  done
done

# summarise
echo "Resizing complete. Resized images saved to: $TARGET/$NAME"
echo
