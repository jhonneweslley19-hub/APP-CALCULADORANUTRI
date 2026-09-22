import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Apple, LayoutDashboard, Menu, ShoppingBasket, X } from 'lucide-react'
import { ToastProvider } from './lib/toast'
import { ConfirmProvider } from './lib/confirm'
import HomePage from './pages/HomePage'
import IngredientsPage from './pages/IngredientsPage'
import ProductsPage from './pages/ProductsPage'
import ProductEditPage from './pages/ProductEditPage'
import LabelPage from './pages/LabelPage'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/produtos', label: 'Produtos', icon: ShoppingBasket, end: false },
  { to: '/ingredientes', label: 'Ingredientes', icon: Apple, end: false },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
  }`
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={onNavigate}>
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div className="size-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
        CN
      </div>
      <div className="leading-tight">
        <p className="font-semibold text-slate-800 text-sm">Calculadora Nutri</p>
        <p className="text-[11px] text-slate-400">Rótulos nutricionais</p>
      </div>
    </div>
  )
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen lg:flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
            <Logo />
            <Sidebar />
          </aside>

          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3">
            <Logo />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
          </div>

          {/* Mobile slide-over menu */}
          {mobileOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-popover animate-slide-in">
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                  <span className="font-semibold text-sm text-slate-800">Menu</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                    aria-label="Fechar menu"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          )}

          <main className="flex-1 lg:pl-60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/produtos/:id" element={<ProductEditPage />} />
                <Route path="/produtos/:id/rotulo" element={<LabelPage />} />
                <Route path="/ingredientes" element={<IngredientsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
