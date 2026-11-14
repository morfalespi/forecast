import { EndpointError } from 'sdk';
import { normalizeCityQuery, searchLocations } from '../lib/forecast.js';

export default async function (input, ctx) {
  if (!ctx?.initData?.user?.id) {
    throw new EndpointError('Sessão do Telegram inválida', { code: 'UNAUTHORIZED' });
  }
  const query = normalizeCityQuery(input?.query);
  if (!query) {
    throw new EndpointError('Digite pelo menos duas letras para pesquisar', { code: 'INVALID_QUERY' });
  }
  const locations = await searchLocations(query);
  return {
    locations: locations.slice(0, 5).map((location) => ({
      id: location.id,
      name: location.name,
      admin1: location.admin1,
      country: location.country
    }))
  };
}
