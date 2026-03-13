const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Unique ID for the item (e.g., smartphone_x)
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    // You can add more fields here, e.g., imageUrl, category, etc.
});

module.exports = mongoose.model('ShopItem', shopItemSchema);