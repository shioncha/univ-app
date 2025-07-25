# univ-app

univ-app は、時間割と課題を管理するアプリです。

iOS と Android で動作する React Native アプリです。Android 向けは、 [Release](https://github.com/shioncha/univ-app/releases) から APK をダウンロードできます。iOS 向けは、バイナリを配布していませんが、Expo Go を使ってアプリを起動できます。

## Motivation

納得のいく時間割アプリがなかったため、React Native を使って作成しました。時間割の表示と課題の管理を一つのアプリで行えるようにしています。また、時間割の自動追加機能や課題の提出期限通知など、あると嬉しい便利な機能を追加しています。

## Features

- 📅 時間割の表示
- 📝 課題の管理
- 🔴 課題の提出期限を通知
- 🧩 Chrome 拡張機能 ([shioncha/univ-app-extension](https://github.com/shioncha/univ-app-extension)) を利用した、時間割の自動追加
- 📷 QR コードをスキャンして、時間割を共有
- 📱 Android と iOS の両方で動作
- 🌙 ダークモードに切り替え可能

## Tech Stack

- Language
  - [JavaScript](https://www.javascript.com/)
  - [TypeScript](https://www.typescriptlang.org/)
- Framework
  - [React Native](https://reactnative.dev/)
  - [Expo](https://expo.dev/)
- Navigation
  - [React Navigation](https://reactnavigation.org/)
- Database
  - SQLite ([expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/))

## Usage

### iOS

iOS でアプリを使用するには、Expo Go をインストールしてください。

### Android

Android でアプリを使用するには、[Release](https://github.com/shioncha/univ-app/releases) から APK ファイルをダウンロードしてインストールしてください。

## Dev.

Node.js と pnpm が利用できる環境を用意してください。[Volta](https://volta.sh) を使ってインストールすることを推奨します。また、iOS 向けにローカルでビルドする場合は、Xcode が必要です。

環境が整ったら、リポジトリをクローンして、以下のコマンドを実行してください。

```bash
pnpm install
```

次に、Expo Go を使ってアプリを起動します。以下のコマンドを実行してください。

```bash
pnpm expo start
```

Expo Go が起動し、QR コードが表示されます。スマートフォンの Expo Go アプリで QR コードをスキャンするか、表示された URL にアクセスしてアプリを起動してください。
