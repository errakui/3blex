'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    const inputStyles = `
      w-full px-4 py-3 text-sm rounded-xl border
      bg-white text-slate-900 placeholder:text-slate-400
      focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
      transition-all duration-200 ease-out
      ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'}
      ${leftIcon ? 'pl-12' : ''}
      ${rightIcon ? 'pr-12' : ''}
    `

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`${inputStyles} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, hint, ...props }, ref) => {
    const textareaStyles = `
      w-full px-4 py-3 text-sm rounded-xl border
      bg-white text-slate-900 placeholder:text-slate-400
      focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
      transition-all duration-200 ease-out resize-none
      ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'}
    `

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${textareaStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, ...props }, ref) => {
    const selectStyles = `
      w-full px-4 py-3 text-sm rounded-xl border
      bg-white text-slate-900 
      focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
      transition-all duration-200 ease-out cursor-pointer
      ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'}
    `

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`${selectStyles} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Input
