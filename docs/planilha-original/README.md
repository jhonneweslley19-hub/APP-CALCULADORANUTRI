# Planilha original

`planilha_do_nutri.xlsx` é a planilha do Google Sheets que deu origem a este
app, mantida aqui como referência histórica. Continha 3 abas:

- **USDA_LOGS** — histórico de buscas de nutrientes no USDA FoodData Central.
- **TABELA_TECNICA** — banco de ingredientes com nutrientes por 100g.
- **CALCULO_NUTRICIONAL** — receita, totais e rótulo nutricional calculado.

A lógica de cálculo e a automação de busca no USDA (incluindo o script do
Google Apps Script) foram portadas para este app — ver o `README.md` na raiz
do repositório para os detalhes de cada decisão de design e os bugs
corrigidos na migração.
