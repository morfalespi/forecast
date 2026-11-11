# CHANGELOG — Forecast

Histórico legível da evolução do bot. **Proposto**, **implementado em desenvolvimento**, **testado localmente**, **verificado no Telegram** e **publicado** são estados diferentes. Não presumir publicação ou compatibilidade operacional a partir de código, documentação ou testes simulados.

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

## Evolução 01 — implantação tentada e pendências reais (10 de novembro de 2026)

- A primeira estrutura Serverless entrou diretamente em `main` no commit `111a6ad`, antes de passar por um PR. A divergência com o método definido pelo autor é registrada, sem reescrever esse histórico.
- A atualização de `AGENTS.md` entrou em `main` pelo commit `0c2ce168`. Este PR corrige apenas as cercas Markdown acidentalmente incluídas nesse arquivo, preservando suas regras.
- As [execuções 1](https://github.com/morfalespi/forecast/actions/runs/42940489709) e [2](https://github.com/morfalespi/forecast/actions/runs/42941734379) instalaram a CLI e executaram 17 testes com sucesso, mas `tgcloud push` falhou porque a CLI 0.2.0 rejeitou `handlers/widget_query.js`.
- A [issue #1](https://github.com/morfalespi/forecast/issues/1) e o [PR #3](https://github.com/morfalespi/forecast/pull/3) registraram a incompatibilidade e implementaram uma alternativa usando `callback_query`: o cartão Widget mantém os dados em `chat_data` e os comandos interativos são botões Telegram. O PR #3 foi integrado à `main` no commit `d57d1e09`.
- A [execução 3](https://github.com/morfalespi/forecast/actions/runs/42942206972) instalou a CLI, passou os 17 testes e reconheceu os módulos, mas o `push` foi bloqueado pela **formatação inválida de `TGCLOUD_TOKEN`**. A CLI exige o formato `app<id>:<secret>`.
- Em todas as execuções, `migrate` e `webhook sync` ficaram sem execução. Não há confirmação de deploy Serverless nem teste real no aplicativo.
- A [issue #2](https://github.com/morfalespi/forecast/issues/2) acompanha o ajuste do secret de CLI pelo proprietário, a repetição do deploy e a validação de ponta a ponta.

**Limites de comprovação:** a passagem dos testes locais prova os comportamentos exercitados nesses testes, não a aceitação do deploy nem o uso do bot no Telegram. A publicação efetiva ainda depende de credencial correta, migração, sincronização e teste real com o autor.
