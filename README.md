# Calculadora Nutri

App web para montar a receita de um produto alimentício, calcular os valores
nutricionais totais e gerar a tabela de informação nutricional (rótulo)
pronta para embalagem, no padrão ANVISA (IN 75/2020 / RDC 429/2020).

Reconstrói, como aplicação, a lógica que antes vivia em uma planilha do
Google Sheets (`TABELA_TECNICA`, `USDA_LOGS`, `CALCULO_NUTRICIONAL`).

## Stack

- React + Vite + TypeScript + Tailwind CSS
- Supabase (Postgres) para persistência — sem login por enquanto (uso
  pessoal); o schema já tem RLS habilitado com uma policy aberta para o
  papel `anon`, pronta para ser restringida quando autenticação for
  adicionada.
- Supabase Edge Function (`usda-search`) como proxy opcional para buscar
  nutrientes no USDA FoodData Central, com tradução PT→EN via MyMemory.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com a URL e a publishable key do projeto Supabase
npm run dev
```

Testes do motor de cálculo (validados contra os valores reais extraídos da
planilha original):

```bash
npm test
```

## Estrutura

- `src/lib/nutrition.ts` — motor de cálculo puro: soma dos ingredientes da
  receita, valores por 100g/por porção, energia recalculada por Atwater
  (carboidratos×4 + proteínas×4 + gorduras×9 + fibra×2) e %VD.
- `src/lib/vdr.ts` — tabela de Valores Diários de Referência (IN 75/2020).
- `src/pages/IngredientsPage.tsx` — cadastro manual de ingredientes (16
  nutrientes por 100g) + busca opcional no USDA.
- `src/pages/ProductEditPage.tsx` — monta a receita (ingrediente +
  quantidade) e mostra uma prévia dos valores calculados.
- `src/pages/LabelPage.tsx` — rótulo final no layout ANVISA, com exportação
  para PNG/PDF.
- `supabase/functions/usda-search` — Edge Function de busca USDA.
- `supabase/migrations/` — schema do banco.

## Busca USDA (opcional)

A busca automática de nutrientes é opcional — o cadastro manual é o fluxo
padrão. Ela já está configurada e funcionando, usando a mesma chave gratuita
do USDA FoodData Central que estava no script original (Apps Script) da
planilha.

A lógica de busca foi portada diretamente desse script: primeiro tenta um
dicionário PT→EN de termos comuns, senão traduz via MyMemory; os resultados
do USDA são então ranqueados por uma função de pontuação que prioriza itens
"raw/fresh" e penaliza itens processados (powder, jam, syrup, concentrate,
canned...) — a mesma heurística usada para preencher a `TABELA_TECNICA`
automaticamente. A diferença é que aqui o resultado do topo **não é aceito
automaticamente**: os candidatos ranqueados são mostrados para você escolher
e revisar antes de salvar, evitando os matches errados que apareciam nos
logs originais (ex: "açúcar cristal" → "HONEY + AJI CRISTAL").

A chave da API fica guardada na tabela `app_config` do banco (não em um
arquivo do repositório), protegida por RLS: só o service role — usado
exclusivamente dentro da Edge Function, nunca exposto ao navegador —
consegue lê-la. Para trocá-la no futuro:

```sql
update public.app_config set value = 'nova_chave' where key = 'USDA_FDC_API_KEY';
```

Sem uma chave configurada (tabela vazia), o botão "Buscar no USDA" mostra uma
mensagem explicando que a busca automática não está disponível — o cadastro
manual continua funcionando normalmente.

## Diferenças em relação à planilha original

Ao portar a lógica de cálculo, dois bugs encontrados na planilha foram
corrigidos (a pedido, ao invés de replicados):

1. **Açúcares totais por 100g** — a planilha usava por engano a coluna de
   Carboidratos nessa célula, fazendo o valor de açúcares totais sair igual
   ao de carboidratos. Corrigido para usar a coluna correta.
2. **Proteínas por porção** — a planilha zerava esse valor sempre que o
   *total da receita* (não da porção) ultrapassava 0,5g, o que ocorria quase
   sempre. A regra correta da ANVISA (declarar "0" quando o valor *por
   porção* for menor que 0,5g) foi implementada em `roundForDisplay()`.

## Projeto Supabase

Um projeto dedicado (`calculadora-nutri`) foi criado na mesma organização
dos projetos PLANOGRAMA. Como a conta estava no limite de 2 projetos
gratuitos, o projeto `PLANOGRAMA` (o mais antigo dos dois) foi **pausado**
para abrir espaço — pode ser reativado a qualquer momento pelo painel do
Supabase.

## Deploy

Qualquer host de site estático funciona (Vercel, Netlify, Cloudflare Pages):
build com `npm run build`, publique a pasta `dist/`, e configure as mesmas
variáveis de ambiente do `.env` no painel do host.
