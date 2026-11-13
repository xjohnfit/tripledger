import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ElementType,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-500 hover:text-red-600',
  }
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'ghost' && 'px-2! py-1!',
        styles[variant],
        className,
      )}
    />
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20'

type FieldProps = {
  label: string
  as?: 'input' | 'select' | 'textarea'
  className?: string
} & InputHTMLAttributes<HTMLInputElement> &
  SelectHTMLAttributes<HTMLSelectElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>

export function Field({ label, as = 'input', children, className, ...props }: FieldProps) {
  const Control: ElementType = as
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>
      <Control {...props} className={inputClass}>
        {children}
      </Control>
    </label>
  )
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx('rounded-xl border border-slate-200 bg-white', className)} />
}

const badgeColors = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
}
export type BadgeColor = keyof typeof badgeColors

export function Badge({ color = 'slate', children }: { color?: BadgeColor; children: ReactNode }) {
  return (
    <span className={cx('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', badgeColors[color])}>
      {children}
    </span>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  )
}
