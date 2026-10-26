import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { rangeRows, type RangeRow, type ToleranceResult } from '../lib/tolerance'

interface Props {
  result: ToleranceResult
}

const TAGS = { upper: '上限', lower: '下限', median: '中央値', step: '', base: '基準' } as const

function tagOf(row: RangeRow) {
  if (!row.atBase) return TAGS[row.kind]
  return row.kind === 'step' ? TAGS.base : `${TAGS[row.kind]}（基準）`
}
const MOVE_MS = 260

type Positions = Map<string, { left: number; top: number }>

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readPositions(list: HTMLElement): Positions {
  const map: Positions = new Map()
  for (const el of list.children) {
    if (el instanceof HTMLElement && el.dataset.key) {
      map.set(el.dataset.key, { left: el.offsetLeft, top: el.offsetTop })
    }
  }
  return map
}

export function RangeList({ result }: Props) {
  const rows = rangeRows(result)
  const hasRows = rows.length > 0
  const listRef = useRef<HTMLOListElement>(null)
  const prevPositions = useRef<Positions>(new Map())
  const [height, setHeight] = useState<number | null>(null)

  // 値が増減したとき、残った行は前の位置から新しい位置へ滑らせる
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const next = readPositions(list)
    if (!reducedMotion()) {
      for (const el of list.children) {
        if (!(el instanceof HTMLElement) || !el.dataset.key) continue
        const from = prevPositions.current.get(el.dataset.key)
        const to = next.get(el.dataset.key)
        if (!from || !to) continue
        const dx = from.left - to.left
        const dy = from.top - to.top
        if (dx === 0 && dy === 0) continue
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: MOVE_MS,
          easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        })
      }
    }
    prevPositions.current = next
  })

  // 行数が変わっても高さが跳ねないよう、中身の高さに合わせて伸び縮みさせる
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new ResizeObserver(() => {
      setHeight(list.offsetHeight)
      // 高さが変わったら位置も変わるので、取り直す
      prevPositions.current = readPositions(list)
    })
    observer.observe(list)
    return () => observer.disconnect()
  }, [hasRows])

  if (!hasRows) return null

  return (
    <div className="range">
      <h3 className="range-title">上限〜下限の間</h3>
      <div className="range-frame" style={height === null ? undefined : { height }}>
        <ol className="range-list" ref={listRef}>
          {rows.map((row) => (
            <Fragment key={row.text}>
              {row.gapBefore && (
                <li className="range-gap" data-key="gap" aria-hidden="true">
                  ⋮
                </li>
              )}
              <li data-key={row.text} className={`range-row is-${row.kind}${row.atBase ? ' at-base' : ''}`}>
                <span className="range-tag">{tagOf(row)}</span>
                <span className="range-value num">{row.text}</span>
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </div>
  )
}
