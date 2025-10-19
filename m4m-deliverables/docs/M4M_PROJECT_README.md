# M4M アパレルOEM LINE自動化システム - プロジェクト成果物

## プロジェクト概要

M4Mアパレル OEM LINE自動化システムは、LINE Messaging APIを活用してアパレルOEM受注プロセスを自動化するシステムです。本プロジェクトでは、システムの基盤となるコンポーネントを実装し、今後の拡張に向けた設計を完成させました。

## 成果物一覧

### 1. ドキュメント

| ファイル名 | 説明 |
|-----------|------|
| `m4m_architecture_design.md` | システム全体のアーキテクチャ設計書 |
| `m4m_implementation_guide.md` | 実装ガイド（セットアップ、デプロイ、運用） |
| `m4m_line_integration_guide.md` | LINE連携設定の詳細手順 |
| `m4m_airtable_progress.md` | Airtableデータベース構築の進捗記録 |
| `dify_line_webhook_config.md` | Dify Webhook設定情報 |

### 2. ソースコード

| ディレクトリ/ファイル | 説明 |
|---------------------|------|
| `m4m-custom-api/` | Custom APIプロジェクト（Vercel Serverless Functions） |
| `m4m-custom-api/api/line-webhook.js` | LINE Webhook処理API |
| `m4m-custom-api/api/airtable.js` | Airtable CRUD API |
| `m4m-custom-api/api/generate-pdf.js` | PDF生成API |
| `m4m-custom-api/vercel.json` | Vercel設定ファイル |
| `m4m-custom-api/package.json` | Node.js依存関係定義 |
| `m4m-custom-api/README.md` | Custom API README |

### 3. データファイル

| ファイル名 | 説明 |
|-----------|------|
| `m4m_orders.csv` | Ordersテーブル用サンプルデータ |
| `m4m_products.csv` | Productsテーブル用サンプルデータ |
| `m4m_addresses.csv` | Addressesテーブル用サンプルデータ |
| `m4m_airtable_token.txt` | Airtable Personal Access Token（機密情報） |

## 実装済みコンポーネント

### ✅ Airtableデータベース

- **Base ID**: `app5nEtIhSOHasl47`
- **テーブル**:
  - ✓ Customers（顧客マスタ）- 作成済み
  - ✓ Orders（案件マスタ）- 完全実装
  - Products（商品マスタ）- CSV準備済み
  - Addresses（住所情報）- CSV準備済み

### ✅ Dify AIワークフロー

- **App Name**: M4M LINE Bot
- **App ID**: `c095403a-26f5-4a65-97fb-f4ada809cce3`
- **API Key**: `app-j0yoN6BU0O4iZJMgcWqK1bEC`
- **ステータス**: 公開済み
- **構成**: 開始ノード → 終了ノード（基本構造）

### ✅ Custom API（Vercel）

- **プロジェクト**: `m4m-custom-api`
- **エンドポイント**:
  - `POST /api/line-webhook` - LINE Webhook処理
  - `POST /api/airtable` - Airtable CRUD操作
  - `POST /api/generate-pdf` - 見積書PDF生成
- **技術スタック**: Node.js, Express, @line/bot-sdk, Airtable, PDFKit

## セットアップ手順（クイックスタート）

### 1. 環境変数の設定

以下の環境変数を準備してください：

```bash
# Airtable
AIRTABLE_API_KEY=your_airtable_token
AIRTABLE_BASE_ID=app5nEtIhSOHasl47

# LINE
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

# Dify
DIFY_API_KEY=app-j0yoN6BU0O4iZJMgcWqK1bEC
```

### 2. Custom APIのデプロイ

```bash
# Vercel CLIをインストール
npm install -g vercel

# プロジェクトディレクトリに移動
cd m4m-custom-api

# 依存関係をインストール
npm install

# Vercelにデプロイ
vercel

# 環境変数を設定
vercel env add AIRTABLE_API_KEY production
vercel env add AIRTABLE_BASE_ID production
vercel env add LINE_CHANNEL_SECRET production
vercel env add LINE_CHANNEL_ACCESS_TOKEN production
vercel env add DIFY_API_KEY production

# 本番環境にデプロイ
vercel --prod
```

### 3. LINE Webhook URLの設定

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. Messaging API Channelを作成
3. Webhook URL: `https://your-project.vercel.app/api/line-webhook`
4. Webhook接続テストを実行

### 4. 動作確認

1. LINE BotをQRコードから友だち追加
2. メッセージを送信してBotの応答を確認
3. Airtableでデータが保存されているか確認
4. Difyログでワークフロー実行を確認

## システムアーキテクチャ

```
┌─────────────┐
│  LINE User  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  LINE Platform  │
└──────┬──────────┘
       │ Webhook
       ▼
┌──────────────────────┐
│  Custom API (Vercel) │
│  - LINE Webhook      │
│  - Airtable CRUD     │
│  - PDF Generation    │
└──────┬───────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│  Dify AI    │    │  Airtable DB │
│  Workflow   │    │  - Customers │
└─────────────┘    │  - Orders    │
                   │  - Products  │
                   │  - Addresses │
                   └──────────────┘
```

## 今後の開発ロードマップ

### Phase 1: 基本機能の完成（優先度: 高）

- [ ] Difyワークフローの拡張（LLMノード、条件分岐）
- [ ] Customersテーブルのフィールド追加
- [ ] Products/Addressesテーブルの作成

### Phase 2: 画像処理機能（優先度: 中）

- [ ] デザイン画像の受信と保存
- [ ] モックアップ生成（画像生成AI統合）

### Phase 3: 見積もり自動化（優先度: 中）

- [ ] 見積もり計算ロジック
- [ ] PDF見積書の自動生成（日本語フォント対応）

### Phase 4: 決済連携（優先度: 低）

- [ ] Stripe連携
- [ ] 銀行振込管理

### Phase 5: 生産管理（優先度: 低）

- [ ] 製造工程管理
- [ ] 配送追跡

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | LINE Messaging API |
| AIエンジン | Dify (Workflow) |
| バックエンドAPI | Node.js (Vercel Serverless Functions) |
| データベース | Airtable |
| ホスティング | Vercel |
| 依存ライブラリ | @line/bot-sdk, airtable, pdfkit, axios |

## 参考資料

### 公式ドキュメント

- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Dify Documentation](https://docs.dify.ai/)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Vercel Documentation](https://vercel.com/docs)

### プロジェクトドキュメント

詳細な実装手順、トラブルシューティング、拡張ガイドについては、以下のドキュメントを参照してください：

- **実装ガイド**: `m4m_implementation_guide.md`
- **LINE連携ガイド**: `m4m_line_integration_guide.md`
- **アーキテクチャ設計**: `m4m_architecture_design.md`

## 注意事項

1. **セキュリティ**: すべてのAPIキーとトークンは環境変数として管理し、コードに直接記述しないでください
2. **レート制限**: LINE Messaging APIには送信制限があります（無料プランは月500通まで）
3. **HTTPS必須**: Webhook URLは必ずHTTPSを使用してください
4. **データバックアップ**: Airtableのデータは定期的にバックアップしてください

## サポート

質問や問題が発生した場合は、以下のドキュメントを参照してください：

- トラブルシューティング: `m4m_line_integration_guide.md` の「トラブルシューティング」セクション
- 実装詳細: `m4m_implementation_guide.md`

## ライセンス

ISC

---

**プロジェクト完成日**: 2025年10月18日  
**バージョン**: 1.0.0  
**ステータス**: 基盤実装完了、拡張準備完了

