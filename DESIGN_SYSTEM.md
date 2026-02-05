# FunFund デザインシステム

## 概要

FunFundは、重み付き評価システムを搭載した次世代クラウドファンディングプラットフォームです。このドキュメントは、アプリケーション全体で一貫したデザインを維持するためのデザインシステムを定義します。

## カラーパレット

### Primary Colors

- **Primary**: `#6366F1` (Indigo)
- **Primary Gradient**: `#6366F1` → `#3B82F6` (Indigo to Blue)
- **Primary Foreground**: `#FFFFFF` (White)

### Background Colors

- **Background**: `#F9FAFB` (Light Gray)
- **Card**: `#FFFFFF` (White)

### Text Colors

- **Text Primary**: `#1F2937` (Dark Gray)
- **Text Secondary**: `#6B7280` (Medium Gray)

### Border Colors

- **Border**: `#E5E7EB` (Light Gray)

### Status Colors

- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)

## タイポグラフィ

### フォントファミリー

- **Primary Font**: Geist Sans
- **Monospace Font**: Geist Mono

### フォントサイズ

- **Display (3xl)**: 30px / 1.2 (Bold)
- **Heading 1 (2xl)**: 24px / 1.3 (Bold)
- **Heading 2 (xl)**: 20px / 1.4 (Semibold)
- **Heading 3 (lg)**: 18px / 1.5 (Semibold)
- **Body (base)**: 16px / 1.6 (Regular)
- **Small (sm)**: 14px / 1.5 (Regular)
- **Extra Small (xs)**: 12px / 1.4 (Regular)

## スペーシング

8px基準のスペーシングシステムを使用：

- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px
- `12` = 48px
- `16` = 64px

## ボーダー半径

- **Small**: 8px (`rounded-lg`)
- **Medium**: 12px (`rounded-xl`)
- **Large**: 16px (`rounded-2xl`)
- **Full**: 9999px (`rounded-full`)

## シャドウ

- **Small**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **Medium**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- **Large**: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- **Extra Large**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

## コンポーネント

### ボタン

#### Primary Button
```tsx
<button className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
  ボタン
</button>
```

#### Secondary Button
```tsx
<button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
  ボタン
</button>
```

### カード

```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
  {/* コンテンツ */}
</div>
```

### 入力フィールド

```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
/>
```

### バッジ

```tsx
<span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
  バッジ
</span>
```

## アニメーション

### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Hover Effects
- カード: `hover:shadow-md transition-shadow`
- ボタン: `hover:opacity-90 transition-opacity`
- リンク: `hover:text-indigo-600 transition-colors`

## レスポンシブデザイン

### ブレークポイント

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### グリッドシステム

- **Mobile**: 1列
- **Tablet**: 2列
- **Desktop**: 3列

## アクセシビリティ

### フォーカス状態

すべてのインタラクティブ要素には明確なフォーカス状態が必要：

```css
*:focus-visible {
  outline: 2px solid rgb(99 102 241);
  outline-offset: 2px;
  border-radius: 0.25rem;
}
```

### コントラスト比

- テキストと背景: 最低 4.5:1
- 大きなテキスト: 最低 3:1

## 空状態（Empty State）

```tsx
<div className="text-center py-16">
  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
    <Icon className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    タイトル
  </h3>
  <p className="text-gray-600 text-sm">
    説明文
  </p>
</div>
```

## 使用例

### プロジェクトカード

```tsx
<Link href="/project/1" className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
  <div className="aspect-video bg-gray-100">
    <img src="..." alt="..." className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
  </div>
  <div className="p-5">
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
  </div>
</Link>
```

## 実装ファイル

- `src/app/globals.css` - デザインシステムのCSS変数とユーティリティクラス
- `src/components/projects/ProjectCard.tsx` - プロジェクトカードコンポーネント
- `src/components/projects/ProjectFilters.tsx` - フィルターコンポーネント
- `src/components/dashboard/EvaluationSliderGroup.tsx` - 評価スライダーグループ

## 更新履歴

- 2026-02-04: 初版作成（Indigo #6366F1ベースのデザインシステム）
