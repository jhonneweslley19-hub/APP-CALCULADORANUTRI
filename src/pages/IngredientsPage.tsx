import { useEffect, useMemo, useState } from 'react'
import { Apple, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import { createIngredient, deleteIngredient, listIngredients, updateIngredient } from '../lib/api'
import { NUTRIENT_GROUP_LABELS, nutrientFieldsByGroup } from '../lib/nutrientFields'
import type { Ingredient, IngredientInput } from '../types/database'
import UsdaSearchModal from '../components/UsdaSearchModal'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Field, { inputClass } from '../components/ui/Field'
import { useToast } from '../lib/toast'
import { useConfirm } from '../lib/confirm'

const GROUPED_FIELDS = nutrientFieldsByGroup()

function emptyForm(): IngredientInput {
  const form = {
    nome: '',
    origem: 'manual',
    usda_fdc_id: null,
    usda_description: null,
  } as IngredientInput
  for (const [, fields] of GROUPED_FIELDS) {
    for (const meta of fields) {
      ;(form as unknown as Record<string, number>)[meta.field] = 0
    }
  }
  return form
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<IngredientInput>(emptyForm())
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showUsdaSearch, setShowUsdaSearch] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  async function refresh() {
    try {
      setIngredients(await listIngredients())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setIngredients((prev) => prev ?? [])
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => (ingredients ?? []).filter((i) => i.nome.toLowerCase().includes(search.toLowerCase())),
    [ingredients, search],
  )

  function startEdit(ingredient: Ingredient) {
    setEditingId(ingredient.id)
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = ingredient
    setForm(rest)
    setShowForm(true)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateIngredient(editingId, form)
        toast.success('Ingrediente atualizado.')
      } else {
        await createIngredient(form)
        toast.success('Ingrediente cadastrado.')
      }
      await refresh()
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ingredient: Ingredient) {
    const ok = await confirm({
      title: `Excluir "${ingredient.nome}"?`,
      description: 'Isso falhará se o ingrediente estiver em uso em algum produto.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteIngredient(ingredient.id)
      toast.success('Ingrediente excluído.')
      await refresh()
      if (editingId === ingredient.id) setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value === '' ? 0 : Number(value) }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Ingredientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Valores nutricionais por 100g/100ml</p>
        </div>
        <Button onClick={startNew} icon={<Plus className="size-4" />}>
          Novo ingrediente
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ingrediente..."
          className={`${inputClass} pl-9`}
        />
      </div>

      {ingredients === null ? (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Apple}
            title={ingredients.length === 0 ? 'Nenhum ingrediente cadastrado' : 'Nada encontrado'}
            description={
              ingredients.length === 0
                ? 'Cadastre manualmente ou busque no USDA FoodData Central.'
                : 'Tente outro termo de busca.'
            }
            action={
              ingredients.length === 0 ? (
                <Button size="sm" icon={<Plus className="size-4" />} onClick={startNew}>
                  Novo ingrediente
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filtered.map((ing) => (
              <li key={ing.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 group">
                <button className="flex-1 text-left flex items-center gap-3 min-w-0" onClick={() => startEdit(ing)}>
                  <span className="font-medium text-sm text-slate-700 truncate">{ing.nome}</span>
                  {ing.origem === 'usda' && <Badge tone="brand">USDA</Badge>}
                  <span className="text-xs text-slate-400 shrink-0">{ing.energia_kcal.toFixed(0)} kcal/100g</span>
                </button>
                <button
                  onClick={() => handleDelete(ing)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  aria-label="Excluir"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-start sm:items-center justify-center p-4 z-[60] overflow-y-auto">
          <Card className="w-full max-w-xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-sm text-slate-800">
                {editingId ? 'Editar ingrediente' : 'Novo ingrediente'}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles className="size-3.5" />}
                  onClick={() => setShowUsdaSearch(true)}
                >
                  Buscar no USDA
                </Button>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto">
              <CardBody className="space-y-5">
                <Field label="Nome do ingrediente">
                  <input
                    required
                    autoFocus
                    value={form.nome}
                    onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                    className={inputClass}
                  />
                </Field>

                {form.origem === 'usda' && (
                  <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
                    Origem: USDA FoodData Central
                    {form.usda_description ? ` — ${form.usda_description}` : ''}
                    {form.usda_fdc_id ? ` (fdcId ${form.usda_fdc_id})` : ''}
                  </p>
                )}

                {GROUPED_FIELDS.map(([group, fields]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {NUTRIENT_GROUP_LABELS[group]}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {fields.map((meta) => (
                        <Field key={meta.field} label={`${meta.label} (${meta.unit})`}>
                          <input
                            type="number"
                            step="any"
                            value={(form as unknown as Record<string, number>)[meta.field]}
                            onChange={(e) => setField(meta.field, e.target.value)}
                            className={inputClass}
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                ))}
              </CardBody>

              <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" loading={saving}>
                  {editingId ? 'Salvar alterações' : 'Adicionar ingrediente'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showUsdaSearch && (
        <UsdaSearchModal
          onClose={() => setShowUsdaSearch(false)}
          onSelect={(result) => {
            setForm((prev) => ({
              ...prev,
              nome: prev.nome || result.description,
              origem: 'usda',
              usda_fdc_id: result.fdcId,
              usda_description: result.description,
              energia_kcal: result.nutrients.energy ?? 0,
              carboidratos_g: result.nutrients.carbs ?? 0,
              acucares_totais_g: result.nutrients.total_sugars ?? 0,
              acucares_adicionados_g: result.nutrients.added_sugars ?? 0,
              proteinas_g: result.nutrients.protein ?? 0,
              gorduras_totais_g: result.nutrients.fat ?? 0,
              gorduras_saturadas_g: result.nutrients.saturatedFat ?? 0,
              gorduras_trans_g: result.nutrients.transFat ?? 0,
              gorduras_mono_g: result.nutrients.monounsaturated ?? 0,
              gorduras_poly_g: result.nutrients.polyunsaturated ?? 0,
              omega6_g: result.nutrients.omega6 ?? 0,
              omega3_g: result.nutrients.omega3 ?? 0,
              colesterol_mg: result.nutrients.cholesterol ?? 0,
              fibra_g: result.nutrients.fiber ?? 0,
              sodio_mg: result.nutrients.sodium ?? 0,
            }))
            setShowUsdaSearch(false)
          }}
        />
      )}
    </div>
  )
}
