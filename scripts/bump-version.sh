#!/bin/bash
# bump-version.sh: Bump the patch version in version.js and update service worker cache names

# Read current version
CURRENT_VERSION=$(grep "APP_VERSION = " version.js | sed "s/.*APP_VERSION = '\(.*\)';/\1/")
echo "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Increment patch version
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
echo "New version: $NEW_VERSION"

# Update version.js
sed -i "s/APP_VERSION = '.*'/APP_VERSION = '$NEW_VERSION'/" version.js

# Update service worker cache names
sed -i "s/robinson-limit-mp-v[0-9]*\.[0-9]*\.[0-9]*/robinson-limit-mp-v$NEW_VERSION/g" service-worker.js
sed -i "s/robinson-limit-mp-static-v[0-9]*\.[0-9]*\.[0-9]*/robinson-limit-mp-static-v$NEW_VERSION/g" service-worker.js
sed -i "s/robinson-limit-mp-dynamic-v[0-9]*\.[0-9]*\.[0-9]*/robinson-limit-mp-dynamic-v$NEW_VERSION/g" service-worker.js

echo "Updated cache names:"
grep "CACHE_NAME" service-worker.js 