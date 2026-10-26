// ブロックゲージの組み合わせ。ミツトヨ 112 個組（摩耗ブロック 2mm × 2 付き）を前提にする。
// 値は tolerance.ts と同じく「0.0005mm を 1 とする整数（単位）」で扱う。

const UNITS_PER_MM = 2000

export interface GaugeBlock {
  /** ケースの刻印と同じ書き方 */
  label: string
  units: number
}

function block(label: string): GaugeBlock {
  return { label, units: Math.round(Number(label) * UNITS_PER_MM) }
}

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step)

/** 0.5μm の段：1.0005 */
const HALF_MICRON = block('1.0005')
/** 1μm の段：1.001〜1.009 */
const MICRON = range(1, 9, 1).map((d) => block(`1.00${d}`))
/** 0.01mm の段：1.01〜1.49 */
const HUNDREDTH = range(1, 49, 1).map((d) => block(`1.${String(d).padStart(2, '0')}`))
/** 0.5mm の段：0.5〜24.5 */
const HALF_MM = range(0.5, 24.5, 0.5).map((v) => block(String(v)))
/** 大きい段：25・50・75・100 */
const LARGE = [25, 50, 75, 100].map((v) => block(String(v)))

export const WEAR_BLOCK = block('2')
export const BLOCK_SET_NAME = 'ミツトヨ 112個組'

export type BlockCombination =
  | { ok: true; blocks: GaugeBlock[]; wear: boolean }
  | { ok: false; message: string }

const CANNOT = { ok: false, message: 'このセットでは組めません' } as const

/** 大きい段から、合計がちょうど need になる最少の組み合わせ（need は 25 の倍数） */
function largeBlocksFor(need: number): GaugeBlock[] | null {
  let best: GaugeBlock[] | null = null
  for (let mask = 0; mask < 1 << LARGE.length; mask++) {
    const picked = LARGE.filter((_, i) => mask & (1 << i))
    const sum = picked.reduce((s, b) => s + b.units, 0)
    if (sum === need && (best === null || picked.length < best.length)) best = picked
  }
  return best
}

/**
 * 小さい桁から順に消していく、現場と同じ組み方。
 * 0.5μm → 1μm → 0.01mm → 0.5mm の端数 → 25 の倍数 の順にブロックを選ぶ。
 * 摩耗ブロックを使うときは、先に両端の 2mm × 2 を引いておく。
 */
export function combineBlocks(target: number, useWear: boolean): BlockCombination {
  let rest = target - (useWear ? WEAR_BLOCK.units * 2 : 0)
  if (rest <= 0) return CANNOT
  const blocks: GaugeBlock[] = []
  const take = (b: GaugeBlock) => {
    blocks.push(b)
    rest -= b.units
  }

  // 0.5μm（単位 1 の位）
  if (rest % 2 !== 0) take(HALF_MICRON)
  // 1μm（0.001mm = 単位 2）
  const micron = (rest / 2) % 10
  if (micron !== 0) take(MICRON[micron - 1])
  // 0.01mm：0.5mm の倍数になるように 1.01〜1.49 を選ぶ
  const hundredth = (rest / 20) % 50
  if (hundredth !== 0) take(HUNDREDTH[hundredth - 1])
  if (rest < 0) return CANNOT

  // 25 の倍数にそろえる 0.5mm の段
  const largeStep = LARGE[0].units
  const fraction = rest % largeStep
  if (fraction !== 0) take(HALF_MM.find((b) => b.units === fraction)!)

  const largeMax = LARGE.reduce((s, b) => s + b.units, 0)
  if (rest <= largeMax) {
    const large = largeBlocksFor(rest)
    if (!large) return CANNOT
    large.forEach(take)
  } else {
    // 大きい段を全部使っても足りないぶんは、残っている 0.5mm の段で大きい順に埋める
    LARGE.forEach(take)
    for (const b of [...HALF_MM].reverse()) {
      if (rest === 0) break
      if (b.units <= rest && !blocks.includes(b)) take(b)
    }
  }
  if (rest !== 0) return CANNOT

  return { ok: true, blocks: blocks.sort((a, b) => b.units - a.units), wear: useWear }
}
