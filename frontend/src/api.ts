import type { Expense, ExpenseInput, Summary, Trip, TripInput, TripPage, User } from './types'

// Dev: the FastAPI server on your machine. Production: VITE_API_URL=/api (same domain, the Ingress routes it).
const BASE = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const TOKEN_KEY = 'tripledger_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string | null) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// AuthProvider registers a function here so a 401 anywhere logs the user out.
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn
}

// FastAPI sends either {detail: "text"} or {detail: [{loc, msg}, ...]} for 422.
type ErrorBody = { detail?: string | { loc: (string | number)[]; msg: string }[] } | null

function errorMessage(data: ErrorBody) {
  if (!data) return null
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => `${d.loc.slice(1).join('.')}: ${d.msg}`).join('; ')
  }
  return null
}

// A catch block gives you `unknown`, so every component turns it into text with this.
export const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong')

export type Params = Record<string, string | number | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: object
  form?: Record<string, string>
  params?: Params
}

// <T> is the shape of the JSON you expect back. TypeScript cannot check the network,
// so T is a promise you make, and types.ts is where you keep it honest.
async function request<T>(path: string, { method = 'GET', body, form, params }: RequestOptions = {}): Promise<T> {
  // The second argument lets a relative BASE like "/api" resolve against the current site.
  const url = new URL(BASE + path, window.location.origin)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: URLSearchParams | string | undefined
  if (form) {
    payload = new URLSearchParams(form) // the login endpoint wants form data, not JSON
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(url, { method, headers, body: payload })
  if (res.status === 204) return null as T
  const data = (await res.json().catch(() => null)) as ErrorBody

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(res.status, errorMessage(data) ?? res.statusText)
  }
  return data as T
}

export const api = {
  register: (email: string, password: string) =>
    request<User>('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/login', { method: 'POST', form: { username: email, password } }),
  me: () => request<User>('/auth/me'),

  listTrips: (params?: Params) => request<TripPage>('/trips', { params }),
  createTrip: (body: TripInput) => request<Trip>('/trips', { method: 'POST', body }),
  deleteTrip: (id: number) => request<null>(`/trips/${id}`, { method: 'DELETE' }),

  listExpenses: (params?: Params) => request<Expense[]>('/expenses', { params }),
  createExpense: (body: ExpenseInput) => request<Expense>('/expenses', { method: 'POST', body }),
  deleteExpense: (id: number) => request<null>(`/expenses/${id}`, { method: 'DELETE' }),

  summary: (params?: Params) => request<Summary>('/summary', { params }),
}
