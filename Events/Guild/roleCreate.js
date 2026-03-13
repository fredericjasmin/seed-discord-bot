const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role) {
        const { guild } = role;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logRoleUpdates) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Rol Creado')
            .setDescription(`**Un nuevo rol ha sido creado:** ${role.name} (${role.id})`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
