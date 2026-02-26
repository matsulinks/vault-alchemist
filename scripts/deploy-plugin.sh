#!/bin/bash
# Vault Alchemist プラグインを Obsidian Vault にデプロイする
# 使い方: ./scripts/deploy-plugin.sh /path/to/your/obsidian-vault

set -e

VAULT_PATH="${1:-}"

if [ -z "$VAULT_PATH" ]; then
  echo "Usage: $0 /path/to/obsidian-vault"
  echo "Example: $0 ~/Documents/MyVault"
  exit 1
fi

PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/vault-alchemist"

echo "[deploy] Building..."
npm run build

echo "[deploy] Creating plugin directory: $PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR/service/dist"

echo "[deploy] Copying files..."
cp plugin/manifest.json "$PLUGIN_DIR/"
cp plugin/dist/main.js "$PLUGIN_DIR/"
cp -r service/dist/* "$PLUGIN_DIR/service/dist/"

echo "[deploy] Done!"
echo ""
echo "Next steps:"
echo "  1. Open Obsidian"
echo "  2. Settings → Community Plugins → Enable 'Vault Alchemist'"
echo "  3. Settings → Vault Alchemist → Enter your OpenAI API Key"
