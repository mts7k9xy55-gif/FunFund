# Roomベースシステム: フロントエンド実装テスト手順

## 変更ファイル一覧

### 新規作成
- `src/components/room/RoomSelector.tsx` - Roomセレクタコンポーネント
- `src/components/room/PaywallBanner.tsx` - Room有効化バナー（後でStripe導線に差し替え）
- `src/components/room/DecisionModal.tsx` - 判断モーダル（stance + reason必須）

### 変更
- `src/components/NewFunFundApp.tsx` - Room関連のstateとロジック追加
- `src/components/composer/ItemComposer.tsx` - 理由入力欄追加、disabledプロパティ追加

## 手動テスト手順（3分）

### 1. Room作成と選択（30秒）

1. アプリを開く
2. 画面上部の「Roomを作成」ボタンをクリック
3. Room名を入力（例: "テストRoom"）
4. Roomが作成され、自動的にactiveになる
5. Roomセレクタで作成したRoomが選択されていることを確認

**期待結果**: Roomが作成され、セレクタに表示される

---

### 2. Roomがactiveでない場合の送信停止（30秒）

1. RoomセレクタでRoomを選択
2. 下部のComposerを確認
3. 入力欄がdisabledになっていることを確認
4. 送信ボタンがdisabledになっていることを確認
5. 「このRoomは有効化が必要」バナーが表示されることを確認

**期待結果**: すべての入力要素がdisabled、バナーが表示される

**注意**: 現在は作成時に自動的にactiveにするため、このテストは後でStripe実装後に確認

---

### 3. 提言作成（理由必須）（30秒）

1. Roomを選択（active状態）
2. Composerで「提言」モードを選択
3. 本文を入力（例: "新機能の提案"）
4. **理由入力欄が表示されることを確認**
5. 理由を入力せずに送信を試みる → **送信できないことを確認**
6. 理由を入力（例: "ユーザーの要望が多い"）
7. 送信 → **成功することを確認**

**期待結果**: 理由入力欄が表示され、理由なしでは送信不可

---

### 4. プロジェクト作成（理由必須）（30秒）

1. Composerで「プロジェクト」モードを選択
2. 本文を入力（例: "プロジェクトX"）
3. **理由入力欄が表示されることを確認**
4. 理由を入力せずに送信を試みる → **送信できないことを確認**
5. 理由を入力（例: "ビジネス価値が高い"）
6. 送信 → **成功することを確認**

**期待結果**: 理由入力欄が表示され、理由なしでは送信不可

---

### 5. 判断ボタン（最重要）（60秒）

1. Thread（スレッド）が表示されている状態で
2. 「判断」ボタンをクリック
3. **DecisionModalが開くことを確認**
4. stance選択（賛成/反対/保留）が表示されることを確認
5. 理由入力欄が表示されることを確認
6. 理由を入力せずに送信を試みる → **送信できないことを確認**
7. 理由を入力（例: "技術的に実現可能"）
8. stanceを選択（例: "賛成"）
9. 「判断を下す」ボタンをクリック
10. **成功メッセージが表示されることを確認**

**期待結果**: DecisionModalが開き、理由必須で判断が送信される

---

### 6. エラーハンドリング（30秒）

1. Roomを選択せずに判断ボタンをクリック
2. 既存のCommitModalが開くことを確認（後方互換）
3. Roomを選択して判断ボタンをクリック
4. DecisionModalが開くことを確認

**期待結果**: Room選択時はDecisionModal、それ以外は既存のCommitModal

---

## 主要コンポーネント

### RoomSelector
- Room一覧を表示
- Room選択
- Room作成ボタン（作成時に自動的にactive化）

### PaywallBanner
- Roomがactiveでない場合に表示
- 後でStripe導線に差し替える前提でコンポーネント化
- draft/past_due/canceledのメッセージを表示

### DecisionModal
- stance選択（賛成/反対/保留）
- 理由入力（必須）
- 送信時に`decide(roomId, threadId, stance, reasonBody)`を呼ぶ
- エラー時は明確なメッセージ表示

### ItemComposer（変更点）
- 理由入力欄追加（提言/プロジェクトモード時）
- disabledプロパティ追加（Roomがactiveでない場合）
- onSubmitにreasonパラメータ追加

---

## 注意事項

1. **Room作成時の自動active化**: 現在は作成時に自動的にactiveにしていますが、後でStripe決済に置き換える前提です。

2. **判断ボタンの挙動**: Room選択時はDecisionModal、それ以外は既存のCommitModalを使用（後方互換）。

3. **理由必須の最終チェック**: UIで補助しますが、最終的な強制はConvex側（既に実装済み）で行われます。

4. **Thread表示**: 現在は既存のitemsベースの表示を使用しています。後でRoomベースのThread表示に置き換える前提です。
