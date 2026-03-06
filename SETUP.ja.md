# Vault Alchemist — セットアップ & テストガイド

> **このファイルについて**
> 開発者（自分）がパソコンを開いたときに参照するための実用ガイド。
> 哲学的な話は [README.ja.md](README.ja.md) を見てください。

---

## 目次

1. [前提条件チェック](#前提条件チェック)
2. [はじめてのセットアップ（一度だけ）](#はじめてのセットアップ一度だけ)
3. [毎日パソコンを開いたときのルーティン](#毎日パソコンを開いたときのルーティン)
4. [自動テスト（53項目）](#自動テスト53項目)
5. [手動テスト（動作確認）](#手動テスト動作確認)
6. [困ったときのトラブルシューティング](#困ったときのトラブルシューティング)

---

## 前提条件チェック

開発を始める前に、以下のツールがインストールされているか確認する。

### コマンドラインで確認する

ターミナル（Mac: Terminal.app、Windows: PowerShell）を開いて、以下を1行ずつ入力してEnterを押す。

```bash
node --version
```
→ `v18.0.0` 以上が表示されればOK（例: `v22.22.0`）

```bash
npm --version
```
→ `8.0.0` 以上が表示されればOK（例: `10.9.4`）

```bash
git --version
```
→ バージョンが表示されればOK（例: `git version 2.40.0`）

### 必要なもの（事前に準備しておく）

| 必要なもの | どこで手に入れるか | 使う場面 |
|---|---|---|
| Node.js v18以上 | https://nodejs.org → LTS版をインストール | サービスを動かす |
| Obsidian 1.4.0以上 | https://obsidian.md → 無料でダウンロード | プラグインを動かす |
| OpenAI APIキー | https://platform.openai.com → APIキーを作成 | AI機能を使う |

> **OpenAI APIキーについて**
> アカウントを作って「API Keys」からキーを発行する。
> `sk-...` で始まる文字列。絶対にGitHubにアップしてはいけない。

---

## はじめてのセットアップ（一度だけ）

### 1. リポジトリをダウンロードする

```bash
git clone https://github.com/matsulinks/vault-alchemist
cd vault-alchemist
```

### 2. 依存パッケージをインストールする

```bash
npm install
```

→ しばらく待つ。`added XXX packages` と表示されたら完了。

### 3. ビルドする（TypeScriptをJavaScriptに変換する）

```bash
npm run build
```

→ エラーなく終わればOK。`plugin/dist/`、`service/dist/`、`shared/dist/` が作られる。

### 4. Obsidianにデプロイする

```bash
./scripts/deploy-plugin.sh /path/to/your-obsidian-vault
```

**`/path/to/your-obsidian-vault` の部分は自分のVaultのパスに変える。**

例:
```bash
# Macの場合
./scripts/deploy-plugin.sh ~/Documents/MyVault

# Windowsの場合（WSLを使っているなら）
./scripts/deploy-plugin.sh /mnt/c/Users/自分の名前/Documents/MyVault
```

→ `[deploy] Done!` と表示されたら成功。

### 5. Obsidianでプラグインを有効にする

1. Obsidianを開く
2. 左下の歯車アイコン → **設定**
3. 左メニューの **「コミュニティプラグイン」** をクリック
4. **「制限モードをオフにする」** → **「オフにする」**
5. 一覧の中に **Vault Alchemist** が表示される → **有効** にする

### 6. OpenAI APIキーを設定する

1. 設定 → **Vault Alchemist**
2. **OpenAI API Key** の欄に `sk-...` で始まるキーを貼り付け
3. 設定ウィンドウを閉じる

---

## 毎日パソコンを開いたときのルーティン

開発再開するときは、毎回この順番でやる。

```bash
# 1. プロジェクトのフォルダに移動
cd /home/user/vault-alchemist

# 2. 最新のコードを取得
git pull origin claude/review-project-design-f0ZNu

# 3. テストを実行して壊れていないか確認
npm run test

# 4. ビルド
npm run build

# 5. Obsidianにデプロイ（コードを変えた場合のみ）
./scripts/deploy-plugin.sh /path/to/your-obsidian-vault
```

### コードを書いて確認したいとき

ターミナルを2つ開いて、片方でウォッチモード（自動ビルド）を起動しておく。

**ターミナル1（自動ビルド）:**
```bash
npm run dev
```
→ ファイルを保存するたびに自動でビルドが走る。

**ターミナル2（作業用）:**
```bash
# テスト実行
npm run test

# またはサービスを手動で起動して確認
node service/dist/main.js
```

---

## 自動テスト（53項目）

### テストを実行するコマンド

```bash
# 全部のテストを1回実行する（一番よく使う）
npm run test

# テストの結果を詳しく見たいとき
npm run test -w service -- --reporter verbose

# テスト中に変更を検知して自動実行するとき
npm run test:watch -w service

# どれだけのコードがテストされているか（カバレッジ）を確認するとき
npm run test:coverage -w service
```

### テストの結果の見方

```
✓ src/pipeline/similarity.test.ts (6 tests)   ← 全部パス
✓ src/pipeline/chat-parser.test.ts (7 tests)
✓ src/pipeline/estimator.test.ts (6 tests)
...
Test Files  8 passed
Tests       53 passed                          ← 53項目全部パスで正常
Duration    758ms
```

`✓` が `×` になったら、そのテストが壊れている。

---

### テスト項目の詳細

#### グループ1: 類似度計算 `similarity.test.ts` — 6項目

AIが「似ているかどうか」を判定する計算のテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | まったく同じベクトルを比べると類似度1.0になるか | 1.0 |
| 2 | まったく違うベクトルを比べると類似度が低くなるか | 0.0〜0.5 |
| 3 | 空のベクトルを渡しても壊れないか | 0.0 |
| 4 | 負の値を含むベクトルを正しく計算できるか | 正しい値 |
| 5 | 長さが違うベクトルを渡したときにエラーになるか | エラー |
| 6 | 大量のベクトルを高速に処理できるか | 完了 |

#### グループ2: チャットログの解析 `chat-parser.test.ts` — 7項目

会話ログを読み込んで、メッセージ単位に分解するテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | 通常の会話ログが正しくパースされるか | メッセージ配列 |
| 2 | 話者名（User/AI）が正しく認識されるか | 各メッセージに話者付き |
| 3 | タイムスタンプが含まれる場合に解析されるか | 日時が抽出される |
| 4 | 空のファイルを渡しても壊れないか | 空配列 |
| 5 | 長い会話ログでも動くか | 全メッセージが取れる |
| 6 | 特殊文字（日本語・絵文字）が含まれても壊れないか | 文字化けしない |
| 7 | 対応していない形式のファイルでもエラーにならないか | 空配列またはエラー |

#### グループ3: 話題の境界検出 `boundary-detector.test.ts` — 8項目

「ここで話題が変わっている」という境界を見つけるテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | 1つの話題しかない会話では境界が出ないか | 境界なし |
| 2 | 明らかに話題が変わっている箇所を検出できるか | 正しいインデックス |
| 3 | 急に違う言語に切り替わったとき境界になるか | 境界あり |
| 4 | 短すぎる会話でも壊れないか | 境界なし |
| 5 | しきい値（sensitivity）を変えると境界数が変わるか | 比例して変わる |
| 6 | 会話が1メッセージだけでも壊れないか | 境界なし |
| 7 | 境界の位置が正しいインデックスを返すか | 正しいインデックス |
| 8 | 全体の話題を要約した名前が付くか | 文字列が返る |

#### グループ4: スレッド分割 `thread-builder.test.ts` — 6項目

境界で分割された会話を「スレッド（話題単位のかたまり）」に組み立てるテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | 会話が正しくスレッドに分かれるか | スレッド配列 |
| 2 | 各スレッドにメッセージが正しく含まれるか | messages付き |
| 3 | スレッドが1つのとき（分割なし）でも動くか | 1スレッド |
| 4 | 境界が連続しているとき（空のスレッドが出ないか） | スキップされる |
| 5 | 各スレッドのメタデータ（開始・終了位置）が正しいか | 正しいインデックス |
| 6 | 大量のスレッドでも動くか | 全スレッドが取れる |

#### グループ5: テキストのチャンク分割 `chunker.test.ts` — 7項目

ノートを「埋め込み（embedding）」のために小分けにするテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | 長いテキストが正しいサイズに分割されるか | 適切なサイズのチャンク |
| 2 | 最大トークン数を超えないか | 各チャンクがサイズ以内 |
| 3 | チャンクに重複（オーバーラップ）があるか | 指定分の重複あり |
| 4 | 空のテキストを渡しても壊れないか | 空配列 |
| 5 | 短いテキストが1チャンクになるか | 1チャンク |
| 6 | 各チャンクにIDとハッシュが付いているか | chunkId, hash付き |
| 7 | 同じテキストのハッシュは毎回同じになるか | 同一ハッシュ |

#### グループ6: 処理量の見積もり `estimator.test.ts` — 6項目

「このノートを処理すると何トークン・いくら使うか」を事前計算するテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | 通常のMarkdownファイルの見積もりができるか | tokenCount, costUsd |
| 2 | ファイルが存在しない場合にエラーになるか | エラー |
| 3 | 空ファイルの見積もりがゼロになるか | 0 |
| 4 | 日本語テキストのトークン数が正しく計算されるか | 適切な数値 |
| 5 | 大きなファイルでも動くか | 大きな数値 |
| 6 | Frontmatter（---から始まるメタデータ）が含まれていても正しいか | frontmatterを含む数値 |

#### グループ7: ジョブログのDB保存 `job-store.test.ts` — 8項目

「どの処理をいつ実行したか」のログをSQLiteに保存・取得するテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | ジョブを保存できるか | 保存成功 |
| 2 | 保存したジョブを取り出せるか | 同じデータが返る |
| 3 | run_idで絞り込みができるか | 対象のみ返る |
| 4 | 存在しないrun_idで空配列が返るか | [] |
| 5 | 複数のジョブを保存して全件取得できるか | 全件 |
| 6 | ジョブのステータスを更新できるか | 更新された値 |
| 7 | DBが壊れていてもアプリが落ちないか | エラーハンドリング |
| 8 | Vaultパスが変わっても別DBとして扱われるか | 分離される |

#### グループ8: 埋め込みのDB保存 `embedding-store.test.ts` — 5項目

ベクトルデータ（意味検索の元データ）をSQLiteに保存・取得するテスト。

| # | テスト内容 | 正常な結果 |
|---|---|---|
| 1 | チャンクのベクトルを保存できるか | 保存成功 |
| 2 | 保存したベクトルを取り出せるか | 同じベクトル |
| 3 | 同じハッシュがあるかチェックできるか | true/false |
| 4 | 全件取得ができるか | 全埋め込み |
| 5 | 同じchunkIdを上書き保存（upsert）できるか | 最新値になる |

---

## 手動テスト（動作確認）

自動テストにないUI・API・連携の確認は手動でやる。

### A. サービス起動確認

ターミナルでサービスを手動起動して、動いているか確認する。

```bash
# ビルドが済んでいること（npm run build を先に実行）
node service/dist/main.js
```

→ 以下のようなメッセージが出たらOK：
```
[vault-alchemist] service started on port 3000
```

### B. API疎通確認（curl）

別のターミナルで以下を実行する。サービスが起動している状態でやること。

#### ヘルスチェック（一番シンプルな確認）

```bash
curl http://127.0.0.1:3000/health
```

→ 期待する返り値:
```json
{"status":"ok","version":"0.1.0","uptime":5}
```

#### ノートの処理量を見積もる

```bash
curl -X POST http://127.0.0.1:3000/estimate \
  -H "Content-Type: application/json" \
  -H "x-vault-path: /path/to/your-vault" \
  -d '{"notePath": "examples/sample-chat.md"}'
```

→ 期待する返り値:
```json
{"tokenCount": 1234, "costUsd": 0.002, "lines": 50}
```

**`/path/to/your-vault` は自分のVaultのパスに変える。**

#### ジョブ履歴の確認

```bash
curl http://127.0.0.1:3000/jobs \
  -H "x-vault-path: /path/to/your-vault"
```

→ 期待する返り値:
```json
{"items": []}  ← まだ何も実行していなければ空
```

#### 必須パラメータが欠けているときにエラーになるか確認

```bash
curl -X POST http://127.0.0.1:3000/estimate \
  -H "Content-Type: application/json" \
  -d '{}'
```

→ 期待する返り値（400エラー）:
```json
{"error": "notePath and x-vault-path header required"}
```

### C. チャット分割のフルフロー確認（OpenAI APIキーが必要）

サンプルファイルが `examples/sample-chat.md` にある。これを使って試す。

```bash
# まず見積もり
curl -X POST http://127.0.0.1:3000/estimate \
  -H "Content-Type: application/json" \
  -H "x-vault-path: $(pwd)" \
  -d '{"notePath": "examples/sample-chat.md"}'

# 実際に処理（dry_run=true で試し実行 → ファイルは変更されない）
curl -X POST http://127.0.0.1:3000/run \
  -H "Content-Type: application/json" \
  -H "x-vault-path: $(pwd)" \
  -H "x-openai-key: sk-..." \
  -d '{
    "notePath": "examples/sample-chat.md",
    "mode": "dry_run"
  }'
```

→ 期待する返り値: スレッドの一覧と生成されるはずのファイルパス

### D. Obsidianプラグインの動作確認

デプロイ済みの状態でObsidianを使って確認する。

| # | 確認項目 | 確認方法 | 期待する結果 |
|---|---|---|---|
| 1 | プラグインが有効になっているか | 設定 → コミュニティプラグイン → 一覧 | Vault Alchemistが表示されていて「有効」 |
| 2 | サービスが自動起動しているか | 設定 → Vault Alchemist | 「Service: Running」と表示される |
| 3 | ホームビューが開くか | 左サイドバーの📖アイコンをクリック | ホーム画面が開く |
| 4 | チャット分割ビューが開くか | コマンドパレット(Ctrl+P) → "Chat Cleaner" | チャット分割の画面が開く |
| 5 | APIキーが保存されているか | 設定 → Vault Alchemist | APIキーの欄に入力したキーが表示される |

---

## 困ったときのトラブルシューティング

### `npm install` でエラーが出る

```
npm ERR! code ENOENT
```

→ `vault-alchemist` フォルダの中にいるか確認する。
```bash
pwd  # 現在地を確認 → /home/user/vault-alchemist と表示されるはず
```

---

### `npm run build` でエラーが出る

```
error TS2345: ...
```

→ TypeScriptのエラー。エラーメッセージに書いてあるファイルと行番号を確認する。

---

### サービスが起動しない（ポートが使われている）

```
[vault-alchemist] port 3000 in use, trying 3001
```

→ 自動で3001に切り替わるので問題ない。
もし複数回起動してしまっている場合は一度全部止める:

```bash
# 動いているサービスを探して止める
pkill -f "vault-alchemist"
```

---

### `curl` でエラーが返ってくる

```json
{"error": "x-vault-path header required"}
```

→ `-H "x-vault-path: /path/to/vault"` ヘッダーを付け忘れている。

---

### Obsidianでプラグインが表示されない

1. Obsidianを完全に終了して再起動する
2. 設定 → コミュニティプラグイン → 右上の「再読み込み」ボタンを押す
3. それでも出ない場合: `deploy-plugin.sh` を再実行してからObsidianを再起動する

---

### テストが失敗する

```
× src/pipeline/chat-parser.test.ts
```

→ そのテストファイルを単体で実行して、詳細なエラーを確認する:

```bash
npm run test -w service -- --reporter verbose chat-parser
```

---

## 参考: NPMコマンド一覧

| コマンド | 何をするか |
|---|---|
| `npm install` | 依存パッケージをインストール |
| `npm run build` | 全パッケージをビルド（1回） |
| `npm run dev` | 全パッケージをウォッチビルド（変更検知） |
| `npm run test` | 全テストを実行（1回） |
| `npm run test:watch -w service` | テストをウォッチ実行（変更検知） |
| `npm run test:coverage -w service` | カバレッジレポートを生成 |
| `npm run deploy` | Obsidianにデプロイ（Vault名は設定が必要） |
| `node service/dist/main.js` | サービスを手動で起動（デバッグ用） |

---

*このドキュメントは開発が進むにつれて更新していく。*
