# Forecast

**A previsão da sua cidade dentro do Telegram.**

**Forecast** é um bot meteorológico para Telegram, desenvolvido como um projeto autoral em evolução contínua. Utiliza dados do [Open-Meteo](https://open-meteo.com/) e prepara uma experiência interativa com **Telegram Bot API 10.4**, **Telegram Widgets** e **Telegram Serverless**.

## O que o bot oferece na implementação em desenvolvimento

- **Buscar uma cidade** pelo nome ou enviar a localização do Telegram.
- **Salvar um local** para consultas posteriores.
- **Consultar o tempo de hoje e a previsão de cinco dias**, em texto.
- **Compartilhar previsões em texto pelo modo inline.**
- **Experimentar o cartão `/widget`** em conversa privada, com os botões nativos **Hoje**, **5 dias** e **Atualizar** abaixo do cartão. O conteúdo do Widget muda via `chat_data`.
- **Apagar o local salvo** e desativar a atualização dos cartões antigos com `/apagar`. As mensagens anteriores continuam no histórico da conversa.

Os comandos preparados no código incluem `/start`, `/help`, `/buscar cidade`, `/tempo`, `/previsao`, `/widget` e `/apagar`. O botão Atualizar pode reutilizar dados meteorológicos recentes do cache; não garante nova coleta a cada toque.

## Estado do desenvolvimento

A versão **0.1.0** está em migração para produção. O primeiro workflow de publicação falhou porque a CLI Serverless 0.2.0 rejeitou o handler `widget_query`, embora esse update exista na Bot API. A [issue #1](https://github.com/morfalespi/forecast/issues/1) acompanha a compatibilização. O resultado do deploy deve ser conferido no GitHub Actions; execução dos comandos e renderização no aplicativo Telegram exigem confirmação real.

Os widgets são destinados ao chat privado; o modo inline continua textual. Como o roteador Serverless atual não disponibiliza `widget_query` entre os tipos aceitos, esta implementação usa o handler **`callback_query` e teclado inline**, não requisições internas `TelegramWidget.request()`; o cartão exibe o estado e acompanha suas atualizações. Esta versão não oferece vários favoritos, previsões de 7 ou 15 dias, identificação automática do nome do lugar via geocodificação reversa nem alertas meteorológicos oficiais. Os dados de uma etapa anterior armazenados em SQLite local ainda não foram migrados.

## Organização do projeto

O projeto completo separa o código de execução em `tgcloud/`, os testes em `tests/`, a documentação de integração em `docs/`, os quatro documentos técnicos em Markdown diretamente em `docs/`. Todo esse material pertence à evolução do Forecast; decisões passadas são revistas conforme a arquitetura atual e as APIs oficiais.

`AGENTS.md` estabelece como comparar o código com a documentação e revisar mudanças. `CHANGELOG.md` distingue o que foi preparado, implementado, verificado e publicado.

A implantação é feita pelo GitHub Actions após atualização da branch `main`, usando o segredo `TGCLOUD_TOKEN`. O workflow publica módulos, aplica mudanças aditivas do banco e sincroniza o webhook. A confirmação de uso real depende de interação no Telegram.
