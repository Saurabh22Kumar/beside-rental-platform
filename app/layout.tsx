import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientRoot from "@/components/client-root"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Beside - Peer-to-Peer Item Rental India",
  description: "Rent items from people in your local community across India",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
