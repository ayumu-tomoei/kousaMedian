import type { ReactNode } from 'react'

interface Props {
  open: boolean
  children: ReactNode
}

/** 高さ 0 ⇔ 中身の高さをなめらかに切り替える。閉じている間は読み上げ・操作の対象から外す */
export function Collapse({ open, children }: Props) {
  return (
    <div className="collapse" data-open={open} aria-hidden={!open} inert={!open}>
      <div className="collapse-inner">{children}</div>
    </div>
  )
}
