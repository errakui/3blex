import React from 'react'

interface ChipProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`chip ${active ? 'chip-active' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

