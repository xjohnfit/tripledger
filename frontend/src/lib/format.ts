const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const money = (n?: number | null) => usd.format(n ?? 0)

// The API sends "2026-10-30" (date) and "2026-10-30T11:42:00" (no timezone).
// Adding a time to a bare date makes the browser read it as local time.
const toDate = (s: string) => new Date(s.length === 10 ? `${s}T00:00:00` : s)

export const shortDate = (s: string) =>
  toDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const weekday = (s: string) => toDate(s).toLocaleDateString('en-US', { weekday: 'short' })

export const dayLabel = (s: string) =>
  toDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

export const dateTime = (s: string) =>
  toDate(s).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

const pad = (n: number) => String(n).padStart(2, '0')
export const todayInput = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const nowTimeInput = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
