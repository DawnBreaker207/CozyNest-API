import { Schema, model, Document } from 'mongoose';

interface Notification extends Document {
  userId: string;
  orderId: string;
  status: string;
  timestamp: Date;
  read: boolean;
}

const notificationSchema = new Schema<Notification>(
  {
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export default model<Notification>('Notification', notificationSchema);
