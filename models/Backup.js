const { Schema, model } = require("mongoose");

const backupSchema = new Schema({
    backupId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    guildName: {
        type: String,
        required: true
    },
    creatorId: {
        type: String,
        required: true
    },
    iconURL: {
        type: String,
        default: null
    },
    data: {
        roles: [{
            name: String,
            color: Number,
            hoist: Boolean,
            permissions: String,
            mentionable: Boolean,
            position: Number
        }],
        categories: [{
            name: String,
            permissions: [{
                roleName: String,
                allow: String,
                deny: String
            }],
            children: [{
                name: String,
                type: Number,
                topic: String,
                nsfw: Boolean,
                bitrate: Number,
                userLimit: Number,
                rateLimitPerUser: Number,
                permissions: [{
                    roleName: String,
                    allow: String,
                    deny: String
                }]
            }]
        }],
        others: [{
            name: String,
            type: Number,
            topic: String,
            nsfw: Boolean,
            bitrate: Number,
            userLimit: Number,
            rateLimitPerUser: Number,
            permissions: [{
                roleName: String,
                allow: String,
                deny: String
            }]
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = model("Backup", backupSchema);
