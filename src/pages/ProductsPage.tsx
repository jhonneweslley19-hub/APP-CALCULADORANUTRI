import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProduct, deleteProduct, listProducts } from '../lib/api'
import type { Product } from '../types/database'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function refresh() {
    setLoading(true)
    try {
      setProducts(await listProducts())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleNew() {
    try {
      const product = await createProduct({
        nome: 'Novo produto',
        producao_total_g: 0,
        embalagem_g: null,
        rendimento_embalagens: null,
        porcao_g: 0,
        porcao_medida_caseira: null,
      })
      navigate(`/produtos/${product.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Excluir este produto e sua receita?')) return
    try {
      await deleteProduct(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Produtos</h2>
        <button
          onClick={handleNew}
          className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
        >
          + Novo produto
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {products.map((p) => (
            <li
              key={p.id}
              onClick={() => navigate(`/produtos/${p.id}`)}
              className="flex items-center justify-between px-4 py-3 text-sm cursor-pointer hover:bg-slate-50"
            >
              <div>
                <p className="font-medium">{p.nome}</p>
                <p className="text-slate-400 text-xs">
                  Produção: {p.producao_total_g}g · Porção: {p.porcao_g}g
                </p>
              </div>
              <button onClick={(e) => handleDelete(p.id, e)} className="text-slate-400 hover:text-red-600">
                excluir
              </button>
            </li>
          ))}
          {products.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">Nenhum produto ainda.</li>}
        </ul>
      )}
    </div>
  )
}
