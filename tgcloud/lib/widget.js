// Fixed code; all changing weather is supplied through chat_data. No network, secrets or remote assets.
export const widgetHtml = `<style>
body{font-family:system-ui;color:var(--tg-theme-text-color)}
h3{margin:4px 0 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#forecast{white-space:pre-wrap;font-size:14px;line-height:1.5}
small{display:block;color:var(--tg-theme-hint-color);margin-top:8px}
</style><h3 id="place">Forecast</h3><div id="forecast">Carregando previsão…</div>
<small>Use os botões abaixo do cartão para alternar ou atualizar a previsão.</small><small id="status"></small><small>Dados: Open-Meteo • open-meteo.com</small>
<script>
const W=TelegramWidget, status=document.getElementById('status');
function render(){
  try{const s=JSON.parse(W.chatData||'null');if(!s)return;
    document.getElementById('place').textContent=s.name;
    document.getElementById('forecast').textContent=s.text;
    status.textContent=s.error||'';
  }catch(e){status.textContent='Dados indisponíveis. Use /tempo no bot.';}
}
W.onEvent('chatDataChanged',render);render();W.ready();
</script>`;
