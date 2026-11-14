# Changelog

## 1.1.0 — 2026-11-14

- Substitui a resposta genérica do handler `message` pela conversa privada do Forecast.
- Mantém `/start` como apresentação e adiciona `/clima` com solicitação de cidade por `ForceReply`.
- Adiciona pesquisa de localidades em português pela Open-Meteo, com tratamento para nenhum, um ou vários resultados.
- Adiciona seleção de cidades homônimas por `RichMessageButton` incorporado à própria Rich Message.
- Adiciona handler `callback_query`, exigido pelo Telegram Serverless para receber os cliques dos botões.
- Adiciona o módulo compartilhado `forecast` para geocodificação, previsão, períodos, callbacks e construção das Rich Messages.
- Mantém a conversa sem banco usando os identificadores da Open-Meteo em callbacks compactos e validados dentro do limite de 64 bytes.
- Adiciona previsão de Hoje com condições atuais e próximos períodos conforme o horário local da cidade.
- Adiciona previsões de 3 dias e de 7 dias, incluindo tabela semanal compacta.
- Adiciona títulos, destaques, divisores, botões incorporados e rodapé por blocos oficiais da Bot API.
- Adiciona atribuição à Open-Meteo, referência à licença CC BY 4.0 e horário local de atualização.
- Adiciona edição da mesma Rich Message ao alternar entre Hoje, 3 dias e Semana.
- Adiciona tratamento de consulta indisponível, callback inválido, cidade não encontrada e dados parciais sem inventar informações.
- Mantém importações restritas ao `sdk` e aos módulos relativos do projeto, sem dependência de runtime adicional.
- Não adiciona comentários, credenciais, banco, migração, histórico, dados simulados ou arquivos de teste.
- Não altera a Mini App, o endpoint `getProfile`, `tgcloud.json`, `package.json` ou o workflow de implantação.

## 1.0.0 — 2026-11-14

- Remove integralmente a árvore anterior do repositório no commit de reconstrução.
- Cria projeto Telegram Serverless com configuração estática em `tgcloud.json`.
- Adiciona handler de mensagens com validação de `chat.id` e resposta por `api.sendMessage`.
- Adiciona endpoint protegido `getProfile` baseado exclusivamente em `ctx.initData` validado pela plataforma.
- Adiciona Mini App sem dependências de frontend e com integração ao SDK oficial `telegram-web-app.js`.
- Adiciona adaptação ao tema, viewport e áreas seguras do Telegram.
- Adiciona estados explícitos de conexão, sucesso e falha sem dados simulados.
- Adiciona instruções de login, implantação, configuração do BotFather e sincronização do webhook.
- Não inclui código, arquivo, configuração, segredo ou artefato da implementação anterior.
- Adiciona workflow de implantação automática na branch `main` com Node.js 20, instalação da CLI local e `npx tgcloud push` autenticado pelo secret `TGCLOUD_TOKEN`.
- Restringe a permissão do workflow à leitura do conteúdo e impede cancelamento de uma implantação em andamento.
- Altera a implantação para criar o projeto com `npm create @tgcloud/bot tFORECASTbot` antes do envio.
- Substitui no diretório temporário do runner o exemplo criado pelo scaffold pelos módulos `tgcloud/`, pela Mini App `app/` e pela configuração `tgcloud.json` do repositório.
- Executa `npx tgcloud push` dentro do projeto criado em `tFORECASTbot`.
- Expõe `TGCLOUD_TOKEN` somente à etapa de `tgcloud push`, sem disponibilizar o secret ao scaffold ou às etapas de cópia.
- Remove o cabeçalho `X-Content-Type-Options` da configuração estática porque o Telegram Serverless recusou esse cabeçalho durante a preparação da versão.
