import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, NotificationType } from '../types';

// MODEL 12: Notification
export interface INotification extends IBaseDocument {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
}

const NotificationSchema = new Schema<INotification>(
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

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
