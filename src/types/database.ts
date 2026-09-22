export interface Ingredient {
  id: string
  nome: string
  energia_kcal: number
  carboidratos_g: number
  acucares_totais_g: number
  acucares_adicionados_g: number
  proteinas_g: number
  gorduras_totais_g: number
  gorduras_saturadas_g: number
  gorduras_trans_g: number
  gorduras_mono_g: number
  gorduras_poly_g: number
  omega6_g: number
  omega3_g: number
  colesterol_mg: number
  fibra_g: number
  sodio_mg: number
  origem: 'manual' | 'usda'
  usda_fdc_id: number | null
  usda_description: string | null
  created_at: string
  updated_at: string
}

export type IngredientInput = Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>

export interface Product {
  id: string
  nome: string
  producao_total_g: number
  embalagem_g: number | null
  rendimento_embalagens: number | null
  porcao_g: number
  porcao_medida_caseira: string | null
  created_at: string
  updated_at: string
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>

export interface ProductIngredient {
  id: string
  product_id: string
  ingredient_id: string
  quantidade_g: number
  ordem: number
  created_at: string
}

export interface ProductIngredientWithDetails extends ProductIngredient {
  ingredient: Ingredient
}

export interface UsdaSearchLog {
  id: string
  termo_original: string
  termo_traduzido: string | null
  fdc_id: number | null
  description: string | null
  nutrients_json: Record<string, number> | null
  status: string | null
  created_at: string
}
