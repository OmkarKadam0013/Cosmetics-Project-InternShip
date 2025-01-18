const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    min:-1,
  },
  images: [
    {
      url: { type: String, required: true },
    },
  ],
  likes: {
    type: Number,
    default: 0, // Initial likes set to 0
  },
  ratings: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String },
      rating: { type: Number, required: true },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
