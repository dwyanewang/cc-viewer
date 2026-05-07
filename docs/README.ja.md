# CC-Viewer

Claude Code をベースに、自身の開発経験を蒸留・蓄積した Vibe Coding ツール：

1. 能力の上限を引き上げる：/ultraPlan、/ultraReview をローカルで実行でき、プロジェクトのコードを Claude のクラウドに完全に公開せずに済みます；
2. マルチデバイス同時対応：ローカルネットワーク内でモバイル端末からのプログラミングが可能、Web 版はあらゆるシーンに自動適応し、ブラウザ拡張や OS の画面分割への組み込みも容易、ネイティブインストーラも提供；
3. 完全なログトレース：Claude Code のペイロードを丸ごと傍受・解析できる機能を提供し、ロギング、問題分析、学習、リバースエンジニアリングに最適；
4. 学習・経験の共有：多くの学習資料や開発経験を蓄積しています（システム各所の「?」アイコンをご覧ください）；
5. ネイティブ体験の維持：Claude Code の能力を強化するのみで、コアには一切実質的な変更を加えず、ネイティブ体験を保ちます；
6. サードパーティモデル対応：deepseek-v4-*、GLM 5.1、Kimi K2.6 に対応、cc-switch 機能を内蔵しており、サードパーティツールにいつでもホットスイッチ可能です。

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | 日本語 | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | [العربية](./README.ar.md) | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## 使い方

### 前提条件

- Node.js 22.0.0+ がインストール済みであることを確認してください；[ダウンロードしてインストール](https://nodejs.org)
- Claude Code がインストール済みであることを確認してください；[インストールガイド](https://github.com/anthropics/claude-code)

### ccv のインストール

#### npm でインストール

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### Homebrew でインストール (macOS / Linux 推奨)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # アップデート用 — brew インストールでは npm install -g を使わないでください
```

### 起動方法

ccv は claude のドロップイン代替です — すべての引数は Web Viewer を起動しながら claude に渡されます。

```bash
ccv                    # == claude (interactive mode)
```

作者が最もよく使うコマンドは：
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # ccv は Claude Code のすべての起動引数をパススルーします — お好みで自由に組み合わせてください
```

プログラミングモードで起動すると、Web ページが自動的に開きます。

CC-Viewer はネイティブデスクトップアプリとしても提供されています：[ダウンロードページ](https://github.com/weiesky/cc-viewer/releases)


### ロガーモード

ネイティブの claude ツールや VS Code 拡張機能を引き続き好む場合は、このモードを使用してください。

このモードでは、`claude` を起動すると自動的にロギングプロセスが開始され、リクエストログが ~/.claude/cc-viewer/*yourproject*/date.jsonl に記録されます。

ロガーモードを有効にする：
```bash
ccv -logger
```

コンソールが具体的なポートを出力できない場合、デフォルトの最初のポートは 127.0.0.1:7008 です。複数のインスタンスは 7009、7010 のように順次ポートを使用します。

ロガーモードをアンインストール：
```bash
ccv --uninstall
```

### トラブルシューティング

cc-viewer の起動で問題が発生した場合、究極のトラブルシューティング方法は次のとおりです：

ステップ 1：任意のディレクトリで Claude Code を開きます。

ステップ 2：Claude Code に次の指示を与えます：

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

Claude Code に自身で問題を診断させることは、誰かに尋ねたりどんなドキュメントを読んだりするよりも効果的です！

上記の指示が完了すると、`findcc.js` が更新されます。プロジェクトが頻繁にローカルデプロイを必要とする場合、またはフォークされたコードがしばしばインストールの問題を解決する必要がある場合、このファイルを保持しておけば、次回は単にコピーするだけで済みます。現段階では、Claude Code を使用している多くのプロジェクトや会社が Mac ではなくサーバー側のホスト環境にデプロイしているため、作者は今後の cc-viewer ソースコード更新の追跡を容易にするために `findcc.js` を分離しました。


### その他のコマンド

参照：

```bash
ccv -h
```

### サイレントモード

デフォルトでは、`ccv` は `claude` をラップする際にサイレントモードで実行され、ターミナル出力をクリーンに保ち、ネイティブ体験と一貫性を持たせます。すべてのログはバックグラウンドでキャプチャされ、`http://localhost:7008` で閲覧できます。

設定が完了したら、通常通り `claude` コマンドを使用してください。`http://localhost:7008` にアクセスして監視インターフェイスを開けます。


## 機能


### プログラミングモード

ccv で起動すると、次のものが確認できます：

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


編集後すぐにコード diff を表示できます：

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

ファイルとコードを手動で開くことも可能ですが、手動コーディングは推奨しません — それは旧式のコーディングです！

### モバイルプログラミング

QR コードをスキャンしてモバイル端末からコーディングすることもできます：

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

モバイルプログラミングの想像を実現してください。プラグインメカニズムもあります — 自分のコーディング習慣に合わせてカスタマイズが必要な場合は、プラグイン hook の更新にご期待ください。


### ロガーモード（完全な Claude Code セッションの閲覧）

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- Claude Code のすべての API リクエストをリアルタイムにキャプチャし、編集されていない原文のテキストを保証します（これは重要です！！！）
- Main Agent と Sub Agent のリクエストを自動的に識別・ラベリング（サブタイプ：Plan、Search、Bash）
- MainAgent リクエストは Body Diff JSON をサポートし、前回の MainAgent リクエストとの差分（変更/追加フィールドのみ）を折りたたみ表示します
- 各リクエストには Token 使用統計がインラインで表示されます（入出力 tokens、キャッシュ生成/読み取り、ヒット率）
- Claude Code Router (CCR) やその他のプロキシシナリオとの互換性 — API パスパターンマッチングにフォールバックします

### 会話モード

右上の「会話モード」ボタンをクリックすると、Main Agent の完全な会話履歴をチャットインターフェイスに解析します：

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- Agent Team 表示はまだサポートされていません
- ユーザーメッセージは右寄せ（青い吹き出し）、Main Agent の返信は左寄せ（暗い吹き出し）
- `thinking` ブロックはデフォルトで折りたたまれ、Markdown としてレンダリングされます — クリックして展開すると思考プロセスを表示できます；ワンクリック翻訳がサポートされています（機能はまだ不安定です）
- ユーザー選択メッセージ（AskUserQuestion）は Q&A 形式で表示されます
- 双方向モード同期：会話モードに切り替えると、選択中のリクエストに対応する会話へ自動スクロールします；生モードに戻すと、選択中のリクエストへ自動スクロールします
- 設定パネル：ツール結果および thinking ブロックのデフォルトの折りたたみ状態を切り替えます
- モバイル会話ブラウジング：モバイル CLI モードで、上部バーの「会話ブラウズ」ボタンをタップすると、読み取り専用の会話ビューがスライドアウトし、モバイルで完全な会話履歴を閲覧できます

### ログ管理

左上の CC-Viewer ドロップダウンメニューから：

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**ログ圧縮**
ログに関して、作者は Anthropic の公式定義が変更されていないことを明確にしたいと考えています。これによりログの整合性が保証されます。しかし、1M Opus モデルの個々のログエントリは後半段階で極めて大きくなる可能性があるため、MainAgent に対する一部のログ最適化のおかげで、gzip なしでも少なくとも 66% のサイズ削減が達成されます。これらの圧縮ログの解析方法は、現在のリポジトリから抽出できます。

### さらに便利な機能

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

サイドバーツールを使用してプロンプトを素早く特定できます。

--- 

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

興味深い KV-Cache-Text 機能により、Claude が見ている内容を正確に確認できます。

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

画像をアップロードして要望を記述できます — Claude の画像理解能力は驚くほど強力です。そしてご存じのとおり、Ctrl+V で直接画像を貼り付けることができ、完全な内容が会話に表示されます。

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

プラグインをカスタマイズし、すべての CC-Viewer プロセスを管理でき、CC-Viewer は第三者 API へのホットスイッチングをサポートします（はい、GLM、Kimi、MiniMax、Qwen、DeepSeek を使用できます — ただし作者は現時点ではそれらがいずれもかなり非力だと考えています）。

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

発見を待っているさらに多くの機能があります…… 例えば：システムは Agent Team をサポートし、内蔵の Code Reviewer を備えています。Codex Code Reviewer 統合も近日登場（作者は Codex を使って Claude Code のコードをレビューすることを強く推奨します）。

## License

MIT
