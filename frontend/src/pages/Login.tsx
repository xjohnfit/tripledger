import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { messageOf } from '../api'
import { useAuth } from '../authContext'
import { Button, ErrorText, Field } from '../components/ui'

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await (mode === 'login' ? login(email, password) : register(email, password))
      navigate('/')
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="flex min-h-screen bg-white">
      <section className="hidden w-[44%] flex-col justify-center gap-5 bg-emerald-600 p-16 text-white lg:flex">
        <div className="grid size-11 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-600">T</div>
        <p className="text-xl font-semibold">TripLedger</p>
        <h2 className="max-w-md text-4xl leading-tight font-bold">Know what you actually earn per hour.</h2>
        <ul className="space-y-3 text-emerald-50">
          <li>Log trips in seconds</li>
          <li>Track gas, tolls and maintenance</li>
          <li>See your weekly net at a glance</li>
        </ul>
      </section>

      <section className="grid flex-1 place-items-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {isLogin ? 'Sign in to see your trips and earnings.' : 'Start logging trips in under a minute.'}
            </p>
          </div>

          <ErrorText>{error}</ErrorText>
          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'One moment...' : isLogin ? 'Sign in' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-slate-500">
            {isLogin ? 'No account yet? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? 'register' : 'login')
                setError('')
              }}
              className="font-medium text-emerald-700 hover:underline"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}
