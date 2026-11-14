
const webApp = window.Telegram?.WebApp;
const root = document.documentElement;
const page = document.querySelector('.page');
const themeMeta = document.querySelector('#theme-color');
const form = document.querySelector('#city-search');
const searchInput = document.querySelector('#city');
const searchButton = document.querySelector('#search-button');
const feedback = document.querySelector('#feedback');
const hint = document.querySelector('#hint');
const results = document.querySelector('#results');
const refine = document.querySelector('#refine');
const homeView = document.querySelector('#home-view');
const forecastView = document.querySelector('#forecast-view');
const forecastContent = document.querySelector('#weather-content');
const forecastScroll = document.querySelector('#forecast-scroll');
const cityTitle = document.querySelector('#selected-city');
const changeCity = document.querySelector('#change-city');
const tabs = document.querySelector('#period-tabs');
const homeFooter = document.querySelector('#home-footer');
const attribution = document.querySelector('#forecast-attribution');
const updatedAt = document.querySelector('#updated-at');
const viewport = window.visualViewport;
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

let baselineHeight = Math.max(window.innerHeight, viewport?.height ?? 0);
let requestSerial = 0;
let activeRequest = 0;
let currentLocation = null;
let forecast = null;
let activePeriod = 'today';

function syncTheme() {
  const scheme = webApp?.colorScheme;
  const dark = scheme === 'dark' || (scheme !== 'light' && systemTheme.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  const background = dark ? '#1b1646' : '#8b82e6';
  themeMeta.content = background;
  if (webApp?.isVersionAtLeast?.('6.1')) {
    const nativeColor = webApp.isVersionAtLeast('6.9') ? background : 'bg_color';
    if (typeof webApp.setHeaderColor === 'function') webApp.setHeaderColor(nativeColor);
    if (typeof webApp.setBackgroundColor === 'function') webApp.setBackgroundColor(nativeColor);
  }
}

function syncViewport() {
  const height = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
  const top = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
  const typing = document.activeElement === searchInput && !homeView.hidden;
  if (!typing) baselineHeight = Math.max(window.innerHeight, height);
  root.style.setProperty('--visual-height', height + 'px');
  root.style.setProperty('--visual-top', top + 'px');
  page.dataset.keyboard = typing && baselineHeight - height > 110 ? 'open' : 'closed';
  page.dataset.compact = typing && height < 340 ? 'true' : 'false';
}

function create(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined && content !== null) node.textContent = String(content);
  return node;
}

function temperature(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) + ' °C' : '—';
}

function value(value, suffix) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) + suffix : '—';
}

function iconCategory(code, night = false) {
  const id = Number(code);
  if (id === 0 || id === 1) return night ? 'moon' : 'sun';
  if (id === 2) return night ? 'night-partly' : 'partly';
  if (id === 3) return 'cloud';
  if (id === 45 || id === 48) return 'fog';
  if ([51, 53, 55, 56, 57].includes(id)) return 'drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(id)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(id)) return 'snow';
  if ([95, 96, 99].includes(id)) return 'storm';
  return 'unknown';
}

function svgElement(tag, attributes = {}, children = []) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, val] of Object.entries(attributes)) node.setAttribute(key, String(val));
  node.append(...children);
  return node;
}

function sunArtwork(cx = 35, cy = 25, radius = 11) {
  const rays = svgElement('g', { class: 'wx-rays' });
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4;
    const inner = radius + 5;
    const outer = radius + 10;
    rays.append(svgElement('line', {
      x1: cx + Math.cos(angle) * inner,
      y1: cy + Math.sin(angle) * inner,
      x2: cx + Math.cos(angle) * outer,
      y2: cy + Math.sin(angle) * outer,
      class: 'wx-ray'
    }));
  }
  return svgElement('g', { class: 'wx-sun-assembly' }, [
    rays,
    svgElement('circle', { cx, cy, r: radius + 3, class: 'wx-sun-halo' }),
    svgElement('circle', { cx, cy, r: radius, class: 'wx-sun-core' })
  ]);
}

function moonArtwork() {
  return svgElement('g', { class: 'wx-moon-assembly' }, [
    svgElement('path', {
      class: 'wx-moon-core',
      d: 'M42 9c-4.6 6.9-4.5 15.5 1.8 21.5 3.9 3.8 8.3 5.4 12.8 4.5C53 45 43.8 51 33 48.5 21.6 45.7 16 34.8 19.8 24.5 23.4 15 32.4 10.2 42 9Z'
    }),
    svgElement('circle', { cx: 50, cy: 15, r: 1.7, class: 'wx-star star-one' }),
    svgElement('circle', { cx: 54, cy: 24, r: 1.1, class: 'wx-star star-two' })
  ]);
}

function cloudArtwork() {
  return svgElement('g', { class: 'wx-cloud-assembly' }, [
    svgElement('path', {
      class: 'wx-cloud-back',
      d: 'M16 31c-1.2-5.2 2.6-10.7 8-11.1 1.9-6.3 9.8-9.3 15.1-5.7 3.2 2.1 4.7 5.1 5.1 8.2 5.7-.4 11 3.6 11.4 8.7H16Z'
    }),
    svgElement('path', {
      class: 'wx-cloud-front',
      d: 'M15.7 46c-5.7 0-10-4.2-10-9.2 0-5.1 3.8-9.1 8.8-9.6 2.1-6.4 8.4-10.7 15.4-10.7 7.4 0 13.8 5 15 12 6.8.2 12 4.3 12 9.4 0 5.2-4.6 8.1-10.4 8.1H15.7Z'
    }),
    svgElement('path', {
      class: 'wx-cloud-sheen',
      d: 'M15 33c1.4-1.2 3.7-1.5 5.3-1.1 1.1-5.5 5.5-9.2 11-9.2'
    })
  ]);
}

function weatherArtwork(type) {
  const nodes = [];
  if (type === 'sun' || type === 'partly') nodes.push(sunArtwork());
  if (type === 'moon' || type === 'night-partly') nodes.push(moonArtwork());
  if (!['sun', 'moon', 'unknown'].includes(type)) nodes.push(cloudArtwork());
  if (type === 'fog') {
    nodes.push(svgElement('g', { class: 'wx-fog-lines' }, [
      svgElement('path', { d: 'M12 51h26', class: 'wx-fog-line' }),
      svgElement('path', { d: 'M23 57h30', class: 'wx-fog-line' })
    ]));
  }
  if (type === 'rain' || type === 'drizzle') {
    const drops = [17, 31, 45].map((x, i) => svgElement('path', {
      d: type === 'drizzle' ? 'M' + x + ' 50l-1.8 4' : 'M' + x + ' 49l-3 8',
      class: 'wx-drop drop-' + (i + 1)
    }));
    nodes.push(svgElement('g', { class: 'wx-rain-lines' }, drops));
  }
  if (type === 'snow') {
    nodes.push(svgElement('g', { class: 'wx-snow-particles' }, [
      svgElement('path', { d: 'M17 50v9m-4.5-4.5h9m-7.7-3.2 6.4 6.4m0-6.4-6.4 6.4', class: 'wx-snowflake snow-one' }),
      svgElement('path', { d: 'M43 48v9m-4.5-4.5h9m-7.7-3.2 6.4 6.4m0-6.4-6.4 6.4', class: 'wx-snowflake snow-two' })
    ]));
  }
  if (type === 'storm') {
    nodes.push(svgElement('g', { class: 'wx-lightning' }, [
      svgElement('path', { d: 'M33 45 24 56h8l-3 8 14-15h-9l3-4Z', class: 'wx-bolt' })
    ]));
  }
  if (type === 'unknown') {
    nodes.push(svgElement('circle', { cx: 32, cy: 32, r: 16, class: 'wx-question-disc' }));
    nodes.push(svgElement('path', { d: 'M25 25c0-6 14-8 14 0 0 5-7 6-7 12m0 7v1', class: 'wx-question-path' }));
  }
  return svgElement('svg', {
    class: 'wx-artwork',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 64 64',
    fill: 'none',
    'aria-hidden': 'true',
    focusable: 'false'
  }, nodes);
}

function nightForCurrent() {
  const time = forecast?.updatedAt;
  const hour = typeof time === 'string' ? Number(time.slice(11, 13)) : NaN;
  return Number.isFinite(hour) && (hour < 6 || hour >= 19);
}

function weatherIcon(emoji, code, small = false, night = false) {
  const category = iconCategory(code, night);
  const node = create('span', 'weather-symbol wx-' + category + (small ? ' small' : ''));
  node.setAttribute('aria-hidden', 'true');
  node.append(weatherArtwork(category));
  return node;
}

function emptyPanel(title, description, retry = false) {
  const panel = create('div', 'glass-panel frost forecast-empty');
  panel.append(create('h2', 'content-title', title), create('p', '', description));
  if (retry && currentLocation) {
    const button = create('button', 'retry-btn', 'Tentar novamente');
    button.type = 'button';
    button.addEventListener('click', () => loadForecast(currentLocation));
    panel.append(button);
  }
  return panel;
}

function metric(label, detail) {
  const node = create('div', 'metric frost');
  node.append(create('span', 'metric-label', label), create('span', 'metric-value', detail));
  return node;
}

function setSearchStatus(text, isError = false) {
  feedback.textContent = text;
  feedback.setAttribute('data-error', String(isError));
}

function isServerlessReady() {
  if (typeof webApp?.Serverless?.call === 'function') return true;
  setSearchStatus('Abra o Mini App pelo Telegram para consultar o clima.', true);
  return false;
}

function serverlessCall(method, input) {
  return new Promise((resolve, reject) => {
    if (!isServerlessReady()) {
      reject({ type: 'UNAUTHORIZED' });
      return;
    }
    try {
      webApp.Serverless.call(method, input, (error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function explainError(error) {
  if (error?.type === 'UNAUTHORIZED') return 'Abra o Mini App pelo Telegram para consultar o clima.';
  if (error?.type === 'ENDPOINT_ERROR' && typeof error.message === 'string') return error.message;
  return 'A consulta não está disponível agora. Tente novamente.';
}

function displayResults(locations) {
  results.replaceChildren();
  for (const location of locations.slice(0, 5)) {
    if (!location || !location.id || !location.name) continue;
    const button = create('button', 'result-item frost');
    button.type = 'button';
    const label = [location.name, location.admin1, location.country]
      .filter((item, index, parts) => item && parts.indexOf(item) === index)
      .join(' — ');
    button.append(create('span', 'result-pin', '⌖'), create('span', 'result-name', label), create('span', 'result-arrow', '›'));
    button.setAttribute('aria-label', 'Ver previsão de ' + label);
    button.addEventListener('click', () => loadForecast(location));
    results.append(button);
  }
  const hasResults = results.childElementCount > 0;
  results.hidden = !hasResults;
  refine.hidden = false;
  page.dataset.mode = hasResults ? 'results' : 'intro';
  hint.textContent = hasResults ? 'Selecione uma localidade.' : 'Tente incluir estado ou país.';
}

async function searchCity(query) {
  if (!isServerlessReady()) return;
  const serial = ++requestSerial;
  activeRequest = serial;
  results.hidden = true;
  refine.hidden = true;
  page.dataset.mode = 'intro';
  searchButton.disabled = true;
  setSearchStatus('Buscando localidades…');
  hint.textContent = 'Pesquisando na Open-Meteo.';
  try {
    const result = await serverlessCall('searchLocations', { query });
    if (serial !== activeRequest || homeView.hidden) return;
    const locations = Array.isArray(result?.locations) ? result.locations : [];
    displayResults(locations);
    setSearchStatus(locations.length ? '' : 'Nenhuma localidade encontrada.');
  } catch (error) {
    if (serial !== activeRequest || homeView.hidden) return;
    setSearchStatus(explainError(error), true);
    hint.textContent = 'Você pode tentar outra pesquisa.';
  } finally {
    if (serial === activeRequest) searchButton.disabled = false;
  }
}

function showHome() {
  ++requestSerial;
  activeRequest = requestSerial;
  currentLocation = null;
  forecast = null;
  searchButton.disabled = false;
  homeView.hidden = false;
  forecastView.hidden = true;
  tabs.hidden = true;
  attribution.hidden = true;
  homeFooter.hidden = false;
  page.dataset.screen = 'home';
  page.dataset.mode = 'intro';
  results.hidden = true;
  refine.hidden = true;
  setSearchStatus('');
  hint.textContent = 'Digite uma localidade para começar.';
  syncViewport();
}

function showForecastScreen(location) {
  searchInput.blur();
  homeView.hidden = true;
  forecastView.hidden = false;
  homeFooter.hidden = true;
  tabs.hidden = true;
  attribution.hidden = true;
  page.dataset.screen = 'forecast';
  page.dataset.keyboard = 'closed';
  cityTitle.textContent = location.name;
  forecastContent.replaceChildren(emptyPanel('Consultando previsão', 'Buscando os dados meteorológicos…'));
  forecastScroll.scrollTop = 0;
  syncViewport();
}

async function loadForecast(location) {
  if (!location?.id) return;
  const serial = ++requestSerial;
  activeRequest = serial;
  currentLocation = location;
  forecast = null;
  activePeriod = 'today';
  showForecastScreen(location);
  try {
    const data = await serverlessCall('getForecast', { id: String(location.id) });
    if (serial !== activeRequest || forecastView.hidden) return;
    if (!data?.current || !Array.isArray(data?.days)) throw { type: 'ENDPOINT_ERROR', message: 'Previsão indisponível.' };
    forecast = data;
    cityTitle.textContent = data.location?.name || location.name;
    tabs.hidden = false;
    attribution.hidden = false;
    updatedAt.textContent = typeof data.updatedAt === 'string' && data.updatedAt.length >= 16
      ? ' · Atualizado às ' + data.updatedAt.slice(11, 16) + '.'
      : '';
    renderForecast();
  } catch (error) {
    if (serial !== activeRequest || forecastView.hidden) return;
    forecastContent.replaceChildren(emptyPanel('Previsão indisponível', explainError(error), true));
  }
}

function todayPanel(data) {
  const current = data.current;
  const panel = create('section', 'glass-panel frost current-panel');
  const info = create('div', 'current-copy');
  const temp = create('div', 'current-temperature');
  const number = typeof current.temperature === 'number' ? current.temperature : '—';
  temp.append(document.createTextNode(String(number)), create('span', 'unit', '°C'));
  info.append(create('p', 'eyebrow', 'AGORA'), temp, create('p', 'condition-name', current.description || 'Condição não informada'));
  panel.append(info, weatherIcon(current.emoji, current.code, false, nightForCurrent()));
  return panel;
}

function todayContent(data) {
  const content = create('div', 'weather-content');
  content.append(todayPanel(data));
  const metrics = create('div', 'metrics');
  metrics.append(
    metric('Mínima', temperature(data.current.minimum)),
    metric('Máxima', temperature(data.current.maximum)),
    metric('Sensação', temperature(data.current.apparent)),
    metric('Umidade', value(data.current.humidity, '%')),
    metric('Vento', value(data.current.wind, ' km/h'))
  );
  content.append(metrics);
  if (data.periods?.length) {
    content.append(create('h2', 'content-title', 'Próximos períodos'));
    const periodGrid = create('div', 'periods-grid');
    periodGrid.style.setProperty('--period-columns', String(Math.min(data.periods.length, 3)));
    for (const period of data.periods) {
      const card = create('article', 'glass-panel frost period-tile');
      card.append(
        create('h3', 'period-title', period.label),
        weatherIcon(period.emoji, period.code, true, /noite|madrugada/i.test(period.label)),
        create('p', 'period-temp', temperature(period.temperature)),
        create('p', 'period-desc', period.description || 'Condição não informada'),
        create('p', 'period-meta', 'Chuva ' + value(period.precipitation, '%') + ' · Vento ' + value(period.wind, ' km/h'))
      );
      periodGrid.append(card);
    }
    content.append(periodGrid);
  }
  return content;
}

function threeDayContent(data) {
  const content = create('div', 'weather-content');
  content.append(create('h2', 'content-title', 'Próximos 3 dias'));
  for (const day of data.days.slice(0, 3)) {
    const card = create('article', 'glass-panel frost day-panel');
    const info = create('div', 'day-info');
    info.append(
      create('h3', 'day-title', day.fullLabel || day.label),
      create('p', 'day-desc', day.description || 'Condição não informada'),
      create('p', 'day-stats', temperature(day.minimum) + ' – ' + temperature(day.maximum)),
      create('p', 'period-details', 'Chuva: ' + value(day.precipitation, '%') + ' · Vento: ' + value(day.wind, ' km/h'))
    );
    card.append(info, weatherIcon(day.emoji, day.code, true));
    content.append(card);
  }
  if (!data.days.length) content.append(emptyPanel('Sem dados', 'Não há previsão disponível para esses dias.'));
  return content;
}

function weekContent(data) {
  const content = create('div', 'weather-content');
  content.append(create('h2', 'content-title', 'Previsão da semana'));
  for (const day of data.days.slice(0, 7)) {
    const card = create('article', 'glass-panel frost week-panel');
    const info = create('div', 'week-info');
    info.append(weatherIcon(day.emoji, day.code, true), create('span', 'week-description', day.description || '—'));
    const temps = create('div', '');
    temps.append(create('div', 'week-temps', value(day.minimum, '°') + '–' + value(day.maximum, '°')), create('div', 'week-rain', 'Chuva: ' + value(day.precipitation, '%')));
    card.append(create('div', 'week-day', day.label), info, temps);
    content.append(card);
  }
  if (!data.days.length) content.append(emptyPanel('Sem dados', 'Não há previsão semanal disponível.'));
  return content;
}

function renderForecast() {
  if (!forecast) return;
  const next = activePeriod === 'three'
    ? threeDayContent(forecast)
    : activePeriod === 'week' ? weekContent(forecast) : todayContent(forecast);
  forecastContent.dataset.period = activePeriod;
  forecastContent.dataset.hasPeriods = String(Boolean(forecast.periods?.length));
  forecastContent.replaceChildren(...next.children);
  for (const button of tabs.querySelectorAll('[data-period]')) {
    button.setAttribute('aria-pressed', String(button.dataset.period === activePeriod));
  }
  forecastScroll.scrollTop = 0;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.replace(/\s+/g, ' ').trim();
  if (query.length < 2 || query.length > 100) {
    setSearchStatus('Digite entre 2 e 100 caracteres.', true);
    return;
  }
  searchInput.blur();
  searchCity(query);
});
searchInput.addEventListener('input', () => {
  ++requestSerial;
  activeRequest = requestSerial;
  searchButton.disabled = false;
  setSearchStatus('');
  results.hidden = true;
  refine.hidden = true;
  page.dataset.mode = 'intro';
  hint.textContent = 'Digite uma localidade para começar.';
});
refine.addEventListener('click', () => {
  results.hidden = true;
  refine.hidden = true;
  page.dataset.mode = 'intro';
  setSearchStatus('');
  hint.textContent = 'Inclua estado, região ou país para refinar.';
  searchInput.focus();
  searchInput.select();
});
changeCity.addEventListener('click', () => {
  showHome();
  searchInput.focus();
  searchInput.select();
});
tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-period]');
  if (!button) return;
  const period = button.dataset.period;
  if (!['today', 'three', 'week'].includes(period)) return;
  activePeriod = period;
  renderForecast();
});
document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (event) => event.preventDefault(), { passive: false });
document.addEventListener('touchmove', (event) => {
  const target = event.target;
  if (event.touches.length > 1 || !(target instanceof Element && target.closest('.forecast-scroll, .search-results, input'))) {
    event.preventDefault();
  }
}, { passive: false });
viewport?.addEventListener('resize', syncViewport);
viewport?.addEventListener('scroll', syncViewport);
window.addEventListener('resize', syncViewport);
window.addEventListener('orientationchange', syncViewport);
window.addEventListener('pageshow', syncViewport);
searchInput.addEventListener('focus', syncViewport);
searchInput.addEventListener('blur', syncViewport);
webApp?.onEvent?.('themeChanged', syncTheme);
systemTheme.addEventListener('change', syncTheme);
syncTheme();
syncViewport();
webApp?.ready?.();
webApp?.expand?.();
