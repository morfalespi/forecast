import { EndpointError } from 'sdk';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;

  if (!user?.id) {
    throw new EndpointError('Identidade do Telegram indisponível', {
      code: 'TELEGRAM_USER_REQUIRED'
    });
  }

  return {
    user: {
      id: user.id,
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      username: user.username ?? null,
      languageCode: user.language_code ?? null,
      photoUrl: user.photo_url ?? null,
      isPremium: user.is_premium === true
    },
    chat: ctx.initData.chat
      ? {
          id: ctx.initData.chat.id,
          type: ctx.initData.chat.type,
          title: ctx.initData.chat.title ?? null,
          username: ctx.initData.chat.username ?? null,
          photoUrl: ctx.initData.chat.photo_url ?? null
        }
      : null,
    authDate: ctx.initData.auth_date ?? null,
    startParam: ctx.initData.start_param ?? null
  };
}

