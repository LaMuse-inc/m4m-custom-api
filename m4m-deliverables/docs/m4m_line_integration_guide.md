# M4M LINE連携設定ガイド

## 概要

このガイドでは、M4MアパレルOEM自動化システムとLINE Messaging APIを連携させる手順を説明します。

## 前提条件

以下の情報が必要です：

1. **Dify Webhook URL**: `https://api.dify.ai/v1/workflows/run`
2. **Dify API Key**: `app-j0yoN6BU0O4iZJMgcWqK1bEC`
3. **Airtable Base ID**: `app5nEtIhSOHasl47`
4. **Airtable Personal Access Token**: 取得済み
5. **Custom API URL** (Vercelデプロイ後): `https://your-project.vercel.app`

## Step 1: LINE Developers Consoleでの設定

### 1.1 Providerの作成

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. 「Create」をクリック
3. Provider name: **M4M**
4. 「Create」をクリック

### 1.2 Messaging API Channelの作成

1. 「Create a Messaging API channel」をクリック
2. 以下の情報を入力：
   - **Channel type**: Messaging API
   - **Provider**: M4M（先ほど作成したもの）
   - **Channel name**: M4M OEM Bot
   - **Channel description**: アパレルOEM受注自動化ボット
   - **Category**: ショッピング
   - **Subcategory**: ファッション・アクセサリー
   - **Email address**: your-email@example.com
3. 利用規約に同意して「Create」をクリック

### 1.3 Channel Access Tokenの発行

1. 「Messaging API」タブを開く
2. 「Channel access token」セクションで「Issue」をクリック
3. トークンをコピーして安全に保管

### 1.4 Webhook URLの設定

#### オプションA: Custom API経由（推奨）

Custom APIをVercelにデプロイした場合：

1. Webhook URL: `https://your-project.vercel.app/api/line-webhook`
2. 「Use webhook」をONにする
3. 「Verify」をクリックして接続テスト
4. 成功すると「Success」と表示されます

#### オプションB: Dify直接連携（簡易版）

Difyのワークフローに直接接続する場合：

1. Webhook URL: `https://api.dify.ai/v1/workflows/run`
2. ただし、LINE WebhookとDify APIの形式が異なるため、Custom APIの使用を推奨

### 1.5 その他の設定

1. **Auto-reply messages**: OFF（Dify側で制御するため）
2. **Greeting messages**: OFF
3. **Webhook redelivery**: ON（推奨）

### 1.6 Channel Secretの取得

1. 「Basic settings」タブを開く
2. 「Channel secret」をコピーして保管

## Step 2: Custom APIの環境変数設定

Vercelプロジェクトに以下の環境変数を設定：

```bash
# LINE設定
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

# Dify設定
DIFY_API_KEY=app-j0yoN6BU0O4iZJMgcWqK1bEC

# Airtable設定
AIRTABLE_API_KEY=your_airtable_token
AIRTABLE_BASE_ID=app5nEtIhSOHasl47
```

## Step 3: 動作確認

### 3.1 LINE Botを友だち追加

1. LINE Developers Consoleの「Messaging API」タブ
2. QRコードをスキャンしてBotを友だち追加

### 3.2 メッセージ送信テスト

1. LINE Botにメッセージを送信
2. 以下を確認：
   - Botから応答が返ってくるか
   - Difyのログに実行記録があるか
   - Airtableにデータが保存されているか

### 3.3 トラブルシューティング

#### Webhook検証エラー

**原因**: Custom APIがまだデプロイされていない、または環境変数が設定されていない

**解決策**:
1. Vercelにプロジェクトをデプロイ
2. 環境変数を正しく設定
3. デプロイ完了後、再度Webhook URLを設定

#### Botが応答しない

**原因**: LINE Channel Access Tokenが無効、またはDify API Keyが間違っている

**解決策**:
1. LINE Developers Consoleでトークンを再発行
2. Dify API Keyを確認
3. Custom APIの環境変数を更新
4. Vercelで再デプロイ

#### Airtableにデータが保存されない

**原因**: Airtable Personal Access Tokenのスコープが不足、またはBase IDが間違っている

**解決策**:
1. Airtableトークンのスコープを確認（data.records:read, data.records:write）
2. Base IDを確認（`app5nEtIhSOHasl47`）
3. Custom APIの環境変数を更新

## Step 4: 本番運用前のチェックリスト

- [ ] LINE Webhook URLが正しく設定されている
- [ ] Channel Access TokenとChannel Secretが設定されている
- [ ] Dify API Keyが設定されている
- [ ] Airtable APIトークンとBase IDが設定されている
- [ ] Custom APIがVercelにデプロイされている
- [ ] すべての環境変数が正しく設定されている
- [ ] LINE Botからメッセージ送信テストが成功している
- [ ] Airtableにテストデータが保存されている
- [ ] Difyワークフローが正常に実行されている

## 参考情報

### LINE Messaging API ドキュメント
- [公式ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [Webhook イベント](https://developers.line.biz/ja/reference/messaging-api/#webhook-event-objects)

### Dify API ドキュメント
- [ワークフロー実行API](https://docs.dify.ai/guides/workflow/publish-workflow)

### Airtable API ドキュメント
- [API リファレンス](https://airtable.com/developers/web/api/introduction)

## 注意事項

1. **セキュリティ**: すべてのAPIキーとトークンは環境変数として管理し、コードに直接記述しないでください
2. **レート制限**: LINE Messaging APIには送信制限があります（無料プランは月500通まで）
3. **エラーハンドリング**: 本番環境では適切なエラーハンドリングとログ記録を実装してください
4. **HTTPS必須**: Webhook URLは必ずHTTPSを使用してください（VercelはデフォルトでHTTPS対応）

## 次のステップ

1. 実際のユーザーテストを実施
2. フィードバックに基づいてワークフローを改善
3. 追加機能の実装（画像処理、PDF生成など）
4. モニタリングとログ分析の設定

