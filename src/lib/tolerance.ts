// 公差の中央値計算。
// 値はすべて「0.0005mm を 1 とする整数（単位）」で扱い、表示のときだけ mm に戻す。
// 入力は小数 3 桁までなので、どの値も偶数になり、÷ 2 しても必ず割り切れる。

export const MAX_DECIMALS = 3
const MIN_DIGITS = 2
const MAX_INT_DIGITS = 9
/** 1 単位 = 0.0005mm = 0.0001mm × 5 */
const TEN_THOUSANDTHS_PER_UNIT = 5
const MINUS = '−'
const MINUS_LIKE = /[−‐-―ー-]/

export type Sign = 1 | -1

export interface Deviation {
  sign: Sign
  text: string
}

export interface ToleranceInput {
  base: string
  upper: Deviation
  lower: Deviation
}

export type ParsedAmount =
  | { kind: 'empty' }
  | { kind: 'ok'; units: number; decimals: number; text: string }
  | { kind: 'error'; message: string }

export type FieldName = 'base' | 'upper' | 'lower'

export interface ToleranceResult {
  /** 表示の基本桁数 d */
  digits: number
  /** 上下が逆に入力されていて入れ替えた */
  swapped: boolean
  /** 符号付きの許容差（大きいほう・小さいほう） */
  hi: number
  lo: number
  /** (hi + lo) ÷ 2 */
  offset: number
  width: number
  halfWidth: number
  base: { units: number; text: string } | null
  upperLimit: number | null
  lowerLimit: number | null
  median: number | null
}

export type Calculation =
  | { ok: true; result: ToleranceResult }
  | { ok: false; errors: Partial<Record<FieldName, string>> }

export function normalizeNumberText(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/^\s*[φΦØø⌀]/, '')
    .replace(/\s|,/g, '')
}

/** 先頭に付いた + / − を取り出す。許容差の欄に「-0.06」と打たれたとき用。 */
export function splitLeadingSign(raw: string): { sign: Sign | null; rest: string } {
  const s = raw.normalize('NFKC').trimStart()
  if (s.startsWith('+')) return { sign: 1, rest: s.slice(1) }
  if (s !== '' && MINUS_LIKE.test(s[0])) return { sign: -1, rest: s.slice(1) }
  return { sign: null, rest: raw }
}

/** 符号なしの数値を単位に直す。 */
export function parseAmount(raw: string): ParsedAmount {
  const s = normalizeNumberText(raw)
  if (s === '') return { kind: 'empty' }

  const m = /^(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || (m[1] === '' && !m[2])) return { kind: 'error', message: '数字で入力してください' }

  const intText = String(Number(m[1] || '0'))
  const frac = m[2] ?? ''
  if (intText.length > MAX_INT_DIGITS) return { kind: 'error', message: '値が大きすぎます' }
  if (frac.length > MAX_DECIMALS) {
    return { kind: 'error', message: `小数は ${MAX_DECIMALS} 桁（1μm）までです` }
  }

  const thousandths = Number(intText) * 1000 + Number(frac.padEnd(MAX_DECIMALS, '0'))
  return {
    kind: 'ok',
    units: thousandths * 2,
    decimals: frac.length,
    text: frac ? `${intText}.${frac}` : intText,
  }
}

export function calculate(input: ToleranceInput): Calculation {
  const base = parseAmount(input.base)
  const upper = parseAmount(input.upper.text)
  const lower = parseAmount(input.lower.text)

  const errors: Partial<Record<FieldName, string>> = {}
  if (base.kind === 'error') errors.base = base.message
  if (upper.kind === 'error') errors.upper = upper.message
  if (lower.kind === 'error') errors.lower = lower.message
  if (base.kind === 'error' || upper.kind === 'error' || lower.kind === 'error') {
    return { ok: false, errors }
  }

  // 空欄は 0 として扱う
  const up = upper.kind === 'ok' ? upper.units * input.upper.sign : 0
  const low = lower.kind === 'ok' ? lower.units * input.lower.sign : 0
  const swapped = up < low
  const hi = Math.max(up, low)
  const lo = Math.min(up, low)

  const decimalsOf = (p: ParsedAmount) => (p.kind === 'ok' ? p.decimals : 0)
  // 仕様は許容差の桁数だけで決めるが、基準寸法が 3 桁のときに丸めないよう基準も含める
  const digits = Math.min(
    MAX_DECIMALS,
    Math.max(MIN_DIGITS, decimalsOf(upper), decimalsOf(lower), decimalsOf(base)),
  )

  const offset = (hi + lo) / 2
  const width = hi - lo
  const baseValue = base.kind === 'ok' ? { units: base.units, text: base.text } : null

  return {
    ok: true,
    result: {
      digits,
      swapped,
      hi,
      lo,
      offset,
      width,
      halfWidth: width / 2,
      base: baseValue,
      upperLimit: baseValue ? baseValue.units + hi : null,
      lowerLimit: baseValue ? baseValue.units + lo : null,
      median: baseValue ? baseValue.units + offset : null,
    },
  }
}

/**
 * 単位を mm の文字列にする。最低 minDigits 桁を出し、割り切れない桁があれば桁を増やす。
 * マイナスは U+2212。
 */
export function formatMm(units: number, minDigits: number, withPlus = false): string {
  const tenThousandths = units * TEN_THOUSANDTHS_PER_UNIT
  let digits = minDigits
  while (digits < 4 && tenThousandths % 10 ** (4 - digits) !== 0) digits++

  const abs = Math.abs(tenThousandths)
  const intPart = Math.floor(abs / 10000)
  const frac = String(abs % 10000).padStart(4, '0').slice(0, digits)
  const body = digits > 0 ? `${intPart}.${frac}` : String(intPart)

  if (tenThousandths < 0) return MINUS + body
  return withPlus && tenThousandths > 0 ? `+${body}` : body
}

export interface ToleranceDisplay {
  median: string | null
  upperLimit: string | null
  lowerLimit: string | null
  plusMinus: string | null
  width: string
  widthMicrons: string
  hi: string
  lo: string
  halfFormula: string
  baseFormula: string | null
}

export function describe(r: ToleranceResult): ToleranceDisplay {
  const fmt = (u: number) => formatMm(u, r.digits)
  const term = (u: number) => (u < 0 ? `(${fmt(u)})` : fmt(u))
  const median = r.median === null ? null : fmt(r.median)

  return {
    median,
    upperLimit: r.upperLimit === null ? null : fmt(r.upperLimit),
    lowerLimit: r.lowerLimit === null ? null : fmt(r.lowerLimit),
    plusMinus: median === null ? null : `${median} ± ${fmt(r.halfWidth)}`,
    width: fmt(r.width),
    // 単位 2 つで 1μm。hi・lo とも偶数なので幅も必ず割り切れる
    widthMicrons: `${r.width / 2} μm`,
    hi: formatMm(r.hi, r.digits, true),
    lo: formatMm(r.lo, r.digits, true),
    halfFormula: `(${term(r.hi)} + ${term(r.lo)}) ÷ 2 = ${fmt(r.offset)}`,
    baseFormula:
      r.base === null
        ? null
        : `→ ${r.base.text} ${r.offset < 0 ? MINUS : '+'} ${fmt(Math.abs(r.offset))} = ${median}`,
  }
}

/** CAD などに貼るとき用に、マイナスを ASCII に戻す。 */
export function toPlainText(text: string): string {
  return text.split(MINUS).join('-')
}
