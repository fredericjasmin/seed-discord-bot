const mongoose = require('mongoose');

const economySchema = new mongoose.Schema({
    _id: { type: String, required: true },
    coins: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    inventory: { type: [String], default: [] },
    cooldowns: {
        daily: { type: Number, default: null },
        crime: { type: Number, default: null },
        gamble: { type: Number, default: null },
        rob: { type: Number, default: null },
        roulette: { type: Number, default: null },
        slot: { type: Number, default: null },
        slots: { type: Number, default: null },
        work: { type: Number, default: null }
    }
});

module.exports = mongoose.model('Economy', economySchema);
