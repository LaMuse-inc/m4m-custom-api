# M4M アパレルOEM LINE自動化システム - アーキテクチャ設計書

作成日: 2025年10月18日

---

## 1. 要件分析サマリー

### 1.1 システム概要
アパレルOEM事業における受注から生産指示までの業務をLINEを起点として自動化するシステム。

### 1.2 主要機能
1. **友だち追加時の自動対応**
   - 挨拶メッセージ送信
   - Airtableフォーム送信
   - 顧客情報の自動登録

2. **デザイン画像の受信と保管**
   - LINE画像メッセージの受信
   - Google Cloud Storageへの保存
   - Airtableへの画像URL登録

3. **商品提案フロー**
   - 商品マスタに基づく自動提案
   - LINEカルーセルメッセージでの表示
   - カラー・サイズ・枚数の入力

4. **生産指示PDF生成**
   - 動的PDF生成
   - Google Cloud Storageへの保存
   - LINE経由での配信

### 1.3 システムアーキテクチャ

```
┌─────────────────┐
│   お客様        │
│   (LINE)        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  LINE Messaging API          │
│  (Webhook)                   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Dify                        │
│  - 会話管理                  │
│  - 状態管理                  │
│  - ワークフロー実行          │
└───┬─────────────┬───────────┘
    │             │
    ▼             ▼
┌──────────┐  ┌────────────────┐
│Airtable  │  │Custom API      │
│Database  │  │(Vercel)        │
└──────────┘  └───┬────────────┘
                  │
                  ▼
              ┌──────────────┐
              │Google Cloud  │
              │Storage       │
              └──────────────┘
```

### 1.4 技術スタック

| コンポーネント | 技術 | 用途 |
|---------------|------|------|
| チャットボット | Dify | 会話フロー管理、オーケストレーション |
| データベース | Airtable | 顧客・案件・商品マスタ管理 |
| Custom API | Vercel + Node.js | PDF生成、画像処理、LINE配信 |
| ストレージ | Google Cloud Storage | 画像・PDFファイル保管 |
| メッセージング | LINE Messaging API | お客様とのコミュニケーション |

---

## 2. データモデル設計

### 2.1 Airtableテーブル構造

#### Table 1: Customers（顧客マスタ）
| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| customer_id | Auto Number | ○ | 主キー |
| line_user_id | Single Line Text | ○ | LINEユーザーID（一意） |
| line_display_name | Single Line Text |  | LINE表示名 |
| full_name_kanji | Single Line Text |  | 本名（漢字） |
| email | Email |  | メールアドレス |
| phone | Phone Number |  | 電話番号 |
| created_at | Created Time | ○ | 作成日時 |
| updated_at | Last Modified Time | ○ | 更新日時 |
| status | Single Select | ○ | active/inactive |

#### Table 2: Orders（案件マスタ）
| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| order_id | Auto Number | ○ | 主キー |
| customer_id | Link to Customers | ○ | 顧客ID（リンク） |
| order_status | Single Select | ○ | pending/design_submitted/quoted/confirmed/production/completed |
| design_image_url | URL |  | デザイン画像URL（GCS） |
| mockup_image_url | URL |  | モックアップ画像URL（GCS） |
| selected_product_id | Link to Products |  | 選択商品ID |
| desired_delivery_date | Date |  | 希望納期 |
| transfer_name | Single Line Text |  | 振込者名 |
| color_size_quantity | Long Text |  | カラー・サイズ・枚数（JSON形式） |
| quote_amount | Currency |  | 見積金額 |
| pdf_url | URL |  | 生成PDF URL |
| created_at | Created Time | ○ | 作成日時 |
| updated_at | Last Modified Time | ○ | 更新日時 |

#### Table 3: Products（商品マスタ）
| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| product_id | Auto Number | ○ | 主キー |
| category | Single Select | ○ | Tシャツ/ロンT/パーカー等 |
| maker_name | Single Line Text | ○ | メーカー名 |
| product_code | Single Line Text | ○ | 品番 |
| product_name | Single Line Text | ○ | 商品名 |
| description | Long Text |  | 商品説明 |
| image_url | URL |  | 商品画像URL |
| available_colors | Multiple Select |  | 対応カラー |
| available_sizes | Multiple Select |  | 対応サイズ |
| base_price | Currency |  | 基本単価 |
| is_active | Checkbox | ○ | 有効/無効 |

#### Table 4: Addresses（住所情報）
| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| address_id | Auto Number | ○ | 主キー |
| customer_id | Link to Customers | ○ | 顧客ID |
| full_name | Single Line Text | ○ | 氏名 |
| postal_code | Single Line Text |  | 郵便番号 |
| prefecture | Single Line Text |  | 都道府県 |
| city | Single Line Text |  | 市区町村 |
| address_line1 | Single Line Text |  | 番地 |
| address_line2 | Single Line Text |  | 建物名・部屋番号 |
| phone | Phone Number |  | 電話番号 |

---

## 3. API設計

### 3.1 Custom API エンドポイント

#### 1. 画像処理API
**エンドポイント**: `POST /api/process-image`

**リクエスト**:
```json
{
  "messageId": "123456789",
  "lineUserId": "U1234567890abcdef",
  "orderNo": "ORD-001"
}
```

**レスポンス**:
```json
{
  "success": true,
  "imageUrl": "https://storage.googleapis.com/m4m-production/images/ORD-001_1697654321_design.jpg",
  "imageType": "design"
}
```

#### 2. PDF生成API
**エンドポイント**: `POST /api/generate-pdf`

**リクエスト**:
```json
{
  "orderNo": "ORD-001",
  "customerName": "鈴木太郎",
  "desiredDeliveryDate": "最短",
  "transferName": "スズキタロウ",
  "makerName": "ユナイテッドアスレ",
  "productCode": "5001-01",
  "items": [
    {"size": "M", "color": "ブラック", "quantity": 10},
    {"size": "L", "color": "ブラック", "quantity": 15}
  ],
  "designImageUrl": "https://storage.googleapis.com/.../design.jpg",
  "mockupImageUrl": "https://storage.googleapis.com/.../mockup.jpg"
}
```

**レスポンス**:
```json
{
  "success": true,
  "pdfUrl": "https://storage.googleapis.com/m4m-production/pdfs/ORD-001.pdf"
}
```

#### 3. LINE配信API
**エンドポイント**: `POST /api/send-line-message`

**リクエスト**:
```json
{
  "type": "pdf",
  "to": "U1234567890abcdef",
  "pdfUrl": "https://storage.googleapis.com/.../ORD-001.pdf",
  "fileName": "生産指示書_ORD-001.pdf"
}
```

**レスポンス**:
```json
{
  "success": true,
  "messageId": "987654321"
}
```

---

## 4. Difyワークフロー設計

### 4.1 ワークフロー1: 友だち追加対応

```
Trigger: LINE友だち追加イベント
↓
Node 1: [Variable] line_user_id 取得
↓
Node 2: [HTTP Request] Airtable検索
  - API: GET /v0/{baseId}/Customers
  - Filter: {line_user_id} = '{{line_user_id}}'
↓
Node 3: [条件分岐]
  - 既存顧客 → Node 4a
  - 新規顧客 → Node 4b
↓
Node 4a: [HTTP Request] Airtable更新（ステータスactive化）
↓
Node 4b: [HTTP Request] Airtableレコード作成
  - Fields: {line_user_id, line_display_name, status: 'active'}
↓
Node 5: [Template] 挨拶メッセージ生成
↓
Node 6: [Template] フォームURL生成
  - Prefill: line_user_id, line_display_name
↓
Node 7: [LINE Message] メッセージ送信
↓
End
```

### 4.2 ワークフロー2: 画像受信対応

```
Trigger: LINE画像メッセージイベント
↓
Node 1: [Variable] messageId, line_user_id 取得
↓
Node 2: [HTTP Request] Airtable検索（進行中オーダー取得）
  - Filter: {customer.line_user_id} = '{{line_user_id}}'
  - Filter: {order_status} IN ['pending', 'design_submitted']
↓
Node 3: [条件分岐]
  - オーダーあり → Node 4
  - オーダーなし → エラーメッセージ送信 → End
↓
Node 4: [HTTP Request] Custom API: /api/process-image
  - Body: {messageId, lineUserId, orderNo}
↓
Node 5: [条件分岐]
  - 成功 → Node 6
  - 失敗 → エラー処理 → End
↓
Node 6: [LINE Message] 受信確認メッセージ送信
↓
Node 7: [Memory] 画像受信カウント更新
  - design_image_received: true/false
  - mockup_image_received: true/false
↓
Node 8: [条件分岐]
  - 両画像受信済み → Node 9
  - 未完了 → End
↓
Node 9: [HTTP Request] Airtable更新
  - order_status = 'design_submitted'
↓
Node 10: [LINE Message] 完了メッセージ送信
↓
End
```

### 4.3 ワークフロー3: 商品提案

```
Trigger: 管理画面「商品提案開始」ボタン
↓
Node 1: [LINE Message] 希望アイテム質問送信
↓
Node 2: [Wait] お客様回答待機
↓
Node 3: [LLM] カテゴリー判定
  - Prompt: "以下のテキストからアパレル商品カテゴリーを特定してください..."
  - Input: {{お客様回答}}
  - Output: category (Tシャツ/ロンT/パーカー等)
↓
Node 4: [条件分岐]
  - 明確 → Node 5
  - 曖昧 → 選択肢提示 → Node 2に戻る
↓
Node 5: [HTTP Request] Airtable商品検索
  - Filter: {category} = '{{category}}'
  - Filter: {is_active} = true
  - Sort: {base_price} ASC
  - Limit: 10
↓
Node 6: [Code] カルーセルJSON生成
↓
Node 7: [LINE Message] カルーセル送信
↓
End
```

---

## 5. 実装計画

### 5.1 Phase 2: Airtableデータベース構築
- [ ] Airtableベース作成
- [ ] Customersテーブル作成
- [ ] Ordersテーブル作成
- [ ] Productsテーブル作成
- [ ] Addressesテーブル作成
- [ ] サンプルデータ投入

### 5.2 Phase 3: Custom API開発（Vercel）
- [ ] Vercelプロジェクト作成
- [ ] `/api/process-image` エンドポイント実装
- [ ] `/api/generate-pdf` エンドポイント実装
- [ ] `/api/send-line-message` エンドポイント実装
- [ ] Google Cloud Storage連携
- [ ] LINE Messaging API連携

### 5.3 Phase 4: Difyワークフロー構築
- [ ] 友だち追加対応ワークフロー作成
- [ ] 画像受信対応ワークフロー作成
- [ ] 商品提案ワークフロー作成
- [ ] PDF生成・配信ワークフロー作成

### 5.4 Phase 5: LINE連携設定とテスト
- [ ] LINE Messaging API設定
- [ ] Webhook URL設定
- [ ] 統合テスト実施

### 5.5 Phase 6: ドキュメント作成と成果物提出
- [ ] 運用マニュアル作成
- [ ] API仕様書作成
- [ ] システム構成図作成
- [ ] 成果物の提出

---

## 6. 制約事項と前提条件

### 6.1 実装範囲
以下の機能は実装可能な範囲で構築します：

**実装する機能:**
- Airtableデータベース構築
- Custom API（画像処理、PDF生成）の基本実装
- Difyワークフロー（友だち追加、画像受信）の基本実装
- LINE連携の基本設定

**実装しない機能（Phase 2以降で検討）:**
- 見積もり自動計算ロジック
- 決済機能
- 在庫管理システムとの連携
- 高度なエラーハンドリング
- 本番環境での完全なセキュリティ対策

### 6.2 必要な外部サービス
以下のサービスのアカウントが必要です：

1. **LINE Developers**
   - LINE公式アカウント
   - Messaging API Channel

2. **Airtable**
   - Proプラン以上推奨

3. **Vercel**
   - 無料プランで開始可能

4. **Google Cloud Platform**
   - Cloud Storageバケット
   - サービスアカウント

### 6.3 環境変数
以下の環境変数が必要です：

```
# LINE
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=

# Airtable
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Google Cloud Storage
GCS_PROJECT_ID=
GCS_BUCKET_NAME=
GCS_SERVICE_ACCOUNT_KEY=

# Dify
DIFY_API_KEY=
DIFY_API_URL=

# Custom API
API_SECRET_KEY=
```

---

## 7. 次のステップ

1. **Airtableデータベース構築**
   - ベース作成
   - テーブル構造の実装
   - サンプルデータの投入

2. **Custom API開発**
   - Vercelプロジェクトのセットアップ
   - 各エンドポイントの実装

3. **Difyワークフロー構築**
   - 基本ワークフローの作成
   - LINE連携の設定

4. **統合テスト**
   - 全体フローの動作確認

5. **ドキュメント作成**
   - 運用マニュアル
   - API仕様書

---

以上、M4M アパレルOEM LINE自動化システムのアーキテクチャ設計書となります。

