const { EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');
const Giveaway = require('../../models/Giveaway');
const emoji = require('node-emoji');

const getServersPage = (client) => (req, res) => {
    const MANAGE_GUILD_PERMISSION = 0x20;
    const ADMINISTRATOR_PERMISSION = 0x8;
    const userGuilds = req.user.guilds;
    const botGuilds = client.guilds.cache;

    const manageableGuilds = userGuilds.filter(userGuild => {
        // Handle both permission fields and formats
        let perms = 0;
        if (userGuild.permissions_new) {
            perms = typeof userGuild.permissions_new === 'string' 
                ? parseInt(userGuild.permissions_new) 
                : Number(userGuild.permissions_new);
        } else if (userGuild.permissions) {
            perms = typeof userGuild.permissions === 'string' 
                ? parseInt(userGuild.permissions) 
                : Number(userGuild.permissions);
        }
        
        // Check for both Manage Guild and Administrator permissions
        const hasManageGuild = (perms & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION;
        const hasAdministrator = (perms & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION;
        
        return hasManageGuild || hasAdministrator;
    });

    const botInGuilds = [];
    const botNotInGuilds = [];

    manageableGuilds.forEach(userGuild => {
        if (botGuilds.has(userGuild.id)) {
            botInGuilds.push(userGuild);
        } else {
            botNotInGuilds.push(userGuild);
        }
    });

    res.render('servers', {
        path: '/servers',
        botInGuilds: botInGuilds,
        botNotInGuilds: botNotInGuilds,
        botClientId: process.env.DISCORD_CLIENT_ID
    });
};

const getGuildSettingsPage = (client) => async (req, res) => {
    const guildId = req.params.guildId;
    const MANAGE_GUILD_PERMISSION = 0x20;

    // Check if the user is in this guild and has manage guild permissions
    const userGuild = req.user.guilds.find(g => String(g.id) === String(guildId));
    if (!userGuild) {
        return res.status(403).send('You do not have permission to manage this server.');
    }
    
    // Handle both permission fields and formats
    let perms = 0;
    if (userGuild.permissions_new) {
        perms = typeof userGuild.permissions_new === 'string' 
            ? parseInt(userGuild.permissions_new) 
            : Number(userGuild.permissions_new);
    } else if (userGuild.permissions) {
        perms = typeof userGuild.permissions === 'string' 
            ? parseInt(userGuild.permissions) 
            : Number(userGuild.permissions);
    }
    
    // Check for both Manage Guild and Administrator permissions
    const ADMINISTRATOR_PERMISSION = 0x8;
    const hasManageGuild = (perms & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION;
    const hasAdministrator = (perms & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION;
    
    if (!hasManageGuild && !hasAdministrator) {
        return res.status(403).send('You do not have permission to manage this server.');
    }

    // Check if the bot is in this guild
    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
        return res.status(404).send('The bot is not in this server.');
    }

    // Fetch guild data from your database
    let guildData = await Guild.findOne({ guildId: guildId });
    if (!guildData) {
        guildData = new Guild({ guildId: guildId });
    }
    // Ensure config objects are initialized
    if (!guildData.config) {
        guildData.config = {};
    }
    if (!guildData.config.tickets) {
        guildData.config.tickets = {};
    }
    if (!guildData.config.moderation) {
        guildData.config.moderation = {};
    }
    if (!guildData.config.welcome) {
        guildData.config.welcome = {};
    }
    if (!guildData.config.farewell) {
        guildData.config.farewell = {};
    }
    if (!guildData.config.logging) {
        guildData.config.logging = {};
    }
    if (!guildData.config.autoRole) {
        guildData.config.autoRole = {};
    }
    if (!guildData.config.reactionRoles) {
        guildData.config.reactionRoles = [];
    }
    await guildData.save();

    // Fetch all channels and roles for the guild
    const channels = botGuild.channels.cache.filter(c => c.type === 0 || c.type === 4);
    const roles = botGuild.roles.cache.filter(r => !r.managed && r.name !== '@everyone');

    // Fetch giveaways for this guild
    const giveaways = await Giveaway.find({ guildId: guildId }).sort({ endAt: -1 });

    res.render('guildSettings', {
        path: '/servers',
        currentGuild: botGuild,
        guild: guildData,
        channels: botGuild.channels.cache.toJSON(),
        roles: botGuild.roles.cache.toJSON(),
        giveaways
    });
};

// AQUÍ ESTÁ LA CORRECCIÓN: Agregar el parámetro client
const postGuildSettings = (client) => async (req, res) => {
    const guildId = req.params.guildId;
    const MANAGE_GUILD_PERMISSION = 0x20; // 32 in decimal

    // Check if this looks like a Discord ID (should be 17-19 digits) or MongoDB ObjectId (24 hex chars)
    const isDiscordId = /^\d{17,19}$/.test(guildId);
    const isMongoObjectId = /^[0-9a-fA-F]{24}$/.test(guildId);
    
    if (isMongoObjectId) {
        console.log('ERROR: Received MongoDB ObjectId instead of Discord Guild ID');
        console.log('This suggests the route is passing the wrong parameter');
        return res.status(400).send('ID de servidor inválido - se esperaba un ID de Discord, no un ObjectId de MongoDB');
    }
    
    if (!isDiscordId) {
        console.log('ERROR: Guild ID is not in valid Discord format');
        return res.status(400).send('ID de servidor inválido - debe ser un ID de Discord válido');
    }

    // Check if the user is in this guild and has manage guild permissions
    const userGuild = req.user.guilds.find(g => String(g.id) === String(guildId));
    
    if (!userGuild) {
        return res.status(403).send('No tienes permisos para gestionar este servidor - Guild not found.');
    }
    
    // Try both permission fields and handle both string and number formats
    let perms = 0;
    if (userGuild.permissions_new) {
        // Use the new permissions field if available
        perms = typeof userGuild.permissions_new === 'string' 
            ? parseInt(userGuild.permissions_new) 
            : Number(userGuild.permissions_new);
    } else if (userGuild.permissions) {
        // Fall back to old permissions field
        perms = typeof userGuild.permissions === 'string' 
            ? parseInt(userGuild.permissions) 
            : Number(userGuild.permissions);
    }
    
    // Check for Administrator permission (0x8) as well, since admins can manage everything
    const ADMINISTRATOR_PERMISSION = 0x8;
    const hasManageGuild = (perms & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION;
    const hasAdministrator = (perms & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION;
    
    if (!hasManageGuild && !hasAdministrator) {
        return res.status(403).send(`No tienes permisos para gestionar este servidor. Permisos actuales: ${perms}`);
    }

    // Check if the bot is in this guild
    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
        return res.status(404).send('El bot no está en este servidor.');
    }

    try {
        let guildData = await Guild.findOne({ guildId: guildId });
        if (!guildData) {
            guildData = new Guild({ guildId: guildId });
        }

        const { settingType } = req.body;

        switch (settingType) {
            case 'ticketConfig':
                guildData.config.tickets.panelButtonLabel = req.body.panelButtonLabel || 'Crear Ticket';
                guildData.config.tickets.panelButtonEmoji = req.body.panelButtonEmoji || '📩';
                guildData.config.tickets.closeButtonLabel = req.body.closeButtonLabel || 'Cerrar Ticket';
                guildData.config.tickets.closeButtonEmoji = req.body.closeButtonEmoji || '🔒';
                guildData.config.tickets.supportRoleId = req.body.ticketSupportRole || null;
                guildData.config.tickets.categoryId = req.body.ticketCategory || null;
                guildData.config.tickets.panelChannelId = req.body.ticketPanelChannel || null;
                guildData.config.tickets.panelTitle = req.body.ticketPanelTitle || 'Panel de Tickets';
                guildData.config.tickets.panelMessage = req.body.ticketPanelMessage || "React to open a ticket!";
                guildData.config.tickets.welcomeTitle = req.body.ticketWelcomeTitle || 'Ticket Creado';
                // Si llega como array, usar solo el primer valor
                if (Array.isArray(req.body.ticketWelcomeMessage)) {
                    guildData.config.tickets.ticketWelcomeMessage = req.body.ticketWelcomeMessage[0] || 'Welcome to your ticket! A staff member will assist you soon.';
                } else {
                    guildData.config.tickets.ticketWelcomeMessage = req.body.ticketWelcomeMessage || 'Welcome to your ticket! A staff member will assist you soon.';
                }
                guildData.config.tickets.maxTicketsPerUser = req.body.maxTicketsPerUser ? parseInt(req.body.maxTicketsPerUser) : 1;
                guildData.config.tickets.sendTicketCreationMessage = req.body.sendTicketCreationMessage === 'on';
                // Guardar el rol a mencionar (solo uno)
                if (req.body.ticketMentionRole && req.body.ticketMentionRole.length > 0) {
                    guildData.config.tickets.mentionRoleIds = [req.body.ticketMentionRole];
                } else {
                    guildData.config.tickets.mentionRoleIds = [];
                }
                // Guardar colores de embed
                guildData.config.tickets.panelEmbedColor = req.body.ticketPanelEmbedColor || '#00ff00';
                guildData.config.tickets.welcomeEmbedColor = req.body.ticketWelcomeEmbedColor || '#00ff00';

                // Enviar el panel de tickets si el switch está activado
                if (guildData.config.tickets.sendTicketCreationMessage && guildData.config.tickets.panelChannelId) {
                    try {
                        const botGuild = client.guilds.cache.get(guildId);
                        if (botGuild) {
                            const panelChannel = botGuild.channels.cache.get(guildData.config.tickets.panelChannelId);
                            if (panelChannel && panelChannel.isTextBased && panelChannel.isTextBased()) {
                                const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
                                const embed = new EmbedBuilder()
                                    .setColor(guildData.config.tickets.panelEmbedColor || '#00ff00')
                                    .setTitle(guildData.config.tickets.panelTitle || 'Panel de Tickets')
                                    .setDescription(guildData.config.tickets.panelMessage || 'React to open a ticket!');
                                const button = new ActionRowBuilder().addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('create-ticket')
                                        .setLabel(guildData.config.tickets.panelButtonLabel || 'Crear Ticket')
                                        .setStyle(ButtonStyle.Success)
                                        .setEmoji(guildData.config.tickets.panelButtonEmoji || '📩')
                                );
                                await panelChannel.send({
                                    embeds: [embed],
                                    components: [button],
                                });
                            }
                        }
                    } catch (err) {
                        console.error('Error sending ticket panel from dashboard:', err);
                    }
                }
                break;
            case 'loggingConfig':
                guildData.config.logging.enabled = req.body.logsEnabled === 'on';
                guildData.config.logging.channelId = req.body.logsChannel || null;
                guildData.config.logging.logMessageUpdates = req.body.logMessageUpdates === 'on';
                guildData.config.logging.logMessageDeletes = req.body.logMessageDeletes === 'on';
                guildData.config.logging.logMemberUpdates = req.body.logMemberUpdates === 'on';
                guildData.config.logging.logChannelUpdates = req.body.logChannelUpdates === 'on';
                guildData.config.logging.logRoleUpdates = req.body.logRoleUpdates === 'on';
                guildData.config.logging.logBanEvents = req.body.logBanEvents === 'on';
                guildData.config.logging.logKickEvents = req.body.logKickEvents === 'on';
                guildData.config.logging.logWarnEvents = req.body.logWarnEvents === 'on';
                break;
            case 'welcome':
                guildData.config.welcome.enabled = req.body.welcomeEnabled === 'on';
                guildData.config.welcome.channelId = req.body.welcomeChannel || null;
                guildData.config.welcome.message = req.body.welcomeMessage || "Welcome {user.mention} to {guild.name}!";
                guildData.config.welcome.useEmbed = req.body.welcomeUseEmbed === 'on';
                guildData.config.welcome.embedColor = req.body.welcomeEmbedColor || '#000000';
                guildData.config.welcome.embedTitle = req.body.welcomeEmbedTitle || null;
                guildData.config.welcome.embedDescription = req.body.welcomeEmbedDescription || null;
                guildData.config.welcome.embedFooter = req.body.welcomeEmbedFooter || null;
                guildData.config.welcome.embedThumbnail = req.body.welcomeEmbedThumbnail === 'on';
                guildData.config.welcome.embedImage = req.body.welcomeEmbedImage || null;
                break;
            case 'farewell':
                guildData.config.farewell.enabled = req.body.farewellEnabled === 'on';
                guildData.config.farewell.channelId = req.body.farewellChannel || null;
                guildData.config.farewell.message = req.body.farewellMessage || "{user.mention} has left {guild.name}.";
                guildData.config.farewell.useEmbed = req.body.farewellUseEmbed === 'on';
                guildData.config.farewell.embedColor = req.body.farewellEmbedColor || '#000000';
                guildData.config.farewell.embedTitle = req.body.farewellEmbedTitle || null;
                guildData.config.farewell.embedDescription = req.body.farewellEmbedDescription || null;
                guildData.config.farewell.embedFooter = req.body.farewellEmbedFooter || null;
                guildData.config.farewell.embedThumbnail = req.body.farewellEmbedThumbnail === 'on';
                guildData.config.farewell.embedImage = req.body.farewellEmbedImage || null;
                break;
            case 'autoRole':
                guildData.config.autoRole.enabled = req.body.autoRoleEnabled === 'on';
                guildData.config.autoRole.roleId = req.body.autoRoleRole || null;
                break;
            case 'automodConfig':
                if (!guildData.config.automod) guildData.config.automod = {};
                guildData.config.automod.enabled = req.body.automodEnabled === 'on';
                guildData.config.automod.filterWords = req.body.automodFilterWords ? req.body.automodFilterWords.split(',').map(w => w.trim()).filter(Boolean) : [];
                guildData.config.automod.filterInvites = req.body.automodFilterInvites === 'on';
                guildData.config.automod.filterLinks = req.body.automodFilterLinks === 'on';
                guildData.config.automod.filterCaps = req.body.automodFilterCaps === 'on';
                guildData.config.automod.capsThreshold = req.body.automodCapsThreshold ? parseInt(req.body.automodCapsThreshold) : 70;
                guildData.config.automod.action = req.body.automodAction || 'delete';
                guildData.config.automod.muteMinutes = req.body.automodMuteMinutes ? parseInt(req.body.automodMuteMinutes) : 10;
                guildData.config.automod.logChannelId = req.body.automodLogChannelId || null;
                // Arrays de roles/canales (pueden venir como string o array)
                const arr = v => Array.isArray(v) ? v : v ? [v] : [];
                guildData.config.automod.applyToRoles = arr(req.body.automodApplyToRoles);
                guildData.config.automod.ignoreRoles = arr(req.body.automodIgnoreRoles);
                guildData.config.automod.ignoreChannels = arr(req.body.automodIgnoreChannels);
                break;
            case 'reactionRoleCreate':
                const { rrChannel, rrTitle, rrDescription } = req.body;
                const rrEmbed = new EmbedBuilder().setTitle(rrTitle).setDescription(rrDescription).setColor('#0099ff');
                const channel = botGuild.channels.cache.get(rrChannel);
                if (channel) {
                    const message = await channel.send({ embeds: [rrEmbed] });
                    guildData.config.reactionRoles.push({ messageId: message.id, channelId: channel.id, reactions: [] });
                }
                break;
            case 'reactionRoleAdd':
                const { messageId, rrEmoji, rrRole } = req.body;
                const reactionRole = guildData.config.reactionRoles.find(rr => rr.messageId === messageId);
                if (reactionRole) {
                    const parsedEmoji = emoji.get(rrEmoji) || rrEmoji;
                    const customEmojiRegex = /<a?:(.+):(\d+)>/;
                    const customEmojiMatch = parsedEmoji.match(customEmojiRegex);
                    const emojiToReact = customEmojiMatch ? customEmojiMatch[2] : parsedEmoji;

                    if (!reactionRole.reactions.some(r => r.emoji === emojiToReact)) {
                        reactionRole.reactions.push({ emoji: emojiToReact, roleId: rrRole });
                        const rrChannelObj = botGuild.channels.cache.get(reactionRole.channelId);
                        if (rrChannelObj) {
                            const rrMessage = await rrChannelObj.messages.fetch(messageId);
                            await rrMessage.react(emojiToReact);
                        }
                    }
                }
                break;
            case 'reactionRoleRemove':
                const { messageId: msgId, emoji: emojiToRemove } = req.body;
                const rr = guildData.config.reactionRoles.find(rr => rr.messageId === msgId);
                if (rr) {
                    const reactionIndex = rr.reactions.findIndex(r => r.emoji === emojiToRemove);
                    if (reactionIndex !== -1) {
                        rr.reactions.splice(reactionIndex, 1);
                        const rrChannelObj = botGuild.channels.cache.get(rr.channelId);
                        if (rrChannelObj) {
                            const rrMessage = await rrChannelObj.messages.fetch(msgId);
                            const messageReaction = rrMessage.reactions.cache.find(r => r.emoji.name === emojiToRemove || r.emoji.id === emojiToRemove);
                            if (messageReaction) {
                                await messageReaction.remove();
                            }
                        }
                    }
                }
                break;
            case 'ticketWelcome':
                guildData.config.tickets.ticketWelcomeMessage = req.body.ticketWelcomeMessage || "Welcome to your ticket! A staff member will assist you soon.";
                break;
            default:
                break;
        }

        await guildData.save();
        res.redirect(`/servers/${guildId}/settings?success=true`);

    } catch (error) {
        console.error('Error saving server configuration:', error);
        res.redirect(`/servers/${guildId}/settings?error=true`);
    }
};

// --- GIVEAWAYS HANDLERS ---
// Crear sorteo desde dashboard (soporta minutos, horas, días)
const postCreateGiveaway = async (req, res) => {
    const guildId = req.params.guildId;
    const { prize, winners, channelId, durationValue, durationUnit } = req.body;
    let durationMs = 0;
    const value = parseInt(durationValue);
    if (durationUnit === 'minutes') durationMs = value * 60 * 1000;
    else if (durationUnit === 'hours') durationMs = value * 60 * 60 * 1000;
    else if (durationUnit === 'days') durationMs = value * 24 * 60 * 60 * 1000;
    else durationMs = value * 60 * 1000; // fallback
    const endAt = new Date(Date.now() + durationMs);
    const createdBy = req.user.id;
    const giveaway = new Giveaway({
        guildId,
        channelId,
        prize,
        winners: parseInt(winners),
        endAt,
        createdBy
    });
    await giveaway.save();
    res.redirect(`/servers/${guildId}/settings?success=true`);
};

// Finalizar sorteo desde dashboard
const postEndGiveaway = async (req, res) => {
    const guildId = req.params.guildId;
    const giveawayId = req.params.giveawayId;
    await Giveaway.findByIdAndUpdate(giveawayId, { ended: true });
    res.redirect(`/servers/${guildId}/settings?success=true`);
};

module.exports = {
    getServersPage,
    getGuildSettingsPage,
    postGuildSettings,
    postCreateGiveaway,
    postEndGiveaway
};