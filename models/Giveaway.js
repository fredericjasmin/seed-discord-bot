const { Schema, model } = require('mongoose');

const giveawaySchema = new Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String },
    prize: { type: String, required: true },
    winners: { type: Number, default: 1 },
    endAt: { type: Date, required: true },
    createdBy: { type: String, required: true },
    participants: { type: [String], default: [] },
    ended: { type: Boolean, default: false },
    winnerIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('Giveaway', giveawaySchema);
