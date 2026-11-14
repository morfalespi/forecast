import { api } from 'sdk';

export default async function (message) {
  const chatId = message?.chat?.id;

  if (chatId === undefined || chatId === null) {
    throw new Error('Mensagem sem chat.id');
  }

  const name = message.from?.first_name?.trim();
  const greeting = name ? `Olá, ${name}.` : 'Olá.';

  await api.sendMessage({
    chat_id: chatId,
    text: `${greeting}\n\nO Forecast está disponível pelo botão da Mini App configurado no perfil do bot.`
  });
}

