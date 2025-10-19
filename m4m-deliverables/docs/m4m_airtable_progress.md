# M4M Airtable Database Progress

## 完了したテーブル

### 1. Customers（顧客マスタ）
- **Status**: 作成済み（デフォルトフィールドあり）
- **Table ID**: tbljYSauTEcpv1Ppz
- **必要なフィールド**（後で追加）:
  - customer_id (Auto Number)
  - line_user_id (Single Line Text)
  - line_display_name (Single Line Text)
  - full_name_kanji (Single Line Text)
  - email (Email)
  - phone (Phone Number)
  - status (Single Select: active, inactive)

### 2. Orders（案件マスタ）
- **Status**: ✓ 作成完了
- **Table ID**: tblbLBHHaJU4Gh28M
- **フィールド**:
  - order_id (Number)
  - customer_id (Number)
  - order_status (Single Line Text: pending, design_submitted, quoted, confirmed, production, completed)
  - design_image_url (URL)
  - mockup_image_url (URL)
  - desired_delivery_date (Date: 2025-11-01)
  - transfer_name (Single Line Text: 山田太郎)
  - color_size_quantity (Single Line Text: JSON形式)
  - quote_amount (Number: 50000)
  - pdf_url (URL)

## 未作成のテーブル

### 3. Products（商品マスタ）
- **CSV準備済み**: /home/ubuntu/m4m_products.csv
- **サンプルデータ**: 2件（Tシャツ、パーカー）

### 4. Addresses（住所情報）
- **CSV準備済み**: /home/ubuntu/m4m_addresses.csv
- **サンプルデータ**: 1件

## Airtable API情報

- **Base ID**: app5nEtIhSOHasl47
- **Personal Access Token**: pat2t5zSwhxOx6zeu.6806f20c145b36076a63e7b856e089cab616
- **Scopes**: 
  - data.records:read
  - data.records:write
  - schema.bases:write

## 次のステップ

1. ProductsとAddressesテーブルをCSVインポートで作成（オプション）
2. CustomersテーブルのフィールドをAPI経由で追加（オプション）
3. Phase 3: Custom API開発（Vercel）に進む
4. Phase 4: Difyワークフロー構築に進む

## 注意事項

- Airtableの無料プランは14日間のトライアル期間中
- テーブル間のリレーションシップは後で設定可能
- API経由でのフィールド追加・更新が可能

