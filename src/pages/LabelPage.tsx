import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getProduct, listProductIngredients } from '../lib/api'
import { computeLabel, computePercentualVD, recipeTotals, roundForDisplay } from '../lib/nutrition'
import type { Product, ProductIngredientWithDetails } from '../types/database'

function fmt(value: number, decimals = 1): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function LabelPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [lines, setLines] = useState<ProductIngredientWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getProduct(id), listProductIngredients(id)])
      .then(([prod, prodLines]) => {
        setProduct(prod)
        setLines(prodLines)
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [id])

  const totals = useMemo(
    () => recipeTotals(lines.map((l) => ({ ingredient: l.ingredient, quantidade_g: l.quantidade_g }))),
    [lines],
  )
  const label = useMemo(() => (product ? computeLabel(totals, product) : null), [totals, product])
  const vd = useMemo(() => (label ? computePercentualVD(label) : null), [label])

  async function handleExport(type: 'png' | 'pdf') {
    if (!labelRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(labelRef.current, { scale: 3, backgroundColor: '#ffffff' })
      if (type === 'png') {
        const link = document.createElement('a')
        link.download = `rotulo-${product?.nome ?? 'produto'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
        const pageWidth = pdf.internal.pageSize.getWidth()
        const imgWidth = 80
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 15, imgWidth, imgHeight)
        pdf.save(`rotulo-${product?.nome ?? 'produto'}.pdf`)
      }
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Carregando...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!product || !label || !vd) return null

  const proteinaPorcaoDisplay = roundForDisplay(label.perServing.proteinas_g)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to={`/produtos/${product.id}`} className="text-sm text-slate-500 hover:underline">
          ← Voltar para o produto
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('png')}
            disabled={exporting}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            Exportar PNG
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div ref={labelRef} className="bg-white border-2 border-black p-3 w-[340px] font-sans text-black">
          <h2 className="text-center font-bold text-sm border-b-4 border-black pb-1">INFORMAÇÃO NUTRICIONAL</h2>
          <p className="text-[11px] pt-1">
            Porções por embalagem: {label.porcoesPorEmbalagem !== null ? fmt(label.porcoesPorEmbalagem, 0) : '—'}
          </p>
          <p className="text-[11px] pb-1 border-b border-black">
            Porção: {fmt(product.porcao_g, 0)} g
            {product.porcao_medida_caseira ? ` (${product.porcao_medida_caseira})` : ''}
          </p>

          <table className="w-full text-[11px] mt-1">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left font-normal py-1">Descrição</th>
                <th className="text-right font-normal py-1">100 g</th>
                <th className="text-right font-normal py-1">Porção</th>
                <th className="text-right font-normal py-1">%VD*</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="py-1 font-bold">Valor energético (kcal)</td>
                <td className="text-right">{fmt(label.per100g.energia_kcal)}</td>
                <td className="text-right">{fmt(label.valorCaloricoPorcao)}</td>
                <td className="text-right">{fmt(vd.valorEnergetico)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1">Carboidratos (g)</td>
                <td className="text-right">{fmt(label.per100g.carboidratos_g)}</td>
                <td className="text-right">{fmt(label.perServing.carboidratos_g)}</td>
                <td className="text-right">{fmt(vd.carboidratos)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1 pl-2">Açúcares totais (g)</td>
                <td className="text-right">{fmt(label.per100g.acucares_totais_g)}</td>
                <td className="text-right">{fmt(label.perServing.acucares_totais_g)}</td>
                <td className="text-right">—</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1 pl-2">Açúcares adicionados (g)</td>
                <td className="text-right">{fmt(label.per100g.acucares_adicionados_g)}</td>
                <td className="text-right">{fmt(label.perServing.acucares_adicionados_g)}</td>
                <td className="text-right">{fmt(vd.acucaresAdicionados)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1">Proteínas (g)</td>
                <td className="text-right">{fmt(label.per100g.proteinas_g)}</td>
                <td className="text-right">{fmt(proteinaPorcaoDisplay)}</td>
                <td className="text-right">{fmt(vd.proteinas)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1">Gorduras totais (g)</td>
                <td className="text-right">{fmt(label.per100g.gorduras_totais_g)}</td>
                <td className="text-right">{fmt(label.perServing.gorduras_totais_g)}</td>
                <td className="text-right">{fmt(vd.gordurasTotais)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1 pl-2">Gorduras saturadas (g)</td>
                <td className="text-right">{fmt(label.per100g.gorduras_saturadas_g)}</td>
                <td className="text-right">{fmt(label.perServing.gorduras_saturadas_g)}</td>
                <td className="text-right">{fmt(vd.gordurasSaturadas)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1 pl-2">Gorduras trans (g)</td>
                <td className="text-right">{fmt(label.per100g.gorduras_trans_g, 2)}</td>
                <td className="text-right">{fmt(label.perServing.gorduras_trans_g, 2)}</td>
                <td className="text-right">—</td>
              </tr>
              <tr className="border-b border-black">
                <td className="py-1">Fibra alimentar (g)</td>
                <td className="text-right">{fmt(label.per100g.fibra_g)}</td>
                <td className="text-right">{fmt(label.perServing.fibra_g)}</td>
                <td className="text-right">{fmt(vd.fibraAlimentar)}%</td>
              </tr>
              <tr>
                <td className="py-1">Sódio (mg)</td>
                <td className="text-right">{fmt(label.per100g.sodio_mg)}</td>
                <td className="text-right">{fmt(label.perServing.sodio_mg)}</td>
                <td className="text-right">{fmt(vd.sodio)}%</td>
              </tr>
            </tbody>
          </table>

          <p className="text-[9px] pt-2 border-t border-black mt-1">
            *Percentual de valores diários fornecidos pela porção indicada, com base em uma dieta de 2.000 kcal ou
            8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Layout conforme IN 75/2020 / RDC 429/2020 (ANVISA). Confira sempre a legislação vigente antes de imprimir na
        embalagem.
      </p>
    </div>
  )
}
