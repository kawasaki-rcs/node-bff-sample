## これはなに？

- ありがちなユーザ名／パスワードを受け取ってトークンを返すダミーのバックエンドAPIです

- ユーザ名／パスワードは初期値でどちらも`guest`固定です

## 使い方


- 事前準備： npm、git、テキストエディタ

```bash
# リポジトリの取得
git clone https://github.com/kawasaki-rcs/node-bff-sample.git

cd node-bff-sample

# パッケージのDL
npm install
```

- 環境設定ファイルを設定
   - `.env.default` を複製して`.env`にリネーム

```bash
# bash の場合
cp .env.default .env
```


- 実行

```bash
# ローカル環境での実行
npm start
```

- アプリ等から `http://localhost:3010/authentication` 等のAPIを叩いて試す


