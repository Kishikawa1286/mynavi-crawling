# mynavi-crawling

マイナビ2024の検索結果から担当者連絡先メールアドレスを作成する

## 手順

1. git clone
  ```
  git clone https://github.com/Kishikawa1286/mynavi-crawling.git
  ```

2. Visual Studio Code の dev container で動作するのでワークスペースを Visual Studio Code で開く  
  OS によってはポップアップにしたがって dev container を起動する必要がある  
  `yarn install` などは自動で実行される

3. html ファイルを集める  
  [マイナビ 2024 の企業検索](https://job.mynavi.jp/24/pc/corpinfo/displayCorpSearch/index)を行って企業検索結果に移動する  
  各ページを html ファイルとして `assets/` 直下に保存する（ html 以外の画像や js ファイルは不要）

4. スクリプトを実行  
  以下を dev container 内のプロジェクトルートで実行するとプロジェクトトルートに csv ファイルが生成される
  ```
  node ./script.js
  ```
