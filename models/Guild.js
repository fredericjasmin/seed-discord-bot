const { Schema, model } = require("mongoose");
// Define the schema for automod configuration
const automodConfigSchema = new Schema({
    enabled: { type: Boolean, default: false },
    filterWords: { type: [String], default: [] },
    filterInvites: { type: Boolean, default: false },
    filterLinks: { type: Boolean, default: false },
    filterCaps: { type: Boolean, default: false },
    filterSpam: { type: Boolean, default: false },
    filterMassMentions: { type: Boolean, default: false },
    capsThreshold: { type: Number, default: 70 }, // %
    action: { type: String, default: 'delete' }, // delete, warn, mute, kick, ban
    muteMinutes: { type: Number, default: 10 },
    logChannelId: { type: String, default: null },
    applyToRoles: { type: [String], default: [] }, // Solo aplicar a estos roles
    ignoreRoles: { type: [String], default: [] }, // Ignorar estos roles
    ignoreChannels: { type: [String], default: [] }, // Ignorar estos canales
}, { _id: false });

// Define the schema for ticket configuration as a sub-document
const ticketConfigSchema = new Schema({
    supportRoleId: { type: String, default: null },
    categoryId: { type: String, default: null },
    panelChannelId: { type: String, default: null },
    ticketMessageId: { type: String },
    sendTicketCreationMessage: { type: Boolean, default: true },
    panelButtonLabel: { type: String, default: 'Crear Ticket' }, // Texto del botón de crear ticket
    panelButtonEmoji: { type: String, default: '📩' }, // Emoji del botón de crear ticket
    closeButtonLabel: { type: String, default: 'Cerrar Ticket' }, // Texto del botón de cerrar ticket
    closeButtonEmoji: { type: String, default: '🔒' }, // Emoji del botón de cerrar ticket
    panelMessage: { type: String, default: "React to open a ticket!" },
    ticketWelcomeMessage: { type: String, default: "Welcome to your ticket! A staff member will assist you soon." },
    maxTicketsPerUser: { type: Number, default: 1 },
    mentionRoleIds: { type: [String], default: [] }, // Roles a mencionar al abrir ticket
    panelTitle: { type: String, default: 'Panel de Tickets' }, // Título del embed del panel
    panelEmbedColor: { type: String, default: '#00ff00' }, // Color del embed del panel
    welcomeTitle: { type: String, default: 'Ticket Creado' }, // Título del embed de bienvenida
    welcomeEmbedColor: { type: String, default: '#00ff00' }, // Color del embed de bienvenida
}, { _id: false });

// Define the schema for moderation configuration
const moderationConfigSchema = new Schema({
    logChannelId: { type: String, default: null },
    mutedRoleId: { type: String, default: null },
    warnLimit: { type: Number, default: 3 },
}, { _id: false });

// Define the schema for welcome configuration
const welcomeConfigSchema = new Schema({
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "Welcome {user.mention} to {guild.name}! You are the {guild.memberCount}th member." },
    useEmbed: { type: Boolean, default: false },
    embedColor: { type: String, default: "#000000" },
    embedTitle: { type: String, default: "Welcome!" },
    embedDescription: { type: String, default: "Welcome {user.mention} to {guild.name}! You are the {guild.memberCount}th member." },
    embedFooter: { type: String, default: null },
    embedThumbnail: { type: Boolean, default: true },
    embedImage: { type: String, default: null },
}, { _id: false });

// Define the schema for farewell configuration
const farewellConfigSchema = new Schema({
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "Goodbye {user.tag}. We now have {guild.memberCount} members." },
    useEmbed: { type: Boolean, default: false },
    embedColor: { type: String, default: "#000000" },
    embedTitle: { type: String, default: "Goodbye!" },
    embedDescription: { type: String, default: "Goodbye {user.tag}. We now have {guild.memberCount} members." },
    embedFooter: { type: String, default: null },
    embedThumbnail: { type: Boolean, default: true },
    embedImage: { type: String, default: null },
}, { _id: false });

// Define the schema for logging configuration
const loggingConfigSchema = new Schema({
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    logMessageUpdates: { type: Boolean, default: false },
    logMessageDeletes: { type: Boolean, default: false },
    logMemberUpdates: { type: Boolean, default: false },
    logChannelUpdates: { type: Boolean, default: false },
    logRoleUpdates: { type: Boolean, default: false },
    logBanEvents: { type: Boolean, default: false },
    logKickEvents: { type: Boolean, default: false },
    logWarnEvents: { type: Boolean, default: false },
}, { _id: false });

// Define the schema for auto-role configuration
const autoRoleConfigSchema = new Schema({
    enabled: { type: Boolean, default: false },
    roleId: { type: String, default: null },
}, { _id: false });

// Define the schema for a single reaction role entry
const reactionRoleEntrySchema = new Schema({ // New
    emoji: { type: String, required: true },
    roleId: { type: String, required: true },
}, { _id: false });

// Define the schema for reaction roles configuration
const reactionRolesConfigSchema = new Schema({ // New
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    reactions: [reactionRoleEntrySchema],
}, { _id: false });

// Define the schema for a single warning
const warningSchema = new Schema({
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

// Main Guild Schema
const guildSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    config: {
        tickets: ticketConfigSchema,
        moderation: moderationConfigSchema,
        welcome: welcomeConfigSchema,
        farewell: farewellConfigSchema,
        logging: loggingConfigSchema,
        autoRole: autoRoleConfigSchema,
        reactionRoles: [reactionRolesConfigSchema],
        automod: automodConfigSchema,
    },
    warnings: [warningSchema],
});

module.exports = model("Guild", guildSchema);