import { describe, expect, it } from 'vitest'
import type { Ingredient, Product } from '../types/database'
import { computeLabel, computePercentualVD, recipeTotals, roundForDisplay } from './nutrition'

function ingredient(partial: Partial<Ingredient> & { nome: string }): Ingredient {
  return {
    id: partial.nome,
    energia_kcal: 0,
    carboidratos_g: 0,
    acucares_totais_g: 0,
    acucares_adicionados_g: 0,
    proteinas_g: 0,
    gorduras_totais_g: 0,
    gorduras_saturadas_g: 0,
    gorduras_trans_g: 0,
    gorduras_mono_g: 0,
    gorduras_poly_g: 0,
    omega6_g: 0,
    omega3_g: 0,
    colesterol_mg: 0,
    fibra_g: 0,
    sodio_mg: 0,
    origem: 'manual',
    usda_fdc_id: null,
    usda_description: null,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

// Regression fixture: the real recipe found in the original spreadsheet
// (CALCULO_NUTRICIONAL, planilha_do_nutri.xlsx) - blackberries + açúcar
// cristal + suco de limão, batch of 1680g, serving of 20g, package of 280g.
// Expected numbers below were read directly from the spreadsheet's computed
// cell values.
const blackberries = ingredient({
  nome: 'blackberries, raw',
  energia_kcal: 43,
  carboidratos_g: 9.61,
  acucares_totais_g: 4.88,
  acucares_adicionados_g: 0,
  proteinas_g: 1.39,
  gorduras_totais_g: 0.49,
  gorduras_saturadas_g: 0.01,
  gorduras_mono_g: 0.05,
  gorduras_poly_g: 0.28,
  fibra_g: 5.3,
  sodio_mg: 1,
})

const acucarCristal = ingredient({
  nome: 'açúcar cristal',
  carboidratos_g: 99.5,
  acucares_totais_g: 99.5,
  acucares_adicionados_g: 99.5,
  proteinas_g: 0.3,
  sodio_mg: 12,
})

const sucoDeLimao = ingredient({
  nome: 'Suco de limão',
  carboidratos_g: 7.6,
  proteinas_g: 0.6,
  gorduras_totais_g: 0.1,
})

const lines = [
  { ingredient: blackberries, quantidade_g: 1000 },
  { ingredient: acucarCristal, quantidade_g: 1000 },
  { ingredient: sucoDeLimao, quantidade_g: 50 },
]

const product: Product = {
  id: 'p1',
  nome: 'Geleia teste',
  producao_total_g: 1680,
  embalagem_g: 280,
  rendimento_embalagens: 6,
  porcao_g: 20,
  porcao_medida_caseira: null,
  created_at: '',
  updated_at: '',
}

describe('recipeTotals', () => {
  it('sums nutrient contributions across all recipe lines', () => {
    const totals = recipeTotals(lines)
    expect(totals.energia_kcal).toBeCloseTo(430, 5)
    expect(totals.carboidratos_g).toBeCloseTo(1094.9, 5)
    expect(totals.acucares_totais_g).toBeCloseTo(1043.8, 5)
    expect(totals.proteinas_g).toBeCloseTo(17.2, 5)
    expect(totals.gorduras_totais_g).toBeCloseTo(4.95, 5)
    expect(totals.fibra_g).toBeCloseTo(53, 5)
  })
})

describe('computeLabel', () => {
  const totals = recipeTotals(lines)
  const label = computeLabel(totals, product)

  it('matches the spreadsheet per-100g values', () => {
    expect(label.per100g.carboidratos_g).toBeCloseTo(65.17261905, 5)
    expect(label.per100g.proteinas_g).toBeCloseTo(1.023809524, 5)
    expect(label.per100g.gorduras_totais_g).toBeCloseTo(0.2946428571, 5)
    expect(label.per100g.fibra_g).toBeCloseTo(3.154761905, 5)
  })

  it('recomputes energy per 100g via Atwater factors, matching the spreadsheet', () => {
    expect(label.valorCalorico100g).toBeCloseTo(273.7470238, 4)
  })

  it('matches the spreadsheet per-serving energy value', () => {
    expect(label.valorCaloricoPorcao).toBeCloseTo(54.74940476, 4)
  })

  it('matches the spreadsheet batch/package servings', () => {
    expect(label.totalPorcoesLote).toBeCloseTo(84, 5)
    expect(label.porcoesPorEmbalagem).toBeCloseTo(14, 5)
  })

  it('fixes the "açúcares totais per 100g" bug (was reading the carbs column in the sheet)', () => {
    // The original spreadsheet's B32 formula referenced the Carboidratos
    // column (D14) instead of Açúcares totais (E14), so it wrongly matched
    // the carbs value (65.17...). Using the correct total sugars column
    // (1043.8g) gives a different, correct number.
    expect(label.per100g.acucares_totais_g).toBeCloseTo(62.13095238, 5)
    expect(label.per100g.acucares_totais_g).not.toBeCloseTo(label.per100g.carboidratos_g, 2)
  })

  it('computes %VD per serving', () => {
    const vd = computePercentualVD(label)
    expect(vd.fibraAlimentar).toBeCloseTo((label.perServing.fibra_g * 100) / 25, 5)
    expect(vd.sodio).toBeCloseTo((label.perServing.sodio_mg * 100) / 2000, 5)
  })
})

describe('roundForDisplay', () => {
  it('fixes the "proteína por porção" bug (the sheet checked the recipe total instead of the per-serving amount)', () => {
    // Below the 0.5g/serving ANVISA rounding threshold -> displays as 0
    expect(roundForDisplay(0.2)).toBe(0)
    // At or above the threshold -> displays the real value, even when the
    // recipe's total protein is well above 0.5g (this is what the original
    // buggy IF(G14 > 0.5, 0, ...) formula always forced to zero)
    expect(roundForDisplay(0.8)).toBe(0.8)
  })
})
