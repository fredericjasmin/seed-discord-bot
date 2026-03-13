const { Events, EmbedBuilder, ChannelType } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        const { guild } = newChannel;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logChannelUpdates) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Canal Actualizado')
            .setDescription(`**Un canal ha sido actualizado:** ${newChannel.name}`)
            .setTimestamp();

        // Check for specific changes and add fields to embed
        if (oldChannel.name !== newChannel.name) {
            embed.addFields(
                { name: 'Nombre Antiguo', value: oldChannel.name },
                { name: 'Nombre Nuevo', value: newChannel.name }
            );
        }
        if (oldChannel.topic !== newChannel.topic) {
            embed.addFields(
                { name: 'Tema Antiguo', value: oldChannel.topic || 'Ninguno' },
                { name: 'Tema Nuevo', value: newChannel.topic || 'Ninguno' }
            );
        }
        // Add more checks for other properties like permissions, nsfw, etc.

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
