export const number = v => Number.isFinite(v) ? String(Math.round(v)) : '—';
export function condition(code) {
  if (code === 0) return 'Céu limpo';
  if ([1,2,3].includes(code)) return 'Nuvens';
  if ([45,48].includes(code)) return 'Nevoeiro';
  if ([51,53,55,56,57].includes(code)) return 'Garoa';
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'Chuva';
  if ([71,73,75,77,85,86].includes(code)) return 'Neve';
  if ([95,96,99].includes(code)) return 'Trovoadas';
  return 'Sem informação';
}
export function forecastText(w, mode = 'today') {
  const c=w.current, d=w.daily;
  const lines = mode === 'today'
    ? [condition(c.weather_code), number(c.temperature_2m)+' °C • Sensação '+number(c.apparent_temperature)+' °C'] : [];
  for (let i=0; i<Math.min(mode === 'today' ? 1 : 5,d.time.length); i++) {
    lines.push(d.time[i].slice(5).split('-').reverse().join('/')+' • '+number(d.temperature_2m_min[i])+'–'+number(d.temperature_2m_max[i])+' °C • Chuva '+number(d.precipitation_probability_max[i])+'%');
  }
  // Model timestamp is local to the requested place; never label cache reads as new observations.
  lines.push('Dados: '+String(c.time || 'indisponível')+' ('+String(w.timezone || 'local')+')');
  return lines.join('\n');
}
export function utf8Bytes(s) { return Array.from(s).reduce((n,c)=>n+(c.codePointAt(0)<=127?1:c.codePointAt(0)<=2047?2:c.codePointAt(0)<=65535?3:4),0); }
export function truncateBytes(s,max) { let result=''; for(const c of String(s)) { if(utf8Bytes(result+c)>max) break; result+=c; } return result; }
export function widgetState(place,w,mode='today',error='') {
  const value={revision:Date.now(),name:truncateBytes(place.name,120),text:truncateBytes(forecastText(w,mode),720),mode,error:truncateBytes(error,80)};
  let data=JSON.stringify(value);
  while(utf8Bytes(data)>1024 && value.text.length) {value.text=Array.from(value.text).slice(0,-1).join('');data=JSON.stringify(value);}
  if(utf8Bytes(data)>1024) throw new Error('Widget state exceeds 1024 bytes');
  return data;
}
