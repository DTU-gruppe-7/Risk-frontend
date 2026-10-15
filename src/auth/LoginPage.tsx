import { useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useLogin } from './useAuth'

export default function LoginPage() {
  const { redirect } = useSearch({ from: '/login' })
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    loginMutation.mutate(
      { email, password },
      // Back to the page the user tried to open, e.g. a game after a reload.
      { onSuccess: () => navigate({ href: redirect ?? '/' }) },
    )
  }

  return (
    <main className="flex h-screen items-center justify-center bg-stone-900">
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col gap-3 rounded bg-stone-800 p-6 text-stone-100"
      >
        <h1 className="text-xl">Log ind</h1>
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded bg-stone-700 px-2 py-1"
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded bg-stone-700 px-2 py-1"
        />
        <button
          disabled={loginMutation.isPending}
          className="rounded bg-stone-600 py-1 hover:bg-stone-500 disabled:opacity-50"
        >
          Log ind
        </button>
        {loginMutation.error && <p className="text-red-400">{loginMutation.error.message}</p>}
      </form>
    </main>
  )
}
