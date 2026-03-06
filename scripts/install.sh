#!/bin/bash
# Vault Alchemist installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/matsulinks/vault-alchemist/main/scripts/install.sh -o /tmp/va-install.sh && bash /tmp/va-install.sh

set -e

exec </dev/tty

echo ""
echo "  Vault Alchemist"
echo ""

# ─────────────────────────────────────────────
# 1. Node.js
# ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed."
  echo "  → Install LTS from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js v18+ required (found $(node --version))"
  echo "  → Install LTS from https://nodejs.org"
  exit 1
fi

# ─────────────────────────────────────────────
# 2. Download & build
# ─────────────────────────────────────────────
INSTALL_DIR="$HOME/vault-alchemist"

if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR" && git pull --quiet
else
  rm -rf "$INSTALL_DIR"
  git clone --quiet https://github.com/matsulinks/vault-alchemist "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

npm install --quiet 2>/dev/null
npm run build --silent 2>/dev/null

# ─────────────────────────────────────────────
# 3. Detect Obsidian vault
# ─────────────────────────────────────────────
OBSIDIAN_CONFIG="$HOME/Library/Application Support/obsidian/obsidian.json"
VAULT_PATH=""

if [ -f "$OBSIDIAN_CONFIG" ]; then
  VAULT_PATH=$(python3 -c "
import json, sys
data = json.load(open(sys.argv[1], encoding='utf-8'))
vaults = list(data.get('vaults', {}).values())
open_vaults = [v for v in vaults if v.get('open')]
if open_vaults:
    print(open_vaults[0].get('path', ''))
else:
    vaults.sort(key=lambda v: v.get('ts', 0), reverse=True)
    print(vaults[0].get('path', '') if vaults else '')
" "$OBSIDIAN_CONFIG" 2>/dev/null)
fi

if [ -z "$VAULT_PATH" ] || [ ! -d "$VAULT_PATH" ]; then
  SEARCH_DIRS=(
    "$HOME/Documents"
    "$HOME/Desktop"
    "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents"
    "$HOME/Library/Mobile Documents/com~apple~CloudDocs"
    "$HOME"
  )
  VAULT_PATH=$(find "${SEARCH_DIRS[@]}" -maxdepth 4 -name ".obsidian" -type d 2>/dev/null \
    | grep -v "vault-alchemist" | head -1 | xargs dirname 2>/dev/null)
fi

if [ -z "$VAULT_PATH" ] || [ ! -d "$VAULT_PATH" ]; then
  echo "Error: Obsidian vault not found. Please open Obsidian first and try again."
  exit 1
fi

# ─────────────────────────────────────────────
# 4. Deploy
# ─────────────────────────────────────────────
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/vault-alchemist"
mkdir -p "$PLUGIN_DIR/service/dist"
cp plugin/manifest.json "$PLUGIN_DIR/"
cp plugin/dist/main.js "$PLUGIN_DIR/"
cp -r service/dist/* "$PLUGIN_DIR/service/dist/"

echo "  Done. Open Obsidian to get started."
echo ""
