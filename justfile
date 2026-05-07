# fauxfetus task runner
# Run `just --list` to see all available recipes.

set shell := ["bash", "-uc"]
set dotenv-load

# ── Shared / private recipes ────────────────────────────────────────

# Run svelte-kit sync (internal, used as dependency)
_sync:
  svelte-kit sync

# Run prettier check (no writes)
_prettier-check: _sync
  prettier --check .

# Run eslint
_eslint:
  eslint .

# Run svelte-check
_svelte-check: _sync
  svelte-check --tsconfig ./tsconfig.json

# ── Public recipes ──────────────────────────────────────────────────

# Start the dev server
dev:
  vite dev

# Production build
build: lint
  vite build

# Preview the production build locally
preview: build
  vite preview

# Type-check the project
check: _sync
  svelte-check --tsconfig ./tsconfig.json

# Type-check in watch mode
check-watch: _sync
  svelte-check --tsconfig ./tsconfig.json --watch

# Format all files with prettier
format:
  prettier --write .

# Lint: prettier check + eslint + svelte-check
lint: _prettier-check _eslint _svelte-check

# Regenerate catalog/tracks JSON from audio files
data-generate:
  tsx ./scripts/data/generate.ts

# Deploy: lint + build + rsync to server
deploy: build
  #!/usr/bin/env bash
  set -euo pipefail
  rsync -avzh --delete build/ meowsus@fauxfetus.net:fauxfetus.net/

# Create a release (patch|minor|major)
release bump:
  #!/usr/bin/env bash
  set -euo pipefail

  # Validate the argument
  if [[ ! "{{ bump }}" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ Invalid release type: '{{ bump }}'"
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
  pnpm version {{ bump }} --no-git-tag-version

  VERSION=$(jq -r '.version' package.json)

  # Stage version bump + changelog
  git add package.json CHANGELOG.md

  # Create release commit
  git commit -m "Release v$VERSION"

  git repull

  # Tag it
  git tag "v$VERSION"

  git push
  git push origin "v$VERSION"

  echo "✨ Release v$VERSION created."