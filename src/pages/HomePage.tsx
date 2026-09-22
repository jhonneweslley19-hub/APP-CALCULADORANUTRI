import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Apple, ArrowRight, FileText, Plus, ShoppingBasket } from 'lucide-react'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { createProduct, getDashboardStats, listRecentProducts } from '../lib/api'
import type { DashboardStats } from '../lib/api'
import type { Product } from '../types/database'
import { useToast } from '../lib/toast'

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getDashboardStats(), listRecentProducts(5)])
      .then(([s, r]) => {
        setStats(s)
        setRecent(r)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleNewProduct() {
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
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Olá 👋</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monte a receita do seu produto e gere o rótulo nutricional pronto para embalagem.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Produtos" value={stats?.totalProducts} loading={loading} icon={ShoppingBasket} />
        <StatCard label="Ingredientes cadastrados" value={stats?.totalIngredients} loading={loading} icon={Apple} />
        <StatCard label="Ingredientes via USDA" value={stats?.usdaIngredients} loading={loading} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 text-sm">Novo produto</p>
            <p className="text-xs text-slate-400 mt-0.5">Monte uma receita e calcule o rótulo</p>
          </div>
          <Button size="sm" icon={<Plus className="size-4" />} onClick={handleNewProduct}>
            Criar
          </Button>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 text-sm">Novo ingrediente</p>
            <p className="text-xs text-slate-400 mt-0.5">Cadastre valores nutricionais por 100g</p>
          </div>
          <Link to="/ingredientes">
            <Button size="sm" variant="secondary" icon={<Plus className="size-4" />}>
              Cadastrar
            </Button>
          </Link>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Produtos recentes</h2>
          <Link to="/produtos" className="text-xs text-brand-700 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <Card>
          {loading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title="Nenhum produto ainda"
              description="Crie seu primeiro produto para começar a calcular o rótulo nutricional."
              action={
                <Button size="sm" icon={<Plus className="size-4" />} onClick={handleNewProduct}>
                  Criar produto
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/produtos/${p.id}`}
                    className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">{p.nome}</span>
                    <span className="text-slate-400 text-xs">
                      {p.producao_total_g}g · porção {p.porcao_g}g
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
  icon: Icon,
}: {
  label: string
  value?: number
  loading: boolean
  icon: typeof ShoppingBasket
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className="size-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Icon className="size-5" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-6 w-10" />
          ) : (
            <p className="text-xl font-semibold text-slate-800">{value ?? 0}</p>
          )}
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  )
}
