#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/release.sh patch
#   ./scripts/release.sh minor
#   ./scripts/release.sh major

# Ensure version bump type was provided
if [ $# -ne 1 ]; then
  echo "❌ Missing argument."
  echo "Usage: $0 <patch|minor|major>"
  exit 1
fi

BUMP=$1

# Validate the argument
if [[ ! "$BUMP" =~ ^(patch|minor|major)$ ]]; then
  echo "❌ Invalid release type: '$BUMP'"
  echo "Valid options: patch, minor, major"
  exit 1
fi

# Ensure clean working tree except CHANGELOG.md
if ! git diff --quiet -- . ':!CHANGELOG.md' || ! git diff --cached --quiet -- . ':!CHANGELOG.md'; then
  echo "❌ Commit or stash your changes before releasing (except CHANGELOG.md)."
  exit 1
fi

# Ensure CHANGELOG.md has modifications
if git diff --quiet -- CHANGELOG.md && git diff --cached --quiet -- CHANGELOG.md; then
  echo "❌ CHANGELOG.md has not been updated. Please update it before releasing."
  exit 1
fi

echo "✓ CHANGELOG.md updated."

# Bump version without auto-commit or auto-tag
pnpm version $BUMP --no-git-tag-version

VERSION=$(jq -r '.version' package.json)

# Stage version bump + changelog
git add package.json CHANGELOG.md

# Create release commit
git commit -m "Release v$VERSION"

git repull

# Tag it
git tag "v$VERSION"

git push
git push --tags

echo "✨ Release v$VERSION created."