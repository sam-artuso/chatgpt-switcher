#!/bin/bash
#
# Copyright (c) 2025 Samuele Artuso
# SPDX-License-Identifier: BSD-3-Clause

# Bump version in manifest.json

set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST="$PROJECT_ROOT/src/manifest.json"

# Usage information
usage() {
    echo "Usage: $0 [major|minor|patch]"
    echo ""
    echo "Bump the version number in manifest.json"
    echo "Defaults to 'patch' if no argument provided"
    echo ""
    echo "Examples:"
    echo "  $0          # 1.0.1 -> 1.0.2 (default: patch)"
    echo "  $0 patch    # 1.0.1 -> 1.0.2"
    echo "  $0 minor    # 1.0.1 -> 1.1.0"
    echo "  $0 major    # 1.0.1 -> 2.0.0"
    exit 1
}

# Check arguments - default to 'patch' if not provided
if [ $# -eq 0 ]; then
    BUMP_TYPE="patch"
elif [ $# -eq 1 ]; then
    BUMP_TYPE="$1"
else
    usage
fi

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "Error: Invalid bump type '$BUMP_TYPE'"
    usage
fi

# Check if manifest exists
if [ ! -f "$MANIFEST" ]; then
    echo "Error: manifest.json not found at $MANIFEST"
    exit 1
fi

# Extract current version
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' "$MANIFEST" | cut -d'"' -f4)

if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not find version in manifest.json"
    exit 1
fi

echo "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Bump the appropriate part
case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Update manifest.json
# Use sed with backup file for cross-platform compatibility
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST"

# Remove backup file
rm "$MANIFEST.bak"

echo "✓ Version bumped successfully!"
echo "📝 Updated: $MANIFEST"
