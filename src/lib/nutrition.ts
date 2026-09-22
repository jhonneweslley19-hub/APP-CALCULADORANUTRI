import type { Ingredient, Product } from '../types/database'
import { VDR } from './vdr'

export const NUTRIENT_FIELDS = [
  'energia_kcal',
  'carboidratos_g',
  'acucares_totais_g',
  'acucares_adicionados_g',
  'proteinas_g',
  'gorduras_totais_g',
  'gorduras_saturadas_g',
  'gorduras_trans_g',
  'gorduras_mono_g',
  'gorduras_poly_g',
  'omega6_g',
  'omega3_g',
  'colesterol_mg',
  'fibra_g',
  'sodio_mg',
] as const

export type NutrientField = (typeof NUTRIENT_FIELDS)[number]

export type NutrientTotals = Record<NutrientField, number>

export interface RecipeLine {
  ingredient: Ingredient
  quantidade_g: number
}

function emptyTotals(): NutrientTotals {
  const totals = {} as NutrientTotals
  for (const field of NUTRIENT_FIELDS) totals[field] = 0
  return totals
}

/** Contribution of a single recipe line: (quantidade_g / 100) * nutriente_por_100g. */
export function lineContribution(line: RecipeLine): NutrientTotals {
  const factor = line.quantidade_g / 100
  const totals = emptyTotals()
  for (const field of NUTRIENT_FIELDS) {
    totals[field] = factor * line.ingredient[field]
  }
  return totals
}

/** Sum of all recipe lines - equivalent to the TOTAL_RECEITA row in CALCULO_NUTRICIONAL. */
export function recipeTotals(lines: RecipeLine[]): NutrientTotals {
  const totals = emptyTotals()
  for (const line of lines) {
    const contribution = lineContribution(line)
    for (const field of NUTRIENT_FIELDS) {
      totals[field] += contribution[field]
    }
  }
  return totals
}

export interface LabelValues {
  per100g: NutrientTotals
  perServing: NutrientTotals
  valorCalorico100g: number
  valorCaloricoPorcao: number
  totalPorcoesLote: number
  porcoesPorEmbalagem: number | null
}

/**
 * Recomputes the printed label values from the recipe totals: nutrients per
 * 100g of finished product, then per serving. Energy is recalculated from
 * the macros (Atwater factors: carbs*4 + protein*4 + fat*9 + fiber*2)
 * instead of trusting the summed per-ingredient kcal, matching how the
 * original spreadsheet builds the printed label (B20 formula).
 */
export function computeLabel(totals: NutrientTotals, product: Product): LabelValues {
  const producaoTotalG = product.producao_total_g || 0
  const per100g = emptyTotals()

  if (producaoTotalG > 0) {
    for (const field of NUTRIENT_FIELDS) {
      per100g[field] = (totals[field] * 100) / producaoTotalG
    }
  }

  const valorCalorico100g =
    per100g.carboidratos_g * 4 +
    per100g.proteinas_g * 4 +
    per100g.gorduras_totais_g * 9 +
    per100g.fibra_g * 2
  per100g.energia_kcal = valorCalorico100g

  const porcaoG = product.porcao_g || 0
  const perServing = emptyTotals()
  for (const field of NUTRIENT_FIELDS) {
    perServing[field] = (per100g[field] * porcaoG) / 100
  }
  const valorCaloricoPorcao = (valorCalorico100g * porcaoG) / 100
  perServing.energia_kcal = valorCaloricoPorcao

  return {
    per100g,
    perServing,
    valorCalorico100g,
    valorCaloricoPorcao,
    totalPorcoesLote: porcaoG > 0 ? producaoTotalG / porcaoG : 0,
    porcoesPorEmbalagem: product.embalagem_g && porcaoG > 0 ? product.embalagem_g / porcaoG : null,
  }
}

export interface PercentualVD {
  valorEnergetico: number
  carboidratos: number
  acucaresAdicionados: number
  proteinas: number
  gordurasTotais: number
  gordurasSaturadas: number
  fibraAlimentar: number
  sodio: number
}

/** %VD (percentual de valores diários) por porção, conforme IN 75/2020. */
export function computePercentualVD(label: LabelValues): PercentualVD {
  const p = label.perServing
  return {
    valorEnergetico: (label.valorCaloricoPorcao * 100) / VDR.valorEnergetico,
    carboidratos: (p.carboidratos_g * 100) / VDR.carboidratos,
    acucaresAdicionados: (p.acucares_adicionados_g * 100) / VDR.acucaresAdicionados,
    proteinas: (p.proteinas_g * 100) / VDR.proteinas,
    gordurasTotais: (p.gorduras_totais_g * 100) / VDR.gordurasTotais,
    gordurasSaturadas: (p.gorduras_saturadas_g * 100) / VDR.gordurasSaturadas,
    fibraAlimentar: (p.fibra_g * 100) / VDR.fibraAlimentar,
    sodio: (p.sodio_mg * 100) / VDR.sodio,
  }
}

/**
 * Regra de arredondamento da ANVISA (IN 75/2020): quando a quantidade por
 * porção de um nutriente é menor que o limiar, ela pode ser declarada como
 * "0" no rótulo. Usada aqui apenas para exibição (a planilha original
 * verificava o total da receita em vez do valor por porção, o que zerava a
 * proteína quase sempre — ver README/PR).
 */
export function roundForDisplay(perServingValue: number, threshold = 0.5): number {
  return perServingValue < threshold ? 0 : perServingValue
}
