import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {!isHome && <Header variant="grid" />}
      <main className="flex-1 bg-black">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
