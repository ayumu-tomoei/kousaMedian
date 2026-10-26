import { useEffect, useRef, useState } from 'react'
import { describe, type Calculation, type ToleranceDisplay, type ToleranceResult } from '../lib/tolerance'
import { BlockGaugePanel } from './BlockGaugePanel'
import { Collapse } from './Collapse'
import { RangeList } from './RangeList'

interface Props {
  calc: Calculation
}

export function ResultPanel({ calc }: Props) {
  const display = calc.ok ? describe(calc.result) : null
  const [formulaOpen, setFormulaOpen] = useState(false)
  const [showBlocks, setShowBlocks] = useState(false)
  const pmRef = useRef<HTMLDivElement>(null)
  const hasNotation = display?.notation != null
  const hint = calc.ok ? '基準寸法を入れると中央値が出ます' : '入力を確認してください'

  // 結果が消えるときも縮み終わるまでは直前の結果を見せておき、なめらかに閉じる
  const lastShown = useRef<{ display: ToleranceDisplay; result: ToleranceResult } | null>(null)
  if (calc.ok && display && hasNotation) lastShown.current = { display, result: calc.result }
  const lastHint = useRef(hint)
  if (!hasNotation) lastHint.current = hint
  const shown = lastShown.current

  // ± 表記が消えたら（入力エラーや基準寸法が空）閉じておき、戻ったときに勝手に開かないようにする
  if (formulaOpen && !hasNotation) setFormulaOpen(false)

  // 計算式のポップは、外をタップするか Esc で閉じる
  useEffect(() => {
    if (!formulaOpen) return
    function onPointerDown(e: PointerEvent) {
      if (!pmRef.current?.contains(e.target as Node)) setFormulaOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setFormulaOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [formulaOpen])

  return (
    <section className="hero" aria-label="計算結果">
      <Collapse open={hasNotation}>
        {shown && (
          <>
            <div className="pm" ref={pmRef}>
              <div className="pm-row">
                <button
                  type="button"
                  className="hero-pm"
                  aria-expanded={formulaOpen}
                  aria-controls="formula-pop"
                  onClick={() => setFormulaOpen((open) => !open)}
                >
                  <span>{shown.display.notation?.label}</span>
                  {/* 値と ⓘ は折り返しても離さない */}
                  <span className="pm-value">
                    <strong className="num" aria-live="polite">
                      {shown.display.notation?.text}
                    </strong>
                    <svg className="pm-icon" viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M8 7v4.2M8 4.6v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <button
                  type="button"
                  className="blocks-toggle"
                  aria-pressed={showBlocks}
                  onClick={() => setShowBlocks((v) => !v)}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="1.5" y="9" width="13" height="4.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="3.5" y="5" width="9" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="5.5" y="2" width="5" height="3" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  ブロックゲージ
                </button>
              </div>
              <div id="formula-pop" className="formula-pop" data-open={formulaOpen} aria-hidden={!formulaOpen}>
                <p className="formula-pop-title">計算式</p>
                <p className="formula num">{shown.display.halfFormula}</p>
                {shown.display.baseFormula && <p className="formula num">{shown.display.baseFormula}</p>}
              </div>
            </div>

            <Collapse open={!showBlocks}>
              <RangeList result={shown.result} />
            </Collapse>
            <Collapse open={showBlocks}>
              <BlockGaugePanel result={shown.result} />
            </Collapse>
          </>
        )}
      </Collapse>

      <Collapse open={!hasNotation}>
        <p className="hero-hint">{lastHint.current}</p>
      </Collapse>
    </section>
  )
}
