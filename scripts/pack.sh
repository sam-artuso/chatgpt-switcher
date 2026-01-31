#!/bin/bash
#
# Copyright (c) 2025 Samuele Artuso
# SPDX-License-Identifier: BSD-3-Clause

# Pack the Chrome extension for distribution

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Define paths
BUILD_DIR="$PROJECT_ROOT/dist/build"
DIST_DIR="$PROJECT_ROOT/dist"
ZIP_FILE="$DIST_DIR/chrome-extension.zip"

# Ensure build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: Build directory does not exist. Run 'pnpm build' first."
    exit 1
fi

# Create dist directory if it doesn't exist
mkdir -p "$DIST_DIR"

# Remove existing zip file if it exists
if [ -f "$ZIP_FILE" ]; then
    echo "Removing existing $ZIP_FILE..."
    rm "$ZIP_FILE"
fi

# Create the zip file
echo "Packing extension from $BUILD_DIR..."
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . -x "*.DS_Store" -x "__MACOSX/*" -x "*.map"

if [ $? -eq 0 ]; then
    echo "✓ Extension packed successfully!"
    echo "📦 Output: $ZIP_FILE"
    echo "📊 Size: $(du -h "$ZIP_FILE" | cut -f1)"
else
    echo "✗ Error packing extension"
    exit 1
fi
