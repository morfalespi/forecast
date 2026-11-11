# Forecast

**A previsão da sua cidade dentro do Telegram.**

**Forecast** é um bot meteorológico para Telegram, desenvolvido como um projeto autoral em evolução contínua. Utiliza dados do [Open-Meteo](https://open-meteo.com/) e prepara uma experiência interativa com **Telegram Bot API 10.4**, **Telegram Widgets** e **Telegram Serverless**.

## O que o bot oferece na implementação em desenvolvimento

- **Buscar uma cidade** pelo nome ou enviar a localização do Telegram.
- **Salvar um local** para consultas posteriores.
- **Consultar o tempo de hoje e a previsão de cinco dias**, em texto.
- **Compartilhar previsões em texto pelo modo inline.**
- **Experimentar o cartão `/widget`**, com Hoje, 5 dias e Atualizar, em conversa privada com o bot.
- **Apagar o local salvo** e desativar a atualização dos cartões antigos com `/apagar`. As mensagens anteriores continuam no histórico da conversa.

Os comandos preparados no código incluem `/start`, `/help`, `/buscar cidade`, `/tempo`, `/previsao`, `/widget` e `/apagar`. O botão Atualizar pode reutilizar dados meteorológicos recentes do cache; não garante nova coleta a cada toque.

## Estado do desenvolvimento

A versão **0.1.0** é uma implementação de desenvolvimento, **não uma versão publicada ou validada ponta a ponta**. Os registros existentes descrevem testes locais bem-sucedidos, mas ainda não confirmam funcionamento do SDK no ambiente remoto, entrega efetiva dos updates, respostas do Open-Meteo ao vivo nem apresentação dos widgets nos aplicativos Telegram.

Os widgets são destinados ao chat privado; o modo inline continua textual. Esta versão não oferece vários favoritos, previsões de 7 ou 15 dias, identificação automática do nome do lugar via geocodificação reversa nem alertas meteorológicos oficiais. Os dados de uma etapa anterior armazenados em SQLite local ainda não foram migrados.

## Organização do projeto

O projeto completo separa o código de execução em `tgcloud/`, os testes em `tests/`, a documentação de integração em `docs/`, os quatro documentos técnicos em Markdown diretamente em `docs/`. Todo esse material pertence à evolução do Forecast; decisões passadas são revistas conforme a arquitetura atual e as APIs oficiais.

`AGENTS.md` estabelece como comparar o código com a documentação e revisar mudanças. `CHANGELOG.md` distingue o que foi preparado, implementado, verificado e publicado.

A implantação é feita pelo GitHub Actions após atualização da branch `main`, usando o segredo `TGCLOUD_TOKEN`. O workflow publica módulos, aplica mudanças aditivas do banco e sincroniza o webhook. A confirmação de uso real depende de interação no Telegram.

## Situação da publicação em produção (10 de novembro de 2026)

O autor autorizou a implantação pelo GitHub Actions, seguindo a regra de issue e pull request do `AGENTS.md`. Duas execuções automáticas foram iniciadas depois de commits diretos na `main`: [execução 1](https://github.com/morfalespi/forecast/actions/runs/42940489709) e [execução 2](https://github.com/morfalespi/forecast/actions/runs/42941734379). **Ambas falharam antes da publicação dos módulos.**

A CLI instalada (`@tgcloud/cli` 0.2.0) rejeitou `tgcloud/handlers/widget_query.js` porque `widget_query` não consta entre os tipos de handler aceitos, embora a Bot API 10.4 documente esse update. Os 17 testes locais executados pelo GitHub Actions passaram, mas `tgcloud push`, `migrate` e `webhook sync` não foram concluídos. A [issue #2](https://github.com/morfalespi/forecast/issues/2) registra a incompatibilidade e os impactos. A resolução dos Widgets interativos requer uma decisão sobre a compatibilidade do Serverless, sem tratá-los como já operacionais.
