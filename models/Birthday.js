const { Schema, model } = require("mongoose");

const birthdaySchema = new Schema({
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
    day: {
        type: Number,
        required: true,
        min: 1,
        max: 31
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    lastCelebratedYear: {
        type: Number,
        default: 0
    }
});

birthdaySchema.index({ guildId: 1, userId: 1 }, { unique: true });
birthdaySchema.index({ guildId: 1, month: 1, day: 1 });

module.exports = model("Birthday", birthdaySchema);
