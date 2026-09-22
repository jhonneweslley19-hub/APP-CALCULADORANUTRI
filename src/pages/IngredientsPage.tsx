import { useEffect, useMemo, useState } from 'react'
import { createIngredient, deleteIngredient, listIngredients, updateIngredient } from '../lib/api'
import { NUTRIENT_FIELD_META } from '../lib/nutrientFields'
import type { Ingredient, IngredientInput } from '../types/database'
import UsdaSearchModal from '../components/UsdaSearchModal'

function emptyForm(): IngredientInput {
  const form = {
    nome: '',
    origem: 'manual',
    usda_fdc_id: null,
    usda_description: null,
  } as IngredientInput
  for (const meta of NUTRIENT_FIELD_META) {
    ;(form as unknown as Record<string, number>)[meta.field] = 0
  }
  return form
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<IngredientInput>(emptyForm())
  const [search, setSearch] = useState('')
  const [showUsdaSearch, setShowUsdaSearch] = useState(false)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      setIngredients(await listIngredients())
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

  const filtered = useMemo(
    () => ingredients.filter((i) => i.nome.toLowerCase().includes(search.toLowerCase())),
    [ingredients, search],
  )

  function startEdit(ingredient: Ingredient) {
    setEditingId(ingredient.id)
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = ingredient
    setForm(rest)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateIngredient(editingId, form)
      } else {
        await createIngredient(form)
      }
      await refresh()
      startNew()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este ingrediente? Isso falhará se ele estiver em uso em algum produto.')) return
    try {
      await deleteIngredient(id)
      await refresh()
      if (editingId === id) startNew()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value === '' ? 0 : Number(value) }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Ingredientes</h2>
          <button onClick={startNew} className="text-sm text-emerald-700 hover:underline">
            + Novo
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="w-full mb-3 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {filtered.map((ing) => (
              <li key={ing.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <button className="text-left flex-1 hover:text-emerald-700" onClick={() => startEdit(ing)}>
                  <span className="font-medium">{ing.nome}</span>{' '}
                  <span className="text-slate-400">
                    ({ing.energia_kcal.toFixed(0)} kcal/100g{ing.origem === 'usda' ? ' · USDA' : ''})
                  </span>
                </button>
                <button onClick={() => handleDelete(ing.id)} className="text-slate-400 hover:text-red-600 ml-2">
                  excluir
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-4 text-sm text-slate-400">Nenhum ingrediente.</li>}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{editingId ? 'Editar ingrediente' : 'Novo ingrediente'}</h2>
          <button
            type="button"
            onClick={() => setShowUsdaSearch(true)}
            className="text-sm rounded-md border border-emerald-600 text-emerald-700 px-3 py-1 hover:bg-emerald-50"
          >
            Buscar no USDA
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-md p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {NUTRIENT_FIELD_META.map((meta) => (
              <div key={meta.field}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {meta.label} ({meta.unit}/100g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={(form as unknown as Record<string, number>)[meta.field]}
                  onChange={(e) => setField(meta.field, e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          {form.origem === 'usda' && (
            <p className="text-xs text-slate-500">
              Origem: USDA FoodData Central{form.usda_description ? ` — ${form.usda_description}` : ''}
              {form.usda_fdc_id ? ` (fdcId ${form.usda_fdc_id})` : ''}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar ingrediente'}
            </button>
            {editingId && (
              <button type="button" onClick={startNew} className="text-sm text-slate-500 hover:underline">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {showUsdaSearch && (
        <UsdaSearchModal
          onClose={() => setShowUsdaSearch(false)}
          onSelect={(result) => {
            setEditingId(null)
            setForm({
              nome: result.description,
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
            })
            setShowUsdaSearch(false)
          }}
        />
      )}
    </div>
  )
}
