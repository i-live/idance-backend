'use client'

import { Button, ThemeToggle } from '@idance/ui'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function HomePage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">iDance Backoffice</h1>
          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => signIn()}>
                Sign In
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              Manage the entire iDance ecosystem with full administrative privileges.
            </p>
            <Button disabled={status !== 'authenticated'}>
              {status === 'authenticated' ? 'Access Admin Panel' : 'Sign in to access'}
            </Button>
          </div>
          
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="text-muted-foreground mb-4">
              Configure your profile, user-site, and affiliate management.
            </p>
            <Button variant="outline" disabled={status !== 'authenticated'}>
              {status === 'authenticated' ? 'Manage Profile' : 'Sign in to access'}
            </Button>
          </div>
          
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Authentication</h2>
            <p className="text-muted-foreground mb-4">
              {status === 'authenticated'
                ? 'You are signed in and can access all features.'
                : 'Sign in to access your personalized dashboard and settings.'
              }
            </p>
            {status === 'authenticated' ? (
              <Button variant="secondary" onClick={() => window.location.href = '/auth/signin'}>
                Manage Account
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => window.location.href = '/auth/signin'}>
                Sign In
              </Button>
            )}
          </div>
        </div>

        {status === 'authenticated' && session.user && (
          <div className="mt-8 p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Session Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
              <p><strong>Status:</strong> {session.user.user_status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}