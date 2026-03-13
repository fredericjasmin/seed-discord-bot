const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (oldMessage.author.bot) return; // Ignore bots
        if (oldMessage.content === newMessage.content) return; // Ignore if content is same

        const { guild } = newMessage;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logMessageUpdates) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Mensaje Actualizado')
            .setDescription(`**Mensaje de ${newMessage.author.tag} editado en ${newMessage.channel}:**`)
            .addFields(
                { name: 'Antes', value: oldMessage.content.substring(0, 1024) || 'No content' },
                { name: 'After', value: newMessage.content.substring(0, 1024) || 'No content' },
                { name: 'Enlace', value: `[Ir al mensaje](${newMessage.url})` }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
