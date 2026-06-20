import './globals.css'
import type { Viewport } from 'next'
import ConnStatus from './_components/ConnStatus'
import Shell from './_components/Shell'

export const metadata = {
  title: 'Mel Gepuklah AI HQ',
  description: 'GLCC Starter — your business in one place',
}

// width=device-width + initial-scale=1 so phones render at real width (no
// desktop-zoom). viewport-fit=cover lets us pad around the notch/home-bar with
// env(safe-area-inset-*) on the fixed mobile top bar.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>
          <ConnStatus />
          {children}
        </Shell>
      </body>
    </html>
  )
}
