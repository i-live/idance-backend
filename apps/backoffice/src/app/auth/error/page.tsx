'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@idance/ui'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid credentials. Please check your email and password.'
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign in.'
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account.'
      case 'EmailCreateAccount':
        return 'Could not create account with this email.'
      case 'Callback':
        return 'Error occurred during callback.'
      case 'OAuthAccountNotLinked':
        return 'OAuth account is not linked to any existing account.'
      case 'EmailSignin':
        return 'Error occurred during email sign in.'
      case 'SessionRequired':
        return 'You must be signed in to access this page.'
      default:
        return 'An authentication error occurred.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Authentication Error</h2>
          <p className="mt-4 text-muted-foreground">
            {getErrorMessage(error)}
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={() => window.location.href = '/auth/signin'}
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}