#!/bin/bash

# Version bump script for RobinsonLimitMP
# Usage: ./scripts/bump-version.sh [major|minor|patch]

set -e

# Default to patch if no argument provided
BUMP_TYPE=${1:-patch}

# Read current version
CURRENT_VERSION=$(grep "APP_VERSION = " version.js | sed "s/.*APP_VERSION = '\(.*\)';/\1/")
echo "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Calculate new version based on bump type
case "$BUMP_TYPE" in
  "major")
    NEW_VERSION="$((MAJOR + 1)).0.0"
    echo "Bumping major version"
    ;;
  "minor")
    NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
    echo "Bumping minor version"
    ;;
  "patch")
    NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
    echo "Bumping patch version"
    ;;
  *)
    echo "Invalid bump type. Use: major, minor, or patch"
    exit 1
    ;;
esac

echo "New version: $NEW_VERSION"

# Update version.js
sed -i.bak "s/APP_VERSION = '.*'/APP_VERSION = '$NEW_VERSION'/" version.js
rm version.js.bak

# Update service worker cache names
sed -i.bak "s/robinson-limit-mp-v[0-9]*\.[0-9]*\.[0-9]*/robinson-limit-mp-v$NEW_VERSION/g" service-worker.js
sed -i.bak "s/robinson-limit-mp-static-v[0-9]*\.[0-9]*\.[0-9]*/robinson-limit-mp-static-v$NEW_VERSION/g" service-worker.js
sed -i.bak "s/robinson-limit-mp-dynamic-v[0-9]*\.[0-9]*\.[0-9]*/robinson-limit-mp-dynamic-v$NEW_VERSION/g" service-worker.js
rm service-worker.js.bak

echo "✅ Version bumped to $NEW_VERSION"
echo "Files updated: version.js, service-worker.js"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Commit the changes: git add version.js service-worker.js"
echo "3. Push to trigger deployment: git push" 