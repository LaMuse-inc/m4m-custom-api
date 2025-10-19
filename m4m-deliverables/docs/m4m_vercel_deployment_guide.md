# M4M Custom API - Vercelデプロイ手順書

## 概要

このガイドでは、M4M Custom APIをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント（LaMuse-inc）
- Vercelアカウント
- GitHubリポジトリ「LaMuse-inc/m4m-custom-api」（作成済み）

## Step 1: GitHubリポジトリにコードをアップロード

### 方法A: ブラウザでファイルをアップロード（推奨）

1. [https://github.com/LaMuse-inc/m4m-custom-api](https://github.com/LaMuse-inc/m4m-custom-api)にアクセス

2. 「**uploading an existing file**」リンクをクリック

3. 以下のファイルをドラッグ&ドロップ：
   - `/home/ubuntu/m4m-custom-api/api/line-webhook.js`
   - `/home/ubuntu/m4m-custom-api/api/airtable.js`
   - `/home/ubuntu/m4m-custom-api/api/generate-pdf.js`
   - `/home/ubuntu/m4m-custom-api/package.json`
   - `/home/ubuntu/m4m-custom-api/vercel.json`
   - `/home/ubuntu/m4m-custom-api/README.md`

4. Commit message: `Initial commit: M4M Custom API`

5. 「**Commit changes**」をクリック

### 方法B: GitHub Desktop / Git CLI

すでにローカルでコミット済みのため、以下のコマンドでプッシュできます：

```bash
cd /home/ubuntu/m4m-custom-api
git push -u origin main
```

**注意**: GitHub Personal Access Tokenが必要です。

## Step 2: Vercelでプロジェクトをインポート

### 2.1 Vercelにログイン

1. [https://vercel.com/](https://vercel.com/)にアクセス
2. 「**Log in**」をクリック
3. GitHubアカウントでログイン

### 2.2 新しいプロジェクトを作成

1. Vercelダッシュボードで「**Add New...**」→「**Project**」をクリック
2. 「**Import Git Repository**」セクションで「**LaMuse-inc/m4m-custom-api**」を選択
3. 「**Import**」をクリック

### 2.3 プロジェクト設定

**Project Name**: `m4m-custom-api`（デフォルトのまま）

**Framework Preset**: `Other`（デフォルトのまま）

**Root Directory**: `./`（デフォルトのまま）

**Build Command**: 空欄（Serverless Functionsのため不要）

**Output Directory**: 空欄

**Install Command**: `npm install`（デフォルトのまま）

### 2.4 環境変数を設定

「**Environment Variables**」セクションで以下を追加：

| Name | Value |
|------|-------|
| `AIRTABLE_API_KEY` | （Airtable Personal Access Token） |
| `AIRTABLE_BASE_ID` | `app5nEtIhSOHasl47` |
| `LINE_CHANNEL_SECRET` | （LINE Channel Secret） |
| `LINE_CHANNEL_ACCESS_TOKEN` | （LINE Channel Access Token） |
| `DIFY_API_KEY` | `app-j0yoN6BU0O4iZJMgcWqK1bEC` |

**環境変数の取得方法:**

**AIRTABLE_API_KEY**:
- Airtable Developer Hub → Personal access tokens
- すでに作成済み（`/home/ubuntu/m4m_airtable_token.txt`に保存）

**LINE_CHANNEL_SECRET & LINE_CHANNEL_ACCESS_TOKEN**:
- LINE Developers Console → Messaging API Channel
- 「Basic settings」タブ → Channel secret
- 「Messaging API」タブ → Channel access token

### 2.5 デプロイ

1. 「**Deploy**」ボタンをクリック
2. デプロイが完了するまで待機（約1-2分）
3. デプロイ成功後、URLが表示されます（例: `https://m4m-custom-api.vercel.app`）

## Step 3: デプロイ後の確認

### 3.1 デプロイURLを確認

Vercelダッシュボードで「**Domains**」セクションを確認：

- Production URL: `https://m4m-custom-api.vercel.app`

### 3.2 エンドポイントをテスト

**LINE Webhook エンドポイント:**
```
https://m4m-custom-api.vercel.app/api/line-webhook
```

**Airtable API エンドポイント:**
```
https://m4m-custom-api.vercel.app/api/airtable
```

**PDF生成 エンドポイント:**
```
https://m4m-custom-api.vercel.app/api/generate-pdf
```

### 3.3 LINE Webhook URLを設定

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. Messaging API Channelを開く
3. 「Messaging API」タブ → 「Webhook settings」
4. Webhook URL: `https://m4m-custom-api.vercel.app/api/line-webhook`
5. 「Use webhook」をONにする
6. 「Verify」をクリックして接続テスト

## Step 4: 動作確認

### 4.1 LINE Botテスト

1. LINE BotをQRコードから友だち追加
2. メッセージを送信
3. Botから応答が返ってくることを確認

### 4.2 Vercelログ確認

1. Vercelダッシュボード → 「**Logs**」タブ
2. 関数の実行ログを確認
3. エラーがないか確認

### 4.3 Airtableデータ確認

1. Airtableで「M4M Production」ベースを開く
2. 「Customers」または「Orders」テーブルにデータが保存されているか確認

## トラブルシューティング

### エラー: 環境変数が見つからない

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. Vercelダッシュボード → 「**Settings**」→「**Environment Variables**」
2. すべての環境変数が設定されているか確認
3. 変更後、「**Redeploy**」をクリック

### エラー: LINE Webhook検証失敗

**原因**: LINE_CHANNEL_SECRETが間違っている、またはエンドポイントが正しくない

**解決策**:
1. LINE Developers ConsoleでChannel Secretを再確認
2. Vercelの環境変数を更新
3. Webhook URLが正しいか確認（`/api/line-webhook`）

### エラー: Airtableにデータが保存されない

**原因**: AIRTABLE_API_KEYのスコープが不足、またはBASE_IDが間違っている

**解決策**:
1. Airtable Personal Access Tokenのスコープを確認
   - `data.records:read`
   - `data.records:write`
2. BASE_IDが`app5nEtIhSOHasl47`であることを確認

## 継続的デプロイ

GitHubリポジトリにプッシュすると、Vercelが自動的に再デプロイします：

```bash
cd /home/ubuntu/m4m-custom-api
# コードを編集
git add .
git commit -m "Update: ..."
git push origin main
```

Vercelが自動的に検知して、数分以内に本番環境に反映されます。

## 参考情報

### Vercel ドキュメント
- [Serverless Functions](https://vercel.com/docs/functions)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Deployments](https://vercel.com/docs/deployments/overview)

### プロジェクトファイル
- Custom APIコード: `/home/ubuntu/m4m-custom-api/`
- ソースアーカイブ: `/home/ubuntu/m4m-custom-api-source.tar.gz`

## 次のステップ

1. ✓ Vercelデプロイ完了
2. LINE Webhook URLを設定
3. LINE Botをテスト
4. Difyワークフローを拡張
5. 本番運用開始

---

**作成日**: 2025年10月19日  
**バージョン**: 1.0.0

