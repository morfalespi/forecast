import { api } from 'sdk';
import {
  buildCityPrompt,
  buildForecastMessage,
  buildLocationChoices,
  buildNoResultsMessage,
  buildStartMessage,
  buildUnavailableMessage,
  getForecast,
  normalizeCityQuery,
  searchLocations
} from '../lib/forecast.js';

const forceReply = {
  force_reply: true,
  input_field_placeholder: 'Cidade, estado ou país'
};

function commandFrom(text) {
  const match = text.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?(?:\s|$)/i);
  return match ? match[1].toLowerCase() : null;
}

async function sendCityPrompt(chatId, text) {
  await api.sendRichMessage({
    chat_id: chatId,
    rich_message: buildCityPrompt(text),
    reply_markup: forceReply
  });
}

export default async function (message) {
  const chatId = message?.chat?.id;
  if (chatId === undefined || chatId === null || message?.chat?.type !== 'private') return;
  const text = typeof message?.text === 'string' ? message.text.trim() : '';
  if (!text) return;
  const command = commandFrom(text);
  if (command === 'start') {
    const name = typeof message?.from?.first_name === 'string' ? message.from.first_name.trim() : '';
    await api.sendRichMessage({ chat_id: chatId, rich_message: buildStartMessage(name) });
    return;
  }
  if (command === 'clima') {
    await sendCityPrompt(chatId);
    return;
  }
  if (command) {
    await api.sendRichMessage({ chat_id: chatId, rich_message: buildStartMessage('') });
    return;
  }
  const query = normalizeCityQuery(text);
  if (!query) {
    await sendCityPrompt(chatId, 'Informe pelo menos duas letras e, se necessário, acrescente estado ou país.');
    return;
  }
  try {
    const locations = await searchLocations(query);
    if (!locations.length) {
      await api.sendRichMessage({
        chat_id: chatId,
        rich_message: buildNoResultsMessage(),
        reply_markup: forceReply
      });
      return;
    }
    if (locations.length > 1) {
      await api.sendRichMessage({ chat_id: chatId, rich_message: buildLocationChoices(query, locations) });
      return;
    }
    const forecast = await getForecast(locations[0]);
    await api.sendRichMessage({
      chat_id: chatId,
      rich_message: buildForecastMessage(locations[0], forecast, 'today')
    });
  } catch {
    await api.sendRichMessage({ chat_id: chatId, rich_message: buildUnavailableMessage() });
  }
}

