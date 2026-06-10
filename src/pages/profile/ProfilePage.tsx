import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getStoredAdminPassword,
  setStoredAdminName,
  setStoredAdminPassword,
} from '@/lib/constants'
import { getAdminUser } from '@/lib/userSections'
import { useAuthStore } from '@/store/authStore'
import { useCounterStore } from '@/store/counterStore'

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser)!
  const login = useAuthStore((state) => state.login)
  const counters = useCounterStore((state) => state.counters)
  const updateCounter = useCounterStore((state) => state.updateCounter)
  const updatePassword = useCounterStore((state) => state.updatePassword)

  const isAdmin = currentUser.role === 'admin'
  const counter = counters.find((item) => item.id === currentUser.id)
  const effectiveUser = isAdmin ? getAdminUser() : currentUser
  const [displayName, setDisplayName] = React.useState(effectiveUser.name)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [passwordErrors, setPasswordErrors] = React.useState<string[]>([])

  React.useEffect(() => {
    setDisplayName(effectiveUser.name)
  }, [effectiveUser.name])

  function existingPassword() {
    if (isAdmin) return getStoredAdminPassword()
    return counter?.password ?? ''
  }

  function saveName() {
    const nextName = displayName.trim()
    if (!nextName) return

    if (isAdmin) {
      setStoredAdminName(nextName)
      login(currentUser.id)
    } else if (counter) {
      updateCounter(counter.id, {
        name: nextName,
        label: counter.label,
        process: counter.process,
        active: counter.active,
      })
      login(counter.id)
    }

    toast.success('Name updated successfully')
  }

  function updateOwnPassword() {
    const errors: string[] = []

    if (currentPassword !== existingPassword()) {
      errors.push('Current password is incorrect')
    }
    if (newPassword.length < 4) {
      errors.push('New password must be at least 4 characters')
    }
    if (newPassword !== confirmPassword) {
      errors.push('Passwords do not match')
    }

    setPasswordErrors(errors)
    if (errors.length > 0) return

    if (isAdmin) {
      setStoredAdminPassword(newPassword)
    } else if (counter) {
      updatePassword(counter.id, newPassword)
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password updated successfully')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your display name and sign-in password.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Current name</p>
              <p className="text-base font-medium text-foreground">{effectiveUser.name}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>

            <Button type="button" onClick={saveName}>
              Save Name
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {passwordErrors.length > 0 && (
              <div className="space-y-1">
                {passwordErrors.map((error) => (
                  <p key={error} className="text-sm font-medium text-destructive">{error}</p>
                ))}
              </div>
            )}

            <Button type="button" onClick={updateOwnPassword}>
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
