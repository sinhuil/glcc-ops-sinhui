'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Nav from './Nav'

// App chrome. On desktop this is byte-for-byte the old layout: the .topbar and
// .overlay are display:none (see globals.css), so .app is just .side + .main.
// On phones (<=768px) the sidebar becomes an off-canvas drawer toggled by the
// hamburger; tapping the overlay or navigating closes it.
export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer whenever the route changes — i.e. after tapping a nav item.
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className={`app${open ? ' nav-open' : ''}`}>
      <header className="topbar">
        <button
          className="hamb"
          aria-label="Open navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span /><span /><span />
        </button>
        <span className="topbar-brand"><span className="logo" aria-hidden="true" /> Mel Gepuklah AI HQ</span>
      </header>

      <div className="overlay" onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`side${open ? ' open' : ''}`}>
        <div className="brand"><span className="logo" aria-hidden="true" /> Mel Gepuklah AI HQ</div>
        <Nav />
        <p className="hint">One <code>records</code> table behind all 9 tabs.</p>
      </aside>

      <main className="main">{children}</main>
    </div>
  )
}
