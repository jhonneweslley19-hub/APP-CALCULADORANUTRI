import type { NutrientField } from './nutrition'

export type NutrientGroup = 'energia' | 'carboidratos' | 'proteinas' | 'gorduras' | 'outros'

export interface NutrientFieldMeta {
  field: NutrientField
  label: string
  unit: 'g' | 'mg' | 'kcal'
  group: NutrientGroup
}

export const NUTRIENT_FIELD_META: NutrientFieldMeta[] = [
  { field: 'energia_kcal', label: 'Energia', unit: 'kcal', group: 'energia' },
  { field: 'carboidratos_g', label: 'Carboidratos', unit: 'g', group: 'carboidratos' },
  { field: 'acucares_totais_g', label: 'Açúcares totais', unit: 'g', group: 'carboidratos' },
  { field: 'acucares_adicionados_g', label: 'Açúcares adicionados', unit: 'g', group: 'carboidratos' },
  { field: 'fibra_g', label: 'Fibra alimentar', unit: 'g', group: 'carboidratos' },
  { field: 'proteinas_g', label: 'Proteínas', unit: 'g', group: 'proteinas' },
  { field: 'gorduras_totais_g', label: 'Gorduras totais', unit: 'g', group: 'gorduras' },
  { field: 'gorduras_saturadas_g', label: 'Gorduras saturadas', unit: 'g', group: 'gorduras' },
  { field: 'gorduras_trans_g', label: 'Gorduras trans', unit: 'g', group: 'gorduras' },
  { field: 'gorduras_mono_g', label: 'Gorduras monoinsaturadas', unit: 'g', group: 'gorduras' },
  { field: 'gorduras_poly_g', label: 'Gorduras poli-insaturadas', unit: 'g', group: 'gorduras' },
  { field: 'omega6_g', label: 'Ômega 6', unit: 'g', group: 'gorduras' },
  { field: 'omega3_g', label: 'Ômega 3', unit: 'g', group: 'gorduras' },
  { field: 'colesterol_mg', label: 'Colesterol', unit: 'mg', group: 'gorduras' },
  { field: 'sodio_mg', label: 'Sódio', unit: 'mg', group: 'outros' },
]

export const NUTRIENT_GROUP_LABELS: Record<NutrientGroup, string> = {
  energia: 'Energia',
  carboidratos: 'Carboidratos',
  proteinas: 'Proteínas',
  gorduras: 'Gorduras',
  outros: 'Outros',
}

export function nutrientFieldsByGroup(): [NutrientGroup, NutrientFieldMeta[]][] {
  const groups: NutrientGroup[] = ['energia', 'carboidratos', 'proteinas', 'gorduras', 'outros']
  return groups.map((g) => [g, NUTRIENT_FIELD_META.filter((m) => m.group === g)])
}
