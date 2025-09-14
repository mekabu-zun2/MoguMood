# ブランチ保護ルール設定ガイド

このドキュメントでは、mainブランチの保護ルールを設定する方法を説明します。

## 設定手順

### 1. GitHubリポジトリの設定画面にアクセス

1. GitHubリポジトリページで「Settings」タブをクリック
2. 左サイドバーの「Branches」をクリック

### 2. ブランチ保護ルールを追加

1. 「Add rule」ボタンをクリック
2. 「Branch name pattern」に `main` を入力

### 3. 必須設定項目

以下の項目にチェックを入れてください：

#### ✅ Require a pull request before merging
- **Require approvals**: 1人以上の承認を必須にする
- **Dismiss stale reviews**: 新しいコミットがプッシュされた際に古いレビューを無効にする
- **Require review from code owners**: コードオーナーからのレビューを必須にする（CODEOWNERS ファイルがある場合）

#### ✅ Require status checks to pass before merging
- **Require branches to be up to date before merging**: マージ前に最新の状態にする
- **Status checks that are required**: 以下のチェックを必須にする
  - `ci` (CI ワークフロー)
  - `lint / ESLint` (ESLint チェック)
  - `lint / TypeScript` (型チェック)
  - `lint / Security Audit` (セキュリティ監査)
  - `unit-tests (20.x)` (ユニットテスト)
  - `integration-tests` (インテグレーションテスト)

#### ✅ Require conversation resolution before merging
- プルリクエストのコメントがすべて解決されてからマージを許可

#### ✅ Require signed commits
- 署名されたコミットのみを許可（推奨）

#### ✅ Require linear history
- マージコミットを禁止し、リベースまたはスカッシュマージのみを許可

#### ✅ Include administrators
- 管理者にもこれらのルールを適用

### 4. 追加の推奨設定

#### ✅ Restrict pushes that create files
- 特定のファイルパターンの作成を制限（必要に応じて）

#### ✅ Restrict pushes that create files
- `.env` ファイルなど機密情報を含む可能性のあるファイルの直接プッシュを制限

## 設定後の動作

### プルリクエスト作成時
1. CIワークフローが自動実行される
2. すべてのステータスチェックが成功する必要がある
3. 1人以上の承認が必要
4. すべてのコメントが解決されている必要がある

### マージ時
- 上記の条件がすべて満たされた場合のみマージ可能
- 管理者も同じルールに従う必要がある

## トラブルシューティング

### ステータスチェックが表示されない場合
1. プルリクエストを一度作成してCIを実行する
2. その後、ブランチ保護ルールでステータスチェックを選択できるようになる

### 緊急時のマージが必要な場合
1. 一時的にブランチ保護ルールを無効にする
2. マージ後、すぐにルールを再有効化する
3. 緊急マージの理由をドキュメント化する

## 関連ファイル

- `.github/workflows/ci.yml` - メインCIワークフロー
- `.github/workflows/test.yml` - テストワークフロー
- `.github/workflows/lint.yml` - コード品質チェック
- `package.json` - NPMスクリプト設定