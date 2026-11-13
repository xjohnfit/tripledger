import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, messageOf } from '../api'
import { Badge, type BadgeColor, Button, Card, ErrorText, PageHeader } from '../components/ui'
import { dateTime, money } from '../lib/format'
import type { Platform, TripPage } from '../types'

const PAGE_SIZE = 8
const platformColor: Record<Platform, BadgeColor> = { uber: 'slate', lyft: 'blue', direct: 'green' }

export default function Trips() {
  const [filters, setFilters] = useState({ platform: '', start: '', end: '' })
  const [offset, setOffset] = useState(0)
  const [reload, setReload] = useState(0)
  const [page, setPage] = useState<TripPage>({ items: [], total: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .listTrips({ ...filters, limit: PAGE_SIZE, offset })
      .then((data) => {
        if (cancelled) return
        setPage(data)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(messageOf(err))
      })
    return () => {
      cancelled = true
    }
  }, [filters, offset, reload])

  function changeFilter(name: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [name]: value }))
    setOffset(0) // a new filter always starts at page one
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this trip?')) return
    try {
      await api.deleteTrip(id)
      // Deleted the last row on this page? Step back a page instead of showing an empty one.
      if (page.items.length === 1 && offset > 0) setOffset(offset - PAGE_SIZE)
      else setReload((n) => n + 1)
    } catch (err) {
      setError(messageOf(err))
    }
  }

  const from = page.total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, page.total)
  const filterClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700'

  return (
    <>
      <PageHeader title="Trips" subtitle={`${page.total} trips logged`}>
        <Link
          to="/trips/new"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add trip
        </Link>
      </PageHeader>

      <div className="flex gap-3">
        <select
          className={filterClass}
          value={filters.platform}
          onChange={(e) => changeFilter('platform', e.target.value)}
          aria-label="Platform"
        >
          <option value="">All platforms</option>
          <option value="uber">Uber</option>
          <option value="lyft">Lyft</option>
          <option value="direct">Direct</option>
        </select>
        <input
          type="date"
          className={filterClass}
          value={filters.start}
          onChange={(e) => changeFilter('start', e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          className={filterClass}
          value={filters.end}
          onChange={(e) => changeFilter('end', e.target.value)}
          aria-label="To date"
        />
      </div>

      <ErrorText>{error}</ErrorText>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Fare</th>
              <th className="px-4 py-3">Tip</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="w-20 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {page.items.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3.5">{dateTime(t.started_at)}</td>
                <td className="px-4 py-3.5">
                  <Badge color={platformColor[t.platform]}>{t.platform}</Badge>
                </td>
                <td className="px-4 py-3.5">{t.distance_mi} mi</td>
                <td className="px-4 py-3.5">{money(t.fare)}</td>
                <td className="px-4 py-3.5">{money(t.tip)}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-slate-900">{money(t.total)}</td>
                <td className="px-4 py-3.5 text-right">
                  <Button variant="ghost" onClick={() => remove(t.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {page.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No trips match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-[13px] text-slate-500">
        <span>
          Showing {from} to {to} of {page.total}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
            Previous
          </Button>
          <Button variant="secondary" disabled={offset + PAGE_SIZE >= page.total} onClick={() => setOffset(offset + PAGE_SIZE)}>
            Next
          </Button>
        </div>
      </div>
    </>
  )
}
