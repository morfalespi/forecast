import { fetch } from 'sdk';

const GEOCODING_SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODING_GET_URL = 'https://geocoding-api.open-meteo.com/v1/get';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_URL = 'https://open-meteo.com/';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const PERIODS = new Set(['today', 'three', 'week']);
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEATHER = new Map([
  [0, ['☀️', 'Céu limpo']],
  [1, ['🌤️', 'Predominantemente limpo']],
  [2, ['⛅', 'Parcialmente nublado']],
  [3, ['☁️', 'Nublado']],
  [45, ['🌫️', 'Nevoeiro']],
  [48, ['🌫️', 'Nevoeiro com geada']],
  [51, ['🌦️', 'Garoa fraca']],
  [53, ['🌦️', 'Garoa moderada']],
  [55, ['🌧️', 'Garoa intensa']],
  [56, ['🌧️', 'Garoa congelante fraca']],
  [57, ['🌧️', 'Garoa congelante intensa']],
  [61, ['🌦️', 'Chuva fraca']],
  [63, ['🌧️', 'Chuva moderada']],
  [65, ['🌧️', 'Chuva forte']],
  [66, ['🌧️', 'Chuva congelante fraca']],
  [67, ['🌧️', 'Chuva congelante forte']],
  [71, ['🌨️', 'Neve fraca']],
  [73, ['🌨️', 'Neve moderada']],
  [75, ['❄️', 'Neve forte']],
  [77, ['❄️', 'Grãos de neve']],
  [80, ['🌦️', 'Pancadas fracas']],
  [81, ['🌧️', 'Pancadas moderadas']],
  [82, ['⛈️', 'Pancadas fortes']],
  [85, ['🌨️', 'Pancadas de neve fracas']],
  [86, ['❄️', 'Pancadas de neve fortes']],
  [95, ['⛈️', 'Trovoadas']],
  [96, ['⛈️', 'Trovoadas com granizo']],
  [99, ['⛈️', 'Trovoadas fortes com granizo']]
]);

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerId(value) {
  const text = String(value ?? '');
  return /^\d{1,20}$/.test(text) && Number(text) > 0 ? text : null;
}

function callbackData(value) {
  const size = new TextEncoder().encode(value).length;
  if (size < 1 || size > 64) {
    throw new Error('callback_data fora do limite da Bot API');
  }
  return value;
}

function normalizeLocation(value) {
  const id = integerId(value?.id);
  const latitude = finiteNumber(value?.latitude);
  const longitude = finiteNumber(value?.longitude);
  const name = typeof value?.name === 'string' ? value.name.trim() : '';
  if (!id || latitude === null || longitude === null || !name) {
    return null;
  }
  return {
    id,
    name,
    admin1: typeof value.admin1 === 'string' ? value.admin1.trim() : '',
    country: typeof value.country === 'string' ? value.country.trim() : '',
    countryCode: typeof value.country_code === 'string' ? value.country_code.trim() : '',
    latitude,
    longitude,
    timezone: typeof value.timezone === 'string' && value.timezone ? value.timezone : 'auto'
  };
}

function locationLabel(location) {
  return [location.name, location.admin1, location.country]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(' — ');
}

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo respondeu ${response.status}`);
  }
  return response.json();
}

function weatherInfo(code) {
  return WEATHER.get(Number(code)) ?? ['🌡️', 'Condição não informada'];
}

function rounded(value) {
  const number = finiteNumber(value);
  return number === null ? null : Math.round(number);
}

function valueText(value, suffix) {
  const number = rounded(value);
  return number === null ? null : `${number}${suffix}`;
}

function detailsText(parts) {
  return parts.filter(Boolean).join(' · ');
}

function dateAtOffset(date, offset) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  parsed.setUTCDate(parsed.getUTCDate() + offset);
  return parsed.toISOString().slice(0, 10);
}

function dateLabel(date, index) {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  if (index === 2) return 'Depois de amanhã';
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${DAY_NAMES[parsed.getUTCDay()]} ${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

function dominantCode(codes) {
  const counts = new Map();
  for (const value of codes) {
    const code = rounded(value);
    if (code !== null) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let selected = null;
  let count = -1;
  for (const [code, occurrences] of counts) {
    if (occurrences > count) {
      selected = code;
      count = occurrences;
    }
  }
  return selected;
}

function average(values) {
  const numbers = values.map(finiteNumber).filter((value) => value !== null);
  if (!numbers.length) return null;
  return numbers.reduce((total, value) => total + value, 0) / numbers.length;
}

function maximum(values) {
  const numbers = values.map(finiteNumber).filter((value) => value !== null);
  return numbers.length ? Math.max(...numbers) : null;
}

function periodDefinitions(hour) {
  if (hour < 6) {
    return [
      ['Manhã', 0, 6, 11],
      ['Tarde', 0, 12, 17],
      ['Noite', 0, 18, 23]
    ];
  }
  if (hour < 12) {
    return [
      ['Tarde', 0, 12, 17],
      ['Noite', 0, 18, 23]
    ];
  }
  if (hour < 18) {
    return [
      ['Noite', 0, 18, 23],
      ['Madrugada de amanhã', 1, 0, 5]
    ];
  }
  return [
    ['Madrugada de amanhã', 1, 0, 5],
    ['Manhã de amanhã', 1, 6, 11]
  ];
}

function hourlyPeriods(forecast) {
  const currentTime = typeof forecast?.current?.time === 'string' ? forecast.current.time : '';
  if (currentTime.length < 13) return [];
  const currentDate = currentTime.slice(0, 10) || forecast?.daily?.time?.[0];
  const currentHour = Number(currentTime.slice(11, 13));
  const times = Array.isArray(forecast?.hourly?.time) ? forecast.hourly.time : [];
  if (!currentDate || !Number.isInteger(currentHour) || currentHour < 0 || currentHour > 23) return [];
  return periodDefinitions(currentHour).flatMap(([label, offset, start, end]) => {
    const targetDate = dateAtOffset(currentDate, offset);
    const indexes = [];
    for (let index = 0; index < times.length; index += 1) {
      const time = typeof times[index] === 'string' ? times[index] : '';
      const hour = Number(time.slice(11, 13));
      if (time.slice(0, 10) === targetDate && hour >= start && hour <= end) indexes.push(index);
    }
    if (!indexes.length) return [];
    const temperature = indexes.map((index) => forecast.hourly?.temperature_2m?.[index]);
    const precipitation = indexes.map((index) => forecast.hourly?.precipitation_probability?.[index]);
    const wind = indexes.map((index) => forecast.hourly?.wind_speed_10m?.[index]);
    const codes = indexes.map((index) => forecast.hourly?.weather_code?.[index]);
    return [{
      label,
      temperature: average(temperature),
      precipitation: maximum(precipitation),
      wind: maximum(wind),
      code: dominantCode(codes)
    }];
  });
}

function dailyForecast(forecast, limit) {
  const times = Array.isArray(forecast?.daily?.time) ? forecast.daily.time : [];
  return times.slice(0, limit).map((date, index) => ({
    date,
    label: dateLabel(date, index),
    code: rounded(forecast.daily?.weather_code?.[index]),
    minimum: finiteNumber(forecast.daily?.temperature_2m_min?.[index]),
    maximum: finiteNumber(forecast.daily?.temperature_2m_max?.[index]),
    precipitation: finiteNumber(forecast.daily?.precipitation_probability_max?.[index]),
    wind: finiteNumber(forecast.daily?.wind_speed_10m_max?.[index])
  }));
}

function paragraph(text) {
  return { type: 'paragraph', text };
}

function heading(text, size = 2) {
  return { type: 'heading', text, size };
}

function footer(forecast) {
  const time = typeof forecast?.current?.time === 'string' ? forecast.current.time.slice(11, 16) : '';
  const updated = time ? ` · Atualizado às ${time}, horário local` : '';
  return {
    type: 'footer',
    text: [
      'Fonte: ',
      { type: 'url', text: 'Open-Meteo', url: OPEN_METEO_URL },
      ' — ',
      { type: 'url', text: 'CC BY 4.0', url: LICENSE_URL },
      ' · Dados resumidos pelo Forecast',
      updated
    ]
  };
}

function forecastButtons(locationId, active) {
  return {
    type: 'buttons',
    align: 'center',
    buttons: [
      ['Hoje', 'today'],
      ['3 dias', 'three'],
      ['Semana', 'week']
    ].map(([text, period]) => period === active
      ? { text, style: 'primary', disabled: {} }
      : { text, callback_data: encodeForecastCallback(period, locationId) })
  };
}

function currentBlocks(location, forecast) {
  const current = forecast?.current ?? {};
  const [emoji, description] = weatherInfo(current.weather_code);
  const temperature = valueText(current.temperature_2m, ' °C') ?? 'Temperatura não informada';
  const apparent = valueText(current.apparent_temperature, ' °C');
  const humidity = valueText(current.relative_humidity_2m, '%');
  const wind = valueText(current.wind_speed_10m, ' km/h');
  const blocks = [
    heading(location.name, 1),
    heading([
      { type: 'bold', text: `AGORA · ${temperature}` },
      '\n',
      `${emoji} ${description}`,
      ...(apparent ? ['\n', `Sensação: ${apparent}`] : []),
      ...(humidity || wind ? ['\n', detailsText([humidity ? `Umidade: ${humidity}` : null, wind ? `Vento: ${wind}` : null])] : [])
    ], 4)
  ];
  const periods = hourlyPeriods(forecast);
  if (periods.length) {
    blocks.push({ type: 'divider' }, heading('Próximos períodos', 2));
    for (const period of periods) {
      const [periodEmoji, periodDescription] = weatherInfo(period.code);
      blocks.push(heading([
        { type: 'bold', text: period.label },
        '\n',
        detailsText([
          `${periodEmoji} ${periodDescription}`,
          valueText(period.temperature, ' °C'),
          valueText(period.precipitation, '%') ? `Chuva: ${valueText(period.precipitation, '%')}` : null,
          valueText(period.wind, ' km/h') ? `Vento: ${valueText(period.wind, ' km/h')}` : null
        ])
      ], 4));
    }
  }
  return blocks;
}

function threeDayBlocks(location, forecast) {
  const days = dailyForecast(forecast, 3);
  const blocks = [heading(location.name, 1), heading('Próximos 3 dias', 2)];
  for (const day of days) {
    const [emoji, description] = weatherInfo(day.code);
    blocks.push(heading([
      { type: 'bold', text: day.label },
      '\n',
      detailsText([
        `${emoji} ${description}`,
        day.minimum !== null && day.maximum !== null ? `${Math.round(day.minimum)}–${Math.round(day.maximum)} °C` : null,
        valueText(day.precipitation, '%') ? `Chuva: ${valueText(day.precipitation, '%')}` : null,
        valueText(day.wind, ' km/h') ? `Vento: ${valueText(day.wind, ' km/h')}` : null
      ])
    ], 4));
  }
  return blocks;
}

function tableCell(text, isHeader = false, align = 'left') {
  return { text, ...(isHeader ? { is_header: true } : {}), align, valign: 'middle' };
}

function weekBlocks(location, forecast) {
  const days = dailyForecast(forecast, 7);
  const wettest = days.reduce((selected, day) => {
    if (day.precipitation === null) return selected;
    if (!selected || day.precipitation > selected.precipitation) return day;
    return selected;
  }, null);
  const blocks = [heading(location.name, 1), heading('Semana', 2)];
  if (wettest) {
    blocks.push(heading(`Maior chance de chuva: ${wettest.label.toLowerCase()} (${Math.round(wettest.precipitation)}%)`, 4));
  }
  blocks.push({
    type: 'table',
    is_compact: true,
    is_striped: true,
    cells: [
      [tableCell('Dia', true), tableCell('Condição', true), tableCell('Mín./Máx.', true, 'center'), tableCell('Chuva', true, 'right')],
      ...days.map((day) => {
        const [emoji, description] = weatherInfo(day.code);
        const temperatures = day.minimum !== null && day.maximum !== null
          ? `${Math.round(day.minimum)}–${Math.round(day.maximum)}°`
          : '—';
        return [
          tableCell(day.label),
          tableCell(`${emoji} ${description}`),
          tableCell(temperatures, false, 'center'),
          tableCell(valueText(day.precipitation, '%') ?? '—', false, 'right')
        ];
      })
    ]
  });
  return blocks;
}

export function normalizeCityQuery(text) {
  if (typeof text !== 'string') return null;
  const query = text.replace(/\s+/g, ' ').trim();
  return query.length >= 2 && query.length <= 100 ? query : null;
}

export async function searchLocations(query) {
  const normalized = normalizeCityQuery(query);
  if (!normalized) return [];
  const url = `${GEOCODING_SEARCH_URL}?name=${encodeURIComponent(normalized)}&count=5&language=pt&format=json`;
  const payload = await requestJson(url);
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return results.map(normalizeLocation).filter(Boolean);
}

export async function getLocation(id) {
  const normalizedId = integerId(id);
  if (!normalizedId) return null;
  const payload = await requestJson(`${GEOCODING_GET_URL}?id=${normalizedId}&language=pt`);
  const value = Array.isArray(payload?.results) ? payload.results[0] : payload;
  return normalizeLocation(value);
}

export async function getForecast(location) {
  if (!location || finiteNumber(location.latitude) === null || finiteNumber(location.longitude) === null) {
    throw new Error('Localidade inválida');
  }
  const current = 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m';
  const hourly = 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m';
  const daily = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max';
  const url = `${FORECAST_URL}?latitude=${encodeURIComponent(location.latitude)}&longitude=${encodeURIComponent(location.longitude)}&current=${current}&hourly=${hourly}&daily=${daily}&timezone=auto&forecast_days=7`;
  const payload = await requestJson(url);
  if (!payload || typeof payload !== 'object') throw new Error('Previsão inválida');
  return payload;
}

export function encodeLocationCallback(id) {
  const normalizedId = integerId(id);
  if (!normalizedId) throw new Error('Identificador de localidade inválido');
  return callbackData(`loc:${normalizedId}`);
}

export function encodeForecastCallback(period, id) {
  if (!PERIODS.has(period)) throw new Error('Período inválido');
  const normalizedId = integerId(id);
  if (!normalizedId) throw new Error('Identificador de localidade inválido');
  return callbackData(`fc:${period}:${normalizedId}`);
}

export function decodeCallback(data) {
  if (data === 'refine') return { action: 'refine' };
  if (typeof data !== 'string' || new TextEncoder().encode(data).length > 64) return null;
  const location = data.match(/^loc:(\d{1,20})$/);
  if (location && integerId(location[1])) return { action: 'location', locationId: location[1] };
  const forecast = data.match(/^fc:(today|three|week):(\d{1,20})$/);
  if (forecast && integerId(forecast[2])) {
    return { action: 'forecast', period: forecast[1], locationId: forecast[2] };
  }
  return null;
}

export function buildStartMessage(name) {
  const greeting = name ? `Olá, ${name}.` : 'Olá.';
  return {
    blocks: [
      heading('Forecast', 1),
      paragraph([
        `${greeting}\n\nPrevisão do tempo para hoje, três dias ou uma semana. Use `,
        { type: 'bot_command', text: '/clima', bot_command: '/clima' },
        ' para iniciar uma consulta.'
      ])
    ]
  };
}

export function buildCityPrompt(text = 'Informe o nome da cidade para receber a previsão.') {
  return {
    blocks: [
      heading('Consultar o clima'),
      paragraph(text)
    ]
  };
}

export function buildNoResultsMessage() {
  return {
    blocks: [
      heading('Cidade não encontrada'),
      paragraph(['Informe novamente incluindo estado, região ou país.\n\nExemplo: ', { type: 'code', text: 'Santa Maria, Rio Grande do Sul' }])
    ]
  };
}

export function buildLocationChoices(query, locations) {
  const blocks = [
    heading(`Qual ${query}?`),
    paragraph('Foram encontradas localidades com esse nome. Selecione a cidade desejada.')
  ];
  for (const location of locations.slice(0, 5)) {
    blocks.push({
      type: 'buttons',
      align: 'left',
      buttons: [{ text: locationLabel(location), callback_data: encodeLocationCallback(location.id) }]
    });
  }
  blocks.push({
    type: 'buttons',
    align: 'left',
    buttons: [{ text: 'Refinar busca', callback_data: callbackData('refine'), style: 'link' }]
  });
  blocks.push({
    type: 'footer',
    text: ['Localidades: ', { type: 'url', text: 'Open-Meteo', url: OPEN_METEO_URL }]
  });
  return { blocks };
}

export function buildForecastMessage(location, forecast, period = 'today') {
  if (!PERIODS.has(period)) throw new Error('Período inválido');
  const content = period === 'today'
    ? currentBlocks(location, forecast)
    : period === 'three'
      ? threeDayBlocks(location, forecast)
      : weekBlocks(location, forecast);
  return {
    blocks: [...content, forecastButtons(location.id, period), footer(forecast)]
  };
}

export function buildUnavailableMessage() {
  return {
    blocks: [
      heading('Não foi possível consultar a previsão agora'),
      paragraph('A fonte meteorológica não respondeu. A consulta pode ser repetida em instantes.')
    ]
  };
}
