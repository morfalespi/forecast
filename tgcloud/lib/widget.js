// Fixed code; all changing weather is supplied through chat_data. No network, secrets or remote assets.
export const widgetHtml = `<style>
body{font-family:system-ui;color:var(--tg-theme-text-color)}
h3{margin:4px 0 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#forecast{white-space:pre-wrap;font-size:14px;line-height:1.5}
nav{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
button{padding:9px;border-radius:10px}small{display:block;color:var(--tg-theme-hint-color);margin-top:8px}
</style><h3 id="place">Forecast</h3><div id="forecast">Carregando previsão…</div>
<nav><button id="today">Hoje</button><button id="days">5 dias</button><button id="refresh">Atualizar</button></nav>
<small id="status"></small><small>Dados: Open-Meteo • open-meteo.com</small>
<script>
const W=TelegramWidget, status=document.getElementById('status');
let revision=0;
function render(){
  revision++;
  try{const s=JSON.parse(W.chatData||'null');if(!s)return;
    document.getElementById('place').textContent=s.name;
    document.getElementById('forecast').textContent=s.text;
    status.textContent=s.error||'';
  }catch(e){status.textContent='Dados indisponíveis. Use /tempo no bot.';}
}
function request(action){
  const r=revision;status.textContent='Solicitando…';
  try{W.request(action).then(a=>{if(r===revision)status.textContent=a.result||'';},e=>{status.textContent='Falha: '+e.code;});}
  catch(e){status.textContent='Falha: '+(e.code||e.name);}
}
document.getElementById('today').addEventListener('click',()=>request('today'));
document.getElementById('days').addEventListener('click',()=>request('5days'));
document.getElementById('refresh').addEventListener('click',()=>request('refresh'));
W.onEvent('chatDataChanged',render);render();W.ready();
</script>`;
