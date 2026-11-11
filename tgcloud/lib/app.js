import { WeatherError, location } from './weather.js';
import { forecastText, widgetState } from './format.js';
import { widgetHtml } from './widget.js';
const YEAR=365*86400000, MONTH=30*86400000;
const help='🌤 Forecast\nEnvie uma cidade ou localização.\n/buscar cidade — procurar\n/tempo — hoje\n/previsao — 5 dias\n/widget — cartão interativo experimental\n/apagar — remover local salvo e desativar cartões\n/help — ajuda';
const buttons={inline_keyboard:[[{text:'Hoje',callback_data:'weather:today'},{text:'5 dias',callback_data:'weather:5days'}],[{text:'Atualizar',callback_data:'weather:refresh'},{text:'Trocar cidade',callback_data:'weather:change_city'}]]};
const widgetButtons={inline_keyboard:[[{text:'Hoje',callback_data:'widget:today'},{text:'5 dias',callback_data:'widget:5days'}],[{text:'Atualizar',callback_data:'widget:refresh'}]]};
export function createApp({api,store,weather}) {
  const say=(chat,text,extra={})=>api.sendMessage({chat_id:chat,text,...extra});
  const messageKey=(chat,id)=>'message:'+chat+':'+id;
  async function safeWork(chat,work) {
    try { return await work(); }
    catch(e) { if(e instanceof WeatherError) return say(chat,e.message); throw e; }
  }
  async function textCard(chat,user,place,mode='today') {
    const w=await weather.forecast(place);
    const sent=await say(chat,place.name+'\n'+forecastText(w,mode)+'\nFonte: https://open-meteo.com/',{reply_markup:buttons});
    await store.put(messageKey(chat,sent.message_id),{created:Date.now(),user,place,mode,kind:'text'},MONTH);
  }
  async function widgetCard(chat,user,place) {
    const w=await weather.forecast(place);
    const sent=await api.sendWidget({chat_id:chat,html:widgetHtml,
      chat_data:widgetState(place,w),caption:place.name+'\n'+forecastText(w)+'\nOpen-Meteo • https://open-meteo.com/',
      reply_markup:widgetButtons});
    await store.put(messageKey(chat,sent.message_id),{created:Date.now(),user,place,mode:'today',kind:'widget'},MONTH);
  }
  async function search(chat,user,query) {
    const results=await weather.search(query);
    if(!results.length) return say(chat,'Nenhum local encontrado. Use /buscar e pelo menos 3 caracteres.');
    const sent=await say(chat,'Selecione uma cidade:',{reply_markup:{inline_keyboard:[...results.map((p,i)=>[{text:p.name,callback_data:'pick:'+i}]),[{text:'Cancelar',callback_data:'cancel'}]]}});
    await store.put(messageKey(chat,sent.message_id),{created:Date.now(),user,results,kind:'search'},600000);
  }
  async function edit(method,args) {
    try { await api[method](args); }
    catch(e) { if(e.code!==400 || !String(e.description).includes('message is not modified')) throw e; }
  }
  return {
    async message(m) {
      if(!m.from || m.from.is_bot || m.chat.type!=='private') return;
      const chat=m.chat.id,user=m.from.id;
      if(!await store.claim('rate:'+user,1500)) return;
      await store.clean();
      return safeWork(chat,async()=>{
        const text=(m.text||'').trim();
        const command=text.split(/\s/)[0].split('@')[0];
        if(command==='/start'||command==='/help') return say(chat,help);
        if(command==='/apagar') {
          await store.remove('user:'+user);
          await store.removeChat(chat);
          // Existing widget messages remain in Telegram, but no longer refresh.
          await store.put('revoked:'+user,Date.now(),YEAR);
          return say(chat,'Local salvo removido. Cartões anteriores desativados. Mensagens já enviadas continuam no chat.');
        }
        if(m.location) {
          const place=location(m.location);
          await store.put('user:'+user,place,YEAR);
          return textCard(chat,user,place);
        }
        if(['/tempo','/previsao','/widget'].includes(command)) {
          const place=await store.get('user:'+user);
          if(!place) return say(chat,'Use /buscar cidade ou envie uma localização.');
          if(command==='/widget') return widgetCard(chat,user,place);
          return textCard(chat,user,place,command==='/previsao'?'5days':'today');
        }
        if(command==='/buscar') return search(chat,user,text.slice(text.split(/\s/)[0].length).trim());
        if(text && !text.startsWith('/')) return search(chat,user,text);
        if(text.startsWith('/')) return say(chat,help);
      });
    },
    async callback_query(q) {
      const chat=q.message?.chat;
      if(chat?.type!=='private'||chat.id!==q.from.id) return api.answerCallbackQuery({callback_query_id:q.id,text:'Abra o bot no privado.'});
      const key=messageKey(chat.id,q.message.message_id),record=await store.get(key);
      if(!record || record.user!==q.from.id) return api.answerCallbackQuery({callback_query_id:q.id,text:'Cartão ou busca expirado. Use /tempo ou /buscar.'});
      if(!await store.claim('rate:'+q.from.id,1500)) return api.answerCallbackQuery({callback_query_id:q.id,text:'Aguarde um instante.'});
      const revoked=await store.get('revoked:'+q.from.id);
      if(revoked && (!record.created || record.created<=revoked)) return api.answerCallbackQuery({callback_query_id:q.id,text:'Cartão desativado. Faça uma nova busca.'});
      await api.answerCallbackQuery({callback_query_id:q.id});
      return safeWork(chat.id,async()=>{
        if(record.kind==='search') {
          if(q.data==='cancel') {await store.remove(key);return edit('editMessageText',{chat_id:chat.id,message_id:q.message.message_id,text:'Busca cancelada.',reply_markup:{inline_keyboard:[]}});}
          if(!/^pick:[0-4]$/.test(q.data)) return;
          const place=record.results[Number(q.data.slice(5))];
          if(!place) return;
          await store.put('user:'+q.from.id,place,YEAR);
          await textCard(chat.id,q.from.id,place);
          await store.remove(key);
          return edit('editMessageText',{chat_id:chat.id,message_id:q.message.message_id,text:'Local salvo: '+place.name,reply_markup:{inline_keyboard:[]}});
        }
        if(record.kind==='widget') {
          if(!['widget:today','widget:5days','widget:refresh'].includes(q.data)) return;
          const mode=q.data==='widget:refresh'?record.mode:q.data.slice(7);
          const w=await weather.forecast(record.place);
          await edit('editMessageWidgetData',{chat_id:chat.id,message_id:q.message.message_id,chat_data:widgetState(record.place,w,mode)});
          await edit('editMessageCaption',{chat_id:chat.id,message_id:q.message.message_id,caption:record.place.name+'\n'+forecastText(w,mode)+'\nOpen-Meteo • https://open-meteo.com/',reply_markup:widgetButtons});
          await store.put(key,{...record,mode},MONTH);
          return;
        }
        if(record.kind!=='text') return;
        if(q.data==='weather:change_city') return say(chat.id,'Envie o nome da nova cidade.');
        if(!['weather:today','weather:5days','weather:refresh'].includes(q.data)) return;
        const mode=q.data==='weather:refresh'?record.mode:q.data.slice(8);
        const w=await weather.forecast(record.place);
        await edit('editMessageText',{chat_id:chat.id,message_id:q.message.message_id,text:record.place.name+'\n'+forecastText(w,mode)+'\nFonte: https://open-meteo.com/',reply_markup:buttons});
        await store.put(key,{...record,mode},MONTH);
      });
    },
    async inline_query(q) {
      if(!await store.claim('inline-rate:'+q.from.id,1000)) return api.answerInlineQuery({inline_query_id:q.id,results:[],cache_time:1,is_personal:true});
      const places=await weather.search(q.query).catch(e=>{if(e instanceof WeatherError)return [];throw e;});
      const outcomes=await Promise.all(places.slice(0,3).map(async(place,i)=>{
        try {
          const w=await weather.forecast(place);
          return ['today','5days'].map(mode=>({type:'article',id:i+':'+mode,title:place.name+' — '+(mode==='today'?'Hoje':'5 dias'),input_message_content:{message_text:place.name+'\n'+forecastText(w,mode)+'\nFonte: https://open-meteo.com/'}}));
        } catch(e) {if(e instanceof WeatherError)return [];throw e;}
      }));
      return api.answerInlineQuery({inline_query_id:q.id,results:outcomes.flat(),cache_time:60,is_personal:true,button:{text:'Abrir Forecast',start_parameter:'start'}});
    },
  };
}
