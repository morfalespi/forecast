import { api } from 'sdk';
import {
  buildCityPrompt,
  buildForecastMessage,
  buildUnavailableMessage,
  decodeCallback,
  getForecast,
  getLocation
} from '../lib/forecast.js';

const forceReply = {
  force_reply: true,
  input_field_placeholder: 'Cidade, estado ou país'
};

async function answer(callbackQueryId, text, showAlert = false) {
  await api.answerCallbackQuery({
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: showAlert } : {})
  });
}

export default async function (callbackQuery) {
  const callbackQueryId = callbackQuery?.id;
  if (!callbackQueryId) return;
  const decoded = decodeCallback(callbackQuery?.data);
  if (!decoded) {
    await answer(callbackQueryId, 'A opção selecionada não é válida.', true);
    return;
  }
  const message = callbackQuery?.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  const privateChat = message?.chat?.type === 'private';
  const samePerson = String(callbackQuery?.from?.id ?? '') === String(chatId ?? '');
  if (chatId === undefined || chatId === null || !privateChat || !samePerson) {
    await answer(callbackQueryId, 'Esta consulta não está mais disponível. Use /clima para iniciar outra.', true);
    return;
  }
  if (decoded.action === 'refine') {
    await api.sendRichMessage({
      chat_id: chatId,
      rich_message: buildCityPrompt('Informe novamente incluindo estado, região ou país.'),
      reply_markup: forceReply
    });
    await answer(callbackQueryId);
    return;
  }
  if (messageId === undefined || messageId === null) {
    await answer(callbackQueryId, 'Esta consulta não está mais disponível. Use /clima para iniciar outra.', true);
    return;
  }
  try {
    const location = await getLocation(decoded.locationId);
    if (!location) {
      await answer(callbackQueryId, 'A localidade não está mais disponível. Use /clima novamente.', true);
      return;
    }
    const forecast = await getForecast(location);
    const period = decoded.action === 'forecast' ? decoded.period : 'today';
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      rich_message: buildForecastMessage(location, forecast, period)
    });
  } catch {
    await answer(callbackQueryId, 'Não foi possível atualizar a previsão agora.', true);
    if (decoded.action === 'location') {
      await api.sendRichMessage({ chat_id: chatId, rich_message: buildUnavailableMessage() });
    }
    return;
  }
  await answer(callbackQueryId);
}
