import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { connectDB } from './config/database';
import { User } from './models/User';
import { Role } from './types';
import routes from './routes';

// ── Google OAuth2 Strategy ──────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID:     config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL:  config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email    = profile.emails?.[0].value ?? '';
        const avatar   = profile.photos?.[0].value ?? '';
        const googleId = profile.id;

        let user = await User.findOne({ email });

        if (!user) {
          // Tạo mới nếu chưa có
          user = await User.create({
            username:    profile.displayName,
            email,
            googleId,
            avatar,
            hasPassword: false,
            role:        Role.USER,
          });
        } else if (!user.googleId) {
          // Liên kết Google vào tài khoản email cũ
          user.googleId = googleId;
          if (!user.avatar) user.avatar = avatar;
          await user.save();
        }

        done(null, { id: user._id.toString(), email: user.email, role: user.role });
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

// ── Express App ─────────────────────────────────────────────
const app  = express();
const http = createServer(app);

// Socket.IO
const io = new SocketServer(http, {
  cors: { origin: config.clientUrl, credentials: true },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client gửi userId để join phòng riêng nhận thông báo
  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ── Routes ───────────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  http.listen(config.port, () => {
    console.log(`🚀 Server: http://localhost:${config.port}`);
    console.log(`📦 Env: ${config.nodeEnv}`);
  });
};

start();

export { io };
