const { Schema, model } = require("mongoose");

const levelSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    lastXpGained: {
        type: Date,
        default: () => new Date(0)
    }
});

levelSchema.index({ guildId: 1, userId: 1 }, { unique: true });
levelSchema.index({ guildId: 1, xp: -1 });

module.exports = model("Level", levelSchema);
