# Dify LINE Webhook 設定情報

## 作成日時
2025年10月18日 08:17

## アプリ情報
- **アプリ名**: M4M LINE Bot
- **アプリタイプ**: ワークフロー
- **説明**: LINE Webhook連携用のアパレルOEM受注自動化ワークフロー
- **ステータス**: 公開済み

## ワークフロー構成
- **開始ノード**: message (String) 入力を受け取る
- **終了ノード**: message を出力として返す

## API 設定

### ベース URL
```
https://api.dify.ai/v1
```

### API Key
```
app-j0yoN6BU0O4iZJMgcWqK1bEC
```

### 認証ヘッダー
```
Authorization: Bearer app-j0yoN6BU0O4iZJMgcWqK1bEC
```

## Webhook URL（LINE → Dify）

### 完全なWebhook URL
```
https://api.dify.ai/v1/workflows/run
```

### HTTPメソッド
```
POST
```

### リクエストヘッダー
```
Content-Type: application/json
Authorization: Bearer app-j0yoN6BU0O4iZJMgcWqK1bEC
```

### リクエストボディ例（LINEからのメッセージ）
```json
{
  "inputs": {
    "message": "ユーザーからのメッセージ"
  },
  "response_mode": "blocking",
  "user": "LINE_USER_ID_HERE"
}
```

### レスポンス例（成功時）
```json
{
  "workflow_run_id": "workflow-run-id",
  "task_id": "task-id",
  "data": {
    "id": "workflow-id",
    "workflow_id": "workflow-id",
    "status": "succeeded",
    "outputs": {
      "message": "ユーザーからのメッセージ"
    },
    "elapsed_time": 0.5,
    "total_tokens": 0,
    "total_steps": 2,
    "created_at": 1697000000,
    "finished_at": 1697000001
  }
}
```

## LINE Developers Console での設定手順

### 1. Webhook URL設定
LINE Developers Console の Messaging API タブで以下のURLを設定：
```
https://api.dify.ai/v1/workflows/run
```

⚠️ **重要**: LINEのWebhookは認証ヘッダーを送信できないため、以下の対応が必要です：

**オプションA: 中間サーバーを使用（推奨）**
- LINE → 中間サーバー（認証ヘッダーを追加） → Dify
- 中間サーバーでLINEのWebhookを受け取り、Dify API Keyを追加してDifyに転送

**オプションB: Difyのチャットボットアプリを使用**
- ワークフローではなく、チャットボットアプリを使用
- チャットボットアプリは公開URLを提供し、認証なしでアクセス可能

### 2. その他のLINE設定
- **Use webhook**: ON
- **Auto-reply messages**: OFF
- **Greeting messages**: OFF（Dify側で制御）
- **Webhook redelivery**: ON（推奨）

### 3. LINE Channel Access Token取得
1. LINE Developers Console の「Messaging API」タブ
2. 「Channel access token」セクション
3. 「Issue」をクリックしてトークンを発行
4. トークンをコピー（DifyからLINEへの返信に使用）

## 次のステップ

### 1. 中間サーバーの実装（推奨）
LINEとDifyを連携するための中間サーバーを実装：

```python
# 例: Flask/FastAPIでの実装
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

DIFY_API_URL = "https://api.dify.ai/v1/workflows/run"
DIFY_API_KEY = "app-j0yoN6BU0O4iZJMgcWqK1bEC"
LINE_CHANNEL_ACCESS_TOKEN = "YOUR_LINE_CHANNEL_ACCESS_TOKEN"

@app.route("/webhook", methods=["POST"])
def line_webhook():
    # LINEからのWebhookを受け取る
    line_data = request.json
    
    # メッセージを抽出
    for event in line_data.get("events", []):
        if event["type"] == "message" and event["message"]["type"] == "text":
            user_message = event["message"]["text"]
            user_id = event["source"]["userId"]
            
            # Difyにリクエストを送信
            dify_response = requests.post(
                DIFY_API_URL,
                headers={
                    "Authorization": f"Bearer {DIFY_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "inputs": {"message": user_message},
                    "response_mode": "blocking",
                    "user": user_id
                }
            )
            
            # Difyからのレスポンスを取得
            dify_data = dify_response.json()
            reply_message = dify_data["data"]["outputs"]["message"]
            
            # LINEに返信（HTTP リクエストノードを使用する場合は不要）
            # ここでLINE Messaging APIを使用して返信
    
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000)
```

### 2. DifyワークフローにLLMノードを追加
現在のワークフローはメッセージをそのまま返すだけです。実際の受注自動化を実装するには：

1. **LLMノード**を追加して、ユーザーのメッセージを理解
2. **条件分岐（IF/ELSE）**を追加して、問い合わせタイプを判定
3. **HTTP リクエストノード**を追加して、LINEに返信を送信
4. **ナレッジベース**を追加して、製品情報やFAQを参照

### 3. LINE Messaging APIでの返信実装
DifyからLINEに返信するには、HTTP リクエストノードを使用：

**エンドポイント**: `https://api.line.me/v2/bot/message/reply`
**ヘッダー**:
```
Authorization: Bearer {LINE_CHANNEL_ACCESS_TOKEN}
Content-Type: application/json
```
**ボディ**:
```json
{
  "replyToken": "{{reply_token}}",
  "messages": [
    {
      "type": "text",
      "text": "{{dify_response}}"
    }
  ]
}
```

## 注意事項
1. API Keyは一度しか表示されないため、安全に保管してください
2. API Keyはクライアント側で共有または保存せず、サーバー側で保存してください
3. ワークフローを変更した場合は、再度「公開」する必要があります
4. LINEのWebhookは認証ヘッダーを送信できないため、中間サーバーが必要です
5. 本番環境では、HTTPSを使用し、Webhook URLを保護してください

## トラブルシューティング

### Webhook URLが動作しない場合
1. ワークフローが「公開済み」になっているか確認
2. API Keyが正しく設定されているか確認
3. リクエストボディの形式が正しいか確認（inputs, response_mode, user が必須）
4. 中間サーバーが正しく動作しているか確認

### LINEからの返信がない場合
1. LINE Channel Access Tokenが正しいか確認
2. HTTP リクエストノードの設定が正しいか確認
3. Difyのログでエラーがないか確認
4. LINEのWebhook設定で「Use webhook」がONになっているか確認

