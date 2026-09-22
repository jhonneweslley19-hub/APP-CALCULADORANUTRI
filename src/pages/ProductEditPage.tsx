import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  addProductIngredient,
  getProduct,
  listIngredients,
  listProductIngredients,
  removeProductIngredient,
  updateProduct,
  updateProductIngredientQuantity,
} from '../lib/api'
import { computeLabel, recipeTotals } from '../lib/nutrition'
import type { Ingredient, Product, ProductIngredientWithDetails } from '../types/database'

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [lines, setLines] = useState<ProductIngredientWithDetails[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newIngredientId, setNewIngredientId] = useState('')
  const [newQty, setNewQty] = useState('')

  async function refresh() {
    if (!id) return
    setLoading(true)
    try {
      const [prod, prodLines, ingredients] = await Promise.all([
        getProduct(id),
        listProductIngredients(id),
        listIngredients(),
      ])
      setProduct(prod)
      setLines(prodLines)
      setAllIngredients(ingredients)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const totals = useMemo(
    () => recipeTotals(lines.map((l) => ({ ingredient: l.ingredient, quantidade_g: l.quantidade_g }))),
    [lines],
  )
  const label = useMemo(() => (product ? computeLabel(totals, product) : null), [totals, product])

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    try {
      const { id: _id, created_at: _c, updated_at: _u, ...input } = product
      await updateProduct(product.id, input)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !newIngredientId || !newQty) return
    try {
      await addProductIngredient(id, newIngredientId, Number(newQty), lines.length)
      setNewIngredientId('')
      setNewQty('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleQtyChange(lineId: string, value: string) {
    const qty = Number(value)
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, quantidade_g: qty } : l)))
    try {
      await updateProductIngredientQuantity(lineId, qty)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleRemoveLine(lineId: string) {
    try {
      await removeProductIngredient(lineId)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Carregando...</p>
  if (!product) return <p className="text-sm text-red-600">Produto não encontrado.</p>

  const availableIngredients = allIngredients.filter((i) => !lines.some((l) => l.ingredient_id === i.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/produtos')} className="text-sm text-slate-500 hover:underline">
          ← Produtos
        </button>
        <Link
          to={`/produtos/${product.id}/rotulo`}
          className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
        >
          Ver rótulo →
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSaveProduct} className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nome do produto</label>
          <input
            value={product.nome}
            onChange={(e) => setProduct({ ...product, nome: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Produção total (g)</label>
            <input
              type="number"
              step="any"
              value={product.producao_total_g}
              onChange={(e) => setProduct({ ...product, producao_total_g: Number(e.target.value) })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Embalagem (g)</label>
            <input
              type="number"
              step="any"
              value={product.embalagem_g ?? ''}
              onChange={(e) =>
                setProduct({ ...product, embalagem_g: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Porção (g)</label>
            <input
              type="number"
              step="any"
              value={product.porcao_g}
              onChange={(e) => setProduct({ ...product, porcao_g: Number(e.target.value) })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Medida caseira</label>
            <input
              placeholder='ex: "1 colher de sopa"'
              value={product.porcao_medida_caseira ?? ''}
              onChange={(e) => setProduct({ ...product, porcao_medida_caseira: e.target.value || null })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar dados do produto'}
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-md p-4">
        <h3 className="text-sm font-semibold mb-3">Ingredientes da receita</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2">Ingrediente</th>
              <th className="py-2 w-32">Quantidade (g)</th>
              <th className="py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-slate-100">
                <td className="py-2">{line.ingredient.nome}</td>
                <td className="py-2">
                  <input
                    type="number"
                    step="any"
                    value={line.quantidade_g}
                    onChange={(e) => handleQtyChange(line.id, e.target.value)}
                    className="w-24 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="py-2">
                  <button onClick={() => handleRemoveLine(line.id)} className="text-slate-400 hover:text-red-600">
                    remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={handleAddIngredient} className="flex gap-2 mt-3">
          <select
            value={newIngredientId}
            onChange={(e) => setNewIngredientId(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione um ingrediente...</option>
            {availableIngredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            placeholder="g"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!newIngredientId || !newQty}
            className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
        {allIngredients.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">
            Nenhum ingrediente cadastrado ainda. <Link to="/ingredientes" className="underline">Cadastre um</Link>{' '}
            primeiro.
          </p>
        )}
      </div>

      {label && (
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">Prévia (por 100g / por porção)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-1">100g de produto</p>
              <p>{label.per100g.energia_kcal.toFixed(1)} kcal</p>
              <p>{label.per100g.carboidratos_g.toFixed(1)} g carboidratos</p>
              <p>{label.per100g.proteinas_g.toFixed(1)} g proteínas</p>
              <p>{label.per100g.gorduras_totais_g.toFixed(1)} g gorduras totais</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">1 porção ({product.porcao_g}g)</p>
              <p>{label.valorCaloricoPorcao.toFixed(1)} kcal</p>
              <p>{label.perServing.carboidratos_g.toFixed(1)} g carboidratos</p>
              <p>{label.perServing.proteinas_g.toFixed(1)} g proteínas</p>
              <p>{label.perServing.gorduras_totais_g.toFixed(1)} g gorduras totais</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Rendimento do lote: {label.totalPorcoesLote.toFixed(1)} porções
            {label.porcoesPorEmbalagem !== null && ` · ${label.porcoesPorEmbalagem.toFixed(1)} porções/embalagem`}
          </p>
        </div>
      )}
    </div>
  )
}
