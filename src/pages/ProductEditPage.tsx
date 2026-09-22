import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react'
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
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Field, { inputClass } from '../components/ui/Field'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../lib/toast'

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [lines, setLines] = useState<ProductIngredientWithDetails[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newIngredientId, setNewIngredientId] = useState('')
  const [newQty, setNewQty] = useState('')

  async function refresh() {
    if (!id) return
    try {
      const [prod, prodLines, ingredients] = await Promise.all([
        getProduct(id),
        listProductIngredients(id),
        listIngredients(),
      ])
      setProduct(prod)
      setLines(prodLines)
      setAllIngredients(ingredients)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
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
      toast.success('Dados do produto salvos.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
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
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleQtyChange(lineId: string, value: string) {
    const qty = Number(value)
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, quantidade_g: qty } : l)))
    try {
      await updateProductIngredientQuantity(lineId, qty)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleRemoveLine(lineId: string) {
    try {
      await removeProductIngredient(lineId)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    )
  }
  if (!product) return <p className="text-sm text-red-600">Produto não encontrado.</p>

  const availableIngredients = allIngredients.filter((i) => !lines.some((l) => l.ingredient_id === i.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/produtos')}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <ArrowLeft className="size-4" /> Produtos
        </button>
        <Link to={`/produtos/${product.id}/rotulo`}>
          <Button icon={<FileText className="size-4" />}>Ver rótulo</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-800">Dados do produto</h2>
        </CardHeader>
        <form onSubmit={handleSaveProduct}>
          <CardBody className="space-y-4">
            <Field label="Nome do produto">
              <input
                value={product.nome}
                onChange={(e) => setProduct({ ...product, nome: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Produção total (g)">
                <input
                  type="number"
                  step="any"
                  value={product.producao_total_g}
                  onChange={(e) => setProduct({ ...product, producao_total_g: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Embalagem (g)">
                <input
                  type="number"
                  step="any"
                  value={product.embalagem_g ?? ''}
                  onChange={(e) =>
                    setProduct({ ...product, embalagem_g: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Porção (g)">
                <input
                  type="number"
                  step="any"
                  value={product.porcao_g}
                  onChange={(e) => setProduct({ ...product, porcao_g: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Medida caseira" hint='ex: "1 colher de sopa"'>
                <input
                  value={product.porcao_medida_caseira ?? ''}
                  onChange={(e) => setProduct({ ...product, porcao_medida_caseira: e.target.value || null })}
                  className={inputClass}
                />
              </Field>
            </div>
          </CardBody>
          <div className="flex justify-end px-5 py-4 border-t border-slate-100">
            <Button type="submit" size="sm" loading={saving}>
              Salvar dados do produto
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-800">Ingredientes da receita</h2>
        </CardHeader>
        <CardBody>
          {lines.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum ingrediente na receita"
              description="Adicione ingredientes abaixo para começar a calcular o rótulo."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Ingrediente</th>
                  <th className="pb-2 font-medium w-28">Quantidade</th>
                  <th className="pb-2 font-medium w-20 text-right">kcal</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const kcal = (line.quantidade_g / 100) * line.ingredient.energia_kcal
                  return (
                    <tr key={line.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 text-slate-700">{line.ingredient.nome}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={line.quantidade_g}
                            onChange={(e) => handleQtyChange(line.id, e.target.value)}
                            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                          />
                          <span className="text-xs text-slate-400">g</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-500">{kcal.toFixed(0)}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleRemoveLine(line.id)}
                          className="text-slate-300 hover:text-red-500"
                          aria-label="Remover"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          <form onSubmit={handleAddIngredient} className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <select
              value={newIngredientId}
              onChange={(e) => setNewIngredientId(e.target.value)}
              className={`${inputClass} flex-1`}
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
              className={`${inputClass} w-24`}
            />
            <Button type="submit" disabled={!newIngredientId || !newQty} icon={<Plus className="size-4" />}>
              Adicionar
            </Button>
          </form>
          {allIngredients.length === 0 && (
            <p className="text-xs text-slate-400 mt-2">
              Nenhum ingrediente cadastrado ainda.{' '}
              <Link to="/ingredientes" className="text-brand-700 underline">
                Cadastre um
              </Link>{' '}
              primeiro.
            </p>
          )}
        </CardBody>
      </Card>

      {label && lines.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-800">Prévia do rótulo</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-6">
              <PreviewColumn title="100g de produto" values={label.per100g} energia={label.per100g.energia_kcal} />
              <PreviewColumn
                title={`1 porção (${product.porcao_g}g)`}
                values={label.perServing}
                energia={label.valorCaloricoPorcao}
              />
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
              Rendimento do lote: {label.totalPorcoesLote.toFixed(1)} porções
              {label.porcoesPorEmbalagem !== null && ` · ${label.porcoesPorEmbalagem.toFixed(1)} porções/embalagem`}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function PreviewColumn({
  title,
  values,
  energia,
}: {
  title: string
  values: { carboidratos_g: number; proteinas_g: number; gorduras_totais_g: number }
  energia: number
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">{title}</p>
      <p className="text-2xl font-bold text-brand-700 mb-2">
        {energia.toFixed(0)} <span className="text-sm font-medium text-slate-400">kcal</span>
      </p>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Carboidratos</dt>
          <dd className="text-slate-700 font-medium">{values.carboidratos_g.toFixed(1)} g</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Proteínas</dt>
          <dd className="text-slate-700 font-medium">{values.proteinas_g.toFixed(1)} g</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Gorduras totais</dt>
          <dd className="text-slate-700 font-medium">{values.gorduras_totais_g.toFixed(1)} g</dd>
        </div>
      </dl>
    </div>
  )
}
