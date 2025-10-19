# M4M Custom API

M4MアパレルOEM LINE自動化システムのCustom APIサーバー

## 概要

このAPIサーバーは、LINE Bot、Dify AI、Airtableデータベースを統合し、アパレルOEM受注プロセスを自動化します。

## APIエンドポイント

### 1. LINE Webhook API
**エンドポイント**: `POST /api/line-webhook`

LINEからのメッセージやイベントを受信し、処理します。

**機能**:
- テキストメッセージの受信と処理
- 画像メッセージの受信（デザイン画像）
- Dify AIへのメッセージ転送
- ユーザーフォローイベントの処理

### 2. Airtable CRUD API
**エンドポイント**: `POST /api/airtable`

Airtableデータベースへのアクセスを提供します。

**リクエスト例**:
```json
{
  "table": "Orders",
  "action": "create",
  "fields": {
    "customer_id": 1,
    "order_status": "pending",
    "quote_amount": 50000
  }
}
```

**サポートされるアクション**:
- `create`: 新規レコード作成
- `read`: レコード取得
- `update`: レコード更新
- `delete`: レコード削除
- `list`: レコード一覧取得

### 3. PDF生成API
**エンドポイント**: `POST /api/generate-pdf`

見積書PDFを生成します。

**リクエスト例**:
```json
{
  "orderData": {
    "order_id": 1,
    "customer_name": "山田太郎",
    "product_name": "オリジナルTシャツ",
    "color_size_quantity": "ブラック M: 10枚, ホワイト L: 5枚",
    "quote_amount": 50000,
    "desired_delivery_date": "2025-11-01"
  }
}
```

## 環境変数

以下の環境変数を設定してください：

```
AIRTABLE_API_KEY=your_airtable_personal_access_token
AIRTABLE_BASE_ID=app5nEtIhSOHasl47
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
DIFY_API_KEY=app-j0yoN6BU0O4iZJMgcWqK1bEC
```

## デプロイ

### Vercelへのデプロイ

1. Vercel CLIをインストール:
```bash
npm install -g vercel
```

2. プロジェクトをデプロイ:
```bash
vercel
```

3. 環境変数を設定:
```bash
vercel env add AIRTABLE_API_KEY
vercel env add AIRTABLE_BASE_ID
vercel env add LINE_CHANNEL_SECRET
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add DIFY_API_KEY
```

4. 本番環境にデプロイ:
```bash
vercel --prod
```

## ローカル開発

```bash
# 依存関係をインストール
npm install

# Vercel Devサーバーを起動
vercel dev
```

## 技術スタック

- **Runtime**: Node.js
- **Framework**: Vercel Serverless Functions
- **Dependencies**:
  - `@line/bot-sdk`: LINE Bot SDK
  - `airtable`: Airtable API client
  - `pdfkit`: PDF生成ライブラリ
  - `axios`: HTTP client

## アーキテクチャ

```
LINE App → LINE Webhook API → Dify AI
                ↓
         Airtable Database
                ↓
         PDF Generation API
```

## 注意事項

- LINE Webhook URLは、Vercelデプロイ後に取得できるURLを使用してください
- Airtable Personal Access Tokenは安全に管理してください
- 本番環境では、適切な認証・認可メカニズムを実装してください

## ライセンス

ISC

