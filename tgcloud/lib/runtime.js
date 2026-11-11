import { api, db, fetch } from 'sdk';
import { createStore } from './store.js';
import { createWeather } from './weather.js';
import { createApp } from './app.js';
const store=createStore(db);
export const app=createApp({api,store,weather:createWeather(fetch,store)});
