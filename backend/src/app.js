require("dotenv/config");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { createServer } = require("http");
const { Server: SocketServer } = require("socket.io");

const { config } = require("./config/env");
const { connectDB } = require("./config/database");
const { User } = require("./models/User");
const { Role } = require("./types");
const routes = require("./routes");

// ── Google OAuth2 Strategy ──────────────────────────────────
passport.use(
	new GoogleStrategy(
		{
			clientID: config.google.clientId,
			clientSecret: config.google.clientSecret,
			callbackURL: config.google.callbackUrl,
		},
		async (_accessToken, _refreshToken, profile, done) => {
			try {
				const email = profile.emails?.[0].value ?? "";
				const avatar = profile.photos?.[0].value ?? "";
				const googleId = profile.id;

				let user = await User.findOne({ email });

				if (!user) {
					// Tạo mới nếu chưa có
					user = await User.create({
						username: profile.displayName,
						email,
						googleId,
						avatar,
						hasPassword: false,
						role: Role.USER,
					});
				} else if (!user.googleId) {
					// Liên kết Google vào tài khoản email cũ
					user.googleId = googleId;
					if (!user.avatar) user.avatar = avatar;
					await user.save();
				}

				done(null, {
					id: user._id.toString(),
					email: user.email,
					role: user.role,
				});
			} catch (err) {
				done(err);
			}
		},
	),
);

// ── Express App ─────────────────────────────────────────────
const app = express();
const http = createServer(app);

// Socket.IO
const io = new SocketServer(http, {
	cors: { origin: config.clientUrl, credentials: true },
});

io.on("connection", (socket) => {
	console.log(`🔌 Socket connected: ${socket.id}`);

	// Client gửi userId để join phòng riêng nhận thông báo
	socket.on("join", (userId) => {
		socket.join(userId);
		console.log(`User ${userId} joined room`);
	});

	socket.on("disconnect", () => {
		console.log(`🔌 Socket disconnected: ${socket.id}`);
	});
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ── Routes ───────────────────────────────────────────────────
app.use("/api", routes);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
	res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
	console.error("Unhandled error:", err);
	res
		.status(500)
		.json({ success: false, message: err.message || "Internal server error" });
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

module.exports = { io };
