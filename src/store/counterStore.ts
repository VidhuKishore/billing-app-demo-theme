import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { ADMIN_PASSWORD } from '@/lib/constants'
import type { BillingRole, SectionType } from '@/types'

export interface Counter {
  id: string
  name: string
  initials: string
  label: string
  role: BillingRole
  process: SectionType[]
  avatarColor: string
  active: boolean
  password: string
}

type CounterInput = {
  name: string
  label: string
  process: SectionType[]
  active: boolean
}

const AVATAR_COLORS = ['deep', 'mint', 'leaf', 'forest', 'highlight', 'charcoal']

const DEFAULT_PASSWORDS: Record<string, string> = {
  billing_a: 'counter1',
  billing_b: 'counter2',
  billing_c: 'counter3',
  billing_d: 'counter4',
  billing_e: 'counter5',
}

const SEED_COUNTERS: Counter[] = [
  {
    id: 'billing_a',
    name: 'Karthikeyan S.',
    initials: 'KS',
    label: 'COUNTER 1',
    role: 'billing_a',
    process: ['Glass', 'Plywood'],
    avatarColor: 'deep',
    active: true,
    password: 'counter1',
  },
  {
    id: 'billing_b',
    name: 'Meenakshi R.',
    initials: 'MR',
    label: 'COUNTER 2',
    role: 'billing_b',
    process: ['Plumbing', 'Painting', 'Electrical'],
    avatarColor: 'mint',
    active: true,
    password: 'counter2',
  },
  {
    id: 'billing_c',
    name: 'Rajan M.',
    initials: 'RM',
    label: 'COUNTER 3',
    role: 'billing_c',
    process: ['Glass', 'Plywood'],
    avatarColor: 'leaf',
    active: true,
    password: 'counter3',
  },
  {
    id: 'billing_d',
    name: 'Priya K.',
    initials: 'PK',
    label: 'COUNTER 4',
    role: 'billing_d',
    process: ['Plumbing', 'Painting', 'Electrical'],
    avatarColor: 'forest',
    active: true,
    password: 'counter4',
  },
  {
    id: 'billing_e',
    name: 'Selvam T.',
    initials: 'ST',
    label: 'COUNTER 5',
    role: 'billing_e',
    process: ['Glass', 'Plywood'],
    avatarColor: 'highlight',
    active: true,
    password: 'counter5',
  },
]

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function createCounterId() {
  return `billing_${crypto.randomUUID().replaceAll('-', '').slice(0, 4)}` as BillingRole
}

function defaultPasswordFor(counter: Pick<Counter, 'id' | 'label'>) {
  if (DEFAULT_PASSWORDS[counter.id]) return DEFAULT_PASSWORDS[counter.id]
  const labelNumber = counter.label.match(/\d+/)?.[0]
  return labelNumber ? `counter${labelNumber}` : 'counter1'
}

function normalizeCounter(counter: Counter): Counter {
  return {
    ...counter,
    password: counter.password || defaultPasswordFor(counter),
  }
}

interface CounterState {
  counters: Counter[]
  adminPassword: string
  addCounter: (data: CounterInput) => Counter
  updateCounter: (id: string, data: CounterInput) => void
  updatePassword: (counterId: string, newPassword: string) => void
  updateAdminPassword: (newPassword: string) => void
  deleteCounter: (id: string) => void
  reorderCounters: (ids: string[]) => void
}

export const useCounterStore = create<CounterState>()(
  persist(
    (set, get) => ({
      counters: SEED_COUNTERS,
      adminPassword: ADMIN_PASSWORD,

      addCounter: (data) => {
        const id = createCounterId()
        const counter: Counter = {
          id,
          name: data.name,
          initials: initialsFromName(data.name),
          label: data.label,
          role: id,
          process: data.process,
          avatarColor: AVATAR_COLORS[get().counters.length % AVATAR_COLORS.length],
          active: data.active,
          password: defaultPasswordFor({ id, label: data.label }),
        }

        set((state) => ({ counters: [...state.counters, counter] }))
        return counter
      },

      updateCounter: (id, data) =>
        set((state) => ({
          counters: state.counters.map((counter) =>
            counter.id === id
              ? {
                  ...counter,
                  name: data.name,
                  initials: initialsFromName(data.name),
                  label: data.label,
                  process: data.process,
                  active: data.active,
                }
              : counter
          ),
        })),

      updatePassword: (counterId, newPassword) =>
        set((state) => ({
          counters: state.counters.map((counter) =>
            counter.id === counterId ? { ...counter, password: newPassword } : counter
          ),
        })),

      updateAdminPassword: (newPassword) => set({ adminPassword: newPassword }),

      deleteCounter: (id) =>
        set((state) => ({
          counters: state.counters.map((counter) =>
            counter.id === id ? { ...counter, active: false } : counter
          ),
        })),

      reorderCounters: (ids) =>
        set((state) => {
          const byId = new Map(state.counters.map((counter) => [counter.id, counter]))
          return {
            counters: [
              ...ids.map((id) => byId.get(id)).filter((counter): counter is Counter => Boolean(counter)),
              ...state.counters.filter((counter) => !ids.includes(counter.id)),
            ],
          }
        }),
    }),
    {
      name: 'billing-app-counters',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<CounterState> | undefined

        return {
          ...state,
          counters: (state?.counters ?? SEED_COUNTERS).map(normalizeCounter),
          adminPassword: state?.adminPassword || ADMIN_PASSWORD,
        } as CounterState
      },
    }
  )
)
