#!/bin/bash
# Vault Alchemist — かんたんインストーラー
# 使い方:
#   curl -fsSL https://raw.githubusercontent.com/matsulinks/vault-alchemist/main/scripts/install.sh -o /tmp/va-install.sh && bash /tmp/va-install.sh

set -e

# stdin をターミナルに繋ぎ直す（curl | bash 経由でも入力できるように）
exec </dev/tty

echo ""
echo "========================================"
echo "  Vault Alchemist インストーラー"
echo "========================================"
echo ""

# ─────────────────────────────────────────────
# 1. Node.js確認
# ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "✗ Node.js がインストールされていません"
  echo "  → https://nodejs.org から LTS版をインストールしてください"
  exit 1
fi

NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node.js v18以上が必要です（現在: $(node --version)）"
  echo "  → https://nodejs.org から LTS版をインストールしてください"
  exit 1
fi
echo "✓ Node.js $(node --version)"

# ─────────────────────────────────────────────
# 2. ダウンロード & ビルド
# ─────────────────────────────────────────────
INSTALL_DIR="$HOME/vault-alchemist"

if [ -d "$INSTALL_DIR/.git" ]; then
  echo "[install] 既存のインストールを更新中..."
  cd "$INSTALL_DIR"
  git pull --quiet
else
  rm -rf "$INSTALL_DIR"
  echo "[install] ダウンロード中..."
  git clone --quiet https://github.com/matsulinks/vault-alchemist "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "[install] セットアップ中（1〜2分かかります）..."
npm install --quiet 2>/dev/null
npm run build --silent 2>/dev/null
echo "✓ ビルド完了"

# ─────────────────────────────────────────────
# 3. Obsidian Vaultを自動検出
# ─────────────────────────────────────────────
OBSIDIAN_CONFIG="$HOME/Library/Application Support/obsidian/obsidian.json"
VAULTS=()

# obsidian.jsonから取得（最近使った順にソート）
ACTIVE_VAULT=""
if [ -f "$OBSIDIAN_CONFIG" ]; then
  # open:trueのVaultを優先、なければtsが新しい順
  ACTIVE_VAULT=$(python3 -c "
import json, sys
data = json.load(open(sys.argv[1], encoding='utf-8'))
vaults = list(data.get('vaults', {}).values())
# open:true のものを最優先
open_vaults = [v for v in vaults if v.get('open')]
if open_vaults:
    print(open_vaults[0].get('path', ''))
else:
    # 最後に使った(ts最大)ものを選ぶ
    vaults.sort(key=lambda v: v.get('ts', 0), reverse=True)
    print(vaults[0].get('path', '') if vaults else '')
" "$OBSIDIAN_CONFIG" 2>/dev/null)

  # 全Vaultも取得しておく（選択肢用）
  while IFS= read -r p; do
    [ -d "$p" ] && VAULTS+=("$p")
  done < <(python3 -c "
import json, sys
data = json.load(open(sys.argv[1], encoding='utf-8'))
vaults = sorted(data.get('vaults', {}).values(), key=lambda v: v.get('ts', 0), reverse=True)
for v in vaults:
    path = v.get('path', '')
    if path: print(path)
" "$OBSIDIAN_CONFIG" 2>/dev/null)
fi

# 見つからなければ .obsidian フォルダを探す（iCloudも含む）
if [ ${#VAULTS[@]} -eq 0 ]; then
  SEARCH_DIRS=(
    "$HOME/Documents"
    "$HOME/Desktop"
    "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents"
    "$HOME"
  )
  echo "[debug] .obsidian を検索中..."
  while IFS= read -r obsidian_dir; do
    vault_dir="$(dirname "$obsidian_dir")"
    echo "[debug] 発見: $vault_dir"
    VAULTS+=("$vault_dir")
  done < <(find "${SEARCH_DIRS[@]}" -maxdepth 4 -name ".obsidian" -type d 2>/dev/null | grep -v "vault-alchemist")
fi

# ─────────────────────────────────────────────
# 4. Vaultの選択
# ─────────────────────────────────────────────
echo ""
VAULT_PATH=""

# アクティブなVaultが見つかっていればそれを使う
if [ -n "$ACTIVE_VAULT" ] && [ -d "$ACTIVE_VAULT" ]; then
  VAULT_PATH="$ACTIVE_VAULT"
  echo "✓ Vault: $VAULT_PATH"
elif [ ${#VAULTS[@]} -eq 0 ]; then
  echo "ObsidianのVaultが見つかりませんでした。"
  echo "Vaultフォルダをこのウィンドウにドラッグ&ドロップして、Enterを押してください："
  read -r VAULT_PATH
  VAULT_PATH="${VAULT_PATH//\\ / }"
  VAULT_PATH="${VAULT_PATH%/}"
elif [ ${#VAULTS[@]} -eq 1 ]; then
  VAULT_PATH="${VAULTS[0]}"
  echo "✓ Vault: $VAULT_PATH"
else
  echo "複数のVaultが見つかりました。使用するものの番号を入力してください："
  for i in "${!VAULTS[@]}"; do
    echo "  $((i+1)). ${VAULTS[$i]}"
  done
  printf "番号: "
  read -r choice
  idx=$((choice-1))
  VAULT_PATH="${VAULTS[$idx]}"
fi

if [ -z "$VAULT_PATH" ]; then
  echo "✗ Vaultが選択されませんでした"
  exit 1
fi

if [ ! -d "$VAULT_PATH" ]; then
  echo "✗ フォルダが見つかりません: $VAULT_PATH"
  exit 1
fi

# ─────────────────────────────────────────────
# 5. デプロイ
# ─────────────────────────────────────────────
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/vault-alchemist"
echo ""
echo "[install] Obsidianにインストール中..."
mkdir -p "$PLUGIN_DIR/service/dist"
cp plugin/manifest.json "$PLUGIN_DIR/"
cp plugin/dist/main.js "$PLUGIN_DIR/"
cp -r service/dist/* "$PLUGIN_DIR/service/dist/"
echo "✓ インストール完了"

# ─────────────────────────────────────────────
# 完了
# ─────────────────────────────────────────────
echo ""
echo "========================================"
echo "  インストール完了！"
echo "========================================"
echo ""
echo "次の手順:"
echo ""
echo "  1. Obsidianを再起動する"
echo "  2. 設定 → コミュニティプラグイン → 制限モードをオフにする"
echo "  3. 一覧から「Vault Alchemist」を有効にする"
echo "  4. 設定 → Vault Alchemist → OpenAI APIキーを入力"
echo ""
echo "  APIキーの取得: https://platform.openai.com/api-keys"
echo ""
