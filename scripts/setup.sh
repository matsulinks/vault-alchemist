#!/bin/bash
# vault-alchemist 開発環境セットアップスクリプト
# ATPペアリング・初回セットアップの両方で使う
#
# 使い方: bash scripts/setup.sh

set -e

# exit code 定義:
#   0 = 成功
#   1 = Node.jsバージョン不一致
#   2 = ビルド失敗
#   3 = テスト失敗
#   4 = サービス起動確認失敗（/health）

REQUIRED_NODE_MAJOR=22

# ─────────────────────────────────────────────
# 1. Node.jsバージョン確認
# ─────────────────────────────────────────────
NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -ne "$REQUIRED_NODE_MAJOR" ]; then
  echo "⚠ Node.js v${REQUIRED_NODE_MAJOR} が必要です（現在: $(node --version)）"
  echo "  → nvm use ${REQUIRED_NODE_MAJOR} または https://nodejs.org から LTS をインストールしてください"
  echo "  ※ better-sqlite3 のネイティブビルドは v${REQUIRED_NODE_MAJOR} LTS でのみ動作確認済みです"
  exit 1
fi

echo "✓ Node.js $(node --version)"

# ─────────────────────────────────────────────
# 2. 依存パッケージのインストール
# ─────────────────────────────────────────────
echo "[setup] npm install..."
npm install

echo "✓ 依存パッケージインストール完了"

# ─────────────────────────────────────────────
# 3. ビルド
# ─────────────────────────────────────────────
echo "[setup] npm run build..."
npm run build || { echo "✗ ビルド失敗"; exit 2; }

echo "✓ ビルド完了"

# ─────────────────────────────────────────────
# 4. テスト実行（53項目）
# ─────────────────────────────────────────────
echo "[setup] npm run test -w service..."
npm run test -w service || { echo "✗ テスト失敗"; exit 3; }

echo "✓ 全テスト通過"

# ─────────────────────────────────────────────
# 5. サービス起動確認（/healthに疎通）
# ─────────────────────────────────────────────
echo "[setup] サービス起動テスト..."

node service/dist/main.js &
SERVICE_PID=$!
sleep 1

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/health)

kill $SERVICE_PID 2>/dev/null
wait $SERVICE_PID 2>/dev/null

if [ "$HTTP_STATUS" != "200" ]; then
  echo "✗ /health が ${HTTP_STATUS} を返しました"
  exit 4
fi

echo "✓ APIサービス起動確認（/health → 200）"

# ─────────────────────────────────────────────
# 6. ATPレジストリディレクトリ確認
# ─────────────────────────────────────────────
mkdir -p tests/registry
echo "✓ tests/registry/ 準備完了"

# ─────────────────────────────────────────────
# 7. GitHub CLI セットアップ確認（任意）
# ─────────────────────────────────────────────
if command -v gh &>/dev/null; then
  if gh auth status &>/dev/null; then
    echo "[setup] GitHub Issue ラベルをセットアップ..."

    REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

    if [ -n "$REPO" ]; then
      # ATP用ラベルを作成（すでにあれば無視）
      gh label create "atp:fail"    --color "d73a4a" --description "ATPテスト失敗" --repo "$REPO" 2>/dev/null || true
      gh label create "atp:pass"    --color "0075ca" --description "ATPテスト通過" --repo "$REPO" 2>/dev/null || true
      gh label create "fix-needed"  --color "e4e669" --description "開発AIによる修正が必要" --repo "$REPO" 2>/dev/null || true
      gh label create "fix-done"    --color "0e8a16" --description "開発AIによる修正完了" --repo "$REPO" 2>/dev/null || true
      echo "✓ GitHub ラベル設定完了 (${REPO})"
    else
      echo "  （GitHub リポジトリが未設定のためラベル作成をスキップ）"
    fi
  else
    echo "  （gh auth なし → GitHub Issue 連携はスキップ）"
    echo "  有効化する場合: gh auth login"
  fi
else
  echo "  （gh コマンドなし → GitHub Issue 連携はスキップ）"
  echo "  有効化する場合: https://cli.github.com をインストール"
fi

# ─────────────────────────────────────────────
# 完了
# ─────────────────────────────────────────────
echo ""
echo "========================================"
echo "  セットアップ完了！ATPはいつでも起動できます"
echo "========================================"
echo ""
echo "  CLIテスト:  npm run test -w service"
echo "  サービス:   node service/dist/main.js"
echo "  ATPレポート: tests/registry/latest_report.json"
echo ""
