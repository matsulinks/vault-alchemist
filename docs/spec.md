# Vault Alchemist — 設計図（spec.md）
> 「何を作るか」を記す仕様書。実装手順は tasks.md へ。
>
> **この仕様書は、技術仕様と設計哲学の両方を記録する文書である。**
> 「なぜそう作るのか」という問いへの答えを、技術的決定と並走させて記す。

---

## App Name / Visual Persona
- **名前**: Vault Alchemist（仮）
- **絵文字**: 📖🧠🖥️
- **キャッチコピー**: 「Obsidianを、AIと融合した"資産運用"の書斎に変える」

---

## Core Definition（最上位宣言）
Vault Alchemist は、**人間とAIの対話を「資産」に変える再構成エンジン**である。

### 体験としての約束（絶対に守ること）
- **対話は流れない**: チャット履歴を「話題ごとの知識」に再構成し、後から再利用できる形にする。
- **AIは整理まで**: 破壊的変更（本文書き換え・削除・大規模移動）は必ず人間の承認を通す。
- **安心が最優先**: いつでもUndoできる。日記/手紙/メールなど"感情資産"は壊さない。
- **同じ作業を二度させない**: 差分・再開・履歴で、昨日の努力を無駄にしない。
- **ローカル優先**: 個人データは外に出さず、外部AI連携もProject単位で制御する。

> 目的は「便利」ではなく、**思考と対話を、未来の自分とAIが再利用できる形に保全すること**。

> **設計側注**: 「ローカル先位」は「勝手に外に出ない」いう意味。
> Persona公開モードのように「意図して公開する」場合はこの定義と矛盾しない。

---

## Concept
### 3秒説明（たとえ付き）
Obsidianの保管庫（Vault）にある資料を、**AIが"図書館司書＋編集者"として整理し直す**アプリ。
- 長すぎる本は「章」に分ける
- 断片メモは「テーマ別ノート」にまとめる
- 価値が薄いものは「ゴミ箱候補」に分ける
- そして、**人が見て"今読む価値"が一目でわかる表紙（要約＋タグ＋関連）**を付ける

### 解決する痛み
- Obsidianに資料が溜まりすぎて、探せない／使えない
- AIに渡しても、文書が長すぎる・粒度がバラバラ・重複が多い
- タグが増殖して崩壊しがち

---

## ✅ 確定済み技術スタック

| 項目 | 決定内容 | 決定日 |
|---|---|---|
| Obsidianプラグイン言語 | **TypeScript**（Obsidianの仕様で固定） | 2026-02-26 |
| バックグラウンドservice言語 | **TypeScript / Node.js** | 2026-02-26 |
| 統一方針 | プラグイン・service・共通コードをすべてTypeScriptで統一 | 2026-02-26 |
| 主力AIプロバイダ | **OpenAI**（API接続 + OAuth接続の両対応） | 2026-02-26 |
| 探索AIプロバイダ | **xAI**（Grok。オプション扱い・未設定でも動作する） | 2026-02-26 |
| プラグイン配布 | まず**サイドロード**で公開 → 成熟後にコミュニティプラグイン申請 | 2026-02-26 |
| service配布 | **段階的**: Step1(npx) → Step2(npm global) → Step3(インストーラ/Electron) | 2026-02-26 |
| 一般ユーザー向け配布 | **ターミナルを開く事すら普通の人には難しい**。最終目標は`.dmg`/`.exe`のダブルクリックインストール。現状はStep1（curl 1行）で妥協するが、これは開発者向け。 | 2026-03-06 |
| リポジトリ | **`vault-alchemist`**（GitHubでOSS公開） | 2026-02-26 |
| リポジトリ構成 | **Monorepo**（plugin / service / shared / docs を一元管理） | 2026-02-26 |
| 開発方錢 | **OSS・オープン**（コミュニティドリブン） | 2026-02-26 |
| ライセンス | **MIT License** | 2026-02-26 |
| 事業モデル | **Open Core**（OSSコア無料 + クレジット課金 + 企業プラン） | 2026-02-26 |
| タスク粒度 | **1タスク = 10分以内**（完了条件を必ず明記） | 2026-02-26 |
| DBエンジン（service） | Node 22組み込みの **`node:sqlite`**（旧: `better-sqlite3`。ネイティブビルド依存を排除するため移行） | 2026-07-08 |
| ローカル/カスタムLLM | **OpenAI互換API**（`baseURL`差し替え）でOllama / LM Studio等に接続可能（上級者向け設定・デフォルトは従来通り公式OpenAI） | 2026-07-08 |

**TypeScript統一の理由**:
- プラグインとserviceで「データの形（型）」を共有できる
- AI主体の開発において、言語が統一されているとバグが起きにくい
- 一般ユーザーへの配布時は `.app` / `.exe` にまとめられるため、エンドユーザーには言語は関係ない

**AIプロバイダ構成の理由**:
- OpenAI は知名度・APIの安定性・日本語対応で最も実績がある
- OAuth接続でAPIキー不要の体験も提供する（一般ユーザーへの敷居を下げる）
- xAI（Grok）はX（旧Twitter）のリアルタイム情報アクセスに強み。探索用途として位置づけ
- 未設定でもxAI無しで全機能が動く設計（オプション）

### OpenAI OAuth 認証（実装済み: 2026-03-06）

ChatGPT Plus / Max のサブスクリプション保持者は、APIキーを用意せずにOAuth経由でサービスを利用できる。

#### 認証フロー（OAuth 2.0 PKCE）

```
1. PKCE生成: codeVerifier（乱数32B）→ SHA-256 → base64url → codeChallenge
2. ブラウザを開く: https://auth.openai.com/oauth/authorize
   - client_id: app_EMoamEEZ73f0CkXaXp7hrann（Codex CLI公開クライアント）
   - redirect_uri: http://localhost:1455/auth/callback
   - scope: openid profile email offline_access
   - code_challenge_method: S256
3. ローカルHTTPサーバー（port 1455）でコールバックを受信
4. code + state 検証後、https://auth.openai.com/oauth/token でトークン交換
5. accessToken / refreshToken / expiresAt をObsidianのプラグイン設定に保存
6. 有効期限5分前に自動リフレッシュ
```

#### 実装ファイル

| ファイル | 役割 |
|---|---|
| `plugin/src/oauth.ts` | PKCE生成・ブラウザ起動・コールバック受信・トークン交換・リフレッシュ |
| `plugin/src/settings.ts` | `authMode / oauthAccessToken / oauthRefreshToken / oauthExpiresAt` フィールド追加 |
| `plugin/src/settings-tab.ts` | 認証方法ドロップダウン・「ChatGPT でログイン」ボタン・連携解除UI |
| `plugin/src/main.ts` | `resolveApiKey()` でOAuth/APIキーを統一的に取得。`updateApiKey()` でServiceClientを即時更新 |
| `plugin/src/api-client/service-client.ts` | `updateApiKey()` メソッド追加（トークン更新時に再起動不要） |
| `service/src/providers/index.ts` | `getProvider()` のキャッシュを廃止（OAuthトークン更新に追従するため） |
| `service/src/providers/oauth.test.ts` | PKCE・URL構築・トークン交換・リフレッシュ・有効期限管理のユニットテスト（13件） |

#### トークンの流れ

```
OAuthアクセストークン
  ↓（plugin）x-openai-key ヘッダー
  ↓（service）Authorization: Bearer <token>
  → OpenAI API（APIキーと同じBearerトークン形式）
```

APIキーとOAuthトークンはサービス層では同一インターフェースで扱う。認証モードの切り替えはプラグイン側のみで完結する。

### ローカル/カスタムLLM（OpenAI互換API、実装済み: 2026-07-08）

Core Definitionの「ローカル優先」を、AIプロバイダそのものの選択にまで広げる形で実装した。
Mac Mini等で動くOllama / LM StudioなどのOpenAI互換API（`/chat/completions` `/embeddings`）に、
既存のAPIキー方式と同じ「非永続・per-requestヘッダー伝達」の設計で接続できる。

#### 設定項目（プラグイン設定「ローカル / カスタムLLM（上級者向け）」セクション）

| 項目 | 説明 | デフォルト |
|---|---|---|
| Base URL | OpenAI互換APIのエンドポイント（例: `http://localhost:11434/v1`） | 空欄（未設定＝公式OpenAI API） |
| チャットモデル名 | 空欄なら `gpt-4o-mini` | 空欄 |
| 埋め込みモデル名 | 空欄なら `text-embedding-3-small` | 空欄 |

#### 伝達方式

`x-openai-key` と同じ非永続ヘッダー方式で、リクエストごとにserviceへ伝える。

```
x-llm-base-url    ← カスタムAPIのベースURL
x-llm-chat-model  ← チャットモデル名
x-llm-embed-model ← 埋め込みモデル名
```

#### 仕様
- `baseURL` を設定した場合、APIキーは不要（`Authorization` ヘッダーを付与しない）
- 公式OpenAI（`api.openai.com`）以外に接続している間は `costUsd = 0`（コスト計算不可のため）
- **埋め込み整合性ガード**: `EmbeddingStore.assertModelConsistency()` がDBの `embeddings.model` と現在の設定モデルの不一致を検出し、`/embed` `/search` で明確なエラーを返す。**自動再埋め込みは未実装**（既存埋め込みを削除するか設定を戻す必要がある。将来課題）
- 疎通確認UI（設定画面で接続テストする機能）は未実装（将来課題）

> **設計側注**: 「ローカル優先」は個人データを外に出さないための方針だが、ここでは一歩進めて
> 「推論そのものをローカルで完結させる」選択肢を用意した。公式OpenAIとの切り替えを
> ヘッダー1本の有無だけで行える設計にしたことで、上級者はコードを書かずに乗り換えられる。

---

## 開発・配布フロー
- **リポジトリ**: GitHub で管理
- **順序**: 仕様書（spec.md）→ 手順書（tasks.md）完成 → GitHub push → 実装開始

### 配布の段階的ロードマップ

Obsidianユーザーはそもそもリテラシーが高いコアユーザー層なので、
最初から一般向けを狙うのではなく「刺さる人に刺さる形」で始める。

| 段階 | 対象 | 配布方法 | 判断基準 |
|---|---|---|---|
| **Step 1** | 開発者・自分 | `npx` or `git clone` + `node` | まず動く状態を作る |
| **Step 2** | コアユーザー（Obsidian民） | `npm install -g vault-alchemist` + README手順 | ユーザーの反応・需要確認 |
| **Step 3** | 一般ユーザー | インストーラ（.pkg/.exe）or Electron アプリ | Step2での需要が証明されてから投資 |

> 方針: 重い投資（Electron化）は「本当にほしい人がいる」が確認できてから行う。

### OSS公開方針
- GitHubでオープンソース公開
- **コミュニティドリブン設計**: 開発段階から多くの人が関わって、使ってから口コミで広げてくれる欋高い
- **AIが作業しやすい構成を最優先**: コントリビューター（人間・AI問わず）が全体象を把握しやすい構成を優先する
- `README.md`（英語）+ `README.ja.md`（日本語）の2ファイル体制

### Monorepo構成の理由
- AIがプラグイン・service・共通コードを**1リポジトリで一度に把握**できる
- TypeScriptの型定義を`shared/`から直接importできる（分割リポはnpmパッケージ化が必要になり複雑）
- 検索・repairするときに**リポをまたぐ必要がない**

---

## Architecture & Project Map
### 構成概要

```
vault-alchemist/                   ← GitHubリポジトリのルート
│
├── plugin/                        🧩 Obsidianの中に入るUIと操作部分
│   └── src/
│       ├── views/                 ← 画面（Home/Inbox/Chat Cleaner等）
│       ├── commands/              ← Obsidianコマンドパレットに出る機能
│       ├── api-client/            ← serviceへのHTTP通信層
│       └── main.ts                ← プラグインエントリポイント
│
├── service/                       🏭 PCの裸で動く処理エンジン
│   └── src/
│       ├── pipeline/              ← チャット分割などの処理フロー（Stage 0【10）
│       ├── providers/             ← OpenAI・xAIへの接続（差し替え可能な口）
│       ├── db/                    ← SQLiteの保存・透明（意味検索・entity-DB）
│       ├── mcp/                   ← MCPサーバー（外部AI連携口）
│       ├── scheduler/             ← 山間・idle時の自動実行
│       ├── api/                   ← pluginとのHTTP API定義
│       └── main.ts                ← serviceエントリポイント
│
├── shared/                        🔗 plugin・serviceが両方使う共通まり
│   └── types/
│       ├── note.ts                ← ノートの型定義（frontmatter等）
│       ├── job.ts                 ← ジョブ・ログの型定義
│       ├── provider.ts            ← AIプロバイダ出力型
│       └── api.ts                 ← plugin↔service通信型
│
├── docs/                          📄 ドキュメント（今ここ）
│   ├── spec.md                ← 設計図（本ファイル）
│   ├── tasks.md               ← 作業手順書（会話後に作成）
│   ├── conversation_log.md    ← 意思決定の会話ログ
│   └── agent-progress.md      ← AIエージェントの進捗ファイル
│
├── README.md                      ← 英語説明（GitHub棄稼に出る）
├── README.ja.md                   ← 日本語説明
├── LICENSE                        ← MIT License
└── package.json                   ← Monorepoルート設定
```

### 各部層の役割（図書館でたとえると）
- **plugin**: 図書館のカウンター（利用者・ Obsidianの接点）
- **service**: 山間に動く司書・実際の処理エンジン
- **shared**: カウンターと司書が両方使う「共通言語」（型定義）

### ✨ serviceの自動起動設計（致命的弱点の克服）

**方針：プラグインを入れるだけで全值動く**

- ObsidianはElectron製なので、プラグイン内部からNode.jsの機能が使える
- serviceのビルド済みファイルを**プラグインフォルダに同梱**する
- プラグイン起動時（Obsidian起動時）に自動でserviceを裸起動
- Obsidian終了時に自動でserviceも停止

```
「Obsidian起動」
  ↓
「プラグインがロードされる」
  ↓
「serviceを裸起動（ユーザーには見えない）」
  ↓
「即座に使える状態」
```

| 項目 | 設計 |
|---|---|
| serviceの起動方法 | `child_process.spawn()`で裸起動（Node.js機能） |
| serviceの置き場所 | `.obsidian/plugins/vault-alchemist/`に同梱 |
| 通信方法 | localhost内部HTTP（外却から見えない） |
| ポート衝突対策 | 使用中なら次のポートを自動で探す |
| クラッシュ時 | プラグインが自動再起動する |
| 初回起動時 | 「Vault Alchemistは、裸側で静かに動いています 🌙」をUIに表示 |

> ✅ 致命的弱点克服：「プラグインを入れるだけで全て動く」設計に確定

### 📝 UI文言ルール（安心設計の持続）

**原則：技術用語を使わず、体験を言葉にする**

| ❌ 使わない | ✅ 使う |
|---|---|
| 「バックグラウンドプロセスを起動します」 | 「作業をバックグラウンドで行います」 |
| "Launch background process" | "Works quietly in the background" |
| 「エラーが発生しました」 | 「うまくいかないアイテムがあります」 |
| 「インデックスを再構築しています」 | 「検索を訅めています」 |


---

## Scope（やること / やらないこと）
### やること
1. Vault内ファイルの取り込み（MD・PDF・テキスト・会話ログなど）
2. 文書の**分割/統合/重複除去/不要箇所の削除候補**を提案
3. 「読む価値がわかるメタ情報」を自動付与（概要・要点・用途・鮮度・信頼度など）
4. 自動タグ付け（大タグ/小タグの階層、同義語の統合）
5. 意味検索（セマンティック検索）
6. Vault変更の監視と自動更新
7. AI接続方式は**OAuth と APIキーの両対応**
8. **Persona公開モード**（MCP経由で、指定したデータを外部公開する）

### やらないこと（初期）
- ノートの見た目を大改造する独自エディタ
- クラウドに丸ごとVaultを強制アップロード（ローカル優先）
- 完全自動で原文を破壊的に書き換える（常に提案→承認フロー）

---

## Operation Modes（作業モード）
1. **Human（人間モード）**: AIは提案だけ。適用は全て人間がクリック。
2. **Co-op（共同モード）**: 低リスクは自動適用。高リスク（統合/削除等）は承認制。
3. **AI（AIモード）**: ルールに合うものは自動適用。削除は常に「保留→まとめて報告→承認」。

---

## MVP切り方（フェーズ計画）
- **Phase 1 (A-MVP)**: チャット分割 ＋ タイトル最適化 ＋ 表紙生成 ＋ ロールバック
- **Phase 2**: 意味検索（チャンク化＋埋め込み＋検索UI）
- **Phase 3**: タグ階層＋タグ辞書管理
- **Phase 4**: Graphレイヤー（Intent/Interest/Insight/Personality）
- **Phase 5**: xAI探索（推奨・任意）
- **Phase 6**: ローカルLLM（個人情報系のローカル先行）
- **Phase 7**: **Persona公開モード**（MCP経由で指定データの外部公開）

---

## Feature Flags（機能スイッチ）
```
features.chat_recompose  = true   ← A-MVPで実装
features.semantic_search = false  ← Phase 2でON
features.graph_layers    = false  ← Phase 4でON
features.xai_explore     = false  ← Phase 5でON
features.local_llm       = false  ← Phase 6でON
features.persona_public  = false  ← Phase 7でON
```

---

## ⚠️ 未確定項目（会話を進めながら埋める）

- [ ] 収益化の具体的な実装方針（Layer AのAPI設計など）
- [ ] Persona公開モードの詳細設計（Phase 7）

---

## 🎭 Persona公開モード（Phase 7）

### ビジョン
> 「多くの人がお互いを理解し合うために、このプラグインを育てたい」

Vaultに蓄積された思想・構想・知識を、**MCP経由で外部に公開**することで、
AIを通じ「その人の考えと対話できる」体験を実現する。

### ユースケース
- 起業家が「プロダクトビジョン」ノートを公開 → 投資家・共感者がAIを通じて深く理解できる
- 政治家が「政策思想」を公開 → 国民がAIを通じて対話し、理解を深める
- 研究者が「研究ログ」を公開 → 世界の研究者がAIを通じてコラボできる
- その対話データも本人の資産として蓄積される（双方向の恩恵）

### 設計原則
- **デフォルトは非公開**（Core Definitionの「ローカル優先」と一致）
- **Project単位でオプトイン**：「この棚だけ公開する」を明示的に選ぶ
- **公開レベルを細かく設定**できる（要約のみ / タグ+要約 / 全文）
- **承認なし公開は禁止**：ユーザーが意図して公開ボタンを押した場合のみ

### データフロー
```
【ユーザー】
  ↓ Project単位で「公開する」を設定
【Vault Alchemist】
  ↓ 指定された範囲のデータをMCPエンドポイントとして公開
【外部の人 + AI】
  ↓ AIがVaultデータを参照しながら応答
【対話データ】
  ↓（オプション）ユーザーの許可があれば
【ユーザーのVaultに蓄積】← "他者との対話"も資産になる
```

### プライバシー設計
- `persona_public=true` のProjectのみ公開対象
- 個人情報（`personal_data=confirmed`）は公開対象から自動除外
- 公開範囲はいつでも変更・停止可能
- 誰がどのデータを読んだか監査ログに残す

### 「Human X」 vs 「AI-X」の哲学

> **イーロン・マスク本人」と「イーロンの知識を元にしたAI」は「最初から別物」として明示する。**

- Persona公開モードが生成するのは「AI based on [Name]’s public knowledge」
- 本人ではなく、本人が公開した知識を元に応答するAI
- UI上で常に明示ラベルを表示する（「これは[Name]本人ではありません」）

### なりすましリスクに対する設計哲学

> 「完璧な解決は目指さない。ハルシネーションと同じく、「軽減」を設計に組み込む。」

- データは本人が意図して公開したもののみ→同意消費が最大の防衛
- 明示ラベル（「AI-X」表示）で発信源を明確にする
- 「完璧ななりすまし消除」より、「明確な区別」を設計に淃わせる

### 収益との接続
- **個人ユーザー**: 無料（自己APIキーで動かす）
- **パブリックフィギュア / 企業**: 有料プラン（Layer B）でホスティング・SLAを提供  
  → ここがLayer Bの主な収益源になりうる

> **これはVault Alchemistが「個人の知識管理ツール」から「人と人をつなぐ知識インフラ」に育つための扉。**

---

## 💼 事業設計（Open Coreモデル）

### 基本思想
「OSSで広げて、サービスで稼ぐ」。
ライセンス制限ではなく、価値ある機能を提供することで收益を得る。

### 收益層

| Layer | 対象 | 調達方法 |
|---|---|---|
| **無料 (OSS)** | 自前 APIキー保持者 | 全機能が無料で使える |
| **Layer A: クレジット課金** | APIキー不要の層 | 次の2つから選べる |
| | → 月額課金 | クレジットを購入 |
| | → 広告視聴 | 広告 1回 = クレジットが貿まる（正式選択制） |
| **Layer B: 企業プラン**（将来） | チーム・SLAが欲しい法人 | 月額課金 |

### クレジット種別従消費順
1. `trial_credit`（初期配布）
2. `ad_credit`（広告視聴）
3. `paid_credit`（課金購入）

### 将来の企業プラン（Layer B）
- 複数人でVaultを共有・管理
- 管理者ダッシュボード
- 管理ログ・監査
- SLA・優先サポート

### 安全設計原則（話顔資産を決して壊さない）
- 広告は必ず「明示的に見る」正式選択制のみ
- バックグラウンド自動再生・音なし自動再生はなし
- ローカルユーザーの信頼を壊す設計は全て排除

---

## 📄 タスク粒度原則（tasks.md の制約）

- **1タスク = 10分以内**で完結できる単位に分割する
- 各タスクに「完了条件（何ができたら終わりか）」を必ず記載
- 依存関係は「前のタスクが終わってから」と明示する
- 途中で作業者（人間・AI）が変わっても再開できる状態を保つ

---

---

## Change Log
| 日付 | 内容 |
|---|---|
| 2026-02-24 | 初版。Obsidian資産をAI再利用しやすくする構想で合意 |
| 2026-02-26 | 技術スタック確定（TypeScript統一）。spec.md・conversation_log.md 作成開始 |
| 2026-02-26 | Project Map確定。service自動起動設計。Persona公開モード追加。詳細仕様マージ完了 |
| 2026-07-08 | DB接続を `better-sqlite3` から Node組み込み `node:sqlite` へ移行（依存36パッケージ削減）。Vault書き込みをアトミック化（`atomicWriteFileSync`、同期クライアント対策）。ローカル/カスタムLLM（OpenAI互換API）対応を追加（baseURL/モデル名設定、埋め込み整合性ガード）。MCP節にObsidian 1.12公式CLIに関する状況メモを追記。あわせてインフラ整備（CIワークフロー追加、OAuth非依存ロジックをsharedへ移動、plugin/tsconfig.jsonの型チェック専用化）を実施 |

---

## 📝 ノートのメタ情報スキーマ（YAML Frontmatter）

Vaultの各ノートに付けるメタ情報の定義。AIと人間の両方が読める形で管理する。

```yaml
# 出所・種類
source_type: pdf | md | chat | web | other
source_ref: 元ファイルパス or URL
source_group_id: 同一資料グループID（原本+PDFなどの統合）
content_hash: 本文ハッシュ（重複判定・差分検知）
note_kind: note | reference | journal | letter | email | meeting | task

# 著者区分（誰が書いたか）
author_type: human | ai | hybrid
title_locked: true | false          # 人間が確定したタイトルは変更不可

# 主題・タグ（4階層）
topic: 主トピック（1行）
tags_big: [領域]
tags_mid: [分野]
tags_small: [テーマ]
tags_micro: [キーワード]

# 価値の可視化（表紙ブロック）
summary: 3〜5行の要約
why_now: 今読む価値・理由
confidence: high | medium | low

# 日付・鮮度
source_date: YYYY-MM-DD             # 情報の発生日（明示があればそれ）
release_date: YYYY-MM-DD            # 本・出版物の発売日
file_created_at: YYYY-MM-DDThh:mm:ssZ
file_modified_at: YYYY-MM-DDThh:mm:ssZ
freshness: high | medium | low      # source_dateから自動計算

# 状態
status: active | defunct_suspected | defunct_confirmed | archived

# 個人情報
personal_data: none | suspected | confirmed
redaction_level: metadata_only | masked | allowed
entity_ids: [...]                   # Private Entity DBへの参照

# 行動ログ（日記・手紙・メール向け）
to_entity_ids: [...]
action_type: met | called | emailed | shipped | paid | promised | other
action_date: YYYY-MM-DD
action_summary: 1〜2行

# 知的メタ（Graph・Persona向け）
user_intents: [...]                 # やりたい/試した/未達成
user_interests: [...]               # 興味・気になること
insight_summary: 分かったこと（1〜3行）
personality_tags: [...]             # 思考傾向（例: 仮説思考 / 実験型）

# 関連
related: [[...]]                    # 関連ノートのリンク
```

---

## 🗄️ DB設計（SQLite）

> **実装メモ（2026-07-08）**: serviceのSQLite接続は `better-sqlite3` から Node 22 組み込みの
> `node:sqlite`（`DatabaseSync`）へ移行済み。`prepare/run/get/all` とPRAGMA（`exec`経由）のみを
> 使用しており機能的な差分はないため、テーブル設計・挙動に変更はない。
> `@types/node` がまだ `node:sqlite` の型定義を含まないため、使用箇所のみをカバーする
> 最小限のアンビエント型宣言（`service/src/db/node-sqlite.d.ts`）を追加している。
> Node 22実行時に `ExperimentalWarning` が stderr に出力されるが、動作に影響はない。
>
> **設計側注**: 「1行インストール／ダブルクリック配布」という配布目標にとって、
> ネイティブビルドが必要な依存（`better-sqlite3`）は一般ユーザー向け配布の障害になりやすい
> （OSごとのビルド済みバイナリ配布・ビルド環境の要求）。Node組み込みの `node:sqlite` に
> 置き換えることで依存を36パッケージ削減し、配布の単純さを技術選定でも一段押し進めた。

### 1) 意味検索DB（Semantic Index）
保存場所: `/_alchemy/index/semantic.sqlite`

```
chunks テーブル:
  chunk_id, note_path, project_id, chunk_order,
  text, token_count, hash, created_at, updated_at

embeddings テーブル:
  chunk_id(FK), provider, model, vector, dim, updated_at

note_meta_cache テーブル:
  note_path(PK), title, topic, tags_big〜micro,
  source_date, freshness, confidence, status,
  personal_data, updated_at
```

### 2) 個人エンティティDB（Private Entity）
保存場所: `/_alchemy/entities/entities.sqlite`

```
entities:        entity_id, entity_type, canonical_name, sensitivity_level
entity_aliases:  alias_id, entity_id, alias, alias_type
entity_mentions: mention_id, entity_id, note_path, context_snippet,
                 detected_by, confidence, detected_at
interactions:    interaction_id, from_entity_id, to_entity_id,
                 action_type, action_date, summary, note_path
redaction_rules: rule_id, entity_id, redaction_level, notes
```

### 3) タグ辞書
保存場所: `/_alchemy/tags/tags.json`
- `tags`（大→中→小→微細の木構造）
- `synonyms`（同義語辞書：「LLM」↔「大規模言語モデル」）
- `deprecated`（廃止タグ→置き換え先）

### 4) Project設定
保存場所: `/_alchemy/projects/<project_id>.json`
- `included_paths` / `excluded_paths`
- `freshness_policy_days`（例: 90日で再確認）
- `personal_data_policy`: strict | standard | relaxed
- `ai_mode_default`: human | co-op | ai
- `automation_profile_id`
- `external_send_allowed`: false（デフォルト）
- `persona_public`: false（デフォルト）

### 5) 提案バッチ
保存場所: `/_alchemy/batches/<batch_id>.json`
- `type`: delete | merge | split | tag | cover
- `grouping_key`: duplicate | stale | no_refs | low_quality
- `items[].risk_level`: low | medium | high
- `status`: proposed | approved | applied | rejected

---

## ⚙️ 実行パイプライン（Stage 0〜10）

```
入力 → 正規化 → 安全化 → 価値付け → 検索化 → 提案 → 承認 → 適用
```

| Stage | 名前 | 内容 | Phase |
|---|---|---|---|
| **0** | Trigger & Queue | Vault監視/Webクリップ/スケジュール/手動 | 1 |
| **1** | Ingest | 取り込み → `/_alchemy/inbox/` | 1 |
| **2** | Normalize | MD化・Chat再構成・content_hash生成 | 1 |
| **3** | Date Resolution | source_date確定・freshness計算 | 1 |
| **4** | Privacy & Entity | 個人情報検出 → Private Entity DB | 1 |
| **5** | Cover | 表紙生成（summary / why_now / topic） | 1 |
| **6** | Tagging | 4階層タグ付け・辞書更新提案 | 3 |
| **7** | Chunk & Embed | チャンク化 + 埋め込み → semantic.sqlite | 2 |
| **8** | Relationship Graph | Intent/Interest/Insight/related更新 | 4 |
| **9** | Proposals & Batches | 削除候補・統合候補をバッチ化 | 1 |
| **10** | Approval & Apply | 承認→適用（常にユーザー確認） | 1 |

### A-MVP（Phase 1）でのパイプライン
Stage 2の「Chat Log Recomposition」に集中する。

```
chat_recompose_mode:
  dry_run   → 変更なし・プレビューのみ（デフォルト）
  in_place  → 元ノートを分割スレッド群 + 目次ノートに変換
  new_files → 新規ノート群を生成
```

#### 話題境界スコア（境界検出ルール）
| シグナル | スコア | 使用モード |
|---|---|---|
| 時間ギャップ（6時間以上） | +0.4 | 速い（粗め）|
| 話題転換語（「次は〜」「別件」等） | +0.3 | 速い（粗め）|
| 明示的終了宣言 | +0.6 | 速い（粗め）|
| 意味距離大（埋め込み計算） | +0.4 | 丁寧（遅い）|
| タグ候補の大変化 | +0.6 | 丁寧（遅い）|

- 合計 ≥ 0.7 → 分割確定
- 0.4〜0.7 → 提案（UIで「⚠ 候補」として表示）
- < 0.4 → 継続

---

## 🔒 Vault書き込みの安全性（アトミック書き込み、実装済み: 2026-07-08）

### 背景
ObsidianのVaultは Obsidian Sync / iCloud / Google Driveミラー等の同期クライアントによって
常時監視されていることが多い。`fs.writeFileSync` でファイルを直接上書きすると、
書き込みが完了しきる前の「途中状態」を同期クライアントが拾ってしまい、
壊れた中間状態が他デバイスへ伝播してしまう恐れがある。

### 実装
`service/src/util/atomic-file.ts` の `atomicWriteFileSync()` が、Vault配下への書き込みを
すべて次の手順で行う:

```
1. 同一ディレクトリ内に一時ファイル `.<元ファイル名>.tmp-<pid>-<random>` を書き出す
2. fs.renameSync() で元ファイルへ差し替える
   （同一ファイルシステム内のrenameはPOSIX/NTFS双方でアトミック）
3. 失敗時は一時ファイルを掃除し、元のファイルには一切触れない
```

### 対象箇所
- apply-engine: curated出力・index書き換え・rollback復元
- job-store: job/rollbackログの保存
- providers: `features.json` の初期書き込み

> **設計側注**: Core Definitionの「安心が最優先」は、UI上のUndoボタンだけでなく
> ファイルシステムレベルの書き込み挙動にも及ぶ。同期クライアントが壊れた中間状態を
> 他デバイスにまき散らすことは、ユーザーの目に見えないところで信頼を損なう典型例であり、
> 「壊れているように見える瞬間」自体を存在させないことを優先した。

---

## 🚦 リスク分類モデル

### 🟢 Low Risk（自動適用可）
- 表紙（summary/why_now）の生成・更新
- タグの追加（削除なし）
- インデックス再生成
- related更新・freshness再計算

### 🟡 Medium Risk（バッチ単位で承認）
- ノート統合・分割（元ノートはアーカイブ保持）
- タグ削除・置換
- フォルダ移動・リネーム
- archived化

### 🔴 High Risk（個別承認 + 差分表示必須）
- 本文の直接書き換え
- ノート完全削除
- 日記/手紙/メール（`note_kind=journal|letter|email`）への変更

### 自動判定ロジック
- `touch_original_text=1` → 強制的にHigh
- `affects_links=1 && reversible=1` → Medium
- それ以外 → Low
- confidenceが低い場合は1段階引き上げ

---

## 📋 ログ設計（Job System）

### 機械用ログ（再開・ロールバック用）
保存場所: `/_alchemy/logs/jobs/<job_id>.json`

```
job_id, run_id, job_type, target, status,
started_at, finished_at, hash_snapshot,
provider_used, cost_estimate_usd, cost_actual_usd,
retry_count, error_code, error_message
```

- `hash_snapshot` が同じなら **skipped**（同じ処理を二度しない）
- 失敗はリトライ上限3回→「延期」扱いで次の夜へ

### 人間用ログ（日次サマリ）
保存場所: `/_alchemy/logs/daily/YYYY-MM-DD.md`
- 今日の処理件数サマリ
- 失敗の概要（技術詳細なし）
- コスト（今日/今月・表示通貨）

### ロールバックログ（A-MVP用）
保存場所: `/_alchemy/logs/rollback/<run_id>.json`

```
run_id, original_note_path, before_hash, after_hash,
before_content,         ← 元本文を全文保存（圧縮可）
index_note_content,     ← 置き換え後の目次ノート内容
created_thread_notes[], ← 生成したスレッドのpath/title/hash
rollback_policy         ← delete_threads | move_to_archive
```

> ロールバックは「ユーザーが脳みそ使わず戻せる」ボタンとしてHomeとRun Result画面の目立つ場所に配置する。

---

## 🎬 初期セットアップ（AIインタビュー）

### 目的
- 設定地獄を避けつつ、初期の大量処理を現実的にする
- 「こういうパターンはどうする？」を先に決めて、以降は自動で迷わない

### 入口（2択）
1. **対話インタビュー**（推奨）: AIが質問して最適な初期設定を生成
2. **Vault軽量スキャン + 提案**: フォルダ構造/拡張子/タグ頻度からProject案を作り、最後に人が承認

### インタビューで決める質問例
- 重複が見つかったら？（残す / 統合 / 片方アーカイブ）
- 長文PDFは？（章分割 / 要約のみ / 両方）
- 会話ログは？（日次まとめ / トピック統合 / そのまま）
- Webクリップは？（全部保存 / 選択範囲だけ / 一定以上は要約）
- 店・サービスが消えたら？（自動アーカイブ / 削除バッチ / 通知のみ）
- 個人データが疑わしいときは？（必ずmetadata化 / ローカルLLMのみ / 手動確認）

### 生成されるもの
- Project設定（対象パス・鮮度ルール・外部送信可否）
- タグ大分類の初期ツリー
- 提案バッチのルール（グルーピングキー・頻度）
- Automation Profile の初期値（Level 0〜3）

---

## 🤖 Automation Profile（自動化プロファイル）

### 概念
整理整頓の"手綱"をどこまでAIに渡すかを、固定レベルではなく**プロファイル（ルールセット）として管理する**。

例:
- `Safe Librarian`（慎重）: 低リスクのみ自動・それ以外は全承認
- `Night Cleaner`（夜間強め）: 夜間アイドル時に積極的に整理
- `Research First`（研究優先）: PDFや論文の分割を優先

### 自動化レベル
- **Level 0（観察）**: 何もしない。統計と計画だけ出す
- **Level 1（低リスク自動適用）**: 表紙生成・日付メタ付与・インデックス更新・タグ提案の作成まで
- **Level 2（準自動）**: 低リスク変更は自動適用。中〜高リスクは「バッチでまとめて承認」
- **Level 3（高速初期化モード）**: 初期限定。ルール一致はスナップショット付きで仮適用

> どのLevelでも「本文の破壊的書き換え」「削除」は最終承認を必須にする。

### プロファイル作成フロー
1. AIが候補プロファイルを提示（Vaultスキャン結果＋インタビュー回答から）
2. ユーザーが「代表ケース」でYES/NOを返す（チューニング）
3. AIがルールを調整し「この設定をデフォルトにしますか？」と確認
4. 必要なら複数プロファイルを作成（例: 仕事用は慎重・読書用は強め）

### プロファイルの保存先
- `/_alchemy/projects/<project_id>.json` に `automation_profile_id` を保持
- `/_alchemy/projects/automation_profiles.json` にプロファイル定義を保存
  - `profile_id`, `name`, `level_default`, `rules[]`, `last_updated_at`
  - 変更履歴（なぜ変えたか）も残す

### Automation Profile の設定項目
- `auto_apply_low`: true/false
- `auto_apply_medium`: true/false
- `never_auto_high`: 常にtrue（変更不可）
- `confidence_threshold`: 信頼度の閾値
- `title_style`: concise / academic / business / casual / my_voice
- `foldering_policy`: suggest_only / batch_approve / auto_move_safe

---

## 🏷 タイトル最適化（AIリネーム機能）

### 背景
AIチャット履歴やメモが増えると「タイトルだけ見ても何の話か分からない」問題が発生する。

### 基本方針
- タイトルもAIが提案・変更可能
- **人間が確定させたタイトルは勝手に変更しない**（`title_locked=true`）

### タイトル用メタ情報
```
title_original      : 初期タイトル
title_current       : 現在のタイトル
title_generated_by  : human | ai
title_locked        : true | false
title_confidence    : 0.0–1.0
title_last_updated_at
```

### 自動タイトル生成の対象
- 「ChatGPTとの会話」「Untitled」などの汎用タイトル
- 日付のみのタイトル
- 内容と一致しない汎用タイトル

### タイトルスタイル（`title_style`）
- `concise`: 短く・記号少なめ
- `academic`: 学術的な用語を正確に
- `business`: 目的→結論を先に
- `casual`: 柔らかく
- `my_voice`: ユーザーの既存タイトルから口調を学習

### 人間優先ルール
- ユーザーがタイトルを手動変更 → 自動で `title_locked=true`
- UIで「AIに再最適化させる」を押した場合のみ再生成

---

## 📁 フォルダ自動整理（4.5: Folder Organization）

### 目的
タグだけでなく「置き場所」も整えて、Vaultを迷路にしない。

### 方針
- AIはフォルダ移動を**提案**できる
- **人間が手動で移動したファイルはロック**（`path_locked=true`）して以後動かさない
- フォルダ移動は基本 **Medium Risk**（バッチ承認）

### フォルダ用メタ情報
```
path_original       : 取り込み時のパス
path_current        : 現在パス
path_generated_by   : human | ai
path_locked         : true | false
path_last_updated_at
```

### 自動フォルダ分けルール（MVP）
- Projectごとに「標準フォルダ構造」を持つ
  - 例: `Work/Inbox`, `Work/Reference`, `Work/Log`, `Work/Archive`
- `note_kind` ごとの推奨先:
  - `journal` → `*/Log/`
  - `reference` → `*/Reference/`
  - `task/meeting` → `*/Work/`
- `tags_big`（領域）→ 上位フォルダ候補

### Chat履歴のフォルダテンプレート
初期に3種類を提示し、AIインタビューで選ばせる：

1. **Date → Project → Topic（時系列重視）**
   - 例: `Log/Chat/2026/02/ProjectX/Obsidian整理/`
2. **Project → Topic → Date（仕事/棚重視）**
   - 例: `ProjectX/Log/Chat/Obsidian整理/2026-02/`
3. **Topic → Date（テーマ重視）**
   - 例: `Topics/Obsidian整理/Chat/2026-02/`

### フォルダテンプレートのバージョン管理
フォルダ構造を後から変えたくなっても「全部手で移動」を防ぐ設計。

- 各Projectに `folder_template_id` と `folder_template_version` を持たせる
- テンプレート定義は `/_alchemy/projects/folder_templates.json` に保存
- テンプレート変更時: スキャン → 新テンプレートで理想パス再計算 → 差分のみをフォルダ移動バッチ（Medium Risk）として生成 → 人間が承認

---

## 🌐 情報鮮度管理・defunct（消滅）検出

### 鮮度の計算
`freshness` は `source_date` と Project の `freshness_policy_days` から自動算出。
期限を過ぎたら「再確認候補」としてInboxへ。

### 存在しない情報の自動処理（店・サービス・ツール等）
`entity_type=org/service/place` を持つ情報は定期的に**存在確認チェック**を実行。

**確認方法（MVP）**:
- 参照URLがある場合: HTTPステータス（404/410等）やリダイレクト異常を検知
- ドメイン消滅/DNS失敗が連続した場合も候補化

**結果の処理**:
- まず `status=defunct_suspected` としてバッチにまとめて報告
- 連続N回（例: 3回）失敗で `status=defunct_confirmed`
- defunct_confirmed は自動で整理（curated側はアーカイブ/リンクから除外・削除提案バッチに追加）

> 方針: いきなり破壊削除ではなく、まず無効化→まとめて報告→必要なら削除。

---

## 🌩 MCP（外部AI連携）設計

> **状況メモ（2026-07-08）**: 本プロジェクトのMCP実装自体は未着手だが、Obsidian 1.12
> （2026年2月）で公式CLIが搭載されたことで、コミュニティのMCP連携は従来の
> 「Local REST APIプラグイン経由」から「公式CLIベースの統合」へ移行が進んでいる状況にある。
> 着手時には、この公式CLIを統合面の前提として設計できる。

### 2つの方向性（両方実装する）
- **A方向**: 外部AIからVault Alchemistへ（外部AIが検索・参照・整理提案）
- **B方向**: 外部AIへVault Alchemistから（外部AIが会話資産を取りに来る）

### A方向: 外部AI → Vault Alchemist（Tool提供）

提供するTools:
```
search_semantic(query, project, filters)
get_note(id/path)                          ← メタ中心、原文は権限次第
list_projects() / get_project_rules(project)
propose_curation(targets, mode)            ← 分割/統合/タグ/削除候補バッチ生成
apply_changes(batch_id)                    ← モードと権限に従う
```

### B方向: Vault Alchemist → 外部AI（Conversation Memory提供）

目的: 外部AIとの会話で「過去ログを毎回貼る」手間をなくす。ただし**必ず承認と範囲指定を通す**。

提供するResources:
```
conversation_threads.list(project_id, since?, topic?)
conversation_threads.get(thread_id, detail_level)
  detail_level: summary_only | summary_plus_meta | full_text
memory_snapshot.get(project_id)            ← 直近の意思決定・継続テーマ・未解決事項
tag_dictionary.get(project_id)
```

### 承認モデル（安全の最小単位）
承認は **Project単位** × **時間制限つき（セッション許可）** で管理。

**セッション許可プリセット**:
- 今だけ（1時間）
- しばらく（8時間）
- ずっと（無期限）※強い警告＋解除ボタンを目立つ場所に常時表示

**許可レベル（デフォルトは最も安全）**:
- Level 0: 禁止（デフォルト）
- Level 1: summary_only
- Level 2: summary_plus_meta（topic/tags/date/insight まで）
- Level 3: full_text（強い警告＋短い期限が推奨）

### 監査ログ（必須）
```
/_alchemy/logs/ に記録:
provider_name, project_id, resource, detail_level, timestamp
```

> 重要: 外部AIからの「破壊的操作」は原則禁止。許可する場合も「Project単位」「モード単位」「権限単位」で細かく制御。

---

## 🌐 Webクリッパー（Chrome拡張）

### 目的
ネット上の情報もVault資産にする。

### できること（標準）
- 表示中ページのURL/タイトル/本文（Reader相当）/選択範囲を取得
- Project（棚）を選んで送信
- 送信先はローカルservice（HTTP）

### ログイン必須サイトの現実解
1. **選択範囲クリップ（推奨）**: ユーザーが画面上で必要部分を選択→拡張がHTML/テキストとして送る
2. **ページ全文スナップショット**: 表示中DOMから本文候補を抽出して送る（精度はサイト依存）
3. **手動コピペ受け口**: 拡張/アプリに「貼り付け」入力欄を用意し、貼った内容をMD化

### 生成物
- `/_alchemy/inbox/` にMDとして保存
- frontmatterに `source_type=web`, `source_ref=URL`, `source_date=取得日`, `file_created_at/modified_at`

---

## ☁️ Google Drive同期

### 前提
ObsidianのVaultは「ローカルファイルシステム上のフォルダ」として扱われる。
そのためGoogle Driveを使う場合も、**ローカルに見えるフォルダ（ミラー/オフライン保持）**が前提。

### 接続方針（MVP）
- OAuthでDrive接続（バックアップ/同期用途）
- **推奨**: Driveフォルダをローカルへミラーリングして処理（安定）
- 直接Drive API経由での差分取得は将来拡張

### 注意
「クラウドにだけ存在してローカルに無い（ストリーミングのみ）」は、
Obsidianの監視・リンク更新と相性が悪いため、
MVPでは **「ローカルに実体がある」状態（Mirror/Available offline）を必須**とする。

### 競合
競合発生時は「差分比較→承認」フロー。

---

## 🌙 夜間・アイドルスケジューラ

### 実行トリガー（MVP）
- 一定時間アイドル（例: 20分）
- 充電中・バッテリー閾値以上（デフォルト: 充電中のみ）
- CPU使用率が低い状態が継続
- 手動ボタン
- （任意）ざっくり時間帯ウィンドウ（例: 0:00–6:00）

### 静音モード
- CPU上限・同時ジョブ数・ネットワーク上限を設定可能
- バッテリー駆動中は停止（デフォルト）

### 夜間の推奨実行順
1. Ingest/Normalize（入ったものをまず形にする）
2. Date/Privacy/Cover（人が読める価値を先に付ける）
3. Embed（検索を育てる）
4. Proposals（削除/統合/分割の提案をまとめる）

### 学習（将来）
過去の実行成功ログから「この人が触っていない時間帯」を推定し、
「おすすめ実行枠」を提案する（自動適用はしない）。

---

## 💰 AI利用コスト管理

### 予算設定
- Providerごとに月次/日次の予算上限を設定
  - 内部管理は `budget_usd_monthly`, `budget_usd_daily`（USD基準で統一）
- UI表示は**ユーザー通貨に自動変換**（`display_currency`: JPY / USD / EUR 等）
- 初期セットアップ時に「居住国」をヒアリングし、推奨通貨を自動設定

### 予算が近づいたときの動作
1. キャッシュ優先（同一入力は再呼び出ししない）
2. 低コストモデルへフォールバック
3. 「探索LLM（xAI）」は原則OFF（ユーザー承認があるときだけON）

### コスト表示UI（MVP）
- 今日の消費: 例）¥128
- 今月累計: 例）¥1,840 / ¥5,000
- xAI使用分を別枠表示（節約意識を持たせる）

### コスト表示の見え方設定
`cost_widget_visibility`:
- `always`: 常に表示（デフォルト候補）
- `threshold_only`: 予算の◯%超えや xAI 実行時だけ表示
- `hidden`: 非表示（設定から復帰可能）

### 居住国ヒアリングの説明責任
初期セットアップ時にユーザーへ明示する内容:
> あなたの居住国を教えてください。  
> 目的: AI利用コストを現地通貨で表示するため・夜間実行タイミングの最適化のため。  
> ※位置情報は取得しません。国名はいつでも変更できます。

---

## 🖥 UI/UX詳細設計

### 設計原則（脳みそ節約）
1. **ワンボタン優先**: 迷う設定は「おすすめ」に寄せ、必要なときだけ詳細を出す
2. **先に結果**: まず何がどう良くなるかをプレビューで見せてから選ばせる
3. **失敗しても戻れる**: Undo（ロールバック）を最も目立つ場所に固定
4. **まとめて処理**: 低リスクは自動、判断が要るものは「理由で束ねて」一括承認
5. **通知は控えめ**: 急かさない。Homeに「付箋」を置く程度
6. **デフォルトは安全**: 初期はdry-run / Co-op寄り

### 主要画面一覧

#### 0) Home / Today（今日の付箋）
- 「昨夜AIがやったこと」3行サマリ
- 「次にやると得」トップ3
- 右上に **Undo**（直近Run）

#### 1) Chat Cleaner（チャット整理）
- 対象選択: `source_type=chat` のノート一覧
- **おすすめワンボタン（Recommended）**: Estimate → Preview → 安全説明 → Run
- 初期デフォルト: 精度=速い（粗め）/ 適用=dry_run
- 実行オプション（折りたたみ Advanced）: 精度 / 適用モード / ロールバック方針

**安全説明UI（Recommended直後）**:
> これは試運転（dry-run）です。実際のファイル変更は行われません。

**遅延確認フロー（心理安全設計）**:
> 「こんな感じで整理できます。実際に適用しますか？」  
> ▶ 適用する（Run） / ▶ 今回はやめる / ▶ 後で考える（履歴に保存）

#### 2) Preview（プレビュー）
- レイアウト切替: 🟥 3カラム / 🟨 2カラム（デフォルト） / 🟩 シンプル
- 左: 元ノート（読み取り専用）
- 右: 分割プラン（各スレッド: タイトル案/Topic/Summary）
- 操作: D&Dで境界位置を調整 / 右クリック「ここで分割」「ここは結合」

#### 3) Run Result（実行結果）
- 成功/失敗のサマリ
- 生成されたスレッドへのリンク
- **Undo（ロールバック）ボタン**（job_id/run_id単位）

#### 4) History（履歴）
- `/_alchemy/logs/daily/` の人間用ログを一覧
- 直近のRunを選ぶと実行メタ（run_id・trigger・cost）とUndoが使える

#### 5) Inbox（未整理）
- 新規取り込み一覧（PDF/Office/iWork含む）
- 「これは何の知識？」の分類入力（AI提案＋人間修正）

#### 6) Curation Review（提案レビュー）
- 分割/統合/表紙更新/タグ更新/削除候補をバッチ単位で表示
- 「理由でグルーピング」された削除バッチをワンクリック承認
- 変更は必ずプレビュー（差分）を見られる

#### 7) Tag Manager（タグ辞書）
- 4階層（大/中/小/微細）のツリー
- 同義語の統合・廃止タグの置換提案

#### 8) Semantic Search（意味検索）
- 検索ボックス + Projectフィルタ
- 結果は「チャンク→元ノート」へジャンプ
- related（関連ノート）も同時提示

#### 9) Project Spaces（棚設定）
- 取り込み対象パス/除外パス
- 鮮度ルール（何日で再確認）
- 個人データポリシー（strict/standard/relaxed）
- 外部送信許可（デフォルトfalse）
- persona_public（デフォルトfalse）

#### 10) Secrets & Providers（接続設定）
- OAuth接続 / APIキー入力
- 保存先はローカル（Vault外）であることを明示

#### 11) Scheduler（こっそり実行）
- 深夜実行/アイドル実行のON/OFF
- CPU/電力/ネット上限（静音）

---

## 📦 作業量が多い時の計画提示（Work Planning）

### 初期スキャン後に出す内容
- 総ファイル数
- 推定処理時間
- 個人データ疑い件数
- 重複疑い件数
- 古い情報件数

### 提案プラン例
- 🔹 フェーズ1: 表紙生成のみ（安全・高速）
- 🔹 フェーズ2: 意味検索インデックス化
- 🔹 フェーズ3: 削除候補整理
- 🔹 フェーズ4: タグ最適化

ユーザーは「全部やる」「段階的にやる」「今は検索だけ」を選択可能。

> 目的: 初期の圧倒的作業量を「恐怖」ではなく「ロードマップ」に変える。

---

## 🔐 秘密情報の取り扱い

- OAuthトークン/APIキーはVault内に保存しない
- 初回セットアップでローカルに入力し、OSのキーチェーン/暗号化設定ファイルに保持
- エクスポート/配布時に秘密情報が混入しないことを保証

---

## 📄 対応ファイル形式

| 種別 | 形式 |
|---|---|
| 既存 | `md`, `txt`, `pdf`, `chat log` |
| 追加 | `docx`, `xlsx`, `pptx`（Microsoft Office） |
| 追加 | `pages`, `numbers`, `key`（Apple iWork） |
| 追加 | 上記の PDF 書き出し版 |

### 重複処理（原本 + PDFの統合）
- `content_hash` で同一判定
- `source_group_id` を付与し「同じ資料の別形式」を統合表示

---

## 🔌 ローカルLLM（Phase 6・接続部分は実装済み: 2026-07-08）

### 目的
個人情報・機密をローカルで完結させる。

### 現状方針（Phase 6）
- **接続部分は実装済み**: OpenAI互換API（`baseURL`差し替え）でOllama / LM Studio等に
  接続できる。詳細仕様は「✅ 確定済み技術スタック」直下の
  「ローカル/カスタムLLM（OpenAI互換API、実装済み: 2026-07-08）」節を参照
- **未実装（Phase 6として残る部分）**:
  - Privacy Stage（Stage 4）での「個人情報検出時はlocalへ自動フォールバック」といった
    自動ルーティングは未実装。現状は接続先をユーザーが手動設定するのみ
  - 疎通確認UI・モデル互換性の自動検証は未実装
  - 埋め込みモデル切り替え時の自動再埋め込みは未実装（不一致はエラーで検出のみ）

### 将来有効化条件（自動ルーティング部分）
- 十分なメモリ環境（16GB以上）を持つPC
- モデル配置パスとローカル推論サーバ（例: Ollama等）設定完了時

### 設計上の準備
- Providerとして `local` を予約 → **実装済み**: `OpenAIProvider` は接続先が
  `api.openai.com` 以外のとき `name` が `"local"` を返す
- Privacy Stage（Stage 4）で「local優先」分岐を残す → 未実装（上記参照）
- モデル保存場所はVault外（Drive同期対象外）

---

## 🏷️ Phase 3: タグ管理（Stage 6: Tagging）

> 決定日: 2026-03-06

### 設計方針

タグは「人間が見るための分類ラベル」ではなく、**AIが検索・提案しやすい意味の結び目**として設計する。
ユーザーはObsidianを開かなくても、AIがタグ管理を完結させる。

### 既存 `#タグ` との関係

- **フロントマターの4階層タグが主役**
- Vault内に既存の `#タグ` がある場合は「あれば参考にする」程度の扱い
- `#タグ` を主役にしない理由: Vaultにいまタグがほぼない。本・資料が今後の主な対象なので、最初から4階層ルールで揃えるほうが後でラク

### タグの4階層（フロントマター）

```yaml
tags_big:   [領域]       # 例: テクノロジー
tags_mid:   [分野]       # 例: AI・機械学習
tags_small: [テーマ]     # 例: 自然言語処理
tags_micro: [キーワード] # 例: プロンプト設計, RAG
```

### タグ辞書（`/_alchemy/tags/tags.json`）

#### 初期状態
- **空スタートで育てる方式**
- 辞書は最初から用意しない。AIがノートにタグを付けるたびに辞書に追記されていく
- 理由: 最初からルールを固めるより、実際のノートから自然に育ったほうがVaultの内容に合ったタグ体系になる

#### 辞書の構造
```json
{
  "tags": {
    "テクノロジー": {
      "AI・機械学習": {
        "自然言語処理": ["プロンプト設計", "RAG", "埋め込み"]
      }
    }
  },
  "synonyms": {
    "LLM": "大規模言語モデル",
    "人工知能": "AI"
  },
  "deprecated": {
    "機械学習モデル": "AI・機械学習"
  }
}
```

#### 辞書の自動整理
- バラバラになったタグ・重複したタグ・意味が近いタグをAIが自動で検知
- 整理・統合はAIが自動実行（ユーザー確認不要）
- 整理した内容は日次サマリに記録

### AIタグ付けの動作

#### 通常フロー（夜間バッチ）
```
Scheduler（夜間アイドル時）
  → 未タグノートを検出
  → AIが4階層タグを生成
  → 辞書に新規タグを追加
  → フロントマターに書き込み（Low Risk: 自動適用）
  → 日次サマリに記録
```

#### AIへの指示（プロンプト設計）

入力:
```json
{
  "note_content": "ノート本文（最大8000文字）",
  "note_title": "タイトル",
  "existing_tags_big": ["既存の大タグ一覧"],
  "existing_tags_mid": ["既存の中タグ一覧"],
  "existing_tags_small": ["既存の小タグ一覧"],
  "existing_tags_micro": ["既存の微細タグ一覧"],
  "synonyms": {"LLM": "大規模言語モデル"}
}
```

AIへの指示方針:
- 既存の辞書から最も近いタグを優先して選ぶ
- 辞書にないタグは新規作成してよい（その場合は `is_new: true` を返す）
- 同義語辞書に載っている場合は統一表記を使う
- 微細タグは3〜5個が目安

出力:
```json
{
  "tags_big": ["テクノロジー"],
  "tags_mid": ["AI・機械学習"],
  "tags_small": ["自然言語処理"],
  "tags_micro": ["プロンプト設計", "RAG", "埋め込み"],
  "new_tags": [
    {"level": "micro", "value": "埋め込み", "parent": "自然言語処理"}
  ],
  "confidence": "high"
}
```

#### 新規タグの追加ルール
- `is_new: true` のタグは自動で辞書に追加
- 類似タグが辞書にある場合、AIが統合を判断して古いタグを `deprecated` に移動
- confidenceが `low` の場合はタグを付けず「タグ付け保留」フラグを立てて翌日再試行

### リスク分類（タグ操作）

| 操作 | リスク | 承認 |
|------|--------|------|
| タグの追加（新規・既存問わず） | 🟢 Low | 自動適用 |
| 辞書への新規タグ追加 | 🟢 Low | 自動適用 |
| 辞書の同義語統合 | 🟢 Low | 自動適用 |
| タグの削除・置換 | 🟡 Medium | バッチ承認 |
| 廃止タグの一括置換 | 🟡 Medium | バッチ承認 |

### Tag Manager UI（Obsidianプラグイン内）

- 4階層ツリーの表示（大→中→小→微細）
- 各タグに「このタグが付いているノート数」を表示
- 同義語・廃止タグの統合提案とワンクリック承認
- タグをクリック → そのタグのノート一覧へジャンプ

### Phase 3 完了の定義

以下がすべて動作すれば完成:

1. 夜間バッチで未タグノートが自動タグ付けされる
2. タグ辞書（`tags.json`）が自動で育っていく
3. AIがバラバラなタグを自動で整理・統合する
4. Tag Manager タブでツリー表示と統合提案が見られる
5. 日次サマリにタグ付け件数・新規タグ・整理内容が記録される

