import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface UsdaResult {
  fdcId: number
  description: string
  dataType: string
  nutrients: Record<string, number>
}

interface Props {
  onClose: () => void
  onSelect: (result: UsdaResult) => void
}

export default function UsdaSearchModal({ onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<UsdaResult[]>([])
  const [translated, setTranslated] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const { data, error: fnError } = await supabase.functions.invoke('usda-search', {
        body: { query },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setTranslated(data.termoTraduzido)
      setResults(data.results ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-sm">Buscar ingrediente no USDA</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-4 flex gap-2 border-b border-slate-100">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: morango, açúcar cristal..."
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <div className="overflow-y-auto flex-1 p-4">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {translated && !error && (
            <p className="text-xs text-slate-500 mb-3">
              Termo traduzido usado na busca: <span className="font-medium">{translated}</span>
            </p>
          )}
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.fdcId}>
                <button
                  onClick={() => onSelect(r)}
                  className="w-full text-left rounded-md border border-slate-200 px-3 py-2 hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <p className="text-sm font-medium">{r.description}</p>
                  <p className="text-xs text-slate-500">
                    {r.dataType} · fdcId {r.fdcId} · {r.nutrients.energy ?? 0} kcal/100g
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {!loading && !error && results.length === 0 && (
            <p className="text-sm text-slate-400">
              Confira sempre os valores antes de salvar — nem sempre o primeiro resultado é o ingrediente certo.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
