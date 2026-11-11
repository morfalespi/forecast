import { table, text, integer } from 'sdk/db';
export const state = table('weather_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  expires: integer('expires').notNull(),
});
