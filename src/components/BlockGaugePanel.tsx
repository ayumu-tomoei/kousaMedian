import { useState } from 'react'
import { BLOCK_SET_NAME, WEAR_BLOCK, combineBlocks } from '../lib/gaugeBlocks'
import { formatMm, type ToleranceResult } from '../lib/tolerance'

interface Props {
  result: ToleranceResult
}

type Target = 'median' | 'upper' | 'lower'

const TARGETS: { key: Target; label: string }[] = [
  { key: 'median', label: '中央値' },
  { key: 'upper', label: '上限' },
  { key: 'lower', label: '下限' },
]

export function BlockGaugePanel({ result }: Props) {
  const [target, setTarget] = useState<Target>('median')
  const [useWear, setUseWear] = useState(false)

  const values: Record<Target, number | null> = {
    median: result.median,
    upper: result.upperLimit,
    lower: result.lowerLimit,
  }
  const value = values[target]
  if (value === null) return null

  const combo = combineBlocks(value, useWear)
  const total = formatMm(value, result.digits)

  return (
    <div className="blocks">
      <h3 className="range-title">ブロックゲージの組み合わせ</h3>

      <div className="blocks-targets" role="group" aria-label="組む寸法">
        {TARGETS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={target === t.key}
            onClick={() => setTarget(t.key)}
          >
            <span>{t.label}</span>
            <span className="num">{formatMm(values[t.key] ?? 0, result.digits)}</span>
          </button>
        ))}
      </div>

      {combo.ok ? (
        <>
          <ol className="blocks-stack" aria-label="重ねるブロック（大きい順）">
            {combo.wear && <li className="block-chip is-wear num">{WEAR_BLOCK.label}</li>}
            {combo.blocks.map((b) => (
              <li key={b.label} className="block-chip num">
                {b.label}
              </li>
            ))}
            {combo.wear && <li className="block-chip is-wear num">{WEAR_BLOCK.label}</li>}
          </ol>
          <p className="blocks-total">
            <span className="num">= {total} mm</span>
            <span>
              （{combo.blocks.length}個{combo.wear ? '＋摩耗ブロック2個' : ''}）
            </span>
          </p>
        </>
      ) : (
        <p className="blocks-error">{combo.message}</p>
      )}

      <label className="blocks-wear">
        <input type="checkbox" checked={useWear} onChange={(e) => setUseWear(e.target.checked)} />
        摩耗ブロック（2mm）を両端に使う
      </label>
      <p className="blocks-note">{BLOCK_SET_NAME}で計算しています</p>
    </div>
  )
}
