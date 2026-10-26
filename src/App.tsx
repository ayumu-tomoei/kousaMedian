import { useRef, useState, type KeyboardEvent } from 'react'
import { ClearButton } from './components/ClearButton'
import { DeviationField } from './components/DeviationField'
import { ResultPanel } from './components/ResultPanel'
import { calculate, type Deviation } from './lib/tolerance'
import './App.css'

export default function App() {
  const [base, setBase] = useState('')
  const [upper, setUpper] = useState<Deviation>({ sign: 1, text: '' })
  const [lower, setLower] = useState<Deviation>({ sign: 1, text: '' })
  const baseRef = useRef<HTMLInputElement>(null)

  const calc = calculate({ base, upper, lower })
  const errors = calc.ok ? {} : calc.errors

  const swapped = calc.ok && calc.result.swapped

  function swapDeviations() {
    setUpper(lower)
    setLower(upper)
  }

  function clearBase() {
    setBase('')
    baseRef.current?.focus()
  }

  // Enter で次の入力欄へ。最後の欄ではキーボードを閉じる
  function focusNextOnEnter(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement) || e.nativeEvent.isComposing) return
    e.preventDefault()
    const inputs = Array.from(e.currentTarget.querySelectorAll('input'))
    const next = inputs[inputs.indexOf(e.target) + 1]
    if (next) next.focus()
    else e.target.blur()
  }

  return (
    <main className="page">
      <ResultPanel calc={calc} />

      <section className="card" aria-label="入力" onKeyDown={focusNextOnEnter}>
        <div className="field">
          <label className="field-label" htmlFor="base">
            基準寸法
          </label>
          <div className="input-row">
            <ClearButton label="基準寸法" disabled={base === ''} onClick={clearBase} />
            <div className={`input-box${errors.base ? ' has-error' : ''}`}>
              <input
                ref={baseRef}
                id="base"
                type="text"
                inputMode="decimal"
                enterKeyHint="next"
                autoComplete="off"
                placeholder="例: 180"
                value={base}
                aria-invalid={errors.base ? true : undefined}
                aria-describedby={errors.base ? 'base-error' : undefined}
                onChange={(e) => setBase(e.target.value)}
              />
              <span className="input-unit">mm</span>
            </div>
          </div>
          {errors.base && (
            <p className="field-error" id="base-error">
              {errors.base}
            </p>
          )}
        </div>

        <DeviationField id="upper" label="上の許容差" value={upper} error={errors.upper} onChange={setUpper} />
        <DeviationField
          id="lower"
          label="下の許容差"
          value={lower}
          error={errors.lower}
          enterKeyHint="done"
          onChange={setLower}
        />

        {swapped && (
          <div className="swap-hint" role="status">
            <p>上と下が逆です。大きいほうを上限として計算しています</p>
            <button type="button" onClick={swapDeviations}>
              入れ替える
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
