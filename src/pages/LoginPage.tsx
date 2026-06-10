import * as React from 'react'
import { ArrowLeft, ArrowRight, Hammer, Power, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { COMPANY } from '@/lib/brand'
import { getStoredAdminPassword, SECTION_COLORS } from '@/lib/constants'
import { getAdminUser } from '@/lib/userSections'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { type Counter, useCounterStore } from '@/store/counterStore'

const AVATAR_CLASSES: Record<string, string> = {
  deep: 'from-brand-dark to-brand-deepest',
  mint: 'from-brand-mid to-brand-dark',
  leaf: 'from-brand-light to-brand-mid',
  forest: 'from-brand-mid to-brand-deepest',
  highlight: 'from-brand-light to-brand-dark',
  charcoal: 'from-brand-dark to-brand-deepest',
}

const ACCENT_CLASSES = [
  'border-brand-mid/40 bg-brand-mid/10 text-brand-mid dark:text-brand-light',
  'border-brand-light/40 bg-brand-light/10 text-brand-dark dark:text-brand-light',
  'border-brand-dark/40 bg-brand-dark/10 text-brand-dark dark:text-brand-light',
  'border-brand-mid/40 bg-brand-mid/10 text-brand-mid dark:text-brand-light',
  'border-brand-light/40 bg-brand-light/10 text-brand-dark dark:text-brand-light',
]

function roleTone(process: Counter['process']) {
  return process.some((item) => item === 'Glass' || item === 'Plywood')
    ? 'text-brand-mid dark:text-brand-light'
    : 'text-brand-dark dark:text-brand-muted'
}

function CounterCard({
  counter,
  index,
  onSelect,
}: {
  counter: Counter
  index: number
  onSelect: (target: LoginTarget) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect({
        id: counter.id,
        name: counter.name,
        initials: counter.initials,
        label: counter.label,
        password: counter.password,
        isAdmin: false,
      })}
      className="group h-full text-left transition duration-200 hover:-translate-y-1"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition duration-200 group-hover:border-brand-mid/50 group-hover:glow-brand">
        <div className="flex items-start justify-between gap-4">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br font-mono text-sm font-bold text-white ring-2 ring-transparent transition group-hover:ring-brand-mid/50', AVATAR_CLASSES[counter.avatarColor] ?? AVATAR_CLASSES.deep)}>
            {counter.initials}
          </div>
          <span className={cn('rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest glow-brand', ACCENT_CLASSES[index % ACCENT_CLASSES.length])}>
            {counter.label}
          </span>
        </div>

        <div className="mt-6 flex-1">
          <h2 className="text-xl font-bold text-foreground">{counter.name}</h2>
          <p className={cn('mt-1 text-sm font-medium', roleTone(counter.process))}>Billing counter workspace</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {counter.process.map((process) => (
              <span
                key={process}
                className="rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${SECTION_COLORS[process]}20`,
                  borderColor: `${SECTION_COLORS[process]}40`,
                  color: SECTION_COLORS[process],
                }}
              >
                {process}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Tap to sign in</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-brand-mid transition group-hover:border-brand-mid group-hover:bg-brand-mid group-hover:text-white group-hover:glow-brand dark:group-hover:text-brand-deepest">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  )
}

interface LoginTarget {
  id: string
  name: string
  initials: string
  label: string
  password: string
  isAdmin: boolean
}

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const counters = useCounterStore((state) => state.counters)
  const navigate = useNavigate()
  const admin = getAdminUser()
  const activeCounters = counters.filter((counter) => counter.active)
  const [selectedTarget, setSelectedTarget] = React.useState<LoginTarget | null>(null)
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [forgotPassword, setForgotPassword] = React.useState(false)

  function openTarget(target: LoginTarget) {
    setSelectedTarget(target)
    setPassword('')
    setError('')
    setForgotPassword(false)
  }

  function closeDialog() {
    setSelectedTarget(null)
    setPassword('')
    setError('')
    setForgotPassword(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTarget) return

    const storedPassword = selectedTarget.isAdmin
      ? getStoredAdminPassword()
      : useCounterStore.getState().counters.find((counter) => counter.id === selectedTarget.id)?.password

    if (password !== storedPassword) {
      setError('Incorrect password. Try again.')
      return
    }

    login(selectedTarget.id)
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-5 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-32 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand-mid/10 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-mid text-white glow-brand dark:text-brand-deepest">
            <Hammer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground sm:text-base">{COMPANY.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{COMPANY.place}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-brand-mid/30 bg-brand-mid/10 px-3 py-2 text-xs font-medium text-brand-mid dark:text-brand-light">
          <span className="h-2 w-2 rounded-full bg-[#4CAF50] shadow-[0_0_10px_#4CAF50] animate-pulse" />
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Secured workspace</span>
          <span className="sm:hidden">Secured</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose your <span className="text-gradient-brand">workspace</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Sign in to the counter assigned to your process, or enter the owner workspace for full administration.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeCounters.map((counter, index) => (
            <CounterCard key={counter.id} counter={counter} index={index} onSelect={openTarget} />
          ))}

          <button
            type="button"
            onClick={() => openTarget({
              id: admin.id,
              name: admin.name,
              initials: 'SV',
              label: 'Owner',
              password: getStoredAdminPassword(),
              isAdmin: true,
            })}
            className="group h-full text-left transition duration-200 hover:-translate-y-1"
          >
            <div className="flex h-full flex-col rounded-2xl border border-brand-light/40 bg-card p-6 transition duration-200 group-hover:glow-highlight">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand-deepest font-mono text-sm font-bold text-white ring-2 ring-brand-light/30">
                  SV
                </div>
                <span className="rounded-full border border-brand-light/40 bg-brand-light/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-light">
                  Owner
                </span>
              </div>

              <div className="mt-6 flex-1">
                <h2 className="text-xl font-bold text-foreground">{admin.name}</h2>
                <p className="mt-1 text-sm font-medium text-brand-dark dark:text-brand-light">Full administration workspace</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-brand-light/30 bg-brand-light/10 px-2.5 py-1 text-xs font-medium text-brand-dark dark:text-brand-light">All sections</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Tap to sign in</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-brand-dark transition group-hover:border-brand-light group-hover:bg-brand-light group-hover:text-brand-deepest group-hover:glow-highlight">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </button>
        </div>
      </main>

      <Dialog open={!!selectedTarget} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className={cn(error && !forgotPassword && 'animate-shake')}>
          {selectedTarget && !forgotPassword && (
            <>
              <button
                type="button"
                className="absolute left-4 top-4 rounded-sm text-muted-foreground transition hover:text-foreground"
                onClick={closeDialog}
                aria-label="Back to workspace selection"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <DialogHeader className="items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-mid font-mono text-base font-bold text-white dark:text-brand-deepest">
                  {selectedTarget.initials}
                </div>
                <DialogTitle>{selectedTarget.name}</DialogTitle>
                <DialogDescription>{selectedTarget.label}</DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="Enter your password"
                  autoFocus
                />
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full">
                  Sign in
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
                  onClick={() => {
                    setForgotPassword(true)
                    setError('')
                  }}
                >
                  Forgot password?
                </button>
              </form>
            </>
          )}

          {selectedTarget && forgotPassword && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  {selectedTarget.isAdmin
                    ? 'Contact Anthropic support or reset via the constants file.'
                    : 'Contact your administrator (Subramaniam V.) to reset your password.'}
                </DialogDescription>
              </DialogHeader>
              <Button type="button" variant="outline" onClick={() => setForgotPassword(false)}>
                Back to sign in
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <footer className="relative z-10 px-5 pb-8 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Power className="h-3.5 w-3.5" />
          2026 {COMPANY.name} - Crafted for daily business use
        </span>
      </footer>
    </div>
  )
}
