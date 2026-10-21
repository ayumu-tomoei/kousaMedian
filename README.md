# kousaMedian

基準寸法と上下の許容差から、公差の **中央値・上限・下限・公差の幅** をすぐ計算する Web アプリです。
図面の `Ø12 +0.012 / +0.006` のような寸法を、CAD モデル用の中央値（12.009）に直すときに使います。

## 計算ルール

```
中央値 = 基準寸法 + (上の許容差 + 下の許容差) ÷ 2
```

- 計算は「0.0005mm を 1 とする整数」で行うので、`0.1 + 0.2` のような小数の誤差は出ません。
- 上下を逆に入力しても入れ替えて計算し、注意を表示します。
- 許容差が空欄なら 0 として計算します。基準寸法が空欄でも、公差の幅は出ます。
- 表示は小数 2 桁が基本です。許容差が 3 桁ならその桁に合わせ、中央値は割り切れない桁が出たら 1 桁増やします（例: `10 +0.05 / 0` → `10.025`）。

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm test         # 計算ロジックのテスト（仕様書の計算例 10 件を含む）
npm run build    # dist/ に出力
```

React + TypeScript + Vite で作っています。計算は [src/lib/tolerance.ts](src/lib/tolerance.ts) にまとまっています。

## GitHub Pages で公開する

`main` ブランチに push すると、[.github/workflows/deploy.yml](.github/workflows/deploy.yml) がテスト・ビルドをして GitHub Pages に公開します。
初回だけ、リポジトリの **Settings → Pages → Build and deployment → Source** を「GitHub Actions」にしてください。
