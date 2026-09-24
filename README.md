# 🥗 Calculadora Nutri

App web que transforma a receita de um produto alimentício em **rótulo nutricional no padrão ANVISA** (IN 75/2020 e RDC 429/2020), com exportação em PNG ou PDF.

## Funcionalidades

- Cadastro de ingredientes (manual ou com busca no USDA FoodData Central)
- Montagem de receitas com cálculo automático dos nutrientes
- Rótulo com valores por 100 g, por porção e %VD
- Exportação do rótulo em PNG ou PDF

## Tecnologias

React · TypeScript · Vite · Tailwind CSS · Supabase · Vitest

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com a URL e a publishable key do Supabase
npm run dev
```

Testes: `npm test`

## Licença

[MIT](LICENSE) · Feito por [Jhonne Weslley](https://github.com/jhonneweslley19-hub)
