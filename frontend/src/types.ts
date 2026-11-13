// These mirror the JSON that the FastAPI models send. If you change a model in
// models.py, change the matching type here and the compiler lists every place to fix.
export type Platform = 'uber' | 'lyft' | 'direct'
export type Category = 'gas' | 'maintenance' | 'tolls' | 'other'

export interface User {
  id: number
  email: string
}

export interface Trip {
  id: number
  started_at: string // "2026-10-30T11:42:00", no timezone
  platform: Platform
  distance_mi: number
  fare: number
  tip: number
  notes: string | null
  total: number // fare + tip, computed by the API
}
export type TripInput = Omit<Trip, 'id' | 'total'>

export interface TripPage {
  items: Trip[]
  total: number
}

export interface Expense {
  id: number
  spent_on: string // "2026-10-30"
  category: Category
  amount: number
  note: string | null
}
export type ExpenseInput = Omit<Expense, 'id'>

export interface DayTotal {
  day: string
  earnings: number
}

export interface Summary {
  start: string
  end: string
  earnings: number
  trips: number
  expenses: number
  net: number
  by_day: DayTotal[]
  expenses_by_category: Partial<Record<Category, number>>
}
