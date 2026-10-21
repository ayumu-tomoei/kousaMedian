import { splitLeadingSign, type Deviation, type Sign } from '../lib/tolerance'

interface Props {
  id: string
  label: string
  value: Deviation
  error?: string
  onChange: (value: Deviation) => void
}

const SIGNS: { sign: Sign; label: string; name: string }[] = [
  { sign: 1, label: '+', name: 'プラス' },
  { sign: -1, label: '−', name: 'マイナス' },
]

export function DeviationField({ id, label, value, error, onChange }: Props) {
  function handleText(raw: string) {
    // 「-0.06」のように符号ごと打たれたら、符号ボタンに反映して数字だけ残す
    const { sign, rest } = splitLeadingSign(raw)
    onChange({ sign: sign ?? value.sign, text: rest })
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="deviation-row">
        <div className="sign-toggle" role="group" aria-label={`${label}の符号`}>
          {SIGNS.map((s) => (
            <button
              key={s.sign}
              type="button"
              aria-label={s.name}
              aria-pressed={value.sign === s.sign}
              onClick={() => onChange({ ...value, sign: s.sign })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className={`input-box${error ? ' has-error' : ''}`}>
          <input
            id={id}
            type="text"
            inputMode="decimal"
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
