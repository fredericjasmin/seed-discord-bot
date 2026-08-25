const { Schema, model } = require("mongoose");

const suggestionSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        index: true
    },
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true
    },
    suggestion: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'implemented'],
        default: 'pending'
    },
    upvotes: {
        type: [String], // Array de User IDs
        default: []
    },
    downvotes: {
        type: [String], // Array de User IDs
        default: []
    },
    staffComment: {
        type: String,
        default: null
    },
    staffUserId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

suggestionSchema.index({ guildId: 1, messageId: 1 });

module.exports = model("Suggestion", suggestionSchema);
