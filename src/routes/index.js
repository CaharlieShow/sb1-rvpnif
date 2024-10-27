import passport from 'passport';
import { db } from '../database.js';

export function setupRoutes(app) {
  // Auth routes
  app.get('/auth/discord', passport.authenticate('discord'));
  app.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => res.redirect('/dashboard')
  );

  // Dashboard routes
  app.get('/api/servers', isAuthenticated, (req, res) => {
    const guilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
    res.json(guilds);
  });

  app.get('/api/tickets/:guildId', isAuthenticated, (req, res) => {
    db.all(
      'SELECT * FROM tickets WHERE guild_id = ?',
      [req.params.guildId],
      (err, tickets) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tickets);
      }
    );
  });

  app.post('/api/settings/:guildId', isAuthenticated, (req, res) => {
    const { ticketCategory, supportRole, welcomeMessage } = req.body;
    db.run(
      `INSERT OR REPLACE INTO server_settings 
       (guild_id, ticket_category, support_role, welcome_message) 
       VALUES (?, ?, ?, ?)`,
      [req.params.guildId, ticketCategory, supportRole, welcomeMessage],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}