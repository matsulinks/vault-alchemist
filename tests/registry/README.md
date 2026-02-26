# ATP テスト報告レジストリ

## 使い方

| 役割 | 操作 |
|---|---|
| ATP（テスト担当） | テスト失敗時に `latest_report.md` を作成して報告 |
| 開発AI（修正担当） | 修正完了後に `latest_report.md` を**削除** |

`latest_report.md` が **存在する** = 未修正の失敗がある
`latest_report.md` が **存在しない** = 全テスト通過、次のサイクルへ

## エンドポイント一覧（APIテスト用）

```
GET  http://127.0.0.1:3000/health
POST http://127.0.0.1:3000/estimate   (x-vault-path ヘッダー必須)
POST http://127.0.0.1:3000/run        (x-vault-path, x-openai-key ヘッダー必須)
POST http://127.0.0.1:3000/rollback   (x-vault-path ヘッダー必須)
GET  http://127.0.0.1:3000/jobs       (x-vault-path ヘッダー必須)
POST http://127.0.0.1:3000/embed      (x-vault-path ヘッダー必須)
GET  http://127.0.0.1:3000/search     (x-vault-path ヘッダー必須)
```

## CLIテストの実行コマンド

```bash
npm run test -w service       # 53項目を一発実行
npm run test:coverage -w service  # カバレッジ付き
```
