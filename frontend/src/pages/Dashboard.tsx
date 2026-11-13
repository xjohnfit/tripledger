import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, messageOf } from '../api'
import { Card, ErrorText, PageHeader } from '../components/ui'
import { dateTime, money, shortDate, weekday } from '../lib/format'
import type { Summary, Trip } from '../types'

function Stat({
  label,
  value,
  note,
  tone = 'text-slate-500',
}: {
  label: string
  value: string | number
  note: string
  tone?: string
}) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-3xl font-bold">{value}</p>
      <p className={`mt-1.5 text-xs font-medium ${tone}`}>{note}</p>
    </Card>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [recent, setRecent] = useState<Trip[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([api.summary(), api.listTrips({ limit: 4 })])
      .then(([s, trips]) => {
        if (cancelled) return
        setSummary(s)
        setRecent(trips.items)
      })
      .catch((err) => {
        if (!cancelled) setError(messageOf(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <ErrorText>{error}</ErrorText>
  if (!summary) return <p className="text-sm text-slate-500">Loading...</p>

  const best = Math.max(...summary.by_day.map((d) => d.earnings), 1)
  const avg = summary.trips ? money(summary.earnings / summary.trips) : '$0.00'

  return (
    <>
      <PageHeader title="This week" subtitle={`${shortDate(summary.start)} to ${shortDate(summary.end)}`}>
        <Link
          to="/trips/new"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add trip
        </Link>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Earnings" value={money(summary.earnings)} note={`${avg} per trip`} tone="text-emerald-700" />
        <Stat label="Trips" value={summary.trips} note="Mon to Sun" />
        <Stat
          label="Expenses"
          value={money(summary.expenses)}
          note={`${Object.keys(summary.expenses_by_category).length} categories`}
        />
        <Stat
          label="Net"
          value={money(summary.net)}
          note="After expenses"
          tone={summary.net < 0 ? 'text-red-600' : 'text-emerald-700'}
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-3 p-6">
          <h2 className="font-semibold">Earnings by day</h2>
          <div className="mt-5 flex h-56 items-end justify-between">
            {summary.by_day.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2">
                <span className="h-4 text-xs font-medium text-slate-500">
                  {d.earnings ? `$${Math.round(d.earnings)}` : ''}
                </span>
                <div
                  className={`w-11 rounded-md ${d.earnings ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  style={{ height: Math.max(4, Math.round((d.earnings / best) * 150)) }}
                />
                <span className="text-xs text-slate-500">{weekday(d.day)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-2 p-6">
          <h2 className="font-semibold">Recent trips</h2>
          {recent.length === 0 && <p className="mt-4 text-sm text-slate-500">No trips yet. Add your first one.</p>}
          <ul className="mt-2 divide-y divide-slate-200">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium capitalize">
                    {t.platform}, {t.distance_mi} mi
                  </p>
                  <p className="text-xs text-slate-500">{dateTime(t.started_at)}</p>
                </div>
                <p className="text-sm font-semibold">{money(t.total)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
