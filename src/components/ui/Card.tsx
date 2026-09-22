import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}
