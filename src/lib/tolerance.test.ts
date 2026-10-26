import { describe as group, expect, it } from 'vitest'
import { calculate, describe, rangeRows, splitLeadingSign, type Deviation, type Sign } from './tolerance'

function dev(value: string): Deviation {
  if (value === '') return { sign: 1, text: '' }
  const sign: Sign = value.startsWith('-') ? -1 : 1
  return { sign, text: value.replace(/^[+-]/, '') }
}

function run(base: string, upper: string, lower: string) {
  const calc = calculate({ base, upper: dev(upper), lower: dev(lower) })
  if (!calc.ok) throw new Error(JSON.stringify(calc.errors))
  return { ...describe(calc.result), swapped: calc.result.swapped }
}

// 仕様書「計算例」の 10 件（空欄は '' で表す）
const SPEC_CASES = [
  { no: 1, base: '180', upper: '+0.25', lower: '+0.15', upperLimit: '180.25', lowerLimit: '180.15', median: '180.20', width: '0.10', microns: '100 μm', pm: '180.20 ± 0.05' },
  { no: 2, base: '10', upper: '+0.05', lower: '', upperLimit: '10.05', lowerLimit: '10.00', median: '10.025', width: '0.05', microns: '50 μm', pm: '10.025 ± 0.025' },
  { no: 3, base: '25', upper: '+0.03', lower: '-0.01', upperLimit: '25.03', lowerLimit: '24.99', median: '25.01', width: '0.04', microns: '40 μm', pm: '25.01 ± 0.02' },
  { no: 4, base: '120', upper: '', lower: '-0.06', upperLimit: '120.00', lowerLimit: '119.94', median: '119.97', width: '0.06', microns: '60 μm', pm: '119.97 ± 0.03' },
  { no: 5, base: '4.6', upper: '+0.15', lower: '-0.15', upperLimit: '4.75', lowerLimit: '4.45', median: '4.60', width: '0.30', microns: '300 μm', pm: '4.60 ± 0.15' },
  { no: 6, base: '12', upper: '+0.012', lower: '+0.006', upperLimit: '12.012', lowerLimit: '12.006', median: '12.009', width: '0.006', microns: '6 μm', pm: '12.009 ± 0.003' },
  { no: 7, base: '30', upper: '+0.21', lower: '+0.08', upperLimit: '30.21', lowerLimit: '30.08', median: '30.145', width: '0.13', microns: '130 μm', pm: '30.145 ± 0.065' },
  { no: 8, base: '50', upper: '+0.02', lower: '+0.04', upperLimit: '50.04', lowerLimit: '50.02', median: '50.03', width: '0.02', microns: '20 μm', pm: '50.03 ± 0.01' },
  { no: 9, base: '1.1', upper: '+0.2', lower: '', upperLimit: '1.30', lowerLimit: '1.10', median: '1.20', width: '0.20', microns: '200 μm', pm: '1.20 ± 0.10' },
  { no: 10, base: '', upper: '+0.1', lower: '', upperLimit: null, lowerLimit: null, median: null, width: '0.10', microns: '100 μm', pm: null },
]

group('仕様書の計算例', () => {
  it.each(SPEC_CASES)('No.$no: $base $upper / $lower', (c) => {
    const d = run(c.base, c.upper, c.lower)
    expect(d.upperLimit).toBe(c.upperLimit)
    expect(d.lowerLimit).toBe(c.lowerLimit)
    expect(d.median).toBe(c.median)
    expect(d.width).toBe(c.width)
    expect(d.widthMicrons).toBe(c.microns)
    expect(d.plusMinus).toBe(c.pm)
  })

  it('上下が逆のときだけ swapped になる', () => {
    expect(run('50', '+0.02', '+0.04').swapped).toBe(true)
    expect(run('180', '+0.25', '+0.15').swapped).toBe(false)
  })
})

group('表示', () => {
  it('マイナスは U+2212 で、計算式にも出る', () => {
    const d = run('120', '', '-0.06')
    expect(d.lo).toBe('−0.06')
    expect(d.halfFormula).toBe('(0.00 + (−0.06)) ÷ 2 = −0.03')
    expect(d.baseFormula).toBe('→ 120 − 0.03 = 119.97')
  })

  it('計算式の基準寸法は入力どおりの桁で出す', () => {
    expect(run('180', '+0.25', '+0.15').baseFormula).toBe('→ 180 + 0.20 = 180.20')
    expect(run('187.5', '+0.1', '').baseFormula).toBe('→ 187.5 + 0.05 = 187.55')
  })
})

group('先頭の表記', () => {
  it('上下が同じ数字の ＋／− なら ± 表記', () => {
    expect(run('4.6', '+0.15', '-0.15').notation).toEqual({ label: '± 表記', text: '4.60 ± 0.15' })
  })

  it('＋＋・−−・0 を含むときは許容差を大きい順に並べる', () => {
    expect(run('180', '+0.25', '+0.15').notation).toEqual({ label: '公差表記', text: '180 +0.25 / +0.15' })
    expect(run('180', '-0.25', '-0.15').notation).toEqual({ label: '公差表記', text: '180 −0.15 / −0.25' })
    expect(run('25', '+0.03', '-0.01').notation).toEqual({ label: '公差表記', text: '25 +0.03 / −0.01' })
    expect(run('10', '+0.05', '').notation).toEqual({ label: '公差表記', text: '10 +0.05 / 0' })
  })

  it('基準寸法が空なら出さない', () => {
    expect(run('', '+0.1', '').notation).toBeNull()
  })
})

group('上限と下限の間', () => {
  // 'step' 以外は「値:種類」、基準と重なる行は「(基準)」、区切りの後は先頭に「⋮ 」
  function rows(base: string, upper: string, lower: string) {
    const calc = calculate({ base, upper: dev(upper), lower: dev(lower) })
    if (!calc.ok) throw new Error(JSON.stringify(calc.errors))
    return rangeRows(calc.result).map(
      (r) =>
        (r.gapBefore ? '⋮ ' : '') +
        r.text +
        (r.kind === 'step' ? '' : `:${r.kind}`) +
        (r.atBase ? '(基準)' : ''),
    )
  }

  it('＋＋は 0.01 刻みで並び、基準を下に区切って出す', () => {
    expect(rows('180', '+0.25', '+0.15')).toEqual([
      '180.25:upper', '180.24', '180.23', '180.22', '180.21', '180.20:median',
      '180.19', '180.18', '180.17', '180.16', '180.15:lower', '⋮ 180.00:base',
    ])
  })

  it('−−は基準を上に区切って出す', () => {
    expect(rows('180', '-0.15', '-0.25')).toEqual([
      '180.00:base', '⋮ 179.85:upper', '179.84', '179.83', '179.82', '179.81', '179.80:median',
      '179.79', '179.78', '179.77', '179.76', '179.75:lower',
    ])
  })

  it('刻みに乗らない中央値は差し込み、基準と同じ下限には印を付ける', () => {
    expect(rows('10', '+0.05', '')).toEqual([
      '10.05:upper', '10.04', '10.03', '10.025:median', '10.02', '10.01', '10.00:lower(基準)',
    ])
  })

  it('＋−は基準が範囲の中に入る', () => {
    expect(rows('25', '+0.03', '-0.01')).toEqual([
      '25.03:upper', '25.02', '25.01:median', '25.00(基準)', '24.99:lower',
    ])
  })

  it('幅が広いときは刻みを粗くする', () => {
    const r = rows('4.6', '+0.15', '-0.15')
    expect(r.length).toBeLessThanOrEqual(22)
    expect(r.slice(0, 3)).toEqual(['4.75:upper', '4.74', '4.72'])
    expect(r).toContain('4.60:median(基準)')
  })

  it('基準寸法が空・幅 0 のときは出さない', () => {
    expect(rows('', '+0.1', '')).toEqual([])
    expect(rows('10', '', '')).toEqual([])
  })
})

group('入力', () => {
  it('小数 4 桁以上はエラー', () => {
    const calc = calculate({ base: '12', upper: dev('+0.0125'), lower: dev('') })
    expect(calc.ok).toBe(false)
  })

  it('全角数字とφ付きの基準寸法を受け付ける', () => {
    expect(run('φ１８０', '+０．２５', '+0.15').median).toBe('180.20')
  })

  it('先頭の符号を取り出す', () => {
    expect(splitLeadingSign('-0.06')).toEqual({ sign: -1, rest: '0.06' })
    expect(splitLeadingSign('−0.06')).toEqual({ sign: -1, rest: '0.06' })
    expect(splitLeadingSign('+0.1')).toEqual({ sign: 1, rest: '0.1' })
    expect(splitLeadingSign('0.1')).toEqual({ sign: null, rest: '0.1' })
  })
})
