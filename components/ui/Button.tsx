'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium rounded-xl
      transition-all duration-200 ease-out tap-highlight-none
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-brand-500 focus-visible:ring-offset-2
    `

    const variants = {
      primary: `
        bg-gradient-to-r from-brand-500 to-brand-600 text-white
        shadow-md shadow-brand-500/25
        hover:from-brand-600 hover:to-brand-700 hover:shadow-lg hover:shadow-brand-500/30
      `,
      secondary: `
        bg-white text-slate-700 border border-slate-200
        hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900
        shadow-xs
      `,
      accent: `
        bg-gradient-to-r from-accent-500 to-accent-600 text-white
        shadow-md shadow-accent-500/25
        hover:from-accent-600 hover:to-accent-700 hover:shadow-lg
      `,
      ghost: `
        text-slate-600 hover:bg-slate-100 hover:text-slate-900
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-red-600 text-white
        shadow-md shadow-red-500/25
        hover:from-red-600 hover:to-red-700
      `,
      outline: `
        bg-transparent text-brand-600 border-2 border-brand-500
        hover:bg-brand-50 hover:border-brand-600
      `,
    }

    const sizes = {
      sm: 'px-3.5 py-2 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'w-10 h-10 p-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
