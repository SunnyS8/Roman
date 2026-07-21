const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

function nextCronRun(expr, afterMs) {
  function parseField(field, min, max) {
    const values = new Set();
    for (const part of field.split(',')) {
      if (part === '*') { for (let i = min; i <= max; i++) values.add(i); continue; }
      const stepMatch = part.match(/^(\*|\d+-\d+)\/(\d+)$/);
      if (stepMatch) {
        let start = min, end = max;
        if (stepMatch[1] !== '*') { const [s, e] = stepMatch[1].split('-').map(Number); start = s; end = e; }
        const step = Number(stepMatch[2]);
        for (let i = start; i <= end; i += step) values.add(i);
        continue;
      }
      const rangeMatch = part.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) { const s = Number(rangeMatch[1]), e = Number(rangeMatch[2]); for (let i = s; i <= e; i++) values.add(i); continue; }
      const num = Number(part);
      if (!isNaN(num) && num >= min && num <= max) values.add(num);
    }
    return values;
  }
  function parseCron(ex) {
    const parts = ex.trim().split(/\s+/);
    return {
      minute: parseField(parts[0], 0, 59),
      hour: parseField(parts[1], 0, 23),
      dayOfMonth: parseField(parts[2], 1, 31),
      month: parseField(parts[3], 1, 12),
      dayOfWeek: parseField(parts[4], 0, 6),
    };
  }
  function cronMatches(fields, date) {
    return fields.minute.has(date.getMinutes()) && fields.hour.has(date.getHours()) &&
      fields.dayOfMonth.has(date.getDate()) && fields.month.has(date.getMonth() + 1) &&
      fields.dayOfWeek.has(date.getDay());
  }
  const fields = parseCron(expr);
  const maxScan = 366 * 24 * 60;
  const start = new Date(afterMs);
  start.setSeconds(0, 0);
  start.setTime(start.getTime() + 60000);
  for (let i = 0; i < maxScan; i++) {
    const candidate = new Date(start.getTime() + i * 60000);
    if (cronMatches(fields, candidate)) return candidate.getTime();
  }
  return afterMs + 86400000;
}

const dbPath = path.join(os.homedir(), '.betsy', 'betsy.db');
const db = new Database(dbPath);
const now = Date.now();

const tasks = [
  {
    name: 'morning_greeting',
    schedule: JSON.stringify({ kind: 'cron', expr: '0 9 * * *' }),
    command: 'Напиши владельцу бодрое утреннее сообщение. Пожелай доброго утра, спроси про планы на день, предложи помощь с завтраком (если хочет — может прислать фото для food_analysis). Пиши как друг — коротко, с юмором, без пафоса.',
    channel: 'telegram',
    chatId: '411711275'
  },
  {
    name: 'evening_checkin',
    schedule: JSON.stringify({ kind: 'cron', expr: '0 22 * * *' }),
    command: 'Напиши владельцу вечернее сообщение. Спроси как прошёл день, предложи подвести итоги по питанию (можно использовать food_analysis daily_summary). Если чувствуешь что нужна поддержка — поддержи. Коротко, по-дружески.',
    channel: 'telegram',
    chatId: '411711275'
  },
  {
    name: 'food_reminder_lunch',
    schedule: JSON.stringify({ kind: 'cron', expr: '0 13 * * *' }),
    command: 'Напомни владельцу про обед. Спроси что будет есть, предложи прислать фото для food_analysis. Короткое дружеское напоминание, не нравоучительно.',
    channel: 'telegram',
    chatId: '411711275'
  },
  {
    name: 'food_reminder_dinner',
    schedule: JSON.stringify({ kind: 'cron', expr: '0 18 * * *' }),
    command: 'Напомни владельцу про ужин. Спроси что планирует есть, предложи прислать фото для food_analysis. Коротко и по-дружески.',
    channel: 'telegram',
    chatId: '411711275'
  }
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO scheduled_tasks (id, name, schedule, command, context, channel, chatId, nextRunAt, lastRunAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

const tx = db.transaction(() => {
  for (const t of tasks) {
    const nextRunAt = nextCronRun(JSON.parse(t.schedule).expr, now);
    insert.run(randomUUID(), t.name, t.schedule, t.command, '', t.channel, t.chatId, nextRunAt, null, now);
    console.log('+', t.name);
  }
});

tx();
db.close();
console.log('Done');
