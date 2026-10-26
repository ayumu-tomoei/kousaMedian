interface Props {
  label: string
  disabled: boolean
  onClick: () => void
}

export function ClearButton({ label, disabled, onClick }: Props) {
  return (
    <button type="button" className="clear-btn" aria-label={`${label}を消す`} disabled={disabled} onClick={onClick}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}
