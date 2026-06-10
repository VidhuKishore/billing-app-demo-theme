import { getStoredAdminName, MOCK_USERS, SECTIONS } from '@/lib/constants'
import { useCounterStore } from '@/store/counterStore'
import type { Role, Section, SectionType, User } from '@/types'

const SECTION_BY_LABEL: Record<SectionType, Section> = {
  Glass: 'glass',
  Plywood: 'plywood',
  Plumbing: 'plumbing',
  Painting: 'painting',
  Electrical: 'electrical',
}

export function processToSections(process: SectionType[]): Section[] {
  return process.map((label) => SECTION_BY_LABEL[label])
}

export function getAllSections(): Section[] {
  return SECTIONS.map((section) => section.key)
}

export function getAdminUser() {
  const admin = MOCK_USERS.find((user) => user.role === 'admin')!
  return { ...admin, name: getStoredAdminName(admin.name) }
}

export function getUserSections(userId: string): Section[] {
  const admin = getAdminUser()
  if (userId === admin.id || userId === 'admin') return getAllSections()

  const counter = useCounterStore.getState().counters.find((item) => item.id === userId)
  return counter ? processToSections(counter.process) : []
}

export function getUserSectionsForRole(role: Role): Section[] {
  if (role === 'admin') return getAllSections()
  const counter = useCounterStore.getState().counters.find((item) => item.role === role)
  return counter ? processToSections(counter.process) : []
}

export function getActiveUsers(): User[] {
  const counters = useCounterStore.getState().counters
    .filter((counter) => counter.active)
    .map((counter) => ({
      id: counter.id,
      name: counter.name,
      email: `${counter.id}@hardwareco.local`,
      role: counter.role,
      createdAt: '2024-01-10T09:00:00.000Z',
    }))

  return [...counters, getAdminUser()]
}

export function getUserName(userId: string) {
  const counter = useCounterStore.getState().counters.find((item) => item.id === userId)
  if (counter) return counter.name
  return getAdminUser().id === userId ? getAdminUser().name : userId
}

export function isBillingRole(role: Role) {
  return role.startsWith('billing_')
}
