import { EndpointError } from 'sdk';
import { buildMiniAppForecastResponse, getForecast, getLocation } from '../lib/forecast.js';

export default async function (input, ctx) {
  if (!ctx?.initData?.user?.id) {
    throw new EndpointError('Sessão do Telegram inválida', { code: 'UNAUTHORIZED' });
  }
  const id = String(input?.id ?? '');
  if (!/^\d{1,20}$/.test(id) || Number(id) <= 0) {
    throw new EndpointError('Localidade inválida', { code: 'INVALID_LOCATION' });
  }
  const location = await getLocation(id);
  if (!location) {
    throw new EndpointError('Localidade não encontrada', { code: 'LOCATION_NOT_FOUND' });
  }
  const data = await getForecast(location);
  return buildMiniAppForecastResponse(location, data);
}
