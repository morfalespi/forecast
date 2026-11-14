# Changelog

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
