# Vault Alchemist — 作業手順書（tasks.md）
> 「どう進めるか」を記す手順書。設計の意図は spec.md へ。
>
> **ルール**: 1タスク = 10分以内。完了条件を必ず確認してから次へ進む。

---

## Phase 1 (A-MVP): チャット分割 + タイトル最適化 + 表紙生成 + ロールバック

---

### 🏗️ STEP 0: リポジトリ・環境構築

#### T001: Monorepo の初期化
- **内容**: `vault-alchemist/` ルートに `package.json` を作成し、npm workspaces で plugin / service / shared を繋ぐ
- **完了条件**: `npm install` が成功し、3つのworkspaceが認識される
- **依存**: なし

#### T002: shared/ の構築
- **内容**: `shared/types/` に `note.ts` / `job.ts` / `provider.ts` / `api.ts` の空ファイルを作成し、基本型の定義を書く
- **完了条件**: plugin と service からそれぞれ `import` できる
- **依存**: T001

#### T003: service/ のスキャフォールド
- **内容**: Node.js + TypeScript の Express サーバーを `service/` に作成。`GET /health` を実装して動くことを確認
- **完了条件**: `curl http://localhost:3000/health` が `{"status":"ok"}` を返す
- **依存**: T001, T002

#### T004: plugin/ のスキャフォールド
- **内容**: Obsidian プラグインの最小構成を `plugin/` に作成（`main.ts` + `manifest.json`）。Obsidian の `.obsidian/plugins/` にシンボリックリンクで繋ぐ
- **完了条件**: Obsidian でプラグインが「インストール済み」として表示される
- **依存**: T001, T002

---

### 🔌 STEP 1: service の自動起動

#### T005: service ビルド設定
- **内容**: service を単一の `dist/main.js` にバンドルする TypeScript ビルド設定を作る
- **完了条件**: `npm run build` で `service/dist/main.js` が生成される
- **依存**: T003

#### T006: plugin から service を自動起動する
- **内容**: plugin の `main.ts` でObsidian起動時に `child_process.spawn()` で `service/dist/main.js` を起動する。`/health` を確認して起動済みなら再起動しない
- **完了条件**: Obsidianを起動すると、自動でserviceが裏で起動する（コンソールで確認）
- **依存**: T004, T005

#### T007: service の自動停止
- **内容**: plugin の `onunload()` で service プロセスを終了する
- **完了条件**: Obsidian を終了すると service も終了する（プロセス確認）
- **依存**: T006

#### T008: 初回起動メッセージ
- **内容**: 初回起動時のみ「Vault Alchemistは、あなたのじゃまにならないよう、裏側で静かに動いています 🌙」をObsidian のNoticeで表示する
- **完了条件**: 初回だけ表示され、2回目以降は表示されない
- **依存**: T006

---

### 🗄️ STEP 2: データ基盤

#### T009: SQLite 接続ライブラリのセットアップ
- **内容**: `service/` に `better-sqlite3`（TypeScript対応）を導入し、`/_alchemy/` フォルダを Vault 内に作成する
- **完了条件**: DB ファイルが `/_alchemy/index/semantic.sqlite` に作成される
- **依存**: T003

#### T010: ロールバックログのスキーマ作成
- **内容**: `/_alchemy/logs/rollback/` フォルダを作成。ロールバックJSON の型定義を `shared/types/job.ts` に追加
- **完了条件**: 型定義が作成され、TypeScriptのコンパイルが通る
- **依存**: T002, T009

#### T011: Job System の基本実装
- **内容**: job を JSON で `/_alchemy/logs/jobs/` に保存する関数を実装する（create / update / getByHash）
- **完了条件**: job の作成・更新・ハッシュ重複スキップが動作するユニットテストが通る
- **依存**: T010

---

### 🤖 STEP 3: AI プロバイダ接続

#### T012: OpenAI プロバイダの実装
- **内容**: `service/src/providers/openai.ts` を作成。`generate(prompt)` と `embed(text)` の2メソッドを実装
- **完了条件**: APIキーを環境変数で渡すと、テキスト生成と埋め込み生成が動く
- **依存**: T003

#### T013: プロバイダの切り替え口（Feature Flag）
- **内容**: `shared/types/provider.ts` に `LLMProvider` インターフェースを定義。`features.xai_explore=false` のフラグ管理を実装
- **完了条件**: `features.json` を変更するだけでプロバイダを切り替えられる構造になっている
- **依存**: T012

---

### 💬 STEP 4: チャット分割エンジン（A-MVPのコア）

#### T014: チャットファイルのパーサー
- **内容**: Markdownのチャットログを `{msg_id, role, text, timestamp}` の配列に変換するパーサーを実装。`User:` / `Assistant:` 形式と、タイムスタンプなし形式の両方に対応
- **完了条件**: サンプルのチャットMDを渡すと、発言単位の配列が返る
- **依存**: T003

#### T015: 「速い（粗め）」境界検出
- **内容**: 時間ギャップ（6時間以上）・話題転換語・明示終了宣言だけで境界スコアを計算する関数を実装（LLM不使用）
- **完了条件**: スコアが閾値（0.7）以上の位置が分割候補として返る
- **依存**: T014

#### T016: スレッド生成
- **内容**: 境界スコアから会話を複数スレッド（`thread_id` + 発言配列）に分割する
- **完了条件**: 1つのチャットMDが複数スレッドに分割されて返る
- **依存**: T015

#### T017: 事前スキャン（Estimate）
- **内容**: LLMを使わずに「推定スレッド数・推定処理時間・リスク内訳（上書きあり/なし）」を計算して返す
- **完了条件**: estimateを呼ぶと推定情報のJSONが返る
- **依存**: T016

---

### 📝 STEP 5: 表紙・タイトル生成

#### T018: 表紙の生成（summary + topic）
- **内容**: スレッドの発言テキストをOpenAIに渡し、`summary`（3〜5行）と `topic`（1行）を生成する
- **完了条件**: スレッドを渡すと表紙ブロックのテキストが返る
- **依存**: T012, T016

#### T019: タイトル生成（チャット向けテンプレ）
- **内容**: 思考ログ型テンプレ（「◯◯の件で◯◯だと思って◯◯やってみた」等）でタイトル案を生成
- **完了条件**: スレッドを渡すとタイトル候補が1〜3個返る
- **依存**: T018

---

### 🗂️ STEP 6: 適用モード（dry_run / in_place / new_files）

#### T020: dry_run モードの実装
- **内容**: ファイルを一切変更せず、「変更予定」のプレビューデータを返すだけのモードを実装
- **完了条件**: dry_run を実行しても Vault のファイルが変わらない
- **依存**: T016, T018, T019

#### T021: ロールバックログの書き込み
- **内容**: in_place 実行前に `before_content` を含むロールバックJSONを `/_alchemy/logs/rollback/` に保存する
- **完了条件**: 実行後にロールバックJSONが存在し、`before_content` が元本文と一致する
- **依存**: T010, T020

#### T022: in_place モードの実装
- **内容**: 元ノートをスレッド別ノート群 + 目次ノートに変換してVaultに書き込む。必ずT021のロールバックログを先に保存する
- **完了条件**: 実行後に元ノートが目次ノートになり、スレッドノートが生成される
- **依存**: T021

#### T023: new_files モードの実装
- **内容**: 元ノートを変更せず、新規スレッドノート群を `/_alchemy/curated/` に生成する
- **完了条件**: 実行後に元ノートが残り、`_alchemy/curated/` にスレッドノートが生成される
- **依存**: T020

#### T024: ロールバックの実行
- **内容**: `run_id` を指定すると元ノートを復元し、生成したスレッドノートを削除（またはArchiveへ移動）する
- **完了条件**: ロールバック後にVaultが実行前の状態に戻る
- **依存**: T022

---

### 🖥️ STEP 7: Obsidian プラグイン UI

#### T025: Chat Cleaner タブの骨格
- **内容**: Obsidianのサイドパネルまたはリーフに「Chat Cleaner」タブを追加する。対象ノート一覧（`source_type=chat`フィルタ）を表示する
- **完了条件**: タブが開いて、chatノートの一覧が表示される
- **依存**: T006

#### T026: Estimate（事前スキャン）ボタン
- **内容**: 対象ノートを選んで「Estimate」を押すと推定情報（スレッド数・時間・コスト）をUIに表示する
- **完了条件**: ボタンを押すと推定情報が表示される
- **依存**: T017, T025

#### T027: Preview 画面（2カラム）
- **内容**: 左に元ノート（読み取り専用）、右に分割プラン（スレッド一覧）を表示する2カラムレイアウトを実装。境界候補（スコア0.4〜0.7）は「⚠ 候補」として表示
- **完了条件**: Previewが表示され、境界候補の視覚的区別ができる
- **依存**: T020, T025

#### T028: dry_run の実行と「適用する？」
- **内容**: 「おすすめで進める」ボタンを押すと dry_run が走り、Previewを表示。Preview確認後に「適用する / やめる / 後で考える」を選べる
- **完了条件**: dry_run → Preview → 選択 の流れが動作する
- **依存**: T020, T027

#### T029: Run実行とUndo（ロールバック）ボタン
- **内容**: 「適用する」で in_place or new_files を実行し、完了後に「Undo（元に戻す）」ボタンを目立つ場所に表示する
- **完了条件**: 実行後にUndoボタンが表示され、押すとロールバックされる
- **依存**: T022, T023, T024, T028

#### T030: Home画面（Today）
- **内容**: Homeタブに「昨夜やったこと3行サマリ」と「Undo（直近Run）」ボタンを表示する
- **完了条件**: Home画面が表示され、Undoボタンが機能する
- **依存**: T029

---

### ✅ Phase 1 完了の定義

以下がすべて動作すれば A-MVP 完成：

1. Obsidianを起動するだけで service が自動起動する
2. Chat Cleaner タブでチャットノートを選べる
3. Estimate → Preview → dry_run の流れが動く
4. Preview確認後に適用（in_place または new_files）できる
5. 実行後に Undo で元の状態に戻せる
6. Home 画面に「昨夜やったこと」が表示される

---

## Phase 2 以降（未着手）

- **Phase 2**: 意味検索（T031〜: Embedding生成・semantic.sqlite・検索UI）
- **Phase 3**: タグ管理（T050〜: 4階層タグ・辞書・統合提案）
- **Phase 4**: Graph レイヤー（Intent/Interest/Insight/Personality）
- **Phase 5**: xAI（Grok）探索モード
- **Phase 6**: ローカルLLM
- **Phase 7**: Persona公開モード
