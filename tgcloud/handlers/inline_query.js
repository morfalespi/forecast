import { app } from '../lib/runtime.js';
export default async function(payload) { return app.inline_query(payload); }
