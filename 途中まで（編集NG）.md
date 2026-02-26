# [App Name]
**Vault Alchemist（仮）**

## Visual Persona
- 絵文字: 📖🧠🖥️
- キャッチコピー: **「Obsidianを、AIと融合した“資産運用”の書斎に変える」**

## Core Definition（最上位宣言）
Vault Alchemist は、**人間とAIの対話を「資産」に変える再構成エンジン**である。

### 体験としての約束（絶対に守ること）
- **対話は流れない**: チャット履歴を「話題ごとの知識」に再構成し、後から再利用できる形にする。
- **AIは整理まで**: 破壊的変更（本文書き換え・削除・大規模移動）は必ず人間の承認を通す。
- **安心が最優先**: いつでもUndoできる。日記/手紙/メールなど“感情資産”は壊さない。
- **同じ作業を二度させない**: 差分・再開・履歴で、昨日の努力を無駄にしない。
- **ローカル優先**: 個人データは外に出さず、外部AI連携もProject単位で制御する。

> 目的は「便利」ではなく、**思考と対話を、未来の自分とAIが再利用できる形に保全すること**。

## Concept
### 3秒説明（たとえ付き）
Obsidianの保管庫（Vault）にある資料を、**AIが“図書館司書＋編集者”として整理し直す**アプリ。
- 長すぎる本は「章」に分ける
- 断片メモは「テーマ別ノート」にまとめる
- 価値が薄いものは「ゴミ箱候補」に分ける
- そして、**人が見て“今読む価値”が一目でわかる表紙（要約＋タグ＋関連）**を付ける

### 解決する痛み
- Obsidianに資料が溜まりすぎて、探せない／使えない
- AIに渡しても、文書が長すぎる・粒度がバラバラ・重複が多い
- タグが増殖して崩壊しがち

## Scope（やること / やらないこと）
### やること
1. Vault内ファイルの取り込み（MD・PDF・テキスト・会話ログなど）
2. 文書の**分割/統合/重複除去/不要箇所の削除候補**を提案
3. 「読む価値がわかるメタ情報」を自動付与（概要・要点・用途・鮮度・信頼度など）
4. 自動タグ付け（大タグ/小タグの階層、同義語の統合）
5. 意味検索（セマンティック検索）
6. Vault変更の監視と自動更新（インデックスの更新、タグ辞書の更新）
7. AI接続方式は **OAuth と APIキーの両対応**

### やらないこと（初期）
- ノートの見た目を大改造する独自エディタ
- クラウドに丸ごとVaultを強制アップロード（ローカル優先）
- 完全自動で原文を破壊的に書き換える（常に提案→承認フロー）

> ただし「夜中にこっそり整理」はやる（**自動実行＝“提案作成まで”**／適用はモード次第）。

## Key Ideas
### 「Project単位の思考空間」とは
**棚（Project）ごとに、AIに読ませる範囲と目的を固定する**考え方。
- 例: 「営業提案」棚には提案資料・過去事例・顧客会話だけ
- 「研究」棚には論文・実験ログだけ

同じVaultでも、棚ごとに
- 検索対象
- タグ辞書
- 要約の粒度
- 禁止情報（社外秘など）
を変えることで、AIの回答がブレにくくなる。

## User Stories（利用シーン）
- 資料（PDFや本）を取り込み、**関連するノートに自然につながる形**で再構成したい
- 仕事で使える過去の自分の資産を、**意味検索で掘り起こしたい**
- 応用力を上げるために、**横断的な関連（A→B→C）**を可視化したい

## Operation Modes（作業モード）
整理整頓の“手綱”をどこまでAIに渡すかを選べる。
1. **Human（人間モード）**: AIは提案だけ。適用は全て人間がクリック。
2. **Co-op（共同モード）**: 低リスク（例: 表紙更新、タグ付け、重複候補リスト）は自動適用。高リスク（統合/削除/大規模分割）は承認制。
3. **AI（AIモード）**: ルールに合うものは自動適用。ただし削除は常に「保留→まとめて報告→ワンクリック承認」。

## Initial Setup（初期セットアップ：AIインタビュー）
### 目的
- 設定地獄を避けつつ、初期の大量処理を現実的にする
- 「こういうパターンはどうする？」を先に決めて、以降は自動で迷わない

### 入口
- **対話インタビュー**（推奨）: AIが質問して最適な初期設定を生成
- **Vault軽量スキャン + 提案**: フォルダ構造/拡張子/タグ頻度からProject案を作り、最後に人が承認

### 構成パターンの質問（例）
- 重複が見つかったら？（残す/統合/片方アーカイブ）
- 長文PDFは？（章分割/要約のみ/両方）
- 会話ログは？（日次まとめ/トピック統合/そのまま）
- Webクリップは？（全部保存/選択範囲だけ/一定以上は要約）
- 店・サービスが消えたら？（自動アーカイブ/削除バッチ/通知のみ）
- 個人データが疑わしいときは？（必ずメタ化/ローカルLLMのみ/手動確認）

### 生成されるもの
- Project設定（対象パス、鮮度ルール、外部送信可否）
- タグ大分類の初期ツリー
- 提案バッチのルール（グルーピングキー、頻度）
- 自動化レベル（Level 0〜3）の初期値

## Functional Requirements
### 1) 取り込み（Ingestion）
- Vault内の既存MD/テキスト/会話ログを解析
- PDFはテキスト抽出してMD化（画像PDFは将来対応枠）
- Office/iWorkはテキスト抽出してMD化（可能なら原本優先、PDF版がある場合は統合）
- 取り込み時に「この知識は何か（分類）」を付与

#### Web取り込み（Chrome拡張 / Web Clipper）
ネット上の情報もVault資産にするため、**Chrome拡張（Web Clipper）**を提供する。

- できること（標準）:
  - 表示中ページのURL/タイトル/本文（Reader相当）/選択範囲を取得
  - 「Project（棚）」を選んで送信
  - 送信先はローカルservice（HTTP）

- ログイン必須サイトの扱い（現実解）:
  1. **選択範囲クリップ（推奨）**: ユーザーが画面上で必要部分を選択→拡張がHTML/テキストとして送る
  2. **ページ全文スナップショット**: 表示中DOMから本文候補を抽出して送る（ただし精度はサイト依存）
  3. **手動コピペ受け口**: どうしても難しい場合、拡張/アプリに「貼り付け」できる入力欄を用意し、貼った内容をMD化

- 生成物:
  - `/_alchemy/inbox/` にMDとして保存
  - frontmatterに `source_type=web`, `source_ref=URL`, `source_date=取得日`, `file_created_at/modified_at`

- 注意:
  - 権限の関係で取得できない要素があるため、MVPは「選択範囲」が最強。

### 2) 整理整頓（Curation）
- 長文: チャプター/セクション単位に分割（見出し保持）
- 短文: 同一トピックへ統合（重複排除、出典リンク保持）
- 余計なもの: **削除候補として隔離**（削除は即時実行しない）

#### 削除候補の報告（脳みそ節約仕様）
- 削除候補は「まとめて」提示する（日次/週次/手動）
- さらに、**理由が似ているものを同じバッチに自動グルーピング**して出す
  - 例: 重複（ほぼ同内容） / 期限切れ / 参照ゼロ / 低品質抽出 / 同一PDFの二重取り込み
- 各バッチに「代表例」「共通の削除理由」「影響（リンク切れ候補）」を付ける

### 3) 価値が一目でわかる“表紙”
※ここでいう「表紙」は**ファイルタイトルとは別レイヤー**。

---

## 🏷 タイトル最適化（AIリネーム機能）
### 背景
AIチャット履歴やメモが増えると、
「タイトルだけ見ても何の話か分からない」問題が発生する。

本機能はこれを解消するためのもの。

### 基本方針
- タイトルもAIが提案・変更可能
- ただし **人間が確定させたタイトルは勝手に変更しない**

### タイトル用メタ情報
- `title_original`: 初期タイトル
- `title_current`: 現在のタイトル
- `title_generated_by`: `human | ai`
- `title_locked`: `true | false`
- `title_confidence`: 0.0–1.0
- `title_last_updated_at`

### 自動タイトル生成ルール（MVP）
対象例:
- 「ChatGPTとの会話」
- 「Untitled」
- 日付のみのタイトル
- 内容と一致しない汎用タイトル

生成方法:
- 主トピック + 具体対象 + 行動
- さらに **title_style（文体）** を反映
  - `concise`: 短く・記号少なめ
  - `academic`: 学術っぽく、用語を正確に
  - `business`: 目的→結論を先に
  - `casual`: 柔らかく
  - `my_voice`: ユーザーの既存タイトルから口調を学習（要: 同意）
  例:  
  ❌ Chat履歴  
  ⭕ Obsidian整理設計 – 自動化プロファイル議論

### リスク分類
- タイトル変更は原文非破壊のため基本Low〜Medium
- ただし `note_kind=journal|letter` はMedium扱い
- `title_locked=true` の場合は絶対変更不可

### 人間優先ルール
- ユーザーがタイトルを手動変更 → 自動で `title_locked=true`
- UIで「AIに再最適化させる」ボタンを押した場合のみ再生成

---

表紙ブロックの構成イメージ:
- 📌 要約（summary）
- 🎯 今読む理由（why_now）
- 🗂 主題・タグ
- 📅 日付・鮮度
- 🔗 関連ノート
- 👤 著者区分（human / ai / hybrid）

タイトル（H1）は原文の顔。
AIは整えることはできるが、
**人間が触った瞬間に“神聖領域”になる。**

### 4) 自動タグ付け（階層＋同義語）
- **タグ階層は4段**: 
  - 大タグ（領域）→中タグ（分野）→小タグ（テーマ）→微細タグ（キーワード）
- タグ辞書（同義語・表記ゆれ・英日ゆれ）を一元管理
- 既存タグの棚卸し提案（統合/分割/廃止）
- タグは「ノートに付ける」だけでなく、**Project（棚）ごとの推奨タグセット**も持てる

### 4.5) フォルダ整理（自動フォルダ分け / 移動）
目的: タグだけでなく「置き場所」も整えて、Vaultを迷路にしない。

#### 方針
- AIはフォルダ移動を **提案**できる
- 初期の大量整理を楽にするため、Automation Profileにより「移動の自動化レベル」を設定できる
- **人間が手動で移動したファイルはロック**して以後勝手に動かさない

#### フォルダ操作の安全設計
- ObsidianのVault操作（move/rename API）で実行し、
  - 可能な限りリンク更新（移動後の参照更新）を自動で行う
- それでも影響が大きいので、フォルダ移動は基本 **Medium Risk**（バッチ承認）

#### フォルダ用メタ情報（追加）
- `path_original`: 取り込み時のパス
- `path_current`: 現在パス
- `path_generated_by`: `human | ai`
- `path_locked`: `true | false`
- `path_last_updated_at`

#### 自動フォルダ分けルール（MVP）
- Projectごとに「標準フォルダ構造」を持つ
  - 例: `Work/Inbox`, `Work/Reference`, `Work/Log`, `Work/Archive`
- note_kindごとの推奨先
  - `journal` → `*/Log/`
  - `reference`（PDF由来など）→ `*/Reference/`
  - `task/meeting` → `*/Work/` など
- tags_big（領域）→ 上位フォルダ候補
  - 例: `tags_big=Finance` → `Finance/`

#### 人間優先ルール（移動ロック）
- ユーザーが手動で移動/リネーム → `path_locked=true`
- UIで「AIに再整理させる」を押した場合のみ再提案/再移動

### 5) 意味検索
- ノートを「検索用の小片（チャンク）」に分割して埋め込み（embedding）
- クエリ→近い小片→元ノートへジャンプ
- Project（棚）フィルタ対応

### 6) Vault監視
- ファイル追加/更新/削除を検知
- インデックスとタグ辞書を差分更新

### 6.5) こっそり自動実行（アイドル作業）
ユーザーがPCを触っていない時間帯に、バックグラウンドで整理を進める。

#### 固定時刻が分からない（夜型/不規則）場合の方針
- 「深夜◯時」ではなく、**アイドル検知（操作が無い）**を主トリガーにする
- さらに“静音”優先で、ユーザーの作業を邪魔しない

#### 実行トリガー（MVP）
- 一定時間アイドル（例: 20分）
- 充電中・バッテリー閾値以上（デフォルト: 充電中のみ）
- CPU使用率が低い状態が継続
- 手動ボタン
- （任意）ざっくり時間帯ウィンドウ（例: 0:00–6:00）

#### 学習（将来だが軽め）
- 過去の実行成功ログから「この人が触っていない時間帯」を推定し、
  - 提案として“おすすめ実行枠”を出す（自動適用はしない）

#### 実行内容（MVP）
- 取り込み、表紙生成、タグ提案、意味検索インデックス更新、削除候補のバッチ生成
- Obsidianを自動起動してもよい（設定でON/OFF）
- “静音”優先: CPU/電力/ネットワークの上限を設定可能

### 7) AI接続
- OAuth接続（対応するAIプロバイダがある場合）
- APIキー接続
- プロバイダ切替（将来）

#### 複数AIプロバイダ対応（最低2つ）
目的: 「進化するAIの力」を取り込みつつ、コストと安全を両立する。

- 最低要件: **プロバイダは2つ以上登録できる**（主力 + 予備/探索）
- 1つ目: **主力LLM**（日常の要約/タグ/整形/提案生成）
- 2つ目: **探索LLM（推奨・任意）**（例: xAI）
  - X（旧Twitter）検索・最新の実践例の探索に使う
  - **使わないユーザーもいる前提**で、未設定でも全機能が動く（探索だけ無効）
  - ただしコストが高くなりやすいので“節約モード”を標準にする
- 追加: **ローカルLLM**（将来実装予定 / 初期は無効）
  - 目的: 個人情報/機密を外に出さずに要約/タグ/分割/埋め込み生成までローカル完結
  - 想定モデル（OpenAI open-weight）:
    - `gpt-oss-20b`（16GBメモリ級を想定）
    - `gpt-oss-120b` は高性能GPU前提（一般PC/Macでは非現実的）
  - 現状方針:
    - MVPでは**実装準備のみ（インターフェース設計と切替ポイントの確保）**
    - 実際の推論接続は無効化
  - 将来有効化条件:
    - 十分なメモリ環境を持つPC導入時
    - モデル配置パスとローカル推論サーバ（例: Ollama等）設定完了時
  - 設計上の準備:
    - Providerとして `local` を予約
    - Privacy Stage（Stage 4）で「local優先」分岐を残す
    - モデル保存場所はVault外（Drive同期対象外）
  - 実行方式（将来選択）:
    - ローカルHTTP推論サーバ接続
    - またはservice内蔵ランタイム（拡張時）

#### コスト節約（Budget & Throttle）
- Providerごとに月次/日次の予算上限を設定
  - 内部管理は `budget_usd_monthly`, `budget_usd_daily`（USD基準で統一）
- UI表示は**ユーザー通貨に自動変換**する
  - `display_currency`（JPY / USD / EUR など）
  - 初期セットアップ時に「居住国」をヒアリングし、推奨通貨を自動設定
- 為替レートは定期取得し、`fx_rate_updated_at` を保持（誤差対策として概算表示であることを明示）

- 予算に近づくと自動で:
  1) キャッシュ優先（同一入力は再呼び出ししない）
  2) 低コストモデル/ローカルへフォールバック
  3) 「探索LLM（xAI）」は原則OFF（ユーザー承認がある時だけON）

- コスト表示UI（MVP）:
  - 今日の消費: 例）¥128
  - 今月累計: 例）¥1,840 / ¥5,000
  - xAI使用分を別枠表示（節約意識を持たせる）

#### コスト表示の“見え方”設定（ユーザー差対応）
人によって「常に見たい/必要時だけ見たい/消したい」が違う。

- `cost_widget_visibility`: `always | threshold_only | hidden`
  - `always`: 常に表示（デフォルト候補）
  - `threshold_only`: 予算の◯%超えやxAI実行時だけ表示
  - `hidden`: 非表示（設定から復帰可能）

- UI操作（例）:
  - コスト表示ウィジェットを右クリック →
    - 「この表示を消す」
    - 「現状維持」
    - 「通貨変更」
  - もしくは Settings → Display → Cost で変更

- 通貨設定も同じ場所に置く:
  - Settings → Display → Currency（`display_currency`）
  - 初期セットアップで居住国から推奨値を入れる

#### 居住国ヒアリングの“説明責任”
ユーザーに「なぜ聞くのか」を明確に伝える。

初期セットアップ時に以下の説明を表示する：

> あなたの居住国を教えてください。
> 目的：
> - AI利用コストを現地通貨で正確に表示するため
> - 為替レートを考慮した予算提案を行うため
> - 夜間実行の“おすすめ時間帯”を推定するため
> - 将来の税制・価格変動対応を正しく行うため
>
> ※位置情報は取得しません。国名はいつでも変更できます。

設計原則：
- 取得するのは「国」レベルのみ（都市・住所は不要）
- 強制入力にしない（スキップ可能）
- 後から変更可能
- 目的を明示し、データの用途を限定する

---

## 🌍 拡張ロケーション設定（任意・メリット明示型）
より高度な提案を行うため、ユーザーが希望すれば以下も設定可能にする。

### 取得候補（すべて任意）
- `nearest_station`（最寄り駅）
- `transport_mode`（主な移動手段: 徒歩/電車/車/自転車など）
- `commute_time_minutes`（通勤・移動の目安時間）
- `active_hours_pattern`（活動時間帯の傾向: 夜型/朝型/不規則）

### ユーザーへの説明例
> より実用的な提案（移動時間で読める資料、近場の実店舗情報、時間帯に合わせた整理計画など）を行うため、任意で生活圏情報を設定できます。
> 入力しなくても利用可能です。

### 得られるメリット
- 📚 移動時間に合わせた“読むべき資料”提案（例: 15分で読める要約）
- 🗺 実店舗/イベント情報の有効性チェック（消滅判定精度向上）
- 🌙 実生活に合った夜間バッチ実行タイミングの最適化
- 💡 興味（Interest）と現実行動を結びつけた提案

### プライバシー設計
- 駅名などは**文字列として保存するのみ**（GPS取得なし）
- 外部AIへ送信するかはProjectポリシーに従う（デフォルト送信しない）
- いつでも削除・変更可能

> 原則: 「入力すると賢くなる」。入力しなくても使える。

- 価格/レートは変動しうるため、最新仕様は公式ドキュメントを参照し、
  - トークン消費・キャッシュの概念を前提に設計する

### 8) 外部AI連携（MCP）
アプリは「人間が使うUI」だけでなく、外部AI（別のエージェント/チャット）からも使えるように、**MCP（Model Context Protocol）サーバー**として機能を公開する。

#### 2つの方向性（両方やる）
- **A: 外部AI → Vault Alchemist**（外部AIが検索・参照・提案を行う）
- **B: 外部AI ← Vault Alchemist**（外部AIが“会話資産”を取りに来る。毎回コピペ不要）

> あなたの狙いはB。これを正式に仕様として入れる。

---

### A) 外部AI → Vault Alchemist（Tool提供）
- 目的: 外部AIがVaultの“資産化済み知識”を検索・参照・整理提案できる
- 提供形態: 
  - ローカルMCP（同一PC）
  - リモートMCP（社内LANやVPN内）※将来
- 公開する機能（Tools）例:
  - `search_semantic(query, project, filters)`
  - `get_note(id/path)`（メタ中心、原文は権限次第）
  - `list_projects()` / `get_project_rules(project)`
  - `propose_curation(targets, mode)`（分割/統合/タグ/削除候補バッチ生成）
  - `apply_changes(batch_id)`（モードと権限に従う）

---

### B) 外部AI ← Vault Alchemist（Conversation Memory提供）
#### 目的
- 外部AIとの会話で、**毎回「過去ログを貼る」手間を無くす**
- ただし、ユーザーの安心のため **必ず承認と範囲指定**を通す

#### 公開する情報（Resources）例
- `conversation_threads.list(project_id, since?, topic?)`
- `conversation_threads.get(thread_id, detail_level)`
  - `detail_level`: `summary_only | summary_plus_meta | full_text`
- `memory_snapshot.get(project_id)`
  - 直近の意思決定・継続中テーマ・未解決事項（要約のみ）
- `tag_dictionary.get(project_id)`（会話資産のタグ体系）

#### “コピペ不要”を実現するUX（必須）
- 外部AI側がMCPで「必要な範囲」を要求 → Vault Alchemistが **承認ダイアログ** を出す
- 承認すると、外部AIは **許可された範囲だけ** 参照できる
- 以後は「毎回コピペ」ではなく、AIが必要なときに取りに来る

> たとえ: 本を毎回手で持っていくのではなく、**司書（MCP）が“必要なページだけ”渡す**。

#### 承認モデル（安全の最小単位）
- 承認は **Project単位** で管理
- さらに **時間制限つき（セッション許可）** を用意し、「毎回コピペ/毎回許可」の手間を減らす

##### セッション許可プリセット（UIで即選べる）
- ※ 無期限許可を含め、**セッション許可の解除ボタンはUIの分かりやすい場所に常時表示する**（具体位置はUI設計時に画面を見ながら決定する）

- **今だけ（1時間）**
- **しばらく（8時間）**
- **ずっと（無期限）**（※強い警告＋いつでも解除できる導線を目立たせる）

##### カスタムタイマー（設定画面）
- Settings → External AI / MCP → Session Timer
  - 分/時間/日で指定
  - 「このProjectだけ」または「全Project共通の既定値」を選べる

##### 許可レベル（デフォルトは最も安全）
- Level 0: 禁止（デフォルト）
- Level 1: `summary_only`
- Level 2: `summary_plus_meta`（topic/tags/date/insight/intent/interest まで）
- Level 3: `full_text`（全文。強い警告＋短い期限が推奨）

> 原則: **双方向MCP**（外部AI→本アプリ / 外部AI←会話資産）どちらも、この「Project×レベル×時間」の許可モデルで統一する。

#### 個人情報（Private Entity）との整合
- `personal_data=confirmed` のノート/スレッドは、デフォルトで `detail_level` を強制的に下げる
  - 例: Level 2でも `summary_plus_meta` まで、本文は `masked` を返す
- `redaction_level` に従って、外部AIへ渡す本文はマスク版（masked）にする

#### 監査ログ（必須）
- 外部AIが何を読んだかを `/_alchemy/logs/` に残す
  - `provider_name`, `project_id`, `resource`, `detail_level`, `timestamp`

#### 初期（A-MVP）での扱い
- Phase 1（A-MVP）では **Level 1（summary_only）まで** を推奨実装範囲
- Full textはPhase 2以降（プライバシー・UX・負荷の検証が必要）

---

### 認可
- MCPのHTTP系トランスポートでは**OAuth 2.1**等で保護し、ローカルの場合はOSユーザー権限＋トークンで制御する

> 重要: 外部AIからの“破壊的操作”は原則禁止。許可する場合も「Project単位」「モード単位」「権限単位」で細かく制御。

## Non-Functional Requirements
- ローカルファースト（Vaultの中で完結しやすい）
- 破壊的変更を避ける（提案→承認→適用、またはモード別の自動適用）
- 速度: 日常利用でストレスがない（差分更新が基本）
- プライバシー: 送信範囲（Project/フォルダ/タグ）を明示
- **個人データの扱い**:
  - 個人情報を含むファイルは、本文をそのまま外部AIへ送らない。
  - 本文とは別に、**個人エンティティ専用データベース（Private Entity DB）**へ構造化保存する。
  - 原文はVault内に保持し、外部送信は明示許可が必要。

### Private Entity DB（個人データ専用DB）
目的: 「後から“誰のことか”を正確に辿れる」状態を維持する。
- 保存単位: Person / Organization / Account などのエンティティ
- 主なフィールド:
  - `entity_id`
  - `entity_type`（person / company / client など）
  - `canonical_name`（正式名称）
  - `aliases`（別名・表記ゆれ）
  - `related_notes`（参照ノートID配列）
  - `sensitivity_level`（low / medium / high）
  - `last_detected_at`
- ノート側には実名を直接展開せず、`entity_id`で紐付け可能にする（マスキング運用可）

### 個人データ判定（ハイブリッド方式採用）
本アプリでは **ハイブリッド方式（二段階）を正式採用**する。
1. ルール方式で明確な個人情報形式を検出
2. AI分類方式で文脈判断
3. 検出されたエンティティをPrivate Entity DBへ登録

### 書き換えポリシー
- AIは書き換え提案可能
- ただし**常に明示的なユーザー承認が必要（全モード共通）**
- 外部AI（MCP経由）による変更も同様に承認必須

#### 初期大量処理を現実的にする「段階的自動化」
初期の処理量が多いと“全部承認”が苦行になるため、**承認は保ったまま自動化の段階**を用意する。

- **Level 0（観察）**: 何もしない。スキャンして統計と計画だけ出す。
- **Level 1（低リスク自動適用）**: 表紙生成、日付メタ付与、インデックス更新、タグ提案の作成まで。
- **Level 2（準自動）**: 低リスク変更は自動適用し、
  - 中〜高リスク（統合/分割/削除/本文編集）は「バッチでまとめて承認」
- **Level 3（高速初期化モード）**: 初期限定。
  - ルールに一致するもの（重複・二重取り込み・明確な期限切れ等）を“仮適用”し、
  - いつでもロールバックできるようにスナップショットを残す。

> 重要: どのLevelでも「本文の破壊的書き換え」「削除」は最終承認を必須にする。

#### 自動化レベルは“プロファイル”として学習・提案する
段階（Level）は固定ではなく、**ユーザーの好み（チューニング）を反映したプロファイル**として扱う。

- **Automation Profile（自動化プロファイル）**
  - 例: `Safe Librarian`（慎重） / `Night Cleaner`（夜間強め） / `Research First`（研究優先）
- プロファイルは「ルールセット（もし〜ならこうする）」の集合で、Projectごとに適用できる。

#### プロファイル作成の流れ
1. 初期にAIが候補プロファイルを提示（Vaultスキャン結果＋インタビュー回答から）
2. ユーザーが“数個の代表ケース”でYES/NOを返す（チューニング）
3. AIがルールを調整し、**「この設定をデフォルトにしますか？」**と確認
4. 必要なら分岐して複数プロファイルを作成（例: 仕事用は慎重、読書用は強め）

#### 代表ケース（チューニング質問）例
- 重複ノート（内容が90%一致）→ `統合` / `片方アーカイブ` / `両方残す`
- 同一資料のPDFと原本 → `統合表示` / `原本優先` / `PDF優先`
- 長文PDF（>Nページ）→ `章分割+要約` / `要約のみ` / `そのまま`
- Webクリップが長い（>N文字）→ `要約して保存` / `全文保存` / `選択範囲のみ`
- 期限切れ（freshness超過）→ `再確認候補` / `自動アーカイブ` / `通知のみ`
- サービス消滅（defunct_confirmed）→ `自動アーカイブ+削除バッチ` / `通知のみ`
- 個人データ疑い → `必ずmetadata_only` / `masked` / `手動確認`

#### ルールセットの保存先
- `/_alchemy/projects/<project_id>.json` に `automation_profile_id` を保持
- プロファイル定義は `/_alchemy/projects/automation_profiles.json` に保存
  - `profile_id`, `name`, `level_default`, `rules[]`, `last_updated_at`
  - 変更履歴（なぜ変えたか）も残す（後で戻せる）

### クラウド対応（Google Drive）
ローカルVaultに加えて、Google Drive上のVaultにも対応する。

#### Obsidian前提
- ObsidianのVaultは「ローカルファイルシステム上のフォルダ」として扱われる。
- そのためGoogle Driveを使う場合も、**ローカルに見えるフォルダ（ミラー/オフライン保持）**が前提。

#### 接続方針（MVP）
- OAuthでDrive接続（バックアップ/同期用途）
- 同期方式:
  - **推奨: Driveフォルダをローカルへミラーリングして処理**（安定）
  - 直接Drive API経由で差分取得（将来拡張）

#### 注意（現実解）
- 「クラウドにだけ存在してローカルに無い（ストリーミングのみ）」は、
  - Obsidianの監視・リンク更新・検索インデックス更新と相性が悪くなりやすい。
- したがってMVPでは **“ローカルに実体がある”状態（Mirror/Available offline）**を必須とする。

#### 競合
- 競合発生時は「差分比較→承認」フロー

### 情報鮮度管理（常に最新を保つ）
情報が古くなる問題に対応するため、以下を導入する。

#### 日付の優先順位（いつの情報かを必ず残す）
- **明示日付がある場合**: それを `source_date`（情報の発生日）として採用
  - 例: 記事の公開日、会議日、契約日、メモに書かれた日付
- **明示日付がない場合**: ファイルの作成/更新日時を採用
  - `file_created_at`（作成） / `file_modified_at`（更新）
- **本/出版物**: `release_date`（発売日/出版日）を優先（分かる場合）

#### ノート側メタ（追加）
- `source_date`: `YYYY-MM-DD`（情報の中心日付）
- `file_created_at`: `YYYY-MM-DDThh:mm:ssZ`
- `file_modified_at`: `YYYY-MM-DDThh:mm:ssZ`
- `release_date`: `YYYY-MM-DD`（本など）

#### 鮮度の計算
- `freshness`は上記日付とProjectの `freshness_policy_days` から自動算出
- 期限を過ぎたら「再確認候補」としてInboxへ

#### “存在しない”情報の自動処理（店・サービス・ツール等）
お店やオンラインサービスは「消滅」が起きるため、以下を導入する。
- `entity_type=org/service/place` を持つ情報は **存在確認チェック** を定期実行
- 確認方法（MVP）:
  - 参照URLがある場合: HTTPステータス（404/410等）やリダイレクト異常を検知
  - ドメイン消滅/DNS失敗が連続した場合も候補化
- 結果:
  - まず `status=defunct_suspected` としてバッチにまとめて報告
  - 連続N回（例: 3回）失敗で `status=defunct_confirmed`
  - **defunct_confirmed は自動で整理**（原本は保持しつつ、
    - curated側はアーカイブ/リンクから除外、
    - “削除提案バッチ”に自動追加）

> 方針: 「いきなり破壊削除」ではなく、まず無効化→まとめて報告→必要なら削除。

---

### 配布を想定した秘密情報の扱い（OAuth/APIキー）
- OAuthトークン/APIキー等の秘密情報は **Vault内に保存しない**
- 初回セットアップでローカルに入力/接続し、以降はローカルストレージに保持
  - 例: OSのキーチェーン/資格情報ストア、または暗号化した設定ファイル
- エクスポート/配布時に秘密情報が混入しないことを保証

---

### 対応ファイル形式（追加）
- 既存: `md`, `txt`, `pdf`, `chat log`
- 追加:
  - Microsoft Office: `docx`, `xlsx`, `pptx`
  - Apple iWork: `pages`, `numbers`, `key`
  - それらの **PDF書き出し版**

#### 取り込み方針
- 可能なら「原本→テキスト抽出→MD化」
- iWorkはユーザー環境（Mac/iCloud）でPDF/Office形式に変換できる前提を置き、
  - 変換済みPDFがある場合はそれを優先

#### 統合（原本 + PDFの重複）
- 同じ内容の原本とPDFが並存しがちなので、
  - `content_hash`（本文のハッシュ）で同一判定
  - `source_group_id` を付与し「同じ資料の別形式」を統合表示

## UI/UX Design
- トーン: **Obsidianに溶け込む**（黒基調、静かな図書館）

## 🦥 "堕落した僕型"でも回るUX原則（脳みそ節約の掟）
1. **ワンボタン優先**: 迷う設定は「おすすめ」に寄せ、必要な時だけ詳細を出す（段階的開示）。
2. **先に結果**: まず「何がどう良くなるか」をプレビューで見せてから選ばせる。
3. **失敗しても戻れる**: 画面の一番目立つ場所に Undo（ロールバック）。
4. **まとめて処理**: 低リスクは自動、判断が要るものは“理由で束ねて”一括承認。
5. **通知は控えめ**: 急かさない。Homeに「付箋」を置く程度。
6. **デフォルトは安全**: 初期は dry-run / Co-op 寄り、上書きや自動適用は段階的に解放。

### Phase 1（A-MVP）で必要な最小UI
目的: チャット再構成を「事故らず・迷わず」回す。

#### 画面/導線（最小）
0) **Home / Today（今日の付箋）**
- 「昨夜AIがやったこと」3行サマリ
- 「次にやると得」トップ3（押し付けず“おすすめ”）
- 右上に **Undo**（直近Run）

1) **Chat Cleaner（チャット整理）**（専用タブ）
- 対象選択:
  - `source_type=chat` のノート一覧（検索/フォルダフィルタ）
  - 「最近更新」順 / 「サイズが大きい」順
- **おすすめワンボタン（Recommended）**（堕落救済ボタン）
  - 内部フロー:
    1. Estimate（推定）
    2. Preview（必須表示）
    3. ユーザー理解フェーズ（安全説明）
    4. 明示確認後のみRun可能

  - 初期デフォルト:
    - 精度: `速い（粗め）`
    - 適用: `dry_run`
    - ロールバック方針: `move_to_archive`

  - **安全説明UI（Recommended直後に表示）**:
    > これは試運転（dry‑run）です。実際のファイル変更は行われません。
    > 結果を確認してから、本当に適用するか選べます。

  - **遅延確認フロー（心理安全設計）**:
    - Previewを見終わった後にのみ表示:
      > 「こんな感じで整理できます。実際に適用しますか？」
      - ▶ 適用する（Run）
      - ▶ 今回はやめる
      - ▶ 後で考える（履歴に保存）

  - 原則:
    - 自動適用はしない
    - RunボタンはPreview閲覧後に有効化
    - ファイル操作は常にユーザー意思のあと

- 事前スキャン（Estimate）ボタン（詳細派向け）
  - 推定分割数 / 推定時間 / 推定コスト（表示通貨）/ リスク内訳
- 実行オプション（折りたたみ: Advanced）:
  - 精度: `速い（粗め） | 丁寧（遅い）`
  - 適用: `dry_run | in_place | new_files`
  - ロールバック方針: `delete_threads | move_to_archive`
- 実行（Run）ボタン（Preview確認後のみ有効）

2) **Preview（プレビュー）**（必須）
- 表示レイアウトは切替可能にする（堕落救済＋安心設計）
  - 🟥 3カラム: 「元ノート」|「分割プラン」|「差分」
  - 🟨 2カラム: 「元ノート」|「分割プラン（差分内包）」
  - 🟩 シンプル: 「分割プランのみ」（元は折りたたみ）

- **デフォルト: 2カラム**
  - 理由:
    1. 情報量と安心感のバランスが良い（元が常に見える）
    2. 3カラムは強いが横幅依存が大きい（ノートPCで窮屈）
    3. シンプルは速いが不安を生む可能性がある

- 左: 元ノート（読み取り専用）
- 右: 分割プラン（スレッド一覧）
  - 各スレッド: タイトル案 / Topic / Summary
  - 差分はインライン表示（展開式）
  - 境界候補（0.4〜0.7）は「⚠候補」として表示

- 操作（最小）:
  - 境界の微調整（D&Dで境界位置を前後）
  - 右クリック: 「ここで分割」「ここは結合」
  - 右上: **このまま整理する** / **今回はやめる**

3) **Run Result（実行結果）**
- 成功/失敗のサマリ
- 生成されたスレッドへのリンク
- **Undo（ロールバック）**ボタン（job_id/run_id単位）

4) **History（履歴）**
- `/_alchemy/logs/daily/` の人間用ログを一覧表示
- 直近のRunを選ぶと
  - 実行メタ（run_id, trigger, cost）
  - Undo

#### UI上の安全ルール（A-MVP）
- `dry_run` を常に用意（最初の安心）
- `in_place` は必ずプレビューを通す
- Undoは「迷わず押せる」位置に固定（Home右上＋結果画面）
- journal/letter/email はA-MVP対象から除外（または警告してdry_runのみ）
- **迷ったらおすすめ（Recommended）** を押せば安全側で進む
- 連続実行はしない（A-MVPは1回ずつ）。夜間自動は“提案作成まで”

### 主要画面（提案インターフェイス）
1. **Home / Status（全体状況）**
   - 今日の処理結果（取り込み件数、提案バッチ数、更新されたインデックス）
   - 鮮度アラート（期限切れ候補）
   - “消滅疑い”アラート（defunct_suspected/confirmed）

2. **Inbox（未整理）**
   - 新規取り込み一覧（PDF/Office/iWork含む）
   - 「これは何の知識？」の分類入力（AI提案＋人間修正）

3. **Curation Review（提案レビュー）**
   - 分割/統合/表紙更新/タグ更新/削除候補をバッチ単位で表示
   - “理由でグルーピング”された削除バッチをワンクリック承認
   - 変更は必ずプレビュー（差分）を見られる

4. **Tag Manager（タグ辞書）**
   - 4階層（大/中/小/微細）のツリー
   - 同義語の統合、廃止タグの置換提案

5. **Semantic Search（意味検索）**
   - 検索ボックス + Projectフィルタ
   - 結果は「チャンク→元ノート」へジャンプ
   - related（関連ノート）も同時提示

6. **Project Spaces（棚設定）**
   - 取り込み対象パス/除外パス
   - 鮮度ルール（何日で再確認）
   - 個人データポリシー（strict/standard/relaxed）
   - 外部送信許可（デフォルトfalse）

7. **Secrets & Providers（接続設定）**
   - OAuth接続 / APIキー入力
   - 保存先はローカル（Vault外）であることを明示

8. **Scheduler（こっそり実行）**
   - 深夜実行/アイドル実行のON/OFF
   - CPU/電力/ネット上限（静音）

## Data Schema（引き出しの整理整頓ルール）
Vault内に専用フォルダを作り、生成物はそこへ。

### フォルダ案
- `/_alchemy/inbox/` : 未整理の取り込み結果（取り込み直後のMD化テキスト等）
- `/_alchemy/curated/` : 整理済みの再構成ノート（分割/統合の成果物）
- `/_alchemy/index/` : 検索用インデックス（DB/キャッシュ）
- `/_alchemy/tags/` : タグ辞書（JSON）
- `/_alchemy/entities/` : 個人エンティティDB（SQLite）
- `/_alchemy/projects/` : Project設定（JSON）
- `/_alchemy/batches/` : 提案バッチ（JSON）
- `/_alchemy/logs/` : 実行ログ

---

## Storage Decisions（保存方式の決定）
### 方針
- **人間が読むべきもの**はMarkdown/JSON（Gitで差分が見やすい）
- **検索や参照が多いもの**はSQLite（高速・壊れにくい）

### 採用する保存方式（MVP）
1. **意味検索インデックス**: SQLite（+ ベクトル格納）
2. **Private Entity DB**: SQLite
3. **タグ辞書**: JSON（1ファイル）
4. **Project設定**: JSON（Projectごと）
5. **提案バッチ**: JSON（バッチ単位）

> 微妙さレベル: 12%（SQLiteを使う実装手段は複数あるため。仕様としては“SQLiteで持つ”まで確定。）

---

## Databases（DB設計）

### 1) Semantic Index DB（意味検索DB）
保存場所: `/_alchemy/index/semantic.sqlite`

目的: 「意味検索」「関連ノート提示」「Projectフィルタ検索」を高速化。

#### テーブル案
- `chunks`
  - `chunk_id` (PK)
  - `note_path`（元ノートパス）
  - `project_id`（所属Project）
  - `chunk_order`（ノート内順序）
  - `text`（検索用テキスト。必要なら短縮版）
  - `token_count`
  - `hash`（再計算判定用）
  - `created_at` / `updated_at`

- `embeddings`
  - `chunk_id` (PK/FK)
  - `provider`（例: openai / local / other）
  - `model`
  - `vector`（ベクトル本体。格納方式は実装で選ぶ）
  - `dim`
  - `updated_at`

- `note_meta_cache`
  - `note_path` (PK)
  - `title`
  - `topic`
  - `tags_big` / `tags_mid` / `tags_small` / `tags_micro`（検索フィルタ用キャッシュ）
  - `source_date`
  - `release_date`
  - `file_modified_at`
  - `freshness`
  - `confidence`
  - `status`
  - `personal_data`
  - `updated_at`

#### チャンク規約（MVP）
- 1チャンクは「見出し単位」優先、無ければ長さで分割
- チャンクには必ず出典（note_path + 範囲）を保持

---

### 2) Private Entity DB（個人エンティティ専用DB）
保存場所: `/_alchemy/entities/entities.sqlite`

目的: 「後から“誰のことか”が分かる」「マスキングしても辿れる」

#### テーブル案
- `entities`
  - `entity_id` (PK)
  - `entity_type`（person / org / account / other）
  - `canonical_name`
  - `sensitivity_level`（low/medium/high）
  - `created_at` / `updated_at` / `last_detected_at`

- `entity_aliases`
  - `alias_id` (PK)
  - `entity_id` (FK)
  - `alias`（表記ゆれ）
  - `alias_type`（nickname/romanization/typo/other）

- `entity_mentions`
  - `mention_id` (PK)
  - `entity_id` (FK)
  - `note_path`
  - `context_snippet`（短い前後文。必要ならマスク）
  - `detected_by`（rule/ai/hybrid）
  - `confidence`
  - `detected_at`

- `interactions`
  - `interaction_id` (PK)
  - `from_entity_id`（自分=特殊IDでも可）
  - `to_entity_id`（宛先: person/org）
  - `action_type`（met/called/emailed/paid/promised/other）
  - `action_date`（YYYY-MM-DD）
  - `summary`（短文）
  - `note_path`（根拠ノート）
  - `created_at`

- `redaction_rules`
  - `rule_id` (PK)
  - `entity_id` (FK)
  - `redaction_level`（metadata_only/masked/allowed）
  - `notes`（例: 「社外秘のため常にmasked」）

> ノート側は実名を直接書き換えず、必要なら `entity_id` をフロントマターへ入れる。

---

### 3) Tag Dictionary（タグ辞書）
保存場所: `/_alchemy/tags/tags.json`

目的: タグ崩壊を防ぎ、同義語を統一する。

#### 構造案（JSON）
- `tags`（木構造）
  - big → mid → small → micro
- `synonyms`（同義語辞書）
  - 例: "LLM" ↔ "大規模言語モデル" ↔ "言語モデル"
- `deprecated`（廃止タグ）
  - 置き換え先を持つ

---

### 4) Project Settings（棚ルール）
保存場所: `/_alchemy/projects/<project_id>.json`

#### 設定項目（MVP）
- `project_id`, `name`
- `included_paths` / `excluded_paths`
- `allowed_tags_big`（推奨セット）
- `freshness_policy_days`（例: 30/90）
- `personal_data_policy`（strict/standard/relaxed）
- `ai_mode_default`（human/co-op/ai）
- `external_send_allowed`（true/false。デフォルトfalse）

---

### 5) Proposal Batches（提案バッチ）
保存場所: `/_alchemy/batches/<batch_id>.json`

目的: 「削除候補のまとめ」「統合/分割のまとめ」を、人間が脳みそ使わず処理できる形にする。

#### 構造案
- `batch_id`, `type`（delete/merge/split/tag/cover）
- `project_id`
- `created_at`
- `grouping_key`（例: duplicate / stale / no_refs）
- `items[]`
  - `target_paths[]`
  - `reason`
  - `risk_level`（low/medium/high）
  - `preview`（差分/要点）
- `status`（proposed/approved/applied/rejected）

---

### ノートのメタ情報（例）
YAML Frontmatter:
- `source_type`: `pdf | md | chat | web | other`
- `source_ref`: 元ファイルパス/識別子
- `source_group_id`: 同一資料グループID（原本+PDF等の統合）
- `content_hash`: 本文ハッシュ（重複判定）
- `note_kind`: `note | reference | journal | letter | email | meeting | task`

# 🔎 著者区分（人間 / AI）
- `author_type`: `human | ai | hybrid`
- `original_author`: 自分 / 他人名 / AIモデル名 など
- `ai_generated_sections`: `[section_id...]`（AI生成部分の識別）
- `generation_history`: 最終生成日時・モデル・プロンプト概要

- `topic`: 主トピック
- `tags_big`: `[ ... ]`
- `tags_mid`: `[ ... ]`
- `tags_small`: `[ ... ]`
- `tags_micro`: `[ ... ]`
- `summary`: 3〜5行
- `why_now`: “今読む価値”
- `source_date`: `YYYY-MM-DD`
- `release_date`: `YYYY-MM-DD`
- `file_created_at`: `YYYY-MM-DDThh:mm:ssZ`
- `file_modified_at`: `YYYY-MM-DDThh:mm:ssZ`
- `freshness`: `high | medium | low`
- `confidence`: `high | medium | low`
- `status`: `active | defunct_suspected | defunct_confirmed | archived`
- `related`: `[[...]]`
- `personal_data`: `none | suspected | confirmed`
- `personal_data_notes`
- `redaction_level`: `metadata_only | masked | allowed`
- `entity_ids`: `[ ... ]`
- `to_entity_ids`: `[ ... ]`
- `action_type`: `met | called | emailed | shipped | paid | promised | other`
- `action_date`: `YYYY-MM-DD`
- `action_summary`: 1〜2行（何をしたか）
- `user_intents`: `[ ... ]`（やりたい/やった/未達成）
- `user_interests`: `[ ... ]`（面白そう/気になる/深掘り候補）
- `insight_summary`: 1〜3行（分かったこと）
- `personality_tags`: `[ ... ]`（思考傾向）

## Architecture Decision（技術方針確定）
### 採用: **B案（プラグイン＋ローカルサービス構成）**
理由:
- PDF処理・埋め込み生成・個人データ解析は重い処理のため、Obsidian本体をブロックしない設計が必要
- MCPサーバー機能を持つ場合、常駐サービスの方が自然
- 将来のGoogle Drive同期や外部連携拡張に強い

### 全体構造（役割分担）
- `plugin/` 🧩: Obsidian内UIとVault操作
  - UI表示（Inbox/Review/Search）
  - Vault変更検知
  - ユーザー承認フロー管理
- `service/` 🏭: ローカル常駐バックエンド
  - PDF→MD変換
  - 埋め込み生成（意味検索用）
  - 個人データ判定（ハイブリッド）
  - Private Entity DB管理
  - MCPサーバー機能提供
  - Google Drive同期処理
- `shared/` 🔗: 共通スキーマ・型定義

### 実行モデル
- serviceは常駐（バックグラウンド）
- pluginはUIフロント
- アイドル時自動実行はservice側で制御

## MVP（最小で勝つ切り方）
「簡略化するのもアプリの仕事」を守るため、**まずは“チャット地獄の解消（A）”で勝つ**。

### A-MVP（チャット履歴の地獄解消）
**目的:** 「タイトルだけで何の話か分かる」「話題が混ざらない」状態を最速で作る。

#### A-MVPの成功条件（Acceptance Criteria）
- 既存の`source_type=chat`ノートを対象に、
  - ① トピック分割
  - ② タイトル最適化（思考ログ型テンプレ）
  - ③ 表紙（summary/topic）
  を作れる。
- 上書き（in_place）の場合でも、
  - 変更前の復元ができる（ロールバック）
  - 何をどう変えたかが追跡できる（差分ログ）
- 初回実行前に「推定時間・推定コスト・推定分割数」を表示し、
  ユーザーが「速い/丁寧/dry-run」を選べる。

#### 入力・対象
- 対象ノート条件（MVP）:
  - frontmatter: `source_type: chat`
  - もしくは folder規約: `Log/Chat/` 配下（将来：Projectごとに指定）
- Chat形式（MVPで扱うもの）:
  1) **Markdown内にroleが明示**（例: `User:` / `Assistant:`）
  2) **プレーンテキスト**（行頭の発話者ラベルで推定）
  3) JSONエクスポート（将来対応枠。MVPでは“貼り付け受け口”に回す）

#### 出力
- `chat_recompose_mode` に応じて
  - `in_place`: 元ノートを上書き（分割後の複数ノートへ展開する場合は「元ノートはIndex化」）
  - `new_files`: 新規ノート群を生成
  - `dry_run`: 何も書き換えず提案のみ

> 注: `in_place`で複数ノートに分割する場合、元ノートは「目次ノート（Index）」に変換し、
> 各スレッドへリンクを置く（元の巨大本文は残さない）。

#### 生成物（ノート構造）
- 各スレッドノート:
  - H1: `title_current`
  - 先頭に表紙ブロック（AI生成）
  - 本文: role付き会話ログ
- 目次ノート（in_placeで複数展開時）:
  - 旧ノートのパスを維持
  - 生成されたスレッドへのリンク一覧
  - 実行メタ（job_id, batch_id, 生成日時）

#### 機能（最小）
1) 事前スキャン（推定）
2) トピック分割（粗め/丁寧の選択）
3) タイトル最適化（思考ログ型テンプレ）
4) 表紙（summary/topicのみ）
5) `/_alchemy/logs/` にロールバック情報を保存

#### A-MVPで封印するもの（明示）
- タグ4階層の完全運用
- 意味検索の埋め込み再構築
- Graph拡張（Intent/Interest/Insight/Personality）
- フォルダ大移動

> まず形を作り、2周3周で精度を育てる。

### 「設計図を大切にする」ための枠組み（最初から入れる）
A-MVPで削っても、後から拡張できるように**最初から“差し替え口”だけ作る**。

- Feature Flags（機能スイッチ）
  - `features.chat_recompose=true`
  - `features.semantic_search=false`（後でON）
  - `features.graph_layers=false`（後でON）
  - `features.xai_explore=false`（後でON）
  - `features.local_llm=false`（将来ON）
- Provider Interface（AI差し替え口）
  - `LLMProvider.generate()` / `EmbeddingProvider.embed()` の抽象を shared に定義
  - 主力LLM/探索LLM/将来localを同じ形で扱える
- Pipeline Stage Registry（処理の差し替え口）
  - `stage_id` ごとにジョブを登録できる仕組み
  - A-MVPでは `chat_recompose` だけ動かし、後で `embed/tag/relate` を追加
- ログと再実行の仕組み（Job System）をMVPから入れる
  - これがあると「後から強化」しても同じ処理を二度させない

### フェーズ計画（エンジニア型ロードマップ）
- Phase 1: A-MVP（チャット分割＋タイトル＋表紙＋ロールバック）
- Phase 2: 意味検索（チャンク化＋埋め込み＋検索UI）
- Phase 3: タグ階層＋タグ辞書管理
- Phase 4: Graphレイヤー（Intent/Interest/Insight/Personality）
- Phase 5: xAI探索（推奨・任意）と「今なら可能」お知らせ
- Phase 6: ローカルLLM（個人情報系のローカル優先）

## Next Step（次に仕様化するもの）
**実行フロー（Pipeline）設計**
- 入力（MD/PDF/Office/iWork/Web）
- 正規化（MD化、原本+PDFの統合：`source_group_id` / `content_hash`）
- 個人データ判定（ハイブリッド）→ Entity DB → `entity_ids`
- タグ付け（辞書統合）
- チャンク化→埋め込み→意味検索DB
- 表紙生成（why_now/freshness/related/date）
- 提案バッチ生成（理由でグルーピング）
- 承認→適用（常に許可）
- アイドル/深夜スケジューラ

## Execution Pipeline（実行フロー設計）

### ゴール（体験としての約束）
- 夜に放り込んだ情報が、朝には「読める・探せる・関連づく」状態になっている
- **同じ作業を二度させない**（差分・再開・履歴）
- 書き換え/削除は **必ず許可**

---

## Pipeline Overview（全体像）
入力→正規化→安全化→価値付け→検索化→提案化→承認→適用 の順。

### 入力ソース
- Vault: `md/txt/chat`
- ファイル: `pdf/docx/xlsx/pptx/pages/numbers/key` とそれらのPDF
- Web: Chrome拡張（選択範囲/DOM抽出/手動貼り付け）

---

## Stage 0: Trigger & Queue（起動とキュー）
### トリガー
- Vault監視イベント（作成/更新/削除）
- Web Clipper受信
- スケジュール（深夜）
- アイドル検知
- 手動実行

### キュー優先順位（MVP）
1. **新規投入**（inboxに入ったもの）
2. **検索の壊れ**（インデックス未生成/失敗）
3. **鮮度切れ**（再確認候補）
4. **消滅疑いチェック**（place/service/org）
5. **大規模整理（統合/分割）**

---

## Stage 1: Ingest（取り込み）
### 目的
- 何が入ってきたかを記録し、まず「Inbox」に安全に置く

### 出力
- `/_alchemy/inbox/<id>.md`
- 付与する最低メタ:
  - `source_type`, `source_ref`, `file_created_at`, `file_modified_at`
  - `source_date`（Webは取得日）
  - `project_id`（ユーザー選択 or 推定）

---

## Stage 2: Normalize（正規化 / MD化）
### 目的
- どの入力でも、同じ読みやすい形（MD）に揃える

### ルール（MVP）
- 可能なら原本から抽出し、PDF版がある場合は統合
- `content_hash` を生成し、以降の差分判定の基準にする
- 統合単位（同一資料）を `source_group_id` でまとめる

### 追加: Chat履歴の正規化（最重要）
AIとの会話履歴が「何の話か分からない」「1ファイルが長すぎる」「話題が混ざる」問題を解消する。

#### 入力
- Chatログ（テキスト/JSON/エクスポート等）

#### 正規化ポリシー
- 1会話=1ノート、ではなく **1トピック=1ノート** を基本とする（後述の分割）
- 会話本文は `author_type=hybrid` とし、
  - 人間発言: `role=user`
  - AI発言: `role=assistant`
  を保持する
- AIが生成した「表紙/タイトル/タグ/関連」は `ai_generated_sections` として明示する

---

## Chat Log Recomposition（チャット履歴の再構成アルゴリズム）

### 用語（初心者向け）
- **トピック分割**: 1つの長い会話を「話題ごとの小分けノート」に切ること
- **スレッド**: 小分けにした1つぶんの話題の塊
- **目次ノート（Index）**: 分割後のスレッド一覧をまとめたリンク集（元ファイルの置き換え先）
- **dry-run**: 変えずに「こう変える予定」を見せるだけの試運転

### ゴール
- タイトルだけで「何の話か」分かる
- 1ノートに話題が混ざらない
- 後から検索・再利用しやすい
- 日記や手紙のような“感情資産”は壊さない

### 実行モード（Chat限定）
- `chat_recompose_mode`: 
  - `in_place`（上書き）
  - `new_files`（新規生成）
  - `dry_run`（結果だけ出して適用しない）

### 事前スキャン（chat_estimation_job: 必須）
初回実行前に必ず「軽量予測ジョブ」を走らせ、ユーザーに選択させる。

#### 推定に使う情報（LLMなしで可能な範囲）
- 対象ファイル数
- 文字数合計
- 発話数推定（roleラベルや改行から推定）
- ルール境界の候補数（転換語/時間ギャップ）

#### 推定結果として表示するもの
- 推定分割数（例: 1→7スレッド）
- 推定処理時間（粗い推定でOK。例: 3〜8分）
- 推定コスト（表示通貨）
- リスク内訳（上書き/移動/削除の有無）

#### 選択UI
- 「速い（粗め）」
- 「丁寧（遅い）」
- 「まずdry-run」

### 入力の正規化（MVP）
会話を、内部で必ずこの形に揃える。

#### Internal Message Schema
- `msg_id`
- `timestamp`（無ければnull）
- `role`: `user | assistant | unknown`
- `text`

#### role判定（MVP）
- 明示ラベルがあればそれを採用
- 無い場合は `unknown`（無理に推定しない）

### ステップ（MVP）
1. **発言単位に分解**
2. **話題境界を検出（セグメンテーション）**
3. **スレッド生成**
4. **表紙生成（summary/topicのみ）**
5. **タイトル生成（思考ログ型テンプレ優先）**
6. **適用（in_place/new_files/dry_run）**

---

### 2. 話題境界検出（具体ルール: MVP）
境界は「スコア」で決める。

#### 境界候補
- 長い時間ギャップ（例: 6時間以上）
- 明示的な話題転換（「次は〜」「別件」「ところで」など）
- 意味距離が大きい（丁寧モードのみ）
- タグ候補が大きく変わる（丁寧モードのみ・強いシグナル）

#### 境界スコア（MVP具体値）
- 時間ギャップ（6h以上）: +0.4
- 話題転換語: +0.3
- 意味距離大（丁寧のみ）: +0.4
- タグ候補の大変化（丁寧のみ）: +0.6
- 明示終了宣言: +0.6

合計 ≥0.7 → 分割確定
0.4〜0.7 → 提案（UIで境界候補として表示）
<0.4 → 継続

#### 「速い（粗め）」の中身
- LLM/埋め込みを使わず、
  - 時間ギャップ
  - 転換語
  - 明示終了宣言
  だけで切る

#### 「丁寧（遅い）」の中身
- 上に加えて
  - 意味距離
  - タグ候補変化
  を使う（コスト増・精度増）

---

### 4. 表紙生成（A-MVP仕様）
表紙は「本文を壊さずに、読む価値を上げる」ための先頭ブロック。

#### 表紙フォーマット（固定）
- `## 🧠 Summary`（3〜5行）
- `## 🏷 Topic`（1行）

> A-MVPではwhy_now/related/tagsは生成しない（Phase 2以降）。

---

### 5. タイトル生成（A-MVP仕様）
#### 会話（chat）向けテンプレ
優先順：
1) 「◯◯の件で◯◯だと思って◯◯やってみた」
2) 「◯◯について議論したら◯◯だと分かった」
3) 「◯◯を整理しようとして◯◯に気づいた」

#### 知識ノート（reference）扱いになった場合
- 「◯◯について」または概念名

#### タイトルの安全
- `title_locked=true` は絶対変更しない
- journal/letter/email はタイトル変更もMedium扱い（提案→承認）

---

### 6. 適用とロールバック（A-MVP仕様）
#### ロールバックの考え方
「ファイルを増やさずに戻せる」を優先する。

#### ログ保存（必須）
- 変更前ハッシュ
- 変更後ハッシュ
- 生成したスレッド一覧（新パス/タイトル）
- 目次ノート内容（in_place時）

#### ロールバックの単位
- 1実行（job_id）単位で戻せる

#### ロールバック時の挙動
- in_place:
  - 目次ノートを元本文へ戻す
  - 分割で生成したスレッドノートを削除（またはArchiveへ移動：設定）
- new_files:
  - 生成したノート群を一括削除（またはArchiveへ移動：設定）

> 重要: ロールバックは「ユーザーが脳みそ使わず戻せる」ボタンとしてUIに出す。

### ゴール
- タイトルだけで「何の話か」分かる
- 1ノートに話題が混ざらない
- 後から検索・再利用しやすい
- 日記や手紙のような“感情資産”は壊さない

### 基本方針（あなたの要望を採用）
- **上書き（in-place）をデフォルト選択肢として許可**する
  - ただし安全のため、適用前に「プレビュー」と「ロールバック情報」を必ず残す
- 初回は「1回で完璧」を狙わず、**2周3周で育てる前提**にする

### 実行モード（Chat限定）
- `chat_recompose_mode`: 
  - `in_place`（上書き）
  - `new_files`（新規生成）
  - `dry_run`（結果だけ出して適用しない）

### 事前スキャン（推定時間を出してから選ばせる）
初回実行前に必ず「軽量予測ジョブ」を走らせ、ユーザーに選択させる。

- `chat_estimation_job` 出力:
  - 対象ファイル数
  - 推定分割数（例: 1→7スレッド）
  - 推定処理時間（低精度でもOK）
  - 推定コスト（表示通貨）
  - リスク内訳（上書き/移動/削除の有無）

選択UI（例）:
- 「速い（粗め）」
- 「丁寧（遅い）」
- 「まずdry-run」

### ステップ（MVP）
1. **発言単位に分解**
   - メッセージごとに `timestamp/role/text` を持つ
2. **話題境界を検出（セグメンテーション）**
   境界候補:
   - 長い時間ギャップ（例: 6時間以上）
   - 明示的な話題転換（「次は〜」「別件」「ところで」など）
   - 埋め込み距離が大きい（前後で意味が離れた）
   - タグ候補が大きく変わる（※強い境界シグナル）
3. **トピックごとに“スレッド”を作る**
   - `thread_id` を発行
   - 1スレッドが長すぎる場合はさらに分割
   - 境界スコア方式を採用

#### 境界スコア（MVP具体値）
- 時間ギャップ（6h以上）: +0.4
- 話題転換語: +0.3
- 意味距離大: +0.4
- **タグ候補の大変化: +0.6（ほぼ別話題扱い）**
- 明示終了宣言: +0.6

合計 ≥0.7 → 分割確定
0.4〜0.7 → 提案
<0.4 → 継続

4. **スレッドごとに表紙を生成**
   - `summary/topic` を生成（最初はこれだけでOK）
5. **タイトル生成（AIリネーム）**
   - 思考ログ型テンプレを優先（例: 「◯◯の件で…やってみた」）
6. **適用（in_place/new_files）**
   - `in_place` の場合:
     - 変更前本文のハッシュと差分を `/_alchemy/logs/` に記録
     - いつでもロールバックできるようにする

### 出力（スレッドノート）
- `note_kind`: `note`（通常） または `journal`（日記扱い）
- `author_type`: `hybrid`
- 先頭に表紙ブロック（AI生成）
- 本文は会話ログ（role付き）

> 重要: 「最初は形が見える」を優先し、2周目以降で精度を上げる。

## Chat Foldering Template（チャット履歴のフォルダテンプレ）
初期に3種類提示し、AIインタビューで選ばせる。

1. **Date → Project → Topic（時系列重視）**
   - 例: `Log/Chat/2026/02/ProjectX/Obsidian整理/`
2. **Project → Topic → Date（仕事/棚重視）**
   - 例: `ProjectX/Log/Chat/Obsidian整理/2026-02/`
3. **Topic → Date（テーマ重視）**
   - 例: `Topics/Obsidian整理/Chat/2026-02/`

> 変更したくなっても folder template migration で差分移動できる。

## Stage 3: Date Resolution（情報日付の確定）
### 目的
- 「いつの情報か」を必ず残す

### 優先順位
1. `source_date`（明示日付）
2. `release_date`（本/出版）
3. `file_modified_at` → `file_created_at`

### 出力
- frontmatter更新（`source_date/release_date/file_*`）
- `freshness` 予備計算の材料

---

## Stage 4: Privacy & Entity Detect（個人情報の安全化）
### 目的
- 外部AIに渡せる形にする（メタ化/マスキング）

### ハイブリッド手順
1. ルール検出（メール/電話/住所/番号等）
2. AI判定（文脈で個人性を推定）
3. エンティティ登録（Private Entity DB）

### 出力
- `personal_data`（none/suspected/confirmed）
- `entity_ids`
- `redaction_level`（metadata_only/masked/allowed）

> 原文を破壊しない。必要なら「外部送信用テキスト」は別生成（masked版）。

---

## Stage 5: Cover（表紙生成：読む価値の可視化）
### 目的
- 人間が見て「今読む価値」が分かる状態にする
- 日記/手紙/メールのような“壊せない本文”でも、検索性を上げる

### 感情リスクの高いノートの扱い（journal/letter/email）
- 本文は変更しない（統合/分割/編集はHigh扱い）
- 代わりに「表紙」を先頭に追加して検索性を上げる
  - 要約（summary）
  - 宛先/関係者（to_entity_ids）
  - 行動ログ（action_type/action_date/action_summary）

### 生成物
- `summary`（3〜5行）
- `why_now`（読むべき理由）
- `topic`（主題）
- `confidence`（抽出の信頼度）
- `related`（暫定：同Project内で近いもの）

> 表紙生成は低リスクなので、Co-op/AIモードでは自動適用対象にできる。

---

## Stage 6: Tagging（タグ付け）
### 目的
- タグ崩壊を防ぎつつ、検索と関連付けの骨格を作る

### ルール
- まずフラットタグで提案→安定したら4階層に昇格
- 同義語は辞書へ正規化

### 出力
- `tags_big/mid/small/micro`
- タグ辞書の更新提案（統合/廃止/新規）

---

## Stage 7: Chunk & Embed（チャンク化と埋め込み）
### 目的
- 意味検索を成立させる

### ルール
- 見出し優先でチャンク化
- 長すぎる場合は一定長で分割
- `hash` を持ち、変化したチャンクだけ再埋め込み

### 出力
- semantic.sqlite の `chunks/embeddings/note_meta_cache`

---

## Stage 8: Relationship Graph（関連付け）
### 目的
- 「関連がよく分かる」状態を作る
- ユーザーの“思考の地図”を立体的に可視化する

### 抽出レイヤー（ノートから生成する知的メタ）
- `user_intents`: やりたかったこと / 試したこと / 未達成目標
- `user_interests`: 興味の対象（「面白そう」「気になる」「いつか深掘りしたい」）
- `insight_summary`: 分かったこと（1〜3行）
- `personality_tags`: 思考傾向・価値観（例: 仮説思考 / 仕組み化志向 / 慎重 / 実験型）

> これらは原文を壊さず、表紙メタとして保持する。

### 生成ロジック（MVP）
- related候補 = 埋め込み近傍 + タグ共起 + 同一`source_group_id`
- intent抽出 = 動詞パターン（〜したい/〜する/試す/検討/実装/比較） + AI要約
- interest抽出 = 興味語パターン（面白そう/気になる/興味/ワクワク/深掘り/調べたい） + AI要約
  - 目的: “未着手だけど価値がある種”を拾う
- insight抽出 = 「分かった/気づいた/つまり」等の転換点検出 + 要約
- personality推定 = 長期傾向（複数ノート横断）で頻出パターンを集計
  - 単発推定はconfidence低→表示は控えめ

### Graphノード設計（Obsidianグラフ最大活用）
ノード種別と色分け：
- ノート：白
- エンティティ（Person/Org）：青
- Intent：オレンジ
- Interest（興味）：黄
- Insight：緑
- Project：紫
- Personalityタグ：薄赤

#### 実装方針
- ノートfrontmatterに種別フラグを持たせ、
  - Intent/Insightは“疑似ノート”（`/_alchemy/curated/derived/`）として生成可
- グラフフィルタ用タグを自動付与
  - 例: `#_alchemy/type/note`, `#_alchemy/type/intent` など

### UI連動
- グラフ横に「レイヤーON/OFF」トグル
  - ノートのみ / Intentのみ / Interestのみ / Insightのみ / 全部
- ノードクリックで右ペインに要約表示
- 「今なら可能」提案はIntent/Interestから派生してバッジ表示
  - 例: 興味=「ローカルLLM」→ 今なら使える選択肢を提案

### 出力
- `related` 更新（提案または自動）
- `user_intents[]`, `user_interests[]`, `insight_summary`, `personality_tags[]` をfrontmatterへ反映（Low〜Medium Risk）

## Stage 9: Proposals & Batches（提案とバッチ化）
### 目的
- 脳みそを使わずに整理できる形にする

---

## 🔎 リスク分類の土台提案（Base Risk Model）
まずは“変更の影響範囲”と“可逆性（元に戻せるか）”で3段階に分類する。

### 追加: 感情リスク（Emotional Risk）
論理的には安全でも、心の資産を壊すと致命傷になる。
- 日記、思い出、家族/友人とのやり取り、手紙、メールなどは **感情リスクが高い**
- 方針: **本文は絶対に壊さない**（編集・統合・分割・削除は常に最終承認、かつ個別承認）
- ただし、検索性を上げるために **表紙（要約/行動ログ/宛先など）を“先頭に足す”のは許可**

### 感情リスクの判定方法（MVP）
- ノートの `note_kind`（後述）で判定
- またはユーザーがProject/フォルダ単位で「思い出保護」を指定
- AIが推定する場合でも、
  - `note_kind=journal|letter` は常にHigh扱い（誤検知で危険にしない）

### 判定軸
1. **原文を直接変更するか？**
2. **リンク構造に影響するか？**
3. **自動で元に戻せるか？（スナップショット復元可能か）**
4. **人間の意図を誤解する可能性が高いか？**

---

## 🟢 Low Risk（低リスク）
特徴:
- 原文を破壊しない
- 可逆（再生成可能）
- 検索や表示にのみ影響

例:
- 表紙（summary/why_now）の再生成
- タグの追加（削除なし）
- インデックス再生成
- related更新
- freshness再計算

▶ Co-op / AIモードでは自動適用可

---

## 🟡 Medium Risk（中リスク）
特徴:
- 原文は残るが、構造や分類に影響
- 誤ると後から混乱が生じる
- バッチ単位でまとめて承認が妥当

例:
- ノート統合（merge）※元ノートはアーカイブ保持
- ノート分割（split）
- タグ削除・置換
- archived化
- defunct_confirmed処理
- **フォルダ移動/リネーム**（path変更）

▶ 原則「バッチ単位承認」

---

## 🔴 High Risk（高リスク）
特徴:
- 原文を直接変更または削除
- 人間の意図とズレると致命的
- **感情リスクが高いノート**（日記/手紙/メール等）に影響する

例:
- 本文書き換え
- ノート完全削除
- entity_idの自動上書き
- 日記/手紙/メールの本文に対する分割・統合・編集

▶ 必ず“個別承認”＋差分表示必須＋差分表示必須

---

## 🧠 自動リスク判定ロジック（MVP案）
各提案アイテムに対して以下をスコア化する。

- `touch_original_text`（0/1）
- `affects_links`（0/1）
- `reversible`（0/1）
- `confidence_score`（0.0–1.0）

簡易判定:
- touch_original_text=1 → High
- affects_links=1 & reversible=1 → Medium
- それ以外 → Low

confidenceが低い場合は1段階リスクを引き上げる。

---

## 📦 バッチ提示順（脳負荷最小化）
1. Low Risk（即処理可能）
2. Medium Risk（まとめて確認）
3. High Risk（集中レビュー）

→ UIでは「今日5分で終わる提案」から表示する。

---

## 🎛 Automation Profileとの接続
Automation Profileは以下を持つ:
- `auto_apply_low`（true/false）
- `auto_apply_medium`（true/false）
- `never_auto_high`（常にtrue）
- `confidence_threshold`
- `title_style`（タイトルの文体: concise / academic / business / casual / my_voice）
- `foldering_policy`（フォルダ整理: suggest_only / batch_approve / auto_move_safe）

ユーザーのチューニング結果により、
- Mediumを自動にするか
- confidence閾値をどこに置くか
が変わる。

---

## Stage 10: Approval & Apply（承認と適用）
### ポリシー
- **書き換えは必ず承認**（全モード共通）
- 削除は「即時削除」ではなく、
  - ①無効化/アーカイブ
  - ②バッチでまとめて承認
  - ③必要なら削除

### 適用の単位
- 常に「バッチ単位」か「アイテム単位」で承認
- 差分プレビューを必須にする

---

## Job System（作業履歴と再開）
### ねらい（なぜ“ガチ設計”にするか）
- 夜間/自動処理は「いつ・何を・どこまでやったか」が残らないと事故る
- 失敗しても途中から再開できる
- 同じ処理を二度させない（ハッシュでスキップ）
- GitHub公開で他人が参加しても迷わない

---

## Logs Schema（ログの“引き出しルール”）
保存場所: `/_alchemy/logs/`

### ログを2種類に分ける（MVPから）
1) **機械用ログ（Machine Log）**: 再開/ロールバック/デバッグのための正確な記録
2) **人間用ログ（Human Log）**: 「今日なにが起きたか」を読むための要約

> 方針: 人間は“概要”だけ見ればいい。機械は“完全”を持つ。

### 1) 機械用ログ（Machine Log）
#### ファイル構造（MVP）
- `/_alchemy/logs/jobs/<job_id>.json` : 1ジョブ=1ファイル
- `/_alchemy/logs/runs/<run_id>.json` : 1実行=複数ジョブの束（夜間バッチなど）
- `/_alchemy/logs/rollback/<run_id>.json` : ロールバックに必要な最小情報

#### 1ジョブログの最小スキーマ
- `job_id`
- `run_id`
- `job_type`（ingest / normalize / chat_recompose / date / entity_detect / cover / tag / embed / relate / batch_generate / apply）
- `target`（note_path/chunk_id/batch_id）
- `status`（queued / running / done / failed / skipped）
- `started_at` / `finished_at`
- `hash_snapshot`（content_hash or chunk_hash）
- `provider_used`（openai / xai / local / none）
- `cost_estimate_usd` / `cost_actual_usd`（分かる範囲で）
- `retry_count`
- `error_code` / `error_message`

#### 1実行ログ（run）の最小スキーマ
- `run_id`
- `trigger`（manual / idle / schedule / vault_event / webclip）
- `project_id`（無ければnull）
- `created_at`
- `job_ids[]`
- `summary_counts`（done/failed/skipped の数）

### 2) 人間用ログ（Human Log）
#### 目的
- ユーザーが「脳みそ使わず」状況把握できる

#### ファイル構造（MVP）
- `/_alchemy/logs/daily/YYYY-MM-DD.md`

#### 内容例（構造）
- 今日処理した件数（取り込み/チャット分割/表紙生成など）
- 失敗の概要（原因のカテゴリだけ）
- 提案バッチ数（削除/統合/分割）
- コスト（今日/今月、表示通貨）

---

### A-MVP専用: ロールバックログ（必須）
`chat_recompose_mode=in_place` で分割を行う場合、**元ノートをIndex化する**ため、戻す情報を必ず残す。

#### `/_alchemy/logs/rollback/<run_id>.json` に残すもの
- `run_id`
- `original_note_path`
- `before_hash`
- `after_hash`
- `before_content`（元本文：**A-MVPでは原則“全文”を保存**。圧縮可。サイズが大きい場合は別ファイル参照）
- `index_note_content`（置き換え後の目次ノート本文）
- `created_thread_notes[]`（path/title/hash）
- `rollback_policy`（delete_threads / move_to_archive）

> 重要: “ファイルを増やさない”の代わりに、ログで必ず戻せるようにする。

---

### ログ保持ポリシー（MVP）
- Machine Log: 直近N日（例: 30日）+ 重要イベント（apply/rollback）は無期限
- Human Log: 無期限（小さい）
- Rollback（before_content）:
  - **A-MVPでは安全優先で全文保持**
  - 保存形式は圧縮または外部ファイル参照
  - 容量が増えすぎる場合は「古いrollbackの圧縮/退避」を提案（削除は承認制）
- ログが増えすぎたら「ログ整理バッチ」を提案（削除は承認制）

---

### jobの役割
- 何をいつやったか
- どこで失敗したか
- 何が変わったから再実行したか

### jobの最小スキーマ
- `job_id`
- `job_type`（ingest / normalize / date / entity_detect / cover / tag / embed / relate / batch_generate / apply）
- `target`（note_path/chunk_id/batch_id）
- `status`（queued / running / done / failed / skipped）
- `started_at` / `finished_at`
- `hash_snapshot`（content_hash or chunk_hash）
- `retry_count`
- `error_code` / `error_message`

### 再実行防止ルール
- `hash_snapshot` が同じなら **skipped**
- 失敗はリトライ上限（例: 3）
- 外部要因（ネット不通/レート制限）は「延期」扱いにして次の夜へ

---

## Failure Recovery（失敗時の復旧）
- どのStageでも「入力は残す」
- 失敗したStageから再開できる
- 変換失敗（PDF/Office/iWork）は `low_quality_extract` としてバッチ化し、
  - 代替手段（PDF版の利用/手動貼り付け）を提示する

---

## Idle/Night Scheduler（こっそり実行の具体）
### 静音モード
- CPU上限・同時ジョブ数・ネットワーク上限を設定
- バッテリー駆動中は停止（デフォルト）

### 深夜のおすすめ順（MVP）
1. Ingest/Normalize（入ったものをまず形にする）
2. Date/Privacy/Cover（人が読める価値を先に付ける）
3. Embed（検索を育てる）
4. Proposals（削除/統合/分割の提案をまとめる）

## Work Planning（作業量が多い時のプランニング）
初期導入時は大量のファイルがある可能性が高いため、AIが“作業計画”を提案する。

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

ユーザーは
- 「全部やる」
- 「段階的にやる」
- 「今は検索だけ」
を選択可能。

> 目的: 初期の圧倒的作業量を“恐怖”ではなく“ロードマップ”に変える。

---

## README（ユーザー向け説明書）案

### こんなお困りごと、ありませんか？
- 📚 Obsidianに大量のノートやPDFがあるのに、探せない
- 🧠 AIに渡しても「文脈が足りない」と言われる
- 🏷️ タグが増えすぎて崩壊している
- 🗂️ 同じような資料が何個もある気がする
- ⏳ 情報が古いのか最新なのか分からない
- 🔐 個人情報が混ざっていて外部AIに渡すのが怖い

Vault Alchemistは、それらを**夜中に静かに整理し、朝には“使える資産”に変える**ツールです。

---

### Vault Alchemistとは？
あなたのObsidian Vaultを、AIと共同で整理し、再利用可能な“知識資産”に変えるツールです。

単なる整理アプリではありません。
これは、**あなたの知識をAIが理解できる形に再構築する装置**です。

---

### 1日の体験シナリオ

#### 🌙 夜
- Web記事をクリップする
- PDF資料をVaultに放り込む
- 何もせずPCを閉じる

#### 🌌 深夜（自動処理）
- 文書をMarkdownへ正規化
- 個人情報を検出して安全に分離
- タグを統合・最適化
- 意味検索インデックスを更新
- 「読む価値」が分かる表紙を生成
- 重複や古い情報をバッチ化

#### ☀ 朝
Home画面には：
- 「昨日追加された知識」
- 「読む価値が高い3件」
- 「削除候補（理由別にまとまった一覧）」

あなたは、ワンクリックで承認するだけ。

---

### できること
- PDF/Office/Webを取り込みMarkdown化
- 読む価値が一目でわかる“表紙”生成
- Project単位の意味検索
- 重複や古い情報の整理提案
- 個人情報を安全に分離管理
- 外部AI（MCP経由）からも安全に利用可能

---

### 基本の使い方（3ステップ）
1. Vaultを接続する
2. Project（棚）を作る（またはAI提案を承認）
3. Inboxと提案バッチを確認する

それだけで、あなたのVaultは“整理済み資産”になります。

---

### 安全設計
- AIは勝手に書き換えません（必ず承認が必要）
- 秘密情報はVaultに保存しません
- 個人情報は専用DBで安全管理
- 削除はまとめて確認できます

---

### おすすめの運用
- 毎日5分、Inboxを見る
- 週1回、削除バッチを処理する
- 月1回、タグ整理をする

---

## Folder Template Versioning（フォルダ構造の変更と再編）

### 問題意識
フォルダテンプレート（例: 日付→トピック→Project）を後から変更したくなる可能性が高い。
そのとき「全部手で移動」は地獄。

### 方針
フォルダ構造は“固定ルール”ではなく、**バージョン付きテンプレート**として扱う。

### 仕組み
- 各Projectに以下を持たせる:
  - `folder_template_id`
  - `folder_template_version`
- テンプレート定義は `/_alchemy/projects/folder_templates.json` に保存
  - `template_id`
  - `version`
  - `rules[]`（note_kind / tags_big / 日付などからパスを生成）
  - `created_at`

### 再編（Migration）プロセス
テンプレートを変更した場合:
1. 現在のVaultをスキャン
2. 新テンプレートで「理想パス」を再計算
3. 差分のみを**フォルダ移動バッチ（Medium Risk）**として生成
4. 人間がまとめて承認

### 安全設計
- `path_locked=true` のノートは移動対象外
- スナップショット（移動前パス一覧）を保存
- いつでもロールバック可能

### コスト感（MVP想定）
- 実処理は「パス再計算＋move API呼び出し」なので技術的難易度は中程度
- ただし大量ファイル時はリンク更新コストがあるため、夜間実行を推奨

> 設計思想: フォルダは“絶対構造”ではなく、“現在の整理ポリシーの表現”。


## Monetization Philosophy（収益設計の思想）

### 基本方針
- ローカル利用（自己APIキー利用）は基本無料
- 機能制限で縛らない（整理の自由は守る）
- コストは「API消費量」によって発生する
- お金がない人でも使える逃げ道を用意する

---

## Ad Credit System（広告でAPIを貯める仕組み）

### 🎯 目的
- クレジットカード課金が難しい層でも使える
- 開発側がAPIコストを一方的に負担しない
- ユーザーが“選択”できる形にする（強制しない）

### 💡 コンセプト
> 広告を見ると「APIクレジット」が貯まる。
> クレジットはAI処理にのみ使える。

### 仕組み（MVP想定）
- 広告視聴 → API Credit付与（例: 1回 = $0.05相当）
- Credit残高をUIで明示
- Creditは以下に使用可能:
  - チャット分割（丁寧モード）
  - 埋め込み生成
  - 探索LLM（xAIなど）

### 安全原則（絶対条件）
- バックグラウンドで広告を勝手に流さない
- ユーザーが明示的に「広告を見る」を押す方式のみ
- 音なし自動再生の裏取りはしない
- CPU利用型マイニング等は採用しない

> 理由: 信頼を壊す設計は長期的に損失になるため。

---

## Credit Model（クレジット設計）

### クレジット種別
- `paid_credit`（課金購入）
- `ad_credit`（広告視聴）
- `trial_credit`（初期配布）

### 優先消費順
1. trial_credit
2. ad_credit
3. paid_credit

### 表示UI
- 今日の消費
- 今月の消費
- クレジット残高
- 「広告を見てクレジットを増やす」ボタン

---

## フェアネス設計（思想との整合）
- お金がある人 → 時間を使わない（課金）
- お金がない人 → 少し時間を使う（広告）
- 自己ホスト勢 → 自分のAPIで完全自由

> 目的は“搾取”ではなく、持続可能性と選択肢の提供。

---

## Change Log
- 2026-02-24: 初版。Obsidian資産をAI再利用しやすくする「整理整頓＋タグ＋意味検索」方向で合意。

