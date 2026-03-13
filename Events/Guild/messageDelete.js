const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (message.author.bot) return; // Ignore bots

        const { guild } = message;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logMessageDeletes) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Mensaje Eliminado')
            .setDescription(`**Mensaje de ${message.author.tag} eliminado en ${message.channel}:**`)
            .addFields(
                { name: 'Contenido', value: message.content.substring(0, 1024) || 'No content' }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
