#!/bin/bash
set -e

REPO="matsulinks/vault-alchemist"
PLUGIN_ID="vault-alchemist"

echo ""
echo "Vault Alchemist インストーラー"
echo "================================"
echo ""

# --- 最新リリースのURLを取得 ---
echo "最新バージョンを確認中..."
API_URL="https://api.github.com/repos/${REPO}/releases/latest"
RELEASE_JSON=$(curl -fsSL "$API_URL")

MAIN_JS_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep 'main\.js"' | head -1 | cut -d'"' -f4)
MANIFEST_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep 'manifest\.json"' | head -1 | cut -d'"' -f4)
VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | cut -d'"' -f4)

if [ -z "$MAIN_JS_URL" ] || [ -z "$MANIFEST_URL" ]; then
  echo "エラー: リリースファイルが見つかりませんでした。"
  echo "https://github.com/${REPO}/releases を確認してください。"
  exit 1
fi

echo "バージョン: $VERSION"
echo ""

# --- Obsidianのvaultを探す ---
OBSIDIAN_CONFIG="$HOME/Library/Application Support/obsidian/obsidian.json"

if [ ! -f "$OBSIDIAN_CONFIG" ]; then
  echo "Obsidianが見つかりませんでした。先にObsidianをインストールして起動してください。"
  echo "https://obsidian.md"
  exit 1
fi

# vaultのパスを一覧取得
VAULTS=$(grep -o '"path":"[^"]*"' "$OBSIDIAN_CONFIG" | cut -d'"' -f4)
VAULT_COUNT=$(echo "$VAULTS" | grep -c . || true)

if [ "$VAULT_COUNT" -eq 0 ]; then
  echo "Obsidianの保管庫が見つかりませんでした。先にObsidianで保管庫を開いてください。"
  exit 1
elif [ "$VAULT_COUNT" -eq 1 ]; then
  SELECTED_VAULT="$VAULTS"
  echo "保管庫を検出しました: $SELECTED_VAULT"
else
  echo "複数の保管庫が見つかりました。どれにインストールしますか？"
  echo ""
  i=1
  while IFS= read -r vault; do
    echo "  $i) $vault"
    i=$((i + 1))
  done <<< "$VAULTS"
  echo ""
  printf "番号を入力してください: "
  read -r CHOICE
  SELECTED_VAULT=$(echo "$VAULTS" | sed -n "${CHOICE}p")
fi

if [ -z "$SELECTED_VAULT" ]; then
  echo "保管庫が選択されませんでした。"
  exit 1
fi

# --- インストール ---
PLUGIN_DIR="$SELECTED_VAULT/.obsidian/plugins/$PLUGIN_ID"
mkdir -p "$PLUGIN_DIR"

echo ""
echo "ファイルをダウンロード中..."
curl -fsSL "$MAIN_JS_URL" -o "$PLUGIN_DIR/main.js"
curl -fsSL "$MANIFEST_URL" -o "$PLUGIN_DIR/manifest.json"

echo ""
echo "インストール完了！"
echo ""
echo "次のステップ:"
echo "  1. Obsidianを開く"
echo "  2. 設定 → コミュニティプラグイン → Vault Alchemist を有効化"
echo ""
