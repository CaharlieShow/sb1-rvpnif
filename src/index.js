import { Client, GatewayIntentBits, Partials } from 'discord.js';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { config } from 'dotenv';
import { initDB } from './database.js';
import { setupBot } from './bot/index.js';
import { setupRoutes } from './routes/index.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

const app = express();

// Setup database
initDB();

// Setup passport
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Express middleware
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Setup bot and routes
setupBot(client);
setupRoutes(app);

// Start server and bot
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);