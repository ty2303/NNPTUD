const mongoose = require('mongoose');
const { Schema } = mongoose;

// MODEL 2: Category
const CategorySchema = new Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon:        { type: String, default: '' },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', CategorySchema);

module.exports = { Category };
