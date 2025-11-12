#!/bin/bash

# Pack the Chrome extension for distribution

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Define paths
SRC_DIR="$PROJECT_ROOT/src"
DIST_DIR="$PROJECT_ROOT/dist"
ZIP_FILE="$DIST_DIR/chrome-extension.zip"

# Create dist directory if it doesn't exist
mkdir -p "$DIST_DIR"

# Remove existing zip file if it exists
if [ -f "$ZIP_FILE" ]; then
    echo "Removing existing $ZIP_FILE..."
    rm "$ZIP_FILE"
fi

# Create the zip file
echo "Packing extension from $SRC_DIR..."
cd "$SRC_DIR"
zip -r "$ZIP_FILE" . -x "*.DS_Store" -x "__MACOSX/*"

if [ $? -eq 0 ]; then
    echo "✓ Extension packed successfully!"
    echo "📦 Output: $ZIP_FILE"
    echo "📊 Size: $(du -h "$ZIP_FILE" | cut -f1)"
else
    echo "✗ Error packing extension"
    exit 1
fi
