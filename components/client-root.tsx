"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/navbar";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="py-6 border-t">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground" suppressHydrationWarning>
                © {new Date().getFullYear()} Beside India. All rights reserved.
              </div>
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
