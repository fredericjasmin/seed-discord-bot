const { Schema, model } = require("mongoose");

const afkSchema = new Schema({
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
    reason: {
        type: String,
        default: "AFK"
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

afkSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model("Afk", afkSchema);
