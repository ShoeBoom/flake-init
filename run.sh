#!/bin/sh
set -eu

REPO="flake-init"
OWNER="ShoeBoom"

CACHE_DIR="/tmp/flake-init"
CACHE_PATH="$CACHE_DIR/flake-init"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) PLATFORM_OS="darwin" ;;
  Linux) PLATFORM_OS="linux" ;;
  *)
    echo "Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64) PLATFORM_ARCH="x64" ;;
  arm64|aarch64) PLATFORM_ARCH="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

ASSET="flake-init-$PLATFORM_OS-$PLATFORM_ARCH"
BASE_URL="https://github.com/$OWNER/$REPO/releases/latest/download"
ASSET_URL="$BASE_URL/$ASSET"
SUMS_URL="$BASE_URL/SHA256SUMS"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t flake-init)"
SUMS_PATH="$TMP_DIR/SHA256SUMS"
ASSET_TMP="$TMP_DIR/$ASSET"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM

download() {
  url="$1"
  out="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$out"
    return
  fi

  echo "Missing downloader: install curl." >&2
  exit 1
}

sha256() {
  file="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
    return
  fi

  echo "Missing checksum tool: install sha256sum." >&2
  exit 1
}

download "$SUMS_URL" "$SUMS_PATH"

EXPECTED_SHA="$(grep " $ASSET$" "$SUMS_PATH" | awk '{print $1}')"
if [ -z "$EXPECTED_SHA" ]; then
  echo "Missing checksum for $ASSET" >&2
  exit 1
fi

if [ -f "$CACHE_PATH" ]; then
  CACHED_SHA="$(sha256 "$CACHE_PATH")"
  if [ "$CACHED_SHA" = "$EXPECTED_SHA" ]; then
    exec "$CACHE_PATH" "$@"
  fi
fi

mkdir -p "$CACHE_DIR"
download "$ASSET_URL" "$ASSET_TMP"
chmod +x "$ASSET_TMP"

DOWNLOADED_SHA="$(sha256 "$ASSET_TMP")"
if [ "$DOWNLOADED_SHA" != "$EXPECTED_SHA" ]; then
  echo "Checksum mismatch for $ASSET" >&2
  exit 1
fi

mv "$ASSET_TMP" "$CACHE_PATH"
exec "$CACHE_PATH" "$@"
