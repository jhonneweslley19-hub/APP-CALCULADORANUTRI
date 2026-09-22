import type { NutrientField } from './nutrition'

export interface NutrientFieldMeta {
  field: NutrientField
  label: string
  unit: 'g' | 'mg' | 'kcal'
}

export const NUTRIENT_FIELD_META: NutrientFieldMeta[] = [
  { field: 'energia_kcal', label: 'Energia', unit: 'kcal' },
  { field: 'carboidratos_g', label: 'Carboidratos', unit: 'g' },
  { field: 'acucares_totais_g', label: 'Açúcares totais', unit: 'g' },
  { field: 'acucares_adicionados_g', label: 'Açúcares adicionados', unit: 'g' },
  { field: 'proteinas_g', label: 'Proteínas', unit: 'g' },
  { field: 'gorduras_totais_g', label: 'Gorduras totais', unit: 'g' },
  { field: 'gorduras_saturadas_g', label: 'Gorduras saturadas', unit: 'g' },
  { field: 'gorduras_trans_g', label: 'Gorduras trans', unit: 'g' },
  { field: 'gorduras_mono_g', label: 'Gorduras monoinsaturadas', unit: 'g' },
  { field: 'gorduras_poly_g', label: 'Gorduras poli-insaturadas', unit: 'g' },
  { field: 'omega6_g', label: 'Ômega 6', unit: 'g' },
  { field: 'omega3_g', label: 'Ômega 3', unit: 'g' },
  { field: 'colesterol_mg', label: 'Colesterol', unit: 'mg' },
  { field: 'fibra_g', label: 'Fibra alimentar', unit: 'g' },
  { field: 'sodio_mg', label: 'Sódio', unit: 'mg' },
]
