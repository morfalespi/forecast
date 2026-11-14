# Changelog — Mini App Forecast

## 2026-11-14 — Refinamento 03: composição contínua, altura útil e pesquisa fixa

**Solicitação aprovada:** corrigir os retângulos e as descontinuidades gráficas entre cards, ocupar de forma inteligente a altura disponível de Hoje, 3 dias e Semana, tornar as animações meteorológicas perceptíveis e impedir deslocamentos ou a necessidade de dois toques na busca ao abrir o teclado.

### Pesquisa e teclado — `app/app.js`

- Reorganizado `syncViewport`: continua acompanhando a altura e o deslocamento visível do Telegram, mas deixa de aplicar estados de compactação e reposicionamento da tela inicial conforme o foco do teclado.
- Mantida uma altura de referência para o fundo orgânico, permitindo que a região ilustrada não seja redimensionada a cada abertura do teclado.
- O envio do formulário não força `searchInput.blur()` antes de iniciar a chamada `searchLocations`; o primeiro toque no botão ou a tecla de pesquisa do teclado inicia a consulta imediatamente.
- Após a resposta válida da consulta, o teclado é fechado antes de revelar a lista de até cinco cidades; quando não há localidades, a opção `Refinar busca` continua acessível.
- O bloqueio de gestos permanece ativo fora dos controles; o campo, a barra de busca e os botões continuam recebendo os eventos normais de toque.
- Preservados a validação da consulta, a serialização para evitar respostas obsoletas, os estados de carregamento/erro e a seleção de localidades.

### Tela inicial estável — `app/styles.css`

- Tela inicial reduzida ao título Forecast e à barra de pesquisa. Mantido o fundo orgânico com chuva leve, sem elementos decorativos adicionais que necessitem ser redimensionados durante a digitação.
- Removidas regras CSS antigas que escondiam, diminuíam ou deslocavam a apresentação no estado de teclado aberto.
- O título e a busca passam a ocupar uma posição superior previsível, independente da variação de altura da viewport durante a abertura do teclado.
- Campo e botão permanecem com tamanho constante; resultados reais, mensagens e `Refinar busca` são apresentados abaixo do campo, sem reposicioná-lo.
- Quando necessário, somente a lista de resultados recebe rolagem interna; o documento continua fixo e sem zoom por pinça.

### Previsões em tela cheia — `app/styles.css`

- Substituída a centralização vertical da previsão por ocupação integral da altura útil entre cabeçalho e navegação inferior, reduzindo a grande área vazia mostrada nas capturas.
- `forecast-view` passa a preencher o espaço flexível; `forecast-scroll` não recorta mais os cards e suas sombras durante a visualização normal.
- Hoje preserva o resumo, cinco métricas, título e próximos períodos com proporções de altura equilibradas; 3 dias divide o espaço restante entre três cards; Semana entre sete linhas.
- Em telas excepcionalmente baixas, permanece rolagem interna de contingência para evitar corte de dados; a página externa nunca rola.
- Preservados os valores meteorológicos, os textos, as descrições e a navegação Hoje / 3 dias / Semana.

### Integridade do vidro — `app/styles.css`

- Removidos filtros `backdrop-filter` por card e camadas de isolamento e recorte que poderiam produzir faixas ou retângulos de composição do WebView sobre o fundo orgânico.
- Desativadas as camadas pseudoelemento internas dos cards e o halo adicional do resumo principal, mantendo a transparência por meio de gradientes suaves, cantos arredondados e sombras discretas.
- A navegação inferior continua com a aparência e o tratamento de vidro previstos no design original.
- O documento segue sem bordas finas decorativas ou hairlines.

### Animações dos símbolos — `app/styles.css`

- Raios do sol agora executam uma rotação completa e lenta, com pulsação mais perceptível do disco e do halo.
- Nuvens têm um deslocamento horizontal suave, inclusive em estados parcialmente nublados.
- Gotas, flocos, lua e relâmpagos tiveram os tempos ajustados para facilitar a percepção sem excesso de movimento.
- Transformações SVG usam referências de origem apropriadas aos símbolos e preservam a redução de movimento por `prefers-reduced-motion`.

### Inspeção estática e escopo

- Alterações limitadas a `app/app.js`, `app/styles.css`, `README.md` e este changelog.
- Nenhuma alteração em `app/index.html`, `tgcloud/lib/forecast.js`, `tgcloud/endpoints/` ou `tgcloud/handlers/`.
- Revisadas as referências oficiais da habilidade `@TG Dev`: `MINI_APPS.md`, `SERVERLESS.md` e `BOT_API.md`.
- Conferidos por inspeção os caminhos de envio da busca, renderização das previsões, dimensionamento da tela e classes de animação.
- Nenhum comentário de código foi introduzido. Não foram executados testes; a confirmação do resultado no Telegram fica para a avaliação manual do usuário após o deploy.

## 2026-11-14 — Refinamento 02: cards premium e animações meteorológicas em SVG

**Escopo autorizado:** elevar exclusivamente a qualidade visual dos cartões das telas Hoje, 3 dias e Semana, e concluir as animações simples, específicas por condição meteorológica. Fluxos de pesquisa, endpoints, navegação e dados da Open-Meteo foram preservados.

### Símbolos meteorológicos

- **`app/app.js`**: substituídos os emojis apresentados como ícones meteorológicos por SVGs locais criados com `createElementNS`, sem serviços externos, imagens remotas ou novos pacotes.
- Cada símbolo é composto por partes independentes, como raios e disco solar, lua e estrelas, camadas de nuvens, traços de chuva ou garoa, flocos, névoa e relâmpago.
- Mapeamento visual compatível com os códigos WMO já recebidos: sol, parcialmente nublado, nublado, nevoeiro, garoa, chuva, neve e tempestade. Condições desconhecidas exibem um símbolo neutro.
- Adicionado tratamento noturno apenas na apresentação visual: para o painel atual, a hora já informada pela previsão; para próximos períodos, os rótulos de noite/madrugada. Céu limpo ou parcialmente nublado passa a usar lua nessas ocasiões.
- O conteúdo textual meteorológico e a classificação da fonte foram mantidos, incluindo temperaturas, probabilidade de precipitação, vento e descrições originais.
- Ícones decorativos permanecem `aria-hidden`, pois as condições continuam descritas em texto nos cartões.

### Animação discreta

- **`app/styles.css`**: animações CSS individuais para pulsação solar e halo, rotação lenta dos raios, oscilação da lua e estrelas, deslocamento de nuvens, queda intermitente de gotas, flutuação de flocos, névoa e pulso controlado do relâmpago.
- Animações utilizam majoritariamente `transform` e `opacity`, sem animar tamanho do layout; ícones continuam legíveis mesmo com as animações desativadas.
- Respeitada a preferência `prefers-reduced-motion`: todo movimento interno do SVG é interrompido.

### Refinamento dos cards

- **Hoje:** vidro mais trabalhado no resumo principal, com brilho interno sutil, profundidade e proporções diferenciadas. Métricas redistribuídas em três cartões na primeira linha e dois de larguras iguais na segunda, com legibilidade aprimorada; próximos períodos passam a usar painéis mais delicados.
- **3 dias:** cards mais arredondados, com ícone grande do lado direito, datas e descrições organizadas à esquerda e intervalo de temperatura destacado em cápsula discreta.
- **Semana:** sete linhas arredondadas com melhor separação visual, priorizando nome do dia, símbolo, descrição, temperaturas e chuva sem competir por atenção.
- Superfícies de vidro passam a compartilhar gradientes e sombras suaves nos modos claro e escuro, sem bordas decorativas ou hairlines.
- Mantida a grade responsiva full-size, sem rolagem na página e com o comportamento de contingência para alturas excepcionalmente reduzidas.
- Navegação de vidro e aparência do fundo chuvoso preservadas.

### Limites funcionais e inspeção

- Mudanças limitadas a **`app/app.js`** e **`app/styles.css`**, além da documentação.
- `app/index.html`, `tgcloud/lib/forecast.js`, `tgcloud/endpoints/` e `tgcloud/handlers/` foram mantidos sem alterações.
- Conferidos os pontos de renderização dos símbolos em Hoje, próximos períodos, 3 dias e Semana; funções da busca e da seleção permaneceram inalteradas.
- Conferidos os nomes de funções e estilos de animação, os seletores e a ausência de inserção de HTML externo.
- Conferida a orientação da habilidade `@TG Dev` em `MINI_APPS.md`, `SERVERLESS.md` e `BOT_API.md`.
- Nenhum comentário de código foi adicionado. **Nenhum teste de execução foi realizado**, apenas revisão estática; a observação do comportamento real será feita pelo usuário no Telegram após a publicação.

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
