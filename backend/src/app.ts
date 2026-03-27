import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { connectDB } from './config/database';
import routes from './routes';

// TODO: setup Passport Google OAuth2 Strategy
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// passport.use(new GoogleStrategy({ ... }, async (accessToken, refreshToken, profile, done) => {
//   // TODO: find or create user from Google profile
// }));

const app  = express();
const http = createServer(app);

// TODO: setup Socket.IO
const io = new SocketServer(http, {
  cors: { origin: config.clientUrl, credentials: true },
});

io.on('connection', (socket) => {
  // TODO: handle socket events (join room, disconnect, etc.)
});

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start server
const start = async () => {
  await connectDB();
  http.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
};

start();

export { io };
