/**
 * Valores Diários de Referência (VDR) para rotulagem nutricional,
 * conforme IN 75/2020 (ANVISA). Ported directly from the reference
 * table kept in the original spreadsheet (CALCULO_NUTRICIONAL!A55:C102).
 */
export interface VdrEntry {
  nome: string
  valor: number
  unidade: string
}

export const VDR_REFERENCIA: VdrEntry[] = [
  { nome: 'Valor energético', valor: 2000, unidade: 'kcal' },
  { nome: 'Carboidratos', valor: 300, unidade: 'g' },
  { nome: 'Açúcares adicionados', valor: 50, unidade: 'g' },
  { nome: 'Proteínas', valor: 50, unidade: 'g' },
  { nome: 'Gorduras totais', valor: 65, unidade: 'g' },
  { nome: 'Gorduras saturadas', valor: 20, unidade: 'g' },
  { nome: 'Gorduras trans', valor: 2, unidade: 'g' },
  { nome: 'Gorduras monoinsaturadas', valor: 20, unidade: 'g' },
  { nome: 'Gorduras poli-insaturadas', valor: 20, unidade: 'g' },
  { nome: 'Ômega 6', valor: 18, unidade: 'g' },
  { nome: 'Ômega 3', valor: 4000, unidade: 'mg' },
  { nome: 'Colesterol', valor: 300, unidade: 'mg' },
  { nome: 'Fibras alimentares', valor: 25, unidade: 'g' },
  { nome: 'Sódio', valor: 2000, unidade: 'mg' },
  { nome: 'Vitamina A', valor: 800, unidade: 'mcg' },
  { nome: 'Vitamina D', valor: 15, unidade: 'mcg' },
  { nome: 'Vitamina E', valor: 15, unidade: 'mg' },
  { nome: 'Vitamina K', valor: 120, unidade: 'mcg' },
  { nome: 'Vitamina C', valor: 100, unidade: 'mg' },
  { nome: 'Tiamina', valor: 1.2, unidade: 'mg' },
  { nome: 'Riboflavina', valor: 1.2, unidade: 'mg' },
  { nome: 'Niacina', valor: 15, unidade: 'mg' },
  { nome: 'Vitamina B6', valor: 1.3, unidade: 'mg' },
  { nome: 'Biotina', valor: 30, unidade: 'mcg' },
  { nome: 'Ácido fólico', valor: 400, unidade: 'mcg' },
  { nome: 'Ácido pantotênico', valor: 5, unidade: 'mg' },
  { nome: 'Vitamina B12', valor: 2.4, unidade: 'mcg' },
  { nome: 'Cálcio', valor: 1000, unidade: 'mg' },
  { nome: 'Cloreto', valor: 2300, unidade: 'mg' },
  { nome: 'Cobre', valor: 900, unidade: 'mcg' },
  { nome: 'Cromo', valor: 35, unidade: 'mcg' },
  { nome: 'Ferro', valor: 14, unidade: 'mg' },
  { nome: 'Flúor', valor: 4, unidade: 'mg' },
  { nome: 'Fósforo', valor: 700, unidade: 'mg' },
  { nome: 'Iodo', valor: 150, unidade: 'mcg' },
  { nome: 'Magnésio', valor: 420, unidade: 'mg' },
  { nome: 'Manganês', valor: 3, unidade: 'mg' },
  { nome: 'Molibdênio', valor: 45, unidade: 'mcg' },
  { nome: 'Potássio', valor: 3500, unidade: 'mg' },
  { nome: 'Selênio', valor: 60, unidade: 'mcg' },
  { nome: 'Zinco', valor: 11, unidade: 'mg' },
  { nome: 'Colina', valor: 550, unidade: 'mg' },
]

/** Subset of VDR actually used in the printed macronutrient label (rows 30-39 of the original sheet). */
export const VDR = {
  valorEnergetico: 2000,
  carboidratos: 300,
  acucaresAdicionados: 50,
  proteinas: 50,
  gordurasTotais: 65,
  gordurasSaturadas: 20,
  fibraAlimentar: 25,
  sodio: 2000,
} as const
