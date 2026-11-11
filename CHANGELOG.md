# CHANGELOG — Forecast

Histórico legível imtegral da evolução do bot. **Proposto**, **implementado em desenvolvimento**, **testado localmente**, **verificado no Telegram** e **publicado** são estados diferentes e explicados abaixo sem resumo. 

O texto abaixo é a confirmação direta da coerência total com a normativa impressa e seguida no processo elaborado, conforme o texto `AGENTS.md` decide as regras para as modificações abaixo:

##### NÃO ALTERAR TEXTO ACIMA DESSE AVISO.

## Correção de compatibilidade para deploy — 10/11 de novembro de 2026

- **Falha real identificada:** no workflow inicial da `main`, a instalação da CLI e os 17 testes locais passaram, mas `npx tgcloud push` recusou o módulo `handlers/widget_query.js` por não pertencer ao conjunto de handlers suportados nesta versão do Serverless. O deploy, a migração e o webhook não foram concluídos naquela execução.
- **Orientação confrontada:** a Bot API documenta `widget_query` e `answerWidgetQuery`; a documentação do Serverless condiciona o nome do handler ao conjunto aceito pela plataforma. Os logs comprovam a divergência nesta implantação.
- **Compatibilização:** removido o handler rejeitado e o uso de `TelegramWidget.request`; `sendWidget` agora envia o HTML com `chat_data` e botões nativos (`callback_query`: Hoje / 5 dias / Atualizar). O backend mantém `editMessageWidgetData` e `editMessageCaption` para atualizar o cartão.
- **Segurança e persistência:** mantidos controles de usuário, chat privado, vínculo por mensagem, expiração, revogação, limitação de frequência e cache do Open-Meteo. Consultas inline e comandos meteorológicos não foram modificados nesta correção.
- **Validação local:** 17 testes passaram com Node 22 após a correção. Eles não comprovam entrega de webhooks, execução remota ou visualização no aplicativo.
- **Limitação:** botões ficam **abaixo** do Widget; solicitações disparadas dentro do HTML não estão habilitadas nesta etapa. Não apresentar essa solução como suporte a `widget_query`.
- **Rastreabilidade:** issue [#1](https://github.com/morfalespi/forecast/issues/1), PR correspondente e logs de publicação. A autorização do proprietário inclui merge na `main` e deploy em produção; o resultado será conferido após o workflow.

## Em preparação — 10 de novembro de 2026

### Tarefa 01: organização dos documentos

- Preparados três documentos para revisão isolada: `AGENTS.md`, `README.md` e `CHANGELOG.md`.
- Revisados e mantidos princípios já presentes no trabalho: comunicação pública clara, proteção de dados, verificação por fonte primária e registro fiel de mudanças.
- Unificada a identidade do projeto como **Forecast**, reconhecendo a continuidade de autoria das etapas anteriores, sem tratá-las como projetos de terceiros.
- Explicitada a diferença entre **documentação oficial**, **código atual** e **ponto inicial para modificação**.
- Adotado o processo de confronto direto entre implementação e texto oficial, uma incompatibilidade por vez.
- Preservada a distinção entre validação documental, testes locais, execução no ambiente Telegram e observação no cliente.

**Escopo desta atualização:** revisão dos três arquivos Markdown na pasta de trabalho que continuará sendo usada nas próximas tarefas. A revisão documental foi concluída antes do início da migração Serverless.

## Migração Serverless — publicação autorizada em 10 de novembro de 2026

- Preparação de módulos JavaScript e workflow para implantação em `main`, com teste local, envio, migração aditiva do banco e sincronização do webhook.
- Os resultados de publicação serão conferidos no GitHub Actions; a execução efetiva no Telegram ainda depende de validação com o proprietário.

## Versão 0.1.0 — código de desenvolvimento

*Estado descrito pelo código e pelos registros disponíveis; não revalidado nesta tarefa documental.*

### Implementado no código disponível

- Evolução do código Python/aiogram para módulos JavaScript destinados ao Telegram Serverless.
- Busca por cidade, localização enviada, local salvo e consultas de hoje e cinco dias.
- Respostas inline em texto e cartão privado experimental `/widget`, com ações Hoje, 5 dias e Atualizar.
- Persistência do estado da busca, do usuário e do cartão; cache meteorológico e expiração de registros.
- Comando `/apagar` para remover a localização salva e desativar atualizações de cartões anteriores.

### Evidência registrada anteriormente

- O registro anterior informa **17 testes locais aprovados** com Node 24 e SQLite local, abrangendo cache, expiração, validação de ações, vínculo de cartões e limites de bytes. Esses testes **não foram repetidos nesta tarefa**.
- Os registros do projeto indicam comparação de métodos e parâmetros com Bot API 10.4 e Telegram Widgets. Isso é uma verificação documental, não uma confirmação de aceitação pela plataforma.
- **Não há registro de deploy, migração do banco de produção ou teste ponta a ponta concluído** na versão recebida.

### Limitações documentadas

- Widgets em produção restritos a conversas privadas; inline textual.
- Sem migração de dados do banco antigo, sem vários favoritos e sem previsão de 7 ou 15 dias.
- Sem alertas meteorológicos oficiais ou geocodificação reversa confirmada.
- Funcionamento do SDK Serverless, integração real com Open-Meteo e renderização do widget ainda requerem validação na plataforma.

## Próximas verificações planejadas

Comparar cada comportamento relevante com `docs/` no projeto completo; corrigir incompatibilidades identificadas; registrar o resultado de cada etapa; executar testes no ambiente Telegram **somente após autorização**. Nenhuma dessas etapas é considerada concluída por aparecer nesta lista.

## Continuidade do projeto

As etapas de implementação e os documentos anteriores integram o histórico autoral do **Forecast** e permanecem disponíveis como ponto inicial para futuras modificações. Não foram atribuídas datas ou versões adicionais sem evidência.
