const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole) {
        const { guild } = newRole;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logRoleUpdates) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Rol Actualizado')
            .setDescription(`**Un rol ha sido actualizado:** ${newRole.name}`)
            .setTimestamp();

        // Check for specific changes and add fields to embed
        if (oldRole.name !== newRole.name) {
            embed.addFields(
                { name: 'Nombre Antiguo', value: oldRole.name },
                { name: 'Nombre Nuevo', value: newRole.name }
            );
        }
        if (oldRole.color !== newRole.color) {
            embed.addFields(
                { name: 'Color Antiguo', value: `#${oldRole.color.toString(16)}` },
                { name: 'Color Nuevo', value: `#${newRole.color.toString(16)}` }
            );
        }
        // Add more checks for other properties like permissions, hoist, mentionable, etc.

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
