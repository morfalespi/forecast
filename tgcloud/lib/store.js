// SQL binding and result shapes: official Serverless docs, Database / Raw SQL.
export function createStore(db, now = () => Date.now()) {
  return {
    async get(key) {
      const row = await db.get('SELECT value FROM weather_state WHERE key=:key AND expires>:now', { ':key': key, ':now': now() });
      return row ? JSON.parse(row.value) : null;
    },
    async put(key, value, ttl) {
      await db.run('INSERT INTO weather_state(key,value,expires) VALUES(:key,:value,:expires) ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires=excluded.expires', {
        ':key': key, ':value': JSON.stringify(value), ':expires': now() + ttl,
      });
    },
    async remove(key) { await db.run('DELETE FROM weather_state WHERE key=:key', { ':key': key }); },
    async removeChat(chat) {
      await db.run('DELETE FROM weather_state WHERE key LIKE :prefix', { ':prefix': 'message:'+chat+':%' });
    },
    async clean() { await db.run('DELETE FROM weather_state WHERE expires<=:now', { ':now': now() }); },
    // Atomic across isolates: no in-memory rate limiter or check-then-write.
    async claim(key, ttl) {
      const r = await db.run('INSERT INTO weather_state(key,value,expires) VALUES(:key,\'true\',:expires) ON CONFLICT(key) DO UPDATE SET expires=excluded.expires WHERE weather_state.expires<=:now', {
        ':key': key, ':now': now(), ':expires': now() + ttl,
      });
      return r.rowsAffected === 1;
    },
  };
}
