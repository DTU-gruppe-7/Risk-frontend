import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useRegister } from './useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    registerMutation.mutate(
      { userName, email, password },
      { onSuccess: () => navigate({ to: '/' }) },
    )
  }

  return (
    <main className="flex h-screen items-center justify-center bg-stone-900">
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col gap-3 rounded bg-stone-800 p-6 text-stone-100"
      >
        <h1 className="text-xl">Opret bruger</h1>
        <input
          required
          placeholder="Brugernavn"
          autoComplete="username"
          value={userName}
          onChange={(event) => setUserName(event.target.value)}
          className="rounded bg-stone-700 px-2 py-1"
        />
        <input
          required
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded bg-stone-700 px-2 py-1"
        />
        <input
          required
          minLength={12}
          type="password"
          placeholder="Adgangskode (mindst 12 tegn)"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded bg-stone-700 px-2 py-1"
        />
        <button
          disabled={registerMutation.isPending}
          className="rounded bg-emerald-700 py-1 hover:bg-emerald-600 disabled:opacity-50"
        >
          Opret bruger
        </button>
        {registerMutation.error && <p className="text-red-400">{registerMutation.error.message}</p>}
        <Link to="/login" className="text-center text-stone-300 hover:text-white">
          Har du allerede en bruger? Log ind
        </Link>
      </form>
    </main>
  )
}
