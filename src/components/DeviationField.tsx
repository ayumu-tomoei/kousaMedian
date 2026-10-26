import { useRef } from 'react'
import { ClearButton } from './ClearButton'
import { splitLeadingSign, type Deviation, type Sign } from '../lib/tolerance'

interface Props {
  id: string
  label: string
  value: Deviation
  error?: string
  /** Enter キーの表示（最後の欄だけ「完了」にする） */
  enterKeyHint?: 'next' | 'done'
  onChange: (value: Deviation) => void
}

const SIGNS: { sign: Sign; label: string; name: string }[] = [
  { sign: 1, label: '+', name: 'プラス' },
  { sign: -1, label: '−', name: 'マイナス' },
]

export function DeviationField({ id, label, value, error, enterKeyHint = 'next', onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const current = SIGNS.find((s) => s.sign === value.sign) ?? SIGNS[0]
  const minusClass = value.sign === -1 ? ' is-minus' : ''

  function handleText(raw: string) {
    // 「-0.06」のように符号ごと打たれたら、符号ボタンに反映して数字だけ残す
    const { sign, rest } = splitLeadingSign(raw)
    onChange({ sign: sign ?? value.sign, text: rest })
  }

  // 符号を切り替えたら、そのまま数字を打てるように入力欄へ
  function handleSign(sign: Sign) {
    onChange({ ...value, sign })
    inputRef.current?.focus()
  }

  function handleClear() {
    onChange({ ...value, text: '' })
    inputRef.current?.focus()
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        <span className={`sign-name${minusClass}`}>（{current.name}）</span>
      </label>
      <div className="deviation-row">
        <div className="sign-toggle" role="group" aria-label={`${label}の符号`}>
          {SIGNS.map((s) => (
            <button
              key={s.sign}
              type="button"
              className={s.sign === -1 ? 'is-minus' : undefined}
              aria-label={s.name}
              aria-pressed={value.sign === s.sign}
              onClick={() => handleSign(s.sign)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ClearButton label={label} disabled={value.text === ''} onClick={handleClear} />
        <div className={`input-box${error ? ' has-error' : ''}`}>
          <span className={`input-sign${minusClass}`} aria-hidden="true">
            {current.label}
          </span>
          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="decimal"
            enterKeyHint={enterKeyHint}
            autoComplete="off"
            placeholder="0"
            value={value.text}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => handleText(e.target.value)}
          />
          <span className="input-unit">mm</span>
        </div>
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}
