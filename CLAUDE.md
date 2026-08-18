# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際のガイドなのだ。

## プロジェクト概要

`half-it` は、ダーツのゲーム「ハーフイット」を一人で遊ぶためのスコアカウンター。
HTML / CSS / JavaScript で作るペラいち（単一ページ）の静的サイトで、
ビルドツールやフレームワークは使わず、素の HTML / CSS / JS で構成する。

ゲームのルールと画面の使い方は [README.md](README.md) にまとめてある。

## やり取りのルール

- チャットでの応答は **日本語** で行う。
- コミットメッセージ、Pull Request、Issue、コード内コメントも **日本語** で書く。
- ドキュメント（Markdown）も **日本語** で書く。

## ディレクトリ構成

```
half-it/
├── index.html      # ページ本体（マークアップと DOM の id 定義）
├── css/style.css   # スタイル
├── js/main.js      # カウント処理と画面描画
├── README.md       # 使い方（上部）と技術情報（下部）
└── .nojekyll       # Jekyll のビルドを無効化し、ファイルをそのまま配信する
```

## 開発コマンド

ブラウザで直接開く。

```sh
open index.html
```

相対パスも含めて本番に近い形で確認する場合はローカルサーバーを立てる。

```sh
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

テストランナーやリンターは導入していない。動作確認はブラウザで行う。

## 実装の構造（js/main.js）

- ゲームのルールは上部の定数に集約する。
  - `START_SCORE` … 持ち点の初期値（40）
  - `DARTS_PER_ROUND` … 1 ラウンドの投数（3）
  - `BULL_MARK_POINT` … BULL の 1 マークあたりの得点（25）
  - `DOUBLE_MAX_POINT` … DOUBLE のラウンドの 1 投の最高得点（50）。
    インブルがダブル判定なので D20 の 40 ではなくインブルの 50 が上限になる
  - `ROUNDS` … 全 9 ラウンドの狙う場所。`type` は `number` / `double` / `triple` / `bull`
- 状態は `state`（`history` / `inputMode` / `menuOpen` / `simple` / `theme`）だけに持つ。
  3 点メニューの開閉（`menuOpen`）や見た目の設定（`simple` / `theme`）も `state` に持ち、
  `render()` の先頭でまとめて描画する（ゲーム終了後も切り替えられるように早期 return より前に置く）。
  **持ち点は `state` に持たず、`history` の最後の要素から導出する**（`currentScore()`）。
  同様に現在のラウンドも `history.length` から導出する（`currentRound()` / `isFinished()`）。
  そのため「1つ戻る」は `history.pop()`、「最初から」は `history = []` だけで成立する。
- ルール計算はイベント処理から切り離した純粋な関数に置く。
  `markLimit()` / `pointsFromMarks()` / `manualRule()` / `effectiveMode()` / `commitRound()`。
- 描画は `render()` に一本化する。状態を変えたら `render()` を呼び直す方式なので、
  個別の DOM を差分更新するコードは足さない。
- DOM 参照は `DOMContentLoaded` 内の `el` オブジェクトにまとめる。
  新しい要素を扱うときは `index.html` に `id` を付け、`el` に追記する。
- DOM の生成は `createElement` と `textContent` で行う。`innerHTML` は使わない。

## スタイルの方針（css/style.css）

- 色は `:root` の CSS 変数で定義し、色を直接書かず、変数を追加して参照する。
- 配色は 3 つの入れ物で管理する。変数を足すときは 3 か所すべてに書く。
  - `:root` … 白基調（既定）
  - `@media (prefers-color-scheme: dark)` の `:root:not([data-theme="light"])` … 端末がダークのとき
  - `:root[data-theme="dark"]` … 3 点メニューで黒基調を選んだとき（`state.theme` が `<html>` に付ける）
- クラス名は BEM 風（`.board__value`、`.button--sub`）。状態は `is-` 接頭辞（`.is-halved`、`.is-simple`）。
- シンプルモードで隠す要素は `.is-simple` の子孫セレクタにまとめる（JS では `body` にクラスを付けるだけ）。

## コーディング方針

- 依存ライブラリは極力追加しない。必要な場合は追加前に相談する。
- インデントは半角スペース2つ。
- HTML / CSS / JS はファイルを分ける（`index.html` / `css/` / `js/`）。
- ブラウザで `index.html` を直接開いて動作確認できる状態を保つ。
  ビルド前提の構文やモジュール読み込みは使わない。

## デプロイ

`main` ブランチへのマージで GitHub Pages に公開される
（Settings → Pages で `Deploy from a branch` / `main` / `/ (root)`）。
公開 URL: https://fukayahiroki.github.io/half-it/

## ドキュメントの方針

- README は **上部に使い方、下部に技術情報** の順を保つ。
- ルールや入力できる値の範囲を変えたら、README の該当する表もあわせて更新する。
