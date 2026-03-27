import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { connectDB } from './config/database';
import routes from './routes';

// ---- Passport Google Strategy ----
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from './models/User';
import { Role } from './types';

passport.use(
  new GoogleStrategy(
    {
      clientID:     config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL:  config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value || '';
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            username:    profile.displayName,
            email,
            googleId:    profile.id,
            avatar:      profile.photos?.[0].value || '',
            hasPassword: false,
            role:        Role.USER,
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        done(null, { id: user._id.toString(), email: user.email, role: user.role });
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

// ---- Express App ----
const app  = express();
const http = createServer(app);

// Socket.IO
const io = new SocketServer(http, {
  cors: { origin: config.clientUrl, credentials: true },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('join', (userId: string) => socket.join(userId));
  socket.on('disconnect', () => console.log(`🔌 Socket disconnected: ${socket.id}`));
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

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start
const start = async () => {
  await connectDB();
  http.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
  });
};

start();

export { io };
