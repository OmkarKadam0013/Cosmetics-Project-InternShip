const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
});

// Method to update the total price
cartSchema.methods.updateTotalPrice = async function () {
  let total = 0;
  for (let item of this.items) {
    const product = await mongoose.model('Product').findById(item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  this.totalPrice = total;
  await this.save();
};
// You can use this method in your controller to update the price after adding/removing items.

module.exports = mongoose.model('Cart', cartSchema);
