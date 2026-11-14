# Forecast

Bot e Telegram Mini App de previsão do tempo. A conversa no Telegram e o Mini App compartilham a lógica da Open-Meteo no Telegram Serverless.

## Mini App — Refinamento 04

O frontend do Mini App agora é construído em React 19 com Vite 8, tendo como referência técnica o arquivo `HTML-main 3.zip`. Os componentes visuais são organizados por função óptica, seguindo as decisões do `vidro.ini` original:

- **Vidro fosco** para cards de leitura, campos e contêineres grandes. O componente `Frost` aplica os parâmetros únicos de blur e saturação do arquivo `frontend/vidro.ini`.
- **Refração real** na seleção da navegação segmentada em navegadores Blink compatíveis, com `@samasante/liquid-glass@0.1.1`. O componente é carregado apenas quando uma previsão está visível, depois da primeira pintura. Em WebKit e outros navegadores, usa o controle fosco, mantendo sua usabilidade.
- **Cenários meteorológicos estáticos**, desenhados em SVG, para céu limpo, parcialmente nublado, nublado, chuva, tempestade, neve, nevoeiro e noite; o fundo neutro permanece na busca. O cenário reflete a condição atual da cidade e fica estável ao alternar Hoje, 3 dias e Semana.
- **Tipografia ampliada e legibilidade:** temperatura como protagonista; textos de cards, métricas e previsões maiores. Os painéis ocupam a altura útil do smartphone, com navegação inferior fixa.
- **Animações meteorológicas localizadas nos símbolos:** sol, nuvens, chuva, tempestade, neve, lua e névoa. Redução de movimento e transparência são respeitadas.
- **Busca estável:** o título Forecast e o campo de pesquisa mantêm o mesmo posicionamento com teclado aberto ou fechado. O primeiro envio realiza a pesquisa; resultados (até cinco) e Refinar busca aparecem abaixo do campo.
- **Tema automático do Telegram** com fallback para o modo do sistema em um navegador comum.
- **Sem rolagem da página** e sem zoom por pinça; somente áreas internas possuem rolagem quando a tela é excepcionalmente curta.

## Arquitetura

| Caminho | Responsabilidade |
| --- | --- |
| `frontend/index.html` | Entrada HTML com SDK oficial de Mini Apps do Telegram |
| `frontend/src/main.jsx` | Estados, busca, previsões, troca de cenários, navegação e tema |
| `frontend/src/components/Frost.jsx` | Superfície óptica fosca do arquivo de referência |
| `frontend/src/components/GlassControls.jsx` | Controle segmentado com refração no Blink e fallback fosco |
| `frontend/src/components/WeatherIcon.jsx` | Ícones SVG animados segundo código WMO |
| `frontend/src/lib/vidro.js` e `frontend/vidro.ini` | Parâmetros centralizados de vidro e tintas |
| `frontend/src/styles.css` | Sistema visual e layouts adaptáveis |
| `frontend/public/scenes/` | Nove fundos SVG estáticos |
| `tgcloud/lib/forecast.js` | Dados Open-Meteo e contrato meteorológico compartilhado |
| `tgcloud/endpoints/searchLocations.js` | Busca autenticada de localidades |
| `tgcloud/endpoints/getForecast.js` | Previsão autenticada e estruturada |
| `tgcloud/handlers/` | Comandos e Rich Messages do bot, preservados |
| `.github/workflows/deploy.yml` | Compila frontend e publica no Telegram Serverless |
| `tgcloud.json` | Define a pasta estática `app/` do projeto publicado |

A pasta histórica `app/` do repositório contém uma versão anterior do Mini App. A implantação automatizada não usa essa versão: antes de publicar, o workflow compila `frontend/`, substitui a pasta estática do projeto de implantação pelo resultado em `frontend/dist` e mantém os endpoints em `tgcloud/`. O build de Vite gera HTML/CSS/JS estáticos; o Telegram Serverless continua servindo a aplicação sem um servidor Node em tempo de execução.

## Publicação

O workflow instalado no GitHub é acionado quando `frontend/`, `app/`, `tgcloud/`, `tgcloud.json`, `package.json` ou o próprio workflow mudam na `main`. Ele utiliza Node.js 20, instala dependências de `frontend`, executa `npm run build`, copia a saída para `tFORECASTbot/app` e faz `tgcloud fetch`, `tgcloud push` e `tgcloud webhook sync`. O segredo `TGCLOUD_TOKEN` continua sendo necessário.

Para gerar os arquivos estáticos manualmente em um ambiente autorizado, execute `npm install` e `npm run build` na pasta `frontend/`, depois copie o conteúdo gerado em `frontend/dist/` para o diretório `app/` do projeto Telegram Serverless. A pasta de build não deve substituir os módulos backend em `tgcloud/`.

## Verificação

O desenvolvimento segue a habilidade `@TG Dev`, com referências `BOT_API.md`, `SERVERLESS.md` e `MINI_APPS.md`. São realizadas inspeções estáticas do código; o agente não executa testes. A confirmação de aparência, comportamento e publicação no Telegram é feita pelo usuário após o deploy.

Histórico detalhado: `docs/CHANGELOG-miniapp.md`.

## Referências

- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- Telegram Serverless: https://core.telegram.org/bots/serverless
- Open-Meteo: https://open-meteo.com/
- Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/
