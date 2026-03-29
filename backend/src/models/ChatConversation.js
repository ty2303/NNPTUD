const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 9: ChatConversation (includes ChatMessage subdocument)
const ChatMessageSchema = new Schema({
  senderId:   { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['USER', 'ADMIN'], required: true },
  content:    { type: String, required: true },
  isRead:     { type: Boolean, default: false },
  sentAt:     { type: Date, default: Date.now },
}, { _id: false });

const ChatConversationSchema = new Schema(
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

const ChatConversation = mongoose.model('ChatConversation', ChatConversationSchema);

module.exports = { ChatConversation };
