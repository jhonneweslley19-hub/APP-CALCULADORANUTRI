import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Package, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { createProduct, deleteProduct, listProductIngredients, listProducts } from '../lib/api'
import { computeLabel, recipeTotals } from '../lib/nutrition'
import type { Product } from '../types/database'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../lib/toast'
import { useConfirm } from '../lib/confirm'

interface ProductSummary extends Product {
  ingredientCount: number
  kcalPorcao: number | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSummary[] | null>(null)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  async function refresh() {
    setProducts(null)
    try {
      const list = await listProducts()
      const withSummary = await Promise.all(
        list.map(async (p) => {
          const lines = await listProductIngredients(p.id)
          const totals = recipeTotals(lines.map((l) => ({ ingredient: l.ingredient, quantidade_g: l.quantidade_g })))
          const label = computeLabel(totals, p)
          return {
            ...p,
            ingredientCount: lines.length,
            kcalPorcao: lines.length > 0 ? label.valorCaloricoPorcao : null,
          }
        }),
      )
      setProducts(withSummary)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setProducts([])
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleNew() {
    setCreating(true)
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
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(product: ProductSummary, e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await confirm({
      title: `Excluir "${product.nome}"?`,
      description: 'A receita associada a este produto também será removida. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteProduct(product.id)
      toast.success('Produto excluído.')
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Produtos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Suas receitas e rótulos nutricionais</p>
        </div>
        <Button onClick={handleNew} loading={creating} icon={<Plus className="size-4" />}>
          Novo produto
        </Button>
      </div>

      {products === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingBasket}
            title="Nenhum produto ainda"
            description="Crie um produto, monte a receita com os ingredientes e gere o rótulo nutricional."
            action={
              <Button size="sm" icon={<Plus className="size-4" />} onClick={handleNew}>
                Criar produto
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card
              key={p.id}
              onClick={() => navigate(`/produtos/${p.id}`)}
              className="p-5 cursor-pointer hover:border-brand-300 hover:shadow-popover transition-all group"
            >
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-800 leading-snug">{p.nome}</p>
                <button
                  onClick={(e) => handleDelete(p, e)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                  aria-label="Excluir produto"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-4">
                {p.kcalPorcao !== null ? (
                  <p className="text-2xl font-bold text-brand-700">
                    {p.kcalPorcao.toFixed(0)}
                    <span className="text-sm font-medium text-slate-400 ml-1">kcal/porção</span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sem ingredientes na receita ainda</p>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Package className="size-3.5" /> {p.producao_total_g}g · porção {p.porcao_g}g
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="size-3.5" /> {p.ingredientCount} ingrediente
                  {p.ingredientCount === 1 ? '' : 's'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
