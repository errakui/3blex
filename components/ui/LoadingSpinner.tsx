'use client'

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-2 border-brand-200 border-t-brand-600`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <LoadingSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-slate-600 font-medium"
        >
          Caricamento...
        </motion.p>
      </motion.div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
          <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )
}
