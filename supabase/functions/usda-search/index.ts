// Supabase Edge Function: searches USDA FoodData Central for an ingredient,
// translating the (likely Portuguese) query to English first. Mirrors the
// PT->EN translation + USDA lookup flow found in the original spreadsheet's
// USDA_LOGS tab, but lets the caller review/pick a result before saving it
// (the spreadsheet auto-accepted the first match, which is what caused the
// wrong matches seen in the logs, e.g. "açúcar cristal" -> "HONEY + AJI
// CRISTAL").
import { createClient } from 'jsr:@supabase/supabase-js@2'

const FDC_NUTRIENT_MAP: Record<number, string> = {
  1008: 'energy',
  1003: 'protein',
  1004: 'fat',
  1005: 'carbs',
  1079: 'fiber',
  2000: 'total_sugars',
  1063: 'total_sugars',
  1235: 'added_sugars',
  1258: 'saturatedFat',
  1257: 'transFat',
  1292: 'monounsaturated',
  1293: 'polyunsaturated',
  1253: 'cholesterol',
  1093: 'sodium',
  1316: 'omega6',
  1404: 'omega3',
}

interface FdcFoodNutrient {
  nutrientId: number
  value: number
}

interface FdcFood {
  fdcId: number
  description: string
  dataType: string
  foodNutrients: FdcFoodNutrient[]
}

function isLikelyPortuguese(text: string): boolean {
  return /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(text)
}

async function translateToEnglish(text: string): Promise<string> {
  if (!isLikelyPortuguese(text)) return text
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt|en`,
    )
    if (!res.ok) return text
    const json = await res.json()
    return json?.responseData?.translatedText || text
  } catch {
    return text
  }
}

function extractNutrients(food: FdcFood): Record<string, number> {
  const out: Record<string, number> = {}
  for (const n of food.foodNutrients ?? []) {
    const key = FDC_NUTRIENT_MAP[n.nutrientId]
    if (key && out[key] === undefined) out[key] = n.value
  }
  return out
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Campo "query" é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('USDA_FDC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'USDA_FDC_API_KEY não configurada. Crie uma chave gratuita em https://fdc.nal.usda.gov/api-key-signup e configure-a como secret desta função no Supabase.',
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const translated = await translateToEnglish(query)

    const searchUrl = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
    searchUrl.searchParams.set('api_key', apiKey)
    searchUrl.searchParams.set('query', translated)
    searchUrl.searchParams.set('pageSize', '5')

    const fdcRes = await fetch(searchUrl)
    const fdcJson = await fdcRes.json()
    const foods: FdcFood[] = fdcJson?.foods ?? []

    const results = foods.map((food) => ({
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      nutrients: extractNutrients(food),
    }))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && serviceRoleKey) {
      const admin = createClient(supabaseUrl, serviceRoleKey)
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
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
