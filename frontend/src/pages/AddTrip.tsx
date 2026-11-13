import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, messageOf } from '../api'
import { Button, Card, ErrorText, Field, PageHeader } from '../components/ui'
import { nowTimeInput, todayInput } from '../lib/format'
import type { Platform } from '../types'

// The form keeps everything as strings because that is what inputs give you.
// handleSubmit converts them to the numbers the API wants.
interface TripForm {
  date: string
  time: string
  platform: Platform
  distance: string
  fare: string
  tip: string
  notes: string
}

export default function AddTrip() {
  const navigate = useNavigate()
  const [form, setForm] = useState<TripForm>({
    date: todayInput(),
    time: nowTimeInput(),
    platform: 'uber',
    distance: '',
    fare: '',
    tip: '0',
    notes: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set =
    (name: keyof TripForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.createTrip({
        started_at: `${form.date}T${form.time}`,
        platform: form.platform,
        distance_mi: Number(form.distance),
        fare: Number(form.fare),
        tip: Number(form.tip || 0),
        notes: form.notes.trim() || null,
      })
      navigate('/trips')
    } catch (err) {
      setError(messageOf(err))
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Add trip" subtitle="Log a trip in under 30 seconds" />
      <Card className="max-w-2xl p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorText>{error}</ErrorText>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" type="date" required value={form.date} onChange={set('date')} />
            <Field label="Start time" type="time" required value={form.time} onChange={set('time')} />
            <Field label="Platform" as="select" value={form.platform} onChange={set('platform')}>
              <option value="uber">Uber</option>
              <option value="lyft">Lyft</option>
              <option value="direct">Direct</option>
            </Field>
            <Field
              label="Distance (miles)"
              type="number"
              step="0.1"
              min="0.1"
              max="1000"
              required
              value={form.distance}
              onChange={set('distance')}
            />
            <Field
              label="Fare ($)"
              type="number"
              step="0.01"
              min="0"
              max="10000"
              required
              value={form.fare}
              onChange={set('fare')}
            />
            <Field
              label="Tip ($)"
              type="number"
              step="0.01"
              min="0"
              max="10000"
              value={form.tip}
              onChange={set('tip')}
            />
          </div>
          <Field
            label="Notes (optional)"
            as="textarea"
            rows={3}
            maxLength={500}
            value={form.notes}
            onChange={set('notes')}
          />
          <div className="flex justify-end gap-3">
            <Link
              to="/trips"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save trip'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
