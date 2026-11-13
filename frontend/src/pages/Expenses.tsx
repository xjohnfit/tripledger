import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { api, messageOf } from '../api'
import { Badge, type BadgeColor, Button, Card, ErrorText, Field, PageHeader } from '../components/ui'
import { dayLabel, money, todayInput } from '../lib/format'
import type { Category, Expense, Summary } from '../types'

const categories: Category[] = ['gas', 'maintenance', 'tolls', 'other']
const categoryColor: Record<Category, BadgeColor> = { gas: 'amber', maintenance: 'blue', tolls: 'slate', other: 'green' }
const label = (c: Category) => c[0].toUpperCase() + c.slice(1)

interface ExpenseForm {
  spent_on: string
  category: Category
  amount: string
  note: string
}
const emptyForm = (): ExpenseForm => ({ spent_on: todayInput(), category: 'gas', amount: '', note: '' })

export default function Expenses() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [items, setItems] = useState<Expense[]>([])
  const [reload, setReload] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // The list needs the week's dates, and only the summary knows them, so these run in order.
        const s = await api.summary()
        const list = await api.listExpenses({ start: s.start, end: s.end })
        if (cancelled) return
        setSummary(s)
        setItems(list)
        setError('')
      } catch (err) {
        if (!cancelled) setError(messageOf(err))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [reload])

  const set =
    (name: keyof ExpenseForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value }))

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.createExpense({ ...form, amount: Number(form.amount), note: form.note.trim() || null })
      setForm(emptyForm())
      setShowForm(false)
      setReload((n) => n + 1)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this expense?')) return
    try {
      await api.deleteExpense(id)
      setReload((n) => n + 1)
    } catch (err) {
      setError(messageOf(err))
    }
  }

  const byCategory = summary?.expenses_by_category ?? {}

  return (
    <>
      <PageHeader title="Expenses" subtitle={summary ? `This week, ${money(summary.expenses)} total` : undefined}>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : '+ Add expense'}</Button>
      </PageHeader>

      <ErrorText>{error}</ErrorText>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-4 items-end gap-4">
            <Field label="Date" type="date" required value={form.spent_on} onChange={set('spent_on')} />
            <Field label="Category" as="select" value={form.category} onChange={set('category')}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </Field>
            <Field
              label="Amount ($)"
              type="number"
              step="0.01"
              min="0.01"
              max="10000"
              required
              value={form.amount}
              onChange={set('amount')}
            />
            <Field label="Note" maxLength={200} value={form.note} onChange={set('note')} />
            <div className="col-span-4 flex justify-end">
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save expense'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-4">
        {categories.map((c) => (
          <Card key={c} className="p-5">
            <p className="text-[13px] font-medium text-slate-500">{label(c)}</p>
            <p className="mt-1.5 text-2xl font-bold">{money(byCategory[c])}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="w-20 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {items.map((x) => (
              <tr key={x.id}>
                <td className="px-4 py-3.5">{dayLabel(x.spent_on)}</td>
                <td className="px-4 py-3.5">
                  <Badge color={categoryColor[x.category]}>{x.category}</Badge>
                </td>
                <td className="px-4 py-3.5">{x.note}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-slate-900">{money(x.amount)}</td>
                <td className="px-4 py-3.5 text-right">
                  <Button variant="ghost" onClick={() => remove(x.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No expenses this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  )
}
