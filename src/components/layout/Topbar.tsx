import { Bell, Edit2, KeyRound, LogOut, Menu, PackagePlus, Search, User } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { SidebarInner } from '@/components/layout/Sidebar'
import {
  getStoredAdminPassword,
  GODOWNS_SEED,
  SECTIONS,
  setStoredAdminName,
  setStoredAdminPassword,
} from '@/lib/constants'
import { getActiveUsers, getUserSections } from '@/lib/userSections'
import { useAuthStore } from '@/store/authStore'
import { useCounterStore } from '@/store/counterStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface TopbarProps {
  title?: string
  className?: string
}

function sectionLabel(product: Product) {
  return SECTIONS.find((section) => section.key === product.section)?.label ?? product.section
}

function godownName(godownId: string) {
  return GODOWNS_SEED.find((godown) => godown.id === godownId)?.name ?? godownId
}

export function Topbar({ title, className }: TopbarProps) {
  const { currentUser, logout, login } = useAuthStore()
  const counters = useCounterStore((state) => state.counters)
  const updateCounter = useCounterStore((state) => state.updateCounter)
  const updatePassword = useCounterStore((state) => state.updatePassword)
  const products = useInventoryStore((state) => state.products)
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const [openForm, setOpenForm] = React.useState<'name' | 'password' | null>(null)
  const [displayName, setDisplayName] = React.useState(currentUser?.name ?? '')
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [passwordError, setPasswordError] = React.useState('')

  const currentCounter = currentUser
    ? counters.find((counter) => counter.id === currentUser.id)
    : undefined

  React.useEffect(() => {
    setDisplayName(currentUser?.name ?? '')
  }, [currentUser?.name])

  const lowStockProducts = React.useMemo(() => {
    if (!currentUser) return []
    const allowedSections = getUserSections(currentUser.id)
    return products
      .filter((product) => allowedSections.includes(product.section) && product.stock <= product.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
  }, [currentUser, products])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function resetInlineForms() {
    setOpenForm(null)
    setDisplayName(currentUser?.name ?? '')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  function openNameForm() {
    setOpenForm('name')
    setDisplayName(currentUser?.name ?? '')
    setPasswordError('')
  }

  function openPasswordForm() {
    setOpenForm('password')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  function saveName() {
    if (!currentUser) return
    const nextName = displayName.trim()
    if (!nextName) return

    if (currentUser.role === 'admin') {
      setStoredAdminName(nextName)
      login(currentUser.id)
    } else if (currentCounter) {
      updateCounter(currentCounter.id, {
        name: nextName,
        label: currentCounter.label,
        process: currentCounter.process,
        active: currentCounter.active,
      })
      login(currentCounter.id)
    }

    toast.success('Name updated successfully')
    resetInlineForms()
  }

  function savePassword() {
    if (!currentUser) return
    const storedPassword = currentUser.role === 'admin'
      ? getStoredAdminPassword()
      : useCounterStore.getState().counters.find((counter) => counter.id === currentUser.id)?.password

    if (currentPassword !== storedPassword) {
      setPasswordError('Current password is incorrect')
      return
    }
    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (currentUser.role === 'admin') {
      setStoredAdminPassword(newPassword)
    } else {
      updatePassword(currentUser.id, newPassword)
    }

    toast.success('Password updated successfully')
    resetInlineForms()
  }

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 text-foreground',
        className
      )}
    >
      {/* Hamburger — mobile only */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </Button>

        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarInner onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {title ?? 'Dashboard'}
      </span>

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search bills, products, customers…"
          className="h-8 w-56 pl-8 text-xs lg:w-72"
        />
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      <DropdownMenu open={userMenuOpen} onOpenChange={(open) => {
        setUserMenuOpen(open)
        if (!open) resetInlineForms()
      }}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn('relative h-8 w-8 border-border bg-muted text-brand-mid hover:border-brand-mid hover:text-brand-mid dark:text-brand-light', lowStockProducts.length > 0 && 'animate-glow-pulse')}
            aria-label="Low stock alerts"
          >
            <Bell size={14} />
            {lowStockProducts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF5350] px-1 font-mono text-[10px] leading-none text-white shadow-[0_0_10px_#EF5350]">
                {lowStockProducts.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] border-border bg-card text-foreground">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">Low stock alerts</p>
            <p className="font-normal text-xs text-muted-foreground">
              {lowStockProducts.length} item{lowStockProducts.length === 1 ? '' : 's'} need attention
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {lowStockProducts.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              All stock levels healthy
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-1">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-md px-2 py-2 hover:bg-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sectionLabel(product)} · {godownName(product.godownId)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {product.stock} {product.unit} / min {product.lowStockThreshold}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => navigate('/purchases/new', { state: { restockProductId: product.id } })}
                    >
                      <PackagePlus className="mr-1 h-3 w-3" />
                      Restock
                    </Button>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', product.stock === 0 ? 'bg-[#EF5350]' : 'bg-[#FFB74D]')}
                      style={{ width: `${Math.max(8, Math.min(100, (product.stock / product.lowStockThreshold) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-border bg-muted text-muted-foreground hover:border-brand-mid hover:text-brand-mid dark:hover:text-brand-light"
            aria-label="User menu"
          >
            <User size={14} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 border-border bg-card text-foreground">
          {currentUser && (
            <>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {currentUser.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  openNameForm()
                }}
              >
                <Edit2 size={14} className="mr-2" />
                Edit Name
              </DropdownMenuItem>
              {openForm === 'name' && (
                <div className="space-y-2 px-2 py-2">
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="h-8 text-xs"
                    aria-label="Display name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" className="h-8 text-xs" onClick={saveName}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={resetInlineForms}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  openPasswordForm()
                }}
              >
                <KeyRound size={14} className="mr-2" />
                Change Password
              </DropdownMenuItem>
              {openForm === 'password' && (
                <div className="space-y-2 px-2 py-2">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value)
                      setPasswordError('')
                    }}
                    placeholder="Current password"
                    className="h-8 text-xs"
                  />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value)
                      setPasswordError('')
                    }}
                    placeholder="New password, min 4 chars"
                    className="h-8 text-xs"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setPasswordError('')
                    }}
                    placeholder="Confirm new password"
                    className="h-8 text-xs"
                  />
                  {passwordError && <p className="text-xs font-medium text-destructive">{passwordError}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" className="h-8 text-xs" onClick={savePassword}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={resetInlineForms}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut size={14} className="mr-2" />
            Log out
          </DropdownMenuItem>

          {import.meta.env.DEV && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Dev · switch user
              </DropdownMenuLabel>
              {getActiveUsers().map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => { login(u.id); window.location.reload() }}
                >
                  {u.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
