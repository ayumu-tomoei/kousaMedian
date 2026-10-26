import { describe, expect, it } from 'vitest'
import { combineBlocks } from './gaugeBlocks'

const mm = (v: number) => Math.round(v * 2000)

function labels(target: number, useWear = false) {
  const c = combineBlocks(mm(target), useWear)
  return c.ok ? c.blocks.map((b) => b.label) : c.message
}

describe('ブロックゲージの組み合わせ', () => {
  it('小さい桁から消していく', () => {
    expect(labels(180.2)).toEqual(['100', '75', '4', '1.20'])
    expect(labels(10.025)).toEqual(['8', '1.02', '1.005'])
    expect(labels(12.009)).toEqual(['11', '1.009'])
    expect(labels(10.0005)).toEqual(['9', '1.0005'])
  })

  it('1 個で済むときは 1 個', () => {
    expect(labels(1.25)).toEqual(['1.25'])
    expect(labels(50)).toEqual(['50'])
  })

  it('合計が目標と一致する', () => {
    for (const t of [4.6, 25.01, 119.97, 30.145, 263.4565]) {
      const c = combineBlocks(mm(t), false)
      if (!c.ok) throw new Error(`${t}: ${c.message}`)
      expect(c.blocks.reduce((s, b) => s + b.units, 0)).toBe(mm(t))
    }
  })

  it('摩耗ブロックを使うと両端の 4mm を引いて組む', () => {
    expect(labels(180.2, true)).toEqual(['100', '75', '1.20'])
  })

  it('大きい段を全部使っても足りないときは 0.5mm の段で埋める', () => {
    const c = combineBlocks(mm(300), false)
    expect(c.ok && c.blocks.reduce((s, b) => s + b.units, 0)).toBe(mm(300))
  })

  it('組めない寸法', () => {
    expect(labels(0.3)).toBe('このセットでは組めません')
    expect(labels(3, true)).toBe('このセットでは組めません')
  })
})
