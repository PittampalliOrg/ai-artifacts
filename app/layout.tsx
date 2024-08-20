import { Analytics } from '@vercel/analytics/react'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { SidebarDesktop } from '@/components/sidebar-desktop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Artifacts by E2B',
  description: 'Hackable open-source version of Anthropic\'s AI Artifacts chat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen font-sans antialiased',
        inter.className
      )}>
        <TooltipProvider>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex-1 flex">
                <SidebarDesktop />
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </TooltipProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}