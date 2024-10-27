import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data.db');

export function initDB() {
  db.serialize(() => {
    // Tickets table
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      channel_id TEXT,
      user_id TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Server settings table
    db.run(`CREATE TABLE IF NOT EXISTS server_settings (
      guild_id TEXT PRIMARY KEY,
      ticket_category TEXT,
      support_role TEXT,
      welcome_message TEXT
    )`);
  });
}

export { db };