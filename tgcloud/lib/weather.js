export class WeatherError extends Error {}
export function location(raw) {
  const { latitude, longitude } = raw;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new WeatherError('Local inválido.');
  return { latitude, longitude, name: [raw.name || 'Localização enviada', raw.admin1, raw.country].filter(Boolean).join(', ').slice(0, 100) };
}
export function createWeather(fetch, store) {
  async function json(url) {
    let response;
    try { response = await fetch(url); } catch { throw new WeatherError('Serviço de clima indisponível. Tente novamente.'); }
    if (!response.ok) throw new WeatherError('Serviço de clima indisponível. Tente novamente.');
    let body;
    try { body = await response.json(); } catch { throw new WeatherError('Resposta de clima inválida.'); }
    if (body.error) throw new WeatherError('Consulta de clima recusada.');
    return body;
  }
  return {
    async search(query) {
      query = query.trim().replace(/\s+/g, ' ').slice(0, 100);
      if (query.length < 3) return [];
      const key = 'geo:' + query.toLowerCase();
      const cached = await store.get(key);
      if (cached) return cached;
      const body = await json('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=5&language=pt&format=json');
      if (body.results != null && !Array.isArray(body.results)) throw new WeatherError('Resposta de locais inválida.');
      const result = (body.results || []).slice(0, 5).map(location);
      await store.put(key, result, 86400000);
      return result;
    },
    async forecast(place) {
      location(place);
      // Exact coordinates: do not merge different sites into a rounded grid key.
      const key = 'forecast:' + place.latitude + ':' + place.longitude;
      const cached = await store.get(key);
      if (cached) return cached;
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude + '&longitude=' + place.longitude + '&timezone=auto&forecast_days=5&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code';
      const body = await json(url);
      if (!body.current || !Array.isArray(body.daily?.time) || !body.daily.time.length) throw new WeatherError('Previsão incompleta.');
      for (const field of ['temperature_2m_max','temperature_2m_min','precipitation_probability_max','weather_code']) {
        if (!Array.isArray(body.daily[field]) || body.daily[field].length !== body.daily.time.length) throw new WeatherError('Previsão incompleta.');
      }
      await store.put(key, body, 300000);
      return body;
    },
  };
}
