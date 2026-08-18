# half-it

HTML / CSS / JavaScript だけで作るペラいち（単一ページ）の静的サイト。

現在は GitHub Pages で公開できるかを確かめるための動作確認用ページを置いている。

## 公開 URL

https://fukayahiroki.github.io/half-it/

公開設定は GitHub の Settings → Pages で `Deploy from a branch` / `main` / `/ (root)`。

## ディレクトリ構成

```
half-it/
├── index.html      # ページ本体
├── css/style.css   # スタイル
├── js/main.js      # スクリプト
└── .nojekyll       # Jekyll のビルドを無効化し、ファイルをそのまま配信する
```

## ローカルでの確認

`index.html` をブラウザで直接開けば表示できる。

```sh
open index.html
```

相対パスも含めて本番に近い形で確認したい場合はローカルサーバーを立てる。

```sh
python3 -m http.server 8000
# http://localhost:8000/ を開く
```
