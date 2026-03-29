const mongoose = require('mongoose');
const { Schema } = mongoose;
const { Role } = require('../types');

// MODEL 1: User
const UserSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true },
    avatar:   { type: String, default: '' },
    role:     { type: String, enum: Object.values(Role), default: Role.USER },
    hasPassword:           { type: Boolean, default: false },
    banned:                { type: Boolean, default: false },
    resetPasswordToken:    { type: String },
    resetPasswordExpires:  { type: Date },
    refreshToken:          { type: String, select: false },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

module.exports = { User };
