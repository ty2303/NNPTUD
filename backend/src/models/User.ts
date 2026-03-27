import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, Role } from '../types';

// MODEL 1: User
export interface IUser extends IBaseDocument {
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: Role;
  hasPassword: boolean;
  banned: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema = new Schema<IUser>(
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
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
