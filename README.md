# 🥗 Calculadora Nutri

**Da receita ao rótulo nutricional no padrão ANVISA, em minutos.**

App web que ajuda produtores de alimentos a montar a receita de um produto, calcular automaticamente os valores nutricionais e gerar a **tabela de informação nutricional** pronta para a embalagem, seguindo a **IN 75/2020** e a **RDC 429/2020**. O rótulo pode ser exportado em PNG ou PDF.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Edge%20Functions-3ECF8E?logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/testes-Vitest-6E9F18?logo=vitest&logoColor=white)

---

## 💡 O problema

O cálculo era feito numa planilha do Google Sheets com Apps Script. Funcionava, mas:

- as fórmulas tinham **dois erros de cálculo** que passavam despercebidos (detalhados abaixo);
- a busca automática de nutrientes no USDA **aceitava sempre o primeiro resultado**, o que gerava associações erradas, como "açúcar cristal" → *"HONEY + AJI CRISTAL"*.

## ✅ A solução

Transformei a planilha em uma aplicação web, mantendo a lógica original, corrigindo os erros e melhorando a experiência de uso.

| Funcionalidade | Descrição |
|---|---|
| **Cadastro de ingredientes** | 15 nutrientes por 100 g/ml, inseridos manualmente ou importados do USDA |
| **Busca no USDA FoodData Central** | Tradução PT→EN, ranking por relevância e **escolha manual** do resultado certo |
| **Montagem de receitas** | Ingredientes + quantidades, com prévia dos valores calculados |
| **Rótulo ANVISA** | Valores por 100 g e por porção, %VD e regra de declaração de "0" |
| **Exportação** | Rótulo em PNG ou PDF, pronto para impressão |
| **Painel** | Resumo de produtos, ingredientes e itens importados do USDA |

## 🏗️ Arquitetura

```
┌──────────────────────┐        ┌──────────────────────────────┐
│  React + TypeScript  │ ─────▶ │  Supabase Postgres (RLS)     │
│  (Vite, Tailwind)    │        │  ingredients · products ·    │
│                      │        │  product_ingredients         │
│  lib/nutrition.ts    │        └──────────────────────────────┘
│  (motor de cálculo   │        ┌──────────────────────────────┐
│   puro e testado)    │ ─────▶ │  Edge Function `usda-search` │ ──▶ USDA FoodData Central
└──────────────────────┘        │  (chave da API só no server) │ ──▶ MyMemory (tradução)
                                └──────────────────────────────┘
```

- **Motor de cálculo isolado** (`src/lib/nutrition.ts`): funções puras, sem dependência de UI ou banco, cobertas por testes que usam **os valores reais da planilha original** como referência.
- **Energia recalculada pelos fatores de Atwater**: carboidratos × 4 + proteínas × 4 + gorduras × 9 + fibras × 2.
- **Tabela de VDR** (`src/lib/vdr.ts`) conforme a IN 75/2020.
- **Busca USDA no servidor**: a chave da API nunca chega ao navegador.

### Como a busca no USDA escolhe os resultados

1. Tenta um dicionário PT→EN de termos comuns e, se não encontrar, traduz via MyMemory.
2. Busca no USDA e dá uma pontuação a cada resultado: favorece itens *raw/fresh* e bases de referência (SR, Foundation) e penaliza itens processados (*powder, jam, syrup, canned…*). Também usa a distância de Levenshtein até o termo buscado.
3. Mostra os 6 melhores candidatos para **o usuário revisar e escolher**, em vez de aceitar o primeiro automaticamente.

## 🐛 Erros da planilha original que foram corrigidos

Encontrados durante a migração e cobertos por testes automatizados:

1. **Açúcares totais por 100 g**: a fórmula lia por engano a coluna de *carboidratos*, então os açúcares sempre saíam iguais aos carboidratos.
2. **Proteínas por porção**: a planilha zerava o valor sempre que o *total da receita* passava de 0,5 g, o que acontecia quase sempre. A regra correta da ANVISA declara "0" quando o valor *por porção* é menor que 0,5 g. Isso foi implementado em `roundForDisplay()`.

## 🔐 Segurança

- Nenhuma credencial no repositório: `.env` está no `.gitignore` e só `.env.example` é versionado.
- O navegador usa apenas a **publishable key** do Supabase, que foi feita para ser pública.
- A chave da API do USDA fica numa variável de ambiente da Edge Function ou na tabela `app_config`, protegida por **RLS sem nenhuma policy** (só o *service role* do servidor consegue ler).
- A Edge Function valida a entrada (tamanho máximo da busca) e não expõe detalhes internos nas mensagens de erro.
- A tabela de logs do USDA não pode ser acessada pelo navegador.

> ⚠️ **Limitação conhecida:** o app ainda **não tem login**. Ele foi feito para uso pessoal, e por isso as tabelas de ingredientes e produtos aceitam leitura e escrita com a publishable key. Antes de abrir para vários usuários, o próximo passo é adicionar **Supabase Auth** e trocar as policies para `authenticated` (com `owner_id = auth.uid()`). Veja o roadmap.

## 🚀 Rodando localmente

Pré-requisitos: Node 20+ e um projeto no [Supabase](https://supabase.com) (o plano gratuito serve).

```bash
git clone https://github.com/jhonneweslley19-hub/APP-CALCULADORANUTRI.git
cd APP-CALCULADORANUTRI
npm install
cp .env.example .env   # preencha com a URL e a publishable key do seu projeto Supabase
npm run dev
```

Banco de dados: aplique os arquivos de `supabase/migrations/` em ordem (pelo SQL Editor ou com `supabase db push`).

Busca USDA (opcional): crie uma chave gratuita em <https://fdc.nal.usda.gov/api-key-signup>, publique a função com `supabase functions deploy usda-search` e configure o segredo:

```bash
supabase secrets set USDA_FDC_API_KEY=sua_chave
```

Sem a chave, o cadastro manual continua funcionando normalmente.

### Testes

```bash
npm test
```

## 📁 Estrutura

```
src/
├── lib/
│   ├── nutrition.ts        # motor de cálculo (puro + testado)
│   ├── nutrition.test.ts   # testes validados contra a planilha original
│   ├── vdr.ts              # Valores Diários de Referência (IN 75/2020)
│   └── api.ts              # acesso ao Supabase
├── pages/
│   ├── HomePage.tsx        # painel
│   ├── IngredientsPage.tsx # cadastro + busca USDA
│   ├── ProductsPage.tsx    # lista de produtos
│   ├── ProductEditPage.tsx # montagem da receita
│   └── LabelPage.tsx       # rótulo ANVISA + exportação PNG/PDF
└── components/             # UI reutilizável e modal de busca USDA
supabase/
├── functions/usda-search/  # Edge Function (Deno)
└── migrations/             # schema e políticas de acesso
docs/planilha-original/     # planilha que deu origem ao projeto
```

## 🗺️ Roadmap

- [ ] Autenticação com Supabase Auth e dados separados por usuário
- [ ] Limite de requisições na busca USDA
- [ ] Vitaminas e minerais no rótulo (a tabela de VDR já está pronta)
- [ ] Rotulagem nutricional frontal (lupa) da RDC 429/2020
- [ ] Testes de ponta a ponta (Playwright)

## 📄 Licença

[MIT](LICENSE) © 2026 Jhonne Weslley

---

Feito por **Jhonne Weslley**, estudante de Engenharia de Software · [GitHub](https://github.com/jhonneweslley19-hub) · [LinkedIn](https://www.linkedin.com/in/jhonne-w-038b57127)

> ℹ️ Os valores gerados servem de apoio à rotulagem. Confira sempre a legislação vigente e, se necessário, valide com um profissional responsável.
