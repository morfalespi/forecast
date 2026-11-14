# Changelog — Mini App Forecast

## 2026-11-14 — Refinamento 01: previsões sem rolagem e barra superior harmonizada

**Solicitação:** em visualização full-size, reorganizar o espaço disponível nas telas Hoje, 3 dias e Semana, dispensando rolagem durante a leitura, e harmonizar a barra superior do Telegram com a cor do Forecast.

### Mudanças de interface

- **`app/styles.css`**: alterado o posicionamento da previsão para aproveitar integralmente a área útil da Mini App e diminuir folgas entre o cabeçalho, os cartões, a navegação e a atribuição meteorológica.
- A área da previsão normalmente não possui rolagem: as alturas são redistribuídas por uma grade proporcional conforme o período selecionado.
- **Hoje:** resumo meteorológico mais compacto, cinco métricas em duas linhas e cartões dos próximos períodos distribuídos horizontalmente no espaço disponível.
- **3 dias:** três painéis redimensionáveis com descrição, mínima, máxima, vento e precipitação.
- **Semana:** sete linhas mais enxutas, todas visíveis dentro da região disponível em uma tela cheia de smartphone convencional.
- Barra inferior **Hoje / 3 dias / Semana** permanece visível e em estilo de vidro líquido.
- Mantidos o fundo de chuva suave, os ícones animados, a largura máxima de smartphone e a ausência de rolagem na página.
- Para telas excepcionalmente baixas (viewport inferior a 510 px), há rolagem interna de contingência, preservando a leitura integral dos dados em vez de cortá-los.

### Barra nativa do Telegram

- **`app/app.js`**: `syncTheme` passa a usar `Telegram.WebApp.setHeaderColor` e `Telegram.WebApp.setBackgroundColor` com a cor de fundo do Forecast, em sincronismo com o modo claro ou escuro.
- Mantida a reação ao evento oficial `themeChanged` e a atualização do `meta theme-color` em navegadores externos.
- A faixa superior é configurada pelo SDK Telegram WebApp, sem adicionar um cabeçalho HTML falso.

### Inspeção estática

- Revisadas as regras responsivas para Hoje, 3 dias e Semana, bem como a rolagem de contingência em telas muito baixas.
- Verificada a quantidade dinâmica de colunas dos próximos períodos e a preservação do texto meteorológico.
- Revisados os contratos das APIs `setHeaderColor`, `setBackgroundColor` e `themeChanged` na referência `MINI_APPS.md`.
- Preservados os endpoints de pesquisa e previsão, os handlers do bot e o contrato da Open-Meteo.
- Nenhum comentário adicionado a arquivos de código e nenhum teste executado, seguindo as regras do `@TG Dev`.

## 2026-11-14 — Implementação inicial

**Escopo aprovado:** incorporar o visual do Rascunho 05 ao mesmo bot do Forecast, ativando pesquisa de localidades e previsões Hoje, 3 dias e Semana.

### Interface

- **`app/index.html`:** substituição da antiga página de identificação por um Mini App meteorológico com título Forecast, descrição curta e campo de pesquisa.
- Incorporação da estrutura original do Rascunho 05, incluindo o ícone principal, a marca e a camada de chuva sobre vidro, sem reconstruir a estética por aproximação.
- Área de até cinco localidades selecionáveis, identificadas por cidade, região e país. O botão **Refinar busca** permanece disponível mesmo quando não há resultados.
- Após a seleção, substituição da tela de busca por um painel meteorológico na própria página. Botão **Nova busca** retorna à pesquisa.
- Navegação inferior fixa entre **Hoje**, **3 dias** e **Semana**, com destaque do período selecionado e preservação da cidade atual.
- Rodapé de atribuição à Open-Meteo e à licença Creative Commons Attribution 4.0.

### Design e acessibilidade

- **`app/styles.css`:** migração dos estilos originais do Rascunho 05, com os dois fundos SVG orgânicos embutidos, efeito de gotículas e trilhas de chuva lenta.
- Componentes adicionais em vidro translúcido: resultados da busca, painéis de temperatura, métricas, detalhes por período, dias e navegação.
- Página limitada a 430 px de largura, com altura e posição adaptadas à viewport visual; sem rolagem no documento e sem zoom por pinça.
- Quando o conteúdo não cabe no espaço disponível, a rolagem é interna às áreas delimitadas de resultados e previsão; a barra inferior mantém sua posição.
- Tema automático pelo Telegram WebApp, com alternativa baseada na preferência do sistema fora do Telegram.
- Animações discretas para sol, nuvens, precipitação, neve e tempestades com respeito a `prefers-reduced-motion` e `prefers-reduced-transparency`.
- Rótulos e regiões acessíveis, estados de carregamento e erro, indicadores semânticos dos botões e interpolação segura de dados via `textContent`.

### Integração funcional

- **`tgcloud/endpoints/searchLocations.js`:** endpoint do Telegram Serverless para pesquisar até cinco localidades; utiliza `normalizeCityQuery` e `searchLocations` existentes e exige dados de sessão validados.
- **`tgcloud/endpoints/getForecast.js`:** endpoint que recebe o identificador numérico de uma localidade, valida a entrada, consulta `getLocation` e `getForecast` e retorna dados estruturados.
- **`tgcloud/lib/forecast.js`:** acrescentada a exportação `buildMiniAppForecastResponse`, que reaproveita `dailyForecast`, `hourlyPeriods`, `weatherInfo` e as fontes existentes para gerar o contrato da interface.
- **`app/app.js`:** integração via método documentado `Telegram.WebApp.Serverless.call`, com tratamento de respostas assíncronas, proteção contra respostas obsoletas, seleção da cidade, períodos da previsão, formatação de valores ausentes e controle do teclado.
- Uso das informações reais da Open-Meteo. Não foram adicionados valores meteorológicos fixos ou previsões inventadas.
- Preservadas as funções utilizadas pelo bot de conversa, seus handlers e seus Rich Messages.

### Inspeção estática

- Conferidas as conexões entre `app/app.js`, os nomes dos endpoints e os exports de `tgcloud/lib/forecast.js`.
- Conferida a exigência de sessão do Telegram pelos endpoints usando `ctx.initData.user`, validada pela própria plataforma conforme a documentação do Telegram Serverless.
- Conferida a manutenção dos handlers existentes `tgcloud/handlers/message.js` e `tgcloud/handlers/callback_query.js` sem modificações.
- Conferidos os estados de pesquisa, sem resultados, refinamento, carregamento, erro e retorno à busca.
- Conferidas as referências de licença, a adaptação ao tema, a viewport e a redução de movimento.
- Não foram adicionados comentários nos arquivos de implementação.
- **Nenhum teste funcional ou de execução foi realizado**, conforme as instruções da habilidade `tg-dev`. A publicação e o funcionamento no Telegram dependem da implantação.

### Referências de implementação

- `references/MINI_APPS.md` da habilidade `tg-dev`: seções *Designing Mini Apps*, *Initializing Mini Apps* e *Serverless*.
- `references/SERVERLESS.md` da habilidade `tg-dev`: seções *Endpoints*, *Calling an endpoint from the Mini App* e *Mini App front-end*.
- `references/BOT_API.md` da habilidade `tg-dev`: Bot API e integração do Mini App com o bot.
