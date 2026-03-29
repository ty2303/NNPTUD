const mongoose = require('mongoose');
const { Schema } = mongoose;
const { NotificationType } = require('../types');

// MODEL 12: Notification
const NotificationSchema = new Schema(
  {
    userId:  { type: String, required: true },
    type:    { type: String, enum: Object.values(NotificationType), required: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
    link:    { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = { Notification };
