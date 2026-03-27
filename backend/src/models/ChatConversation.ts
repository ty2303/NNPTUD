import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../types';

// MODEL 9: ChatConversation (includes ChatMessage subdocument)
export interface IChatMessage {
  senderId: string;
  senderName: string;
  senderRole: 'USER' | 'ADMIN';
  content: string;
  isRead: boolean;
  sentAt: Date;
}

export interface IChatConversation extends IBaseDocument {
  userId: string;
  username: string;
  messages: IChatMessage[];
  lastMessage?: string;
  lastMessageAt?: Date;
  isResolved: boolean;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  senderId:   { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['USER', 'ADMIN'], required: true },
  content:    { type: String, required: true },
  isRead:     { type: Boolean, default: false },
  sentAt:     { type: Date, default: Date.now },
}, { _id: false });

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    userId:        { type: String, required: true, unique: true },
    username:      { type: String, required: true },
    messages:      [ChatMessageSchema],
    lastMessage:   { type: String },
    lastMessageAt: { type: Date },
    isResolved:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatConversation = mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);
