-- Os logs de busca da USDA são gravados apenas pela Edge Function `usda-search`,
-- que usa o service role (ignora RLS). O navegador nunca lê nem escreve nesta
-- tabela, então o papel `anon` não precisa de acesso algum: sem esta mudança,
-- qualquer pessoa com a publishable key poderia ler, alterar ou apagar os logs.
drop policy if exists "anon full access" on public.usda_search_logs;
