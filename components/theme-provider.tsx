'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force client-side only to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Ensure the same content is initially rendered on both server and client
  return (
    <NextThemesProvider {...props}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </NextThemesProvider>
  )
}
