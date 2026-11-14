# Forecast

Bot de previsão do tempo e Telegram Mini App, publicado no Telegram Serverless. As mensagens do bot e a interface do Mini App compartilham a lógica de consulta à Open-Meteo.

## Funcionalidades

- Conversa com o bot: comando `/clima`, pesquisa de cidades, seleção de localidades e previsões Hoje, 3 dias e Semana em Rich Messages.
- Mini App: visual mobile-first baseado no Rascunho 05, com fundo de chuva sutil e superfícies translúcidas.
- Busca no Mini App: até cinco localidades reais por pesquisa, identificação por cidade/região/país e opção **Refinar busca**.
- Previsão no Mini App: condições atuais, mínima e máxima, sensação, umidade, vento, próximos períodos, três dias e semana.
- Navegação inferior de vidro: **Hoje · 3 dias · Semana**, com alternância no mesmo painel.
- Tema automático do Telegram (ou preferência do aparelho fora dele) e animações leves com preferência por movimento reduzido.
- Layout de smartphone, inclusive no computador; página fixa, previsão distribuída sem rolagem em telas full-size convencionais e rolagem interna apenas em casos de altura insuficiente.
- Fonte e atribuição: Open-Meteo, CC BY 4.0.

## Arquitetura

| Caminho | Responsabilidade |
| --- | --- |
| `tgcloud/lib/forecast.js` | Consulta e normalização de localidades e previsões; mensagens do bot e contrato de dados do Mini App |
| `tgcloud/handlers/message.js` | Comando `/clima` e mensagens privadas |
| `tgcloud/handlers/callback_query.js` | Seleção de localidades e botões no chat |
| `tgcloud/endpoints/searchLocations.js` | Pesquisa de até cinco cidades, com sessão validada pelo Telegram Serverless |
| `tgcloud/endpoints/getForecast.js` | Previsão para ID selecionado, retornando dados estruturados |
| `tgcloud/endpoints/getProfile.js` | Endpoint de identidade já existente, mantido para compatibilidade |
| `app/index.html` | Estrutura visual do Mini App |
| `app/styles.css` | Design de vidro, fundo orgânico, chuva e animações |
| `app/app.js` | Estados da interface, busca, seleção, navegação, tema e viewport |
| `tgcloud.json` | Publicação da pasta estática `app/` |
| `.github/workflows/deploy.yml` | Publicação no Telegram Serverless após alterações em `main` |

O Mini App usa `Telegram.WebApp.Serverless.call('searchLocations', ...)` e `Telegram.WebApp.Serverless.call('getForecast', ...)`. O Telegram Serverless valida os dados de inicialização; os endpoints exigem o usuário da sessão e não expõem chaves ou credenciais. A interface trata os campos recebidos como texto, sem inserir HTML oriundo da API.

## Publicação

O projeto utiliza Node.js 20 no fluxo automatizado e `@tgcloud/cli` como ferramenta de implantação. Configure o segredo `TGCLOUD_TOKEN` no repositório. Alterações em `main` nos diretórios `tgcloud/` e `app/` acionam o workflow de publicação, incluindo a sincronização do webhook.

Localmente, quando autorizado, a publicação utiliza a CLI do Telegram Serverless e o arquivo `tgcloud.json`; o host da Mini App usa o formato `https://app<app_id>.tgcloud.ai/`. Configure a URL resultante no BotFather como Mini App principal ou botão de menu.

## Verificação técnica

O fluxo de desenvolvimento segue a habilidade `tg-dev`: leitura das referências oficiais, inspeção estática, sem executar testes, sem comentários no código e com histórico detalhado das alterações.

Histórico da versão: `docs/CHANGELOG-miniapp.md`.

## Referências

- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- Telegram Serverless: https://core.telegram.org/bots/serverless
- Open-Meteo: https://open-meteo.com/
- Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/
