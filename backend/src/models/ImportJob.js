const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ImportJobStatus } = require('../types');

// MODEL 11: ImportJob (batch product import tracking)
const ImportJobSchema = new Schema(
  {
    adminId:      { type: String, required: true },
    filename:     { type: String, required: true },
    status:       { type: String, enum: Object.values(ImportJobStatus), default: ImportJobStatus.PENDING },
    totalRows:    { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failCount:    { type: Number, default: 0 },
    importErrors: [
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

const ImportJob = mongoose.model('ImportJob', ImportJobSchema);

module.exports = { ImportJob };
