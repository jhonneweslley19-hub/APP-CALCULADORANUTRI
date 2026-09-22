import { supabase } from './supabaseClient'
import type {
  Ingredient,
  IngredientInput,
  Product,
  ProductInput,
  ProductIngredient,
  ProductIngredientWithDetails,
} from '../types/database'

export async function listIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase.from('ingredients').select('*').order('nome')
  if (error) throw error
  return data
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  const { data, error } = await supabase.from('ingredients').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateIngredient(id: string, input: IngredientInput): Promise<Ingredient> {
  const { data, error } = await supabase.from('ingredients').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) throw error
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('nome')
  if (error) throw error
  return data
}

export async function getProduct(id: string): Promise<Product> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function listProductIngredients(productId: string): Promise<ProductIngredientWithDetails[]> {
  const { data, error } = await supabase
    .from('product_ingredients')
    .select('*, ingredient:ingredients(*)')
    .eq('product_id', productId)
    .order('ordem')
  if (error) throw error
  return data as unknown as ProductIngredientWithDetails[]
}

export async function addProductIngredient(
  productId: string,
  ingredientId: string,
  quantidadeG: number,
  ordem: number,
): Promise<ProductIngredient> {
  const { data, error } = await supabase
    .from('product_ingredients')
    .insert({ product_id: productId, ingredient_id: ingredientId, quantidade_g: quantidadeG, ordem })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProductIngredientQuantity(id: string, quantidadeG: number): Promise<void> {
  const { error } = await supabase.from('product_ingredients').update({ quantidade_g: quantidadeG }).eq('id', id)
  if (error) throw error
}

export async function removeProductIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('product_ingredients').delete().eq('id', id)
  if (error) throw error
}
