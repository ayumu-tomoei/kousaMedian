import { useState } from 'react'
import { DeviationField } from './components/DeviationField'
import { ResultPanel } from './components/ResultPanel'
import { calculate, type Deviation } from './lib/tolerance'
import './App.css'

interface Example {
  label: string
  base: string
  upper: Deviation
  lower: Deviation
}

const EXAMPLES: Example[] = [
  { label: 'φ180 +0.25 / +0.15', base: '180', upper: { sign: 1, text: '0.25' }, lower: { sign: 1, text: '0.15' } },
  { label: '10 +0.05 / 0', base: '10', upper: { sign: 1, text: '0.05' }, lower: { sign: 1, text: '' } },
  { label: 'φ25 +0.03 / −0.01', base: '25', upper: { sign: 1, text: '0.03' }, lower: { sign: -1, text: '0.01' } },
  { label: 'φ120 0 / −0.06', base: '120', upper: { sign: 1, text: '' }, lower: { sign: -1, text: '0.06' } },
  { label: '4.6 ±0.15', base: '4.6', upper: { sign: 1, text: '0.15' }, lower: { sign: -1, text: '0.15' } },
]

export default function App() {
  const [base, setBase] = useState(EXAMPLES[0].base)
  const [upper, setUpper] = useState<Deviation>(EXAMPLES[0].upper)
  const [lower, setLower] = useState<Deviation>(EXAMPLES[0].lower)

  const calc = calculate({ base, upper, lower })
  const errors = calc.ok ? {} : calc.errors

  function applyExample(ex: Example) {
    setBase(ex.base)
    setUpper(ex.upper)
    setLower(ex.lower)
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">公差計算ツール</p>
        <h1>中央値をすぐ計算</h1>
      </header>

      <ResultPanel calc={calc} />

      <section className="card" aria-labelledby="input-title">
        <h2 id="input-title" className="card-title">
          入力
        </h2>

        <div className="field">
          <label className="field-label" htmlFor="base">
            基準寸法
          </label>
          <div className={`input-box${errors.base ? ' has-error' : ''}`}>
            <input
              id="base"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="例: 180"
              value={base}
              aria-invalid={errors.base ? true : undefined}
              aria-describedby={errors.base ? 'base-error' : undefined}
              onChange={(e) => setBase(e.target.value)}
            />
            <span className="input-unit">mm</span>
          </div>
          {errors.base && (
            <p className="field-error" id="base-error">
              {errors.base}
            </p>
          )}
        </div>

        <DeviationField id="upper" label="上の許容差" value={upper} error={errors.upper} onChange={setUpper} />
        <DeviationField id="lower" label="下の許容差" value={lower} error={errors.lower} onChange={setLower} />

        <p className="note">0 のときは空欄でOK。小数は 3 桁（1μm）まで。</p>

        <div className="examples">
          <h3 className="examples-title">よく出る例</h3>
          <div className="chips">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} type="button" className="chip num" onClick={() => applyExample(ex)}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="page-foot">中央値 ＝ 基準寸法 ＋（上の許容差 ＋ 下の許容差）÷ 2</footer>
    </main>
  )
}
