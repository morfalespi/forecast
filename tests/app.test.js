import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { deflateSync } from 'node:zlib';
import { createStore } from '../tgcloud/lib/store.js';
import { createWeather, WeatherError } from '../tgcloud/lib/weather.js';
import { createApp } from '../tgcloud/lib/app.js';
import { widgetHtml } from '../tgcloud/lib/widget.js';
import { forecastText, widgetState } from '../tgcloud/lib/format.js';
const place={name:'São Paulo',latitude:-23.55,longitude:-46.63};
const forecast={current:{temperature_2m:25,apparent_temperature:27,weather_code:0,time:'2026-11-10T12:00'},timezone:'America/Sao_Paulo',daily:{time:['2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14'],temperature_2m_min:[20,21,22,23,24],temperature_2m_max:[28,29,30,31,32],precipitation_probability_max:[80,90,0,0,0],weather_code:[61,61,0,0,0]}};
function harness() {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE weather_state(key TEXT PRIMARY KEY,value TEXT NOT NULL,expires INTEGER NOT NULL)');
  const db={get:async(sql,params)=>sqlite.prepare(sql).get(params),run:async(sql,params)=>({rowsAffected:Number(sqlite.prepare(sql).run(params).changes)})};
  let clock=Date.now();
  const store=createStore(db,()=>clock);
  const calls=[];
  const api=new Proxy({}, {get:(_,method)=>async args=>{calls.push({method,args});return {message_id:calls.length};}});
  const weather={search:async()=>[place],forecast:async()=>forecast};
  const app=createApp({api,store,weather});
  return {app,api,store,calls,weather,advance:ms=>{clock+=ms;}};
}
const msg=(text,id=1)=>({chat:{id,type:'private'},from:{id},text});
const query=(data='refresh',id=1)=>({id:'q',from:{id},chat:{id,type:'private'},message_id:10,type:{type:'data'},data});
async function card(h,extra={}) {await h.store.put('message:1:10',{created:Date.now(),kind:'widget',user:1,place,mode:'today',...extra},60000);}
test('widget stays within raw and compressed UTF-8 limits; no external assets',()=>{
 assert.ok(Buffer.byteLength(widgetHtml)<=32768);assert.ok(deflateSync(widgetHtml,{level:9}).length<=4096);
 assert.doesNotMatch(widgetHtml,/fetch\(|<script\s+src|<link|https?:/);
});
test('state size counts UTF-8 and JSON escaping',()=>{
 for(const name of ['é'.repeat(500),'😀'.repeat(500),'"\\'.repeat(500)]) assert.ok(Buffer.byteLength(widgetState({...place,name},forecast,'5days'))<=1024);
});
test('missing values are not turned into zero; rain probability is not intensity',()=>{
 const text=forecastText({...forecast,current:{...forecast.current,temperature_2m:null}});
 assert.match(text,/— °C/);assert.match(text,/80%/);assert.doesNotMatch(text,/chuva forte/i);
 assert.match(text,/2026-11-10T12:00/);
});
test('SQLite-backed persistence, expiry and atomic claims',async()=>{
 const h=harness();await h.store.put('x',{ok:1},100);assert.deepEqual(await h.store.get('x'),{ok:1});
 assert.equal(await h.store.claim('lock',100),true);assert.equal(await h.store.claim('lock',100),false);
 h.advance(101);assert.equal(await h.store.get('x'),null);assert.equal(await h.store.claim('lock',100),true);
});
test('weather caching avoids repeated HTTP and expires after five minutes',async()=>{
 const h=harness();let count=0;
 const w=createWeather(async()=>{count++;return {ok:true,json:async()=>forecast};},h.store);
 await w.forecast(place);await w.forecast(place);assert.equal(count,1);
 h.advance(300001);await w.forecast(place);assert.equal(count,2);
});
test('different coordinates do not collide and invalid coordinates fail',async()=>{
 const h=harness();let count=0;const w=createWeather(async()=>{count++;return {ok:true,json:async()=>forecast};},h.store);
 await w.forecast(place);await w.forecast({...place,latitude:-23.551});assert.equal(count,2);
 await assert.rejects(w.forecast({...place,latitude:91}),WeatherError);
});
test('upstream failure is explicit, not silently fresh cached data',async()=>{
 const h=harness();const w=createWeather(async()=>({ok:false}),h.store);
 await assert.rejects(w.forecast(place),WeatherError);
});
test('widget queries are acknowledged before slow HTTP, then state and caption change',async()=>{
 const h=harness();await card(h);
 h.weather.forecast=async()=>{assert.equal(h.calls[0].method,'answerWidgetQuery');return forecast;};
 await h.app.widget_query(query('5days'));
 assert.deepEqual(h.calls.map(c=>c.method),['answerWidgetQuery','editMessageWidgetData','editMessageCaption']);
 assert.equal((await h.store.get('message:1:10')).mode,'5days');
});
test('forged actions, wrong owners and groups cannot access weather',async()=>{
 for(const q of [query('arbitrary'),{...query(),from:{id:2}},{...query(),chat:{id:-1,type:'group'}}]) {
  const h=harness();await card(h);await h.app.widget_query(q);
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].method,'answerWidgetQuery');
 }
});
test('old widget retains its own city after changing saved location',async()=>{
 const h=harness();await card(h);await h.store.put('user:1',{...place,name:'Other'},10000);
 h.weather.forecast=async p=>{assert.equal(p.name,'São Paulo');return forecast;};await h.app.widget_query(query());
});
test('expired message never mutates state',async()=>{
 const h=harness();await card(h);h.advance(60001);await h.app.widget_query(query());
 assert.equal(h.calls.length,1);assert.match(h.calls[0].args.data,/expirado/);
});
test('only known no-op Bot API errors are accepted',async()=>{
 const h=harness();await card(h);
 const api={...Object.fromEntries(['answerWidgetQuery','editMessageCaption','sendMessage'].map(m=>[m,h.api[m]])),editMessageWidgetData:async()=>{throw {code:400,description:'Bad Request: message is not modified'};}};
 await createApp({...h,api}).widget_query(query());
 assert.equal(h.calls.at(-1).method,'editMessageCaption');
});
test('forecast failure after ACK reports failure without claiming success',async()=>{
 const h=harness();await card(h);h.weather.forecast=async()=>{throw new WeatherError('Offline');};await h.app.widget_query(query());
 assert.deepEqual(h.calls.map(c=>c.method),['answerWidgetQuery','sendMessage']);
});
test('delete removes saved location and all private message records',async()=>{
 const h=harness();await card(h);await h.store.put('user:1',place,60000);await h.app.message(msg('/apagar'));
 assert.equal(await h.store.get('user:1'),null);assert.equal(await h.store.get('message:1:10'),null);
});
test('inline uses articles and modern button, never production widgets',async()=>{
 const h=harness();await h.app.inline_query({id:'i',from:{id:1},query:'São Paulo'});
 const args=h.calls[0].args;assert.equal(args.results.length,2);assert.equal(args.results[0].type,'article');
 assert.ok(args.button);assert.equal(args.switch_pm_text,undefined);
});
test('private /widget sends HTML widget and persists message owner',async()=>{
 const h=harness();await h.store.put('user:1',place,60000);await h.app.message(msg('/widget'));
 assert.equal(h.calls[0].method,'sendWidget');assert.equal((await h.store.get('message:1:1')).user,1);
});
test('stale search and negative indexes cannot save a location',async()=>{
 const h=harness();await h.app.message(msg('/buscar São Paulo'));h.advance(2000);
 await h.app.callback_query({id:'c',from:{id:1},message:{chat:{type:'private',id:1},message_id:1},data:'pick:-1'});
 assert.equal(await h.store.get('user:1'),null);
});
