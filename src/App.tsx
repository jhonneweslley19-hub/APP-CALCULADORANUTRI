import { NavLink, Route, Routes } from 'react-router-dom'
import IngredientsPage from './pages/IngredientsPage'
import ProductsPage from './pages/ProductsPage'
import ProductEditPage from './pages/ProductEditPage'
import LabelPage from './pages/LabelPage'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'
  }`

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-emerald-700">Calculadora Nutri</h1>
          <nav className="flex gap-1">
            <NavLink to="/produtos" className={navLinkClass}>
              Produtos
            </NavLink>
            <NavLink to="/ingredientes" className={navLinkClass}>
              Ingredientes
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/produtos/:id" element={<ProductEditPage />} />
          <Route path="/produtos/:id/rotulo" element={<LabelPage />} />
          <Route path="/ingredientes" element={<IngredientsPage />} />
        </Routes>
      </main>
    </div>
  )
}
