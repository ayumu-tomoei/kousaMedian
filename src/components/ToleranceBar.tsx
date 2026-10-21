import type { ToleranceDisplay, ToleranceResult } from '../lib/tolerance'

interface Props {
  result: ToleranceResult
  display: ToleranceDisplay
}

// 両端の余白（%）
const PAD = 10
// 帯がこれより狭いと上限・下限のラベルが重なるので、1 つにまとめる
const NARROW_BAND = 30

export function ToleranceBar({ result, display }: Props) {
  if (result.base === null) return null

  // 基準（0）と許容差の範囲がすべて入るように目盛りを決める
  const min = Math.min(0, result.lo)
  const max = Math.max(0, result.hi)
  const span = max - min || 1
  const pos = (u: number) => PAD + ((u - min) / span) * (100 - PAD * 2)

  const left = pos(result.lo)
  const right = pos(result.hi)
  const mid = pos(result.offset)
  const narrow = right - left < NARROW_BAND

  return (
    <div className="bar" aria-hidden="true">
      <div className="bar-labels">
        {narrow ? (
          <span className="bar-limit" style={{ left: `${mid}%` }}>
            {display.lowerLimit} – {display.upperLimit}
          </span>
        ) : (
          <>
            <span className="bar-limit" style={{ left: `${left}%` }}>
              {display.lowerLimit}
            </span>
            <span className="bar-limit" style={{ left: `${right}%` }}>
              {display.upperLimit}
            </span>
          </>
        )}
      </div>
      <div className="bar-track">
        <div className="bar-axis" />
        <div className="bar-band" style={{ left: `${left}%`, width: `${right - left}%` }} />
        <div className="bar-base" style={{ left: `${pos(0)}%` }} />
        <div className="bar-median" style={{ left: `${mid}%` }} />
      </div>
      <div className="bar-below">
        <span className="bar-median-label" style={{ left: `${mid}%` }}>
          中央値
        </span>
      </div>
      <div className="bar-below">
        <span className="bar-base-label" style={{ left: `${pos(0)}%` }}>
          基準 {result.base.text}
        </span>
      </div>
    </div>
  )
}
