import { useState } from 'react'
import { AlertCircle, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Button from './ui/Button'
import { inputClass } from './ui/Field'
import Badge from './ui/Badge'

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
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults([])
    setSearched(true)
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
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-popover max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-sm text-slate-800">Buscar ingrediente no USDA</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-4 flex gap-2 border-b border-slate-100">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: morango, açúcar cristal..."
            className={inputClass}
          />
          <Button type="submit" loading={loading} icon={<Search className="size-4" />}>
            Buscar
          </Button>
        </form>

        <div className="overflow-y-auto flex-1 p-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-3">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          {translated && !error && (
            <p className="text-xs text-slate-500 mb-3">
              Termo traduzido usado na busca: <span className="font-medium text-slate-700">{translated}</span>
            </p>
          )}
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.fdcId}>
                <button
                  onClick={() => onSelect(r)}
                  className="w-full text-left rounded-lg border border-slate-200 px-3.5 py-3 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{r.description}</p>
                    <Badge tone="slate">{r.dataType}</Badge>
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                    <span>{(r.nutrients.energy ?? 0).toFixed(0)} kcal</span>
                    <span>{(r.nutrients.carbs ?? 0).toFixed(1)}g carb</span>
                    <span>{(r.nutrients.protein ?? 0).toFixed(1)}g prot</span>
                    <span>{(r.nutrients.fat ?? 0).toFixed(1)}g gord</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {!loading && !error && searched && results.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum resultado encontrado.</p>
          )}
          {!searched && !loading && (
            <p className="text-sm text-slate-400">
              Confira sempre os valores antes de salvar — nem sempre o primeiro resultado é o ingrediente certo.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
