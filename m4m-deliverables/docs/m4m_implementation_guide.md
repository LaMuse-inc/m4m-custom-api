# M4M アパレルOEM LINE自動化システム 実装ガイド

## 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [実装済みコンポーネント](#実装済みコンポーネント)
4. [セットアップ手順](#セットアップ手順)
5. [デプロイメント](#デプロイメント)
6. [運用方法](#運用方法)
7. [今後の拡張](#今後の拡張)

---

## システム概要

M4Mアパレル OEM LINE自動化システムは、LINE Messaging APIを活用してアパレルOEM受注プロセスを自動化するシステムです。顧客はLINE経由でデザイン画像を送信し、AIアシスタントとの対話を通じて見積もりを取得し、発注まで完結できます。

### 主な機能

**実装済み機能:**
- LINE Botによるメッセージ受信
- Dify AIワークフローとの連携
- Airtableデータベースへのデータ保存
- Custom API（LINE Webhook、Airtable CRUD、PDF生成）

**今後実装予定の機能:**
- デザイン画像からモックアップ生成
- 自動見積もり計算
- 決済連携
- 生産管理機能

### 技術スタック

- **フロントエンド**: LINE Messaging API
- **AIエンジン**: Dify (Workflow)
- **バックエンドAPI**: Node.js (Vercel Serverless Functions)
- **データベース**: Airtable
- **ホスティング**: Vercel

---

## アーキテクチャ

### システム構成図

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

### データフロー

1. **ユーザーメッセージ受信**
   - LINE → Custom API (`/api/line-webhook`)
   - メッセージ内容を解析

2. **AI処理**
   - Custom API → Dify Workflow
   - ユーザー意図を理解し、適切な応答を生成

3. **データ保存**
   - Custom API → Airtable
   - 顧客情報、注文情報を保存

4. **応答返信**
   - Custom API → LINE Platform → User
   - AI生成の応答をユーザーに送信

---

## 実装済みコンポーネント

### 1. Airtableデータベース

**Base ID**: `app5nEtIhSOHasl47`

#### テーブル構造

**Customers（顧客マスタ）**
- `customer_id` (Auto Number)
- `line_user_id` (Single Line Text)
- `line_display_name` (Single Line Text)
- `full_name_kanji` (Single Line Text)
- `email` (Email)
- `phone` (Phone Number)
- `status` (Single Select: active, inactive)

**Orders（案件マスタ）** ✓ 作成済み
- `order_id` (Number)
- `customer_id` (Number)
- `order_status` (Single Line Text)
- `design_image_url` (URL)
- `mockup_image_url` (URL)
- `desired_delivery_date` (Date)
- `transfer_name` (Single Line Text)
- `color_size_quantity` (Single Line Text)
- `quote_amount` (Number)
- `pdf_url` (URL)

**Products（商品マスタ）**
- `product_id` (Auto Number)
- `product_name` (Single Line Text)
- `category` (Single Select)
- `base_price` (Currency)
- `min_order_quantity` (Number)

**Addresses（住所情報）**
- `address_id` (Auto Number)
- `customer_id` (Number)
- `postal_code` (Single Line Text)
- `prefecture` (Single Line Text)
- `city` (Single Line Text)
- `address_line1` (Single Line Text)
- `address_line2` (Single Line Text)

### 2. Dify AIワークフロー

**App ID**: `c095403a-26f5-4a65-97fb-f4ada809cce3`
**Workflow Name**: M4M LINE Bot
**API Key**: `app-j0yoN6BU0O4iZJMgcWqK1bEC`

**現在の構成:**
- 開始ノード: `message` (String) を受け取る
- 終了ノード: `message` (String) を返す

**拡張予定:**
- LLMノード: GPT-4による対話処理
- HTTPリクエストノード: Airtable API連携
- 条件分岐ノード: メッセージタイプ判定
- 変数処理ノード: データ変換

### 3. Custom API

**プロジェクト**: `/home/ubuntu/m4m-custom-api`

#### エンドポイント

**`POST /api/line-webhook`**
- LINE Messaging APIからのWebhookを受信
- メッセージをDifyに転送
- ユーザー応答をLINEに返信

**`POST /api/airtable`**
- Airtableデータベースへのアクセス
- CRUD操作をサポート

リクエスト例:
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

**`POST /api/generate-pdf`**
- 見積書PDFを生成
- 注文データを受け取り、フォーマットされたPDFを返す

リクエスト例:
```json
{
  "orderData": {
    "order_id": 1,
    "customer_name": "山田太郎",
    "product_name": "オリジナルTシャツ",
    "quote_amount": 50000
  }
}
```

---

## セットアップ手順

### 前提条件

- Node.js 18以上
- npm または yarn
- Vercel アカウント
- LINE Developers アカウント
- Dify アカウント
- Airtable アカウント

### 1. Custom APIのセットアップ

```bash
# プロジェクトディレクトリに移動
cd /home/ubuntu/m4m-custom-api

# 依存関係をインストール
npm install

# 環境変数を設定（.env.localファイルを作成）
cat > .env.local << EOF
AIRTABLE_API_KEY=your_airtable_token
AIRTABLE_BASE_ID=app5nEtIhSOHasl47
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
DIFY_API_KEY=app-j0yoN6BU0O4iZJMgcWqK1bEC
EOF

# ローカルでテスト
vercel dev
```

### 2. Airtableのセットアップ

1. [Airtable](https://airtable.com/)にログイン
2. 「M4M Production」ベースを開く
3. 必要に応じてテーブルとフィールドを追加
4. Personal Access Tokenを取得（Developer Hub）

### 3. Difyのセットアップ

1. [Dify Cloud](https://cloud.dify.ai/)にログイン
2. 「M4M LINE Bot」ワークフローを開く
3. ワークフローを拡張（LLMノード、HTTPノードなど）
4. 公開してAPI Keyを確認

### 4. LINEのセットアップ

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. Provider「M4M」を作成
3. Messaging API Channel「M4M OEM Bot」を作成
4. Channel Access TokenとChannel Secretを取得
5. Webhook URLを設定（Vercelデプロイ後）

---

## デプロイメント

### Vercelへのデプロイ

```bash
# Vercel CLIをインストール（初回のみ）
npm install -g vercel

# プロジェクトディレクトリに移動
cd /home/ubuntu/m4m-custom-api

# Vercelにログイン
vercel login

# デプロイ
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

### デプロイ後の確認

1. デプロイされたURLを確認（例: `https://m4m-custom-api.vercel.app`）
2. LINE Developers ConsoleでWebhook URLを設定
   - URL: `https://m4m-custom-api.vercel.app/api/line-webhook`
3. Webhook接続テストを実行
4. LINE Botを友だち追加してメッセージ送信テスト

---

## 運用方法

### 日常運用

**1. メッセージ監視**
- Difyの「ログ」メニューでワークフロー実行履歴を確認
- エラーが発生した場合は、ログを確認して原因を特定

**2. データ管理**
- Airtableで顧客情報、注文情報を確認・編集
- 定期的にデータのバックアップを取得

**3. パフォーマンス監視**
- Vercelダッシュボードで関数の実行時間とエラー率を確認
- LINE Developers Consoleでメッセージ送信数を確認

### トラブルシューティング

**問題: Botが応答しない**

原因と解決策:
1. Webhook URLが正しく設定されているか確認
2. Vercelの環境変数が正しいか確認
3. Dify API Keyが有効か確認
4. LINE Channel Access Tokenが有効か確認

**問題: Airtableにデータが保存されない**

原因と解決策:
1. Airtable Personal Access Tokenのスコープを確認
2. Base IDが正しいか確認
3. テーブル名とフィールド名が正しいか確認

**問題: PDF生成エラー**

原因と解決策:
1. 注文データが正しい形式か確認
2. Vercelの関数タイムアウト設定を確認（デフォルト10秒）
3. PDFKitライブラリが正しくインストールされているか確認

---

## 今後の拡張

### Phase 1: 基本機能の完成

**優先度: 高**

1. **Difyワークフローの拡張**
   - LLMノードの追加と設定
   - 対話フローの設計
   - コンテキスト管理の実装

2. **Customersテーブルの完成**
   - フィールドの追加
   - 初回ユーザー登録フローの実装

3. **Products/Addressesテーブルの作成**
   - CSVインポート
   - サンプルデータの投入

### Phase 2: 画像処理機能

**優先度: 中**

1. **デザイン画像の受信と保存**
   - LINE画像メッセージの処理
   - 画像をAirtable Attachmentに保存

2. **モックアップ生成**
   - 画像生成AIの統合（DALL-E, Stable Diffusionなど）
   - デザイン画像をTシャツモックアップに合成

### Phase 3: 見積もり自動化

**優先度: 中**

1. **見積もり計算ロジック**
   - 商品価格、数量、オプションに基づく計算
   - 割引ルールの適用

2. **PDF見積書の自動生成**
   - 日本語フォント対応
   - 会社ロゴの追加
   - 電子署名の統合

### Phase 4: 決済連携

**優先度: 低**

1. **Stripe連携**
   - 決済リンクの生成
   - 決済完了通知の処理

2. **銀行振込管理**
   - 振込先情報の自動送信
   - 入金確認の管理

### Phase 5: 生産管理

**優先度: 低**

1. **製造工程管理**
   - ステータス更新通知
   - 納期管理

2. **配送追跡**
   - 配送業者API連携
   - 追跡番号の自動通知

---

## 参考資料

### ドキュメント

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [Dify ドキュメント](https://docs.dify.ai/)
- [Airtable API ドキュメント](https://airtable.com/developers/web/api/introduction)
- [Vercel ドキュメント](https://vercel.com/docs)

### プロジェクトファイル

- アーキテクチャ設計: `/home/ubuntu/m4m_architecture_design.md`
- Airtable進捗: `/home/ubuntu/m4m_airtable_progress.md`
- LINE連携ガイド: `/home/ubuntu/m4m_line_integration_guide.md`
- Custom APIコード: `/home/ubuntu/m4m-custom-api/`

---

## まとめ

M4Mアパレル OEM LINE自動化システムの基盤は実装済みです。今後は、要件定義に基づいて段階的に機能を拡張していくことで、完全な自動化システムを構築できます。

各フェーズの実装は独立しているため、優先度に応じて柔軟に開発を進めることができます。

