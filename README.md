# Forecast

Base limpa de Telegram Bot, Telegram Serverless e Mini App criada somente a partir das referências oficiais fornecidas em 14 de novembro de 2026.

## Estrutura

- `tgcloud/handlers/message.js`: recebe mensagens e responde com `api.sendMessage`.
- `tgcloud/endpoints/getProfile.js`: retorna dados de usuário e chat validados pelo Telegram Serverless.
- `app/`: Mini App estática, responsiva e integrada ao tema do Telegram.
- `tgcloud.json`: publica `app/` no host `tgcloud.ai` do projeto.

## Preparação

Requisitos:

- Node.js 18 ou superior.
- Serverless ativado no BotFather.
- Token de CLI no formato `app<id>:<secret>`.

Instale a CLI local:

```bash
npm install
```

Faça login localmente:

```bash
npx tgcloud login
```

Em CI, use `TGCLOUD_TOKEN` no lugar do login interativo.

## Implantação

Publique módulos e Mini App no mesmo lote atômico:

```bash
npm run deploy
```

O comando imprime a URL no formato `https://app<app_id>.tgcloud.ai/`. Configure essa URL no BotFather como Main Mini App do bot. Depois, sincronize o webhook quando o status indicar divergência:

```bash
npx tgcloud webhook sync
```

## Verificação estática

- O runtime importa apenas `sdk`.
- O handler usa parâmetros Bot API em `snake_case`.
- O endpoint usa `ctx.initData`, que o Telegram Serverless valida antes da execução.
- O navegador não trata `initDataUnsafe` como identidade confiável.
- A Mini App chama o endpoint com `Telegram.WebApp.Serverless.call`.
- A interface chama `ready()` e `expand()` e respeita tema e áreas seguras do Telegram.
- Não há banco, migração, pacote de runtime externo, valor secreto ou dado de demonstração.

## Referências normativas

- Telegram Serverless: `https://core.telegram.org/bots/serverless`
- Telegram Bot API: `https://core.telegram.org/bots/api`
- Telegram Mini Apps: `https://core.telegram.org/bots/webapps`

