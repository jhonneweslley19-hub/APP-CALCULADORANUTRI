// Supabase Edge Function: searches USDA FoodData Central for an ingredient,
// translating the (likely Portuguese) query to English first. Ports the
// matching logic from the original Google Apps Script that powered the
// spreadsheet's USDA_LOGS/TABELA_TECNICA tabs: a PT->EN dictionary fast
// path, then MyMemory translation, then a scoring function that prefers
// "raw/fresh" foods and penalizes processed ones (powder, jam, syrup...).
// The script auto-accepted the top match, which is what produced the wrong
// matches seen in the original logs (e.g. "açúcar cristal" -> "HONEY + AJI
// CRISTAL") - here the ranked candidates are returned for the caller to
// review and pick from instead of being auto-applied.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DICT_PT_EN: Record<string, string> = {
  morango: 'strawberry',
  banana: 'banana',
  maca: 'apple',
  acucar: 'sugar',
  'farinha de trigo': 'wheat flour',
  manteiga: 'butter',
  margarina: 'margarine',
  oleo: 'oil',
  ovo: 'egg',
  ovos: 'egg',
  leite: 'milk',
  'leite integral': 'whole milk',
  'suco de laranja': 'orange juice',
  arroz: 'rice',
  feijao: 'beans',
  pao: 'bread',
  'queijo mussarela': 'mozzarella cheese',
}

const MAX_QUERY_LENGTH = 100

const POSITIVE_KEYWORDS = ['raw', 'fresh', 'uncooked', 'whole', 'unprocessed']
const NEGATIVE_KEYWORDS = [
  'powder', 'concentrate', 'concentrated', 'dried', 'dehydrated', 'jam', 'jelly',
  'syrup', 'sweetened', 'canned', 'preserved', 'powdered', 'freeze-dried', 'instant',
]

const NUTRIENT_ID_MAP: Record<string, number> = {
  energy: 1008,
  carbs: 1005,
  protein: 1003,
  fat: 1004,
  saturatedFat: 1258,
  transFat: 1257,
  fiber: 1079,
  sodium: 1093,
  cholesterol: 1253,
}

const NUTRIENT_NAME_KEYWORDS: Record<string, string[]> = {
  energy: ['energy', 'kcal'],
  carbs: ['carbohydrate'],
  total_sugars: ['sugars, total', 'total sugar', 'sugar'],
  added_sugars: ['added sugar'],
  protein: ['protein'],
  fat: ['total lipid', 'total fat', 'lipid'],
  saturatedFat: ['saturated'],
  transFat: ['trans fat', 'trans-fat', 'transfat', 'trans'],
  monounsaturated: ['monounsaturated'],
  polyunsaturated: ['polyunsaturated'],
  omega6: ['omega-6', 'omega 6', 'linoleic'],
  omega3: ['omega-3', 'omega 3', 'alpha-linolenic', 'alpha linolenic', 'eicosapentaenoic', 'docosahexaenoic'],
  cholesterol: ['cholesterol'],
  fiber: ['fiber', 'fibre'],
  sodium: ['sodium'],
}

const NUTRIENT_KEYS = Object.keys(NUTRIENT_NAME_KEYWORDS)

interface FdcFoodNutrient {
  nutrientId?: number
  nutrientName?: string
  value: number
}

interface FdcFood {
  fdcId: number
  description: string
  dataType: string
  foodNutrients: FdcFoodNutrient[]
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^ -~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1)
    }
  }
  return matrix[b.length][a.length]
}

async function translateToEnglish(text: string): Promise<string> {
  const normalized = normalize(text)
  if (DICT_PT_EN[normalized]) return DICT_PT_EN[normalized]
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalized)}&langpair=pt|en`)
    if (!res.ok) return normalized
    const json = await res.json()
    return normalize(json?.responseData?.translatedText || normalized)
  } catch {
    return normalized
  }
}

function scoreFood(food: FdcFood, query: string): number {
  const descNorm = normalize(food.description || '')
  let score = 0
  if (descNorm === query) score += 1500
  else if (descNorm.includes(query)) score += 800
  score += Math.max(0, 200 - descNorm.length)
  const dist = levenshtein(query, descNorm)
  score += dist === 0 ? 1000 : Math.max(0, 300 - dist)
  const dataType = (food.dataType || '').toLowerCase()
  if (dataType.includes('sr') || dataType.includes('foundation') || dataType.includes('survey')) score += 80
  if (dataType.includes('branded')) score -= 60
  if (POSITIVE_KEYWORDS.some((k) => descNorm.includes(k))) score += 150
  if (NEGATIVE_KEYWORDS.some((k) => descNorm.includes(k))) score -= 150
  return score
}

function findNutrientValue(nutrients: FdcFoodNutrient[], key: string): number {
  const id = NUTRIENT_ID_MAP[key]
  if (id) {
    const byId = nutrients.find((n) => n.nutrientId === id)
    if (byId && Number.isFinite(byId.value)) return byId.value
  }
  const keywords = NUTRIENT_NAME_KEYWORDS[key] ?? []
  for (const n of nutrients) {
    const name = (n.nutrientName ?? '').toLowerCase()
    if (keywords.some((k) => name.includes(k)) && Number.isFinite(n.value)) return n.value
  }
  return 0
}

function extractNutrients(food: FdcFood): Record<string, number> {
  const nutrients = food.foodNutrients ?? []
  const out: Record<string, number> = {}
  for (const key of NUTRIENT_KEYS) {
    out[key] = Math.round(findNutrientValue(nutrients, key) * 100) / 100
  }
  return out
}

async function getApiKey(admin: ReturnType<typeof createClient> | null): Promise<string | null> {
  const fromEnv = Deno.env.get('USDA_FDC_API_KEY')
  if (fromEnv) return fromEnv
  if (!admin) return null
  const { data } = await admin.from('app_config').select('value').eq('key', 'USDA_FDC_API_KEY').maybeSingle()
  return (data?.value as string | undefined) ?? null
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => null)
    const query = typeof body?.query === 'string' ? body.query.trim() : ''
    // Limita o tamanho da busca: evita abuso da cota da USDA/MyMemory e logs gigantes
    if (!query || query.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Campo "query" é obrigatório (até ${MAX_QUERY_LENGTH} caracteres).` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const admin = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

    const apiKey = await getApiKey(admin)
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'USDA_FDC_API_KEY não configurada. Crie uma chave gratuita em https://fdc.nal.usda.gov/api-key-signup.',
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const translated = await translateToEnglish(query)

    const searchUrl = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
    searchUrl.searchParams.set('api_key', apiKey)
    searchUrl.searchParams.set('query', translated)
    searchUrl.searchParams.set('pageSize', '15')

    const fdcRes = await fetch(searchUrl)
    if (!fdcRes.ok) throw new Error(`USDA respondeu ${fdcRes.status}`)
    const fdcJson = await fdcRes.json()
    const foods: FdcFood[] = fdcJson?.foods ?? []

    const ranked = foods
      .map((food) => ({ food, score: scoreFood(food, normalize(translated)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    const results = ranked.map(({ food }) => ({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      nutrients: extractNutrients(food),
    }))

    if (admin) {
      await admin.from('usda_search_logs').insert({
        termo_original: query,
        termo_traduzido: translated,
        fdc_id: results[0]?.fdcId ?? null,
        description: results[0]?.description ?? null,
        nutrients_json: results[0]?.nutrients ?? null,
        status: results.length ? 'ok' : 'no_results',
      })
    }

    return new Response(JSON.stringify({ termoTraduzido: translated, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Detalhes só no log do servidor; o cliente recebe uma mensagem genérica
    // (a mensagem original pode conter a URL da USDA com a api_key na query string)
    console.error('usda-search:', err)
    return new Response(JSON.stringify({ error: 'Falha ao consultar o USDA. Tente novamente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
