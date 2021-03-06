# よけろボール

Ball vs Blocks

ボールを操作してブロックを避けながら進んでいこう。ドットを食べるとボールが大きくなるよ！できるだけ多くドットを食べて、でっかいボールになるんだ。シンプルだけど難しい古典的ゲーム。

<https://liberapp.net/applications/ba08b630-2b72-11e9-8d4e-37f23b7c49da>

## ビルド方法

とくに別ライブラリなどは使っていないので、EgretEngineをインストールしてあればそのままビルドできると思います。

## プログラム解説

基本は、"Main.ts"の１ファイルです。

<https://github.com/liberapp-inc/h5g-ball-vs-blocks/blob/master/src/Main.ts>

### GameObjectクラス

UnityのGameObjectライクなタスク管理クラスです。
このクラスを継承して、ゲーム中のオブジェクトの処理を定義しています。

- update()に毎フレームの処理を書く
- オブジェクトを破棄するときはdestroy()を呼ぶ
- 破棄のときに後処理が必要なら、onDestroy()に記述
- 生成時の初期化はUnityと違い、constructor()を使う（引数を渡せる）
- シーンを切り替えたい場合は transitにシーンロード関数を設定（全オブジェクトを破棄してからtransitを実行）

#### Ballクラス
プレイヤーの操作するボール
#### Blockクラス
上から迫ってくるブロック郡
#### DotEnergyクラス
取るとプレイヤーが巨大化するパワーアイテム
#### BlockWaveクラス
ブロック郡の生成処理
#### Scoreクラス
スコア表示
#### GameOverクラス
ゲームオーバー時の表示と遷移を処理しています。

## 最新コード

ひとまずコンパクトなコードを心がけたので、ファイルも分けずにまとめましたが、最新のプロジェクトではもう少し分類が進んで洗練されています。

物理エンジンを使ってみたコードはこちら。

「つみきタワー」<https://github.com/liberapp-inc/h5g-tower>
