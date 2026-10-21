import { useEffect, useState } from 'react'
import { describe, toPlainText, type Calculation } from '../lib/tolerance'
import { ToleranceBar } from './ToleranceBar'

interface Props {
  calc: Calculation
}

export function ResultPanel({ calc }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const display = calc.ok ? describe(calc.result) : null
  const median = display?.median ?? null

  async function copyMedian() {
    if (median === null) return
    try {
      await navigator.clipboard.writeText(toPlainText(median))
      setCopied(true)
    } catch {
      // クリップボードが使えない環境では何もしない
    }
  }

  return (
    <section className="hero" aria-label="計算結果">
      <div className="hero-head">
        <h2 className="hero-label">中央値（CADモデルはこの値で作る）</h2>
        <button type="button" className="copy-btn" onClick={copyMedian} disabled={median === null}>
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>

      <p className="hero-value" aria-live="polite">
        <span className="num">{median ?? '—'}</span>
        {median !== null && <span className="unit">mm</span>}
      </p>

      {!calc.ok && <p className="hero-hint">入力を確認してください</p>}

      {display && (
        <>
          {display.plusMinus ? (
            <p className="hero-pm">
              <span>± 表記</span>
              <strong className="num">{display.plusMinus}</strong>
            </p>
          ) : (
            <p className="hero-hint">基準寸法を入れると中央値が出ます</p>
          )}
          <p className="formula num">{display.halfFormula}</p>
          {display.baseFormula && <p className="formula num">{display.baseFormula}</p>}
        </>
      )}

      {calc.ok && calc.result.swapped && (
        <p className="notice" role="status">
          上と下が逆だったので、入れ替えて計算しました
        </p>
      )}

      <dl className="stats">
        <div className="stat">
          <dt>上限</dt>
          <dd className="num">{display?.upperLimit ?? '—'}</dd>
          <dd className="stat-sub num">{display?.hi ?? ''}</dd>
        </div>
        <div className="stat">
          <dt>下限</dt>
          <dd className="num">{display?.lowerLimit ?? '—'}</dd>
          <dd className="stat-sub num">{display?.lo ?? ''}</dd>
        </div>
        <div className="stat">
          <dt>公差（幅）</dt>
          <dd className="num">{display?.width ?? '—'}</dd>
          <dd className="stat-sub num">{display?.widthMicrons ?? ''}</dd>
        </div>
      </dl>

      {calc.ok && display && <ToleranceBar result={calc.result} display={display} />}
    </section>
  )
}
