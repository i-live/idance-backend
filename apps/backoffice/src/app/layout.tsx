import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@idance/auth'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iDance Backoffice',
  description: 'Admin interface for iDance platform',
}

// Theme script to prevent flash
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme') || 'system';
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (e) {}
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}