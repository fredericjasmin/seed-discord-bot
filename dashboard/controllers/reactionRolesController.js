const { EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

const getNewReactionRolePage = async (req, res) => {
    const { guildId } = req.params;
    const botGuild = req.client.guilds.cache.get(guildId);
    if (!botGuild) {
        return res.status(404).send('Bot is not in this server.');
    }

    res.render('newReactionRole', {
        path: `/servers/${guildId}/settings`,
        currentGuild: botGuild,
        channels: botGuild.channels.cache.toJSON(),
    });
};

const postNewReactionRole = async (req, res) => {
    const { guildId } = req.params;
    const { channel: channelId, title, description } = req.body;

    const botGuild = req.client.guilds.cache.get(guildId);
    if (!botGuild) {
        return res.status(404).send('Bot is not in this server.');
    }

    const channel = botGuild.channels.cache.get(channelId);
    if (!channel) {
        return res.status(400).send('Invalid channel selected.');
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor('#0099ff');

    try {
        const message = await channel.send({ embeds: [embed] });

        let guildData = await Guild.findOne({ guildId });
        if (!guildData) {
            guildData = new Guild({ guildId });
        }

        guildData.config.reactionRoles.push({
            messageId: message.id,
            channelId: channel.id,
            reactions: [],
        });

        await guildData.save();

        res.redirect(`/servers/${guildId}/reaction-roles/${message.id}`);
    } catch (error) {
        console.error('Error creating reaction role message:', error);
        res.redirect(`/servers/${guildId}/settings?error=true`);
    }
};

const getReactionRolePage = async (req, res) => {
    const { guildId, messageId } = req.params;
    const botGuild = req.client.guilds.cache.get(guildId);
    if (!botGuild) {
        return res.status(404).send('Bot is not in this server.');
    }

    let guildData = await Guild.findOne({ guildId });
    if (!guildData) {
        return res.status(404).send('Guild data not found.');
    }

    const reactionRole = guildData.config.reactionRoles.find(rr => rr.messageId === messageId);
    if (!reactionRole) {
        return res.status(404).send('Reaction role message not found.');
    }

    res.render('manageReactionRole', {
        path: `/servers/${guildId}/settings`,
        currentGuild: botGuild,
        reactionRole,
        channels: botGuild.channels.cache.toJSON(),
        roles: botGuild.roles.cache.toJSON(),
    });
};

const postAddReactionRole = async (req, res) => {
    const { guildId, messageId } = req.params;
    const { emoji, role: roleId } = req.body;

    let guildData = await Guild.findOne({ guildId });
    if (!guildData) {
        return res.status(404).send('Guild data not found.');
    }

    const reactionRole = guildData.config.reactionRoles.find(rr => rr.messageId === messageId);
    if (!reactionRole) {
        return res.status(404).send('Reaction role message not found.');
    }

    if (reactionRole.reactions.some(r => r.emoji === emoji)) {
        return res.redirect(`/servers/${guildId}/reaction-roles/${messageId}?error=emoji_in_use`);
    }

    reactionRole.reactions.push({ emoji, roleId });
    await guildData.save();

    try {
        const channel = await req.client.guilds.cache.get(guildId).channels.fetch(reactionRole.channelId);
        const message = await channel.messages.fetch(messageId);
        await message.react(emoji);
    } catch (error) {
        console.error('Error adding reaction:', error);
    }

    res.redirect(`/servers/${guildId}/reaction-roles/${messageId}?success=true`);
};

const postRemoveReactionRole = async (req, res) => {
    const { guildId, messageId } = req.params;
    const { emoji } = req.body;

    let guildData = await Guild.findOne({ guildId });
    if (!guildData) {
        return res.status(404).send('Guild data not found.');
    }

    const reactionRole = guildData.config.reactionRoles.find(rr => rr.messageId === messageId);
    if (!reactionRole) {
        return res.status(404).send('Reaction role message not found.');
    }

    const reactionIndex = reactionRole.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex === -1) {
        return res.redirect(`/servers/${guildId}/reaction-roles/${messageId}?error=emoji_not_found`);
    }

    reactionRole.reactions.splice(reactionIndex, 1);
    await guildData.save();

    try {
        const channel = await req.client.guilds.cache.get(guildId).channels.fetch(reactionRole.channelId);
        const message = await channel.messages.fetch(messageId);
        const messageReaction = message.reactions.cache.get(emoji);
        if (messageReaction) {
            await messageReaction.remove();
        }
    } catch (error) {
        console.error('Error removing reaction:', error);
    }

    res.redirect(`/servers/${guildId}/reaction-roles/${messageId}?success=true`);
};

module.exports = {
    getNewReactionRolePage,
    postNewReactionRole,
    getReactionRolePage,
    postAddReactionRole,
    postRemoveReactionRole,
};