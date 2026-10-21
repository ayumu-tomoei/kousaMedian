import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages（/リポジトリ名/ 配下）でもそのまま動くよう相対パスで出力する
  base: './',
  plugins: [react()],
})
