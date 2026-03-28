import mongoose, { Schema } from 'mongoose';
import { ImportJobStatus } from '../types';

// MODEL 11: ImportJob (batch product import tracking)
export interface IImportJob {
  adminId: string;
  filename: string;
  status: ImportJobStatus;
  totalRows: number;
  successCount: number;
  failCount: number;
  errors: { row: number; message: string }[];
  completedAt?: Date;
}

const ImportJobSchema = new Schema<IImportJob>(
  {
    adminId:      { type: String, required: true },
    filename:     { type: String, required: true },
    status:       { type: String, enum: Object.values(ImportJobStatus), default: ImportJobStatus.PENDING },
    totalRows:    { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failCount:    { type: Number, default: 0 },
    errors: [
      {
        row:     { type: Number },
        message: { type: String },
        _id: false,
      },
    ],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const ImportJob = mongoose.model<IImportJob>('ImportJob', ImportJobSchema);
