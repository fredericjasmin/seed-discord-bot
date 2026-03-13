const { Events, EmbedBuilder, ChannelType } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel) {
        const { guild } = channel;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logChannelUpdates) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Canal Eliminado')
            .setDescription(`**A channel has been deleted:** ${channel.name} (${channel.type === ChannelType.GuildText ? 'Text' : channel.type === ChannelType.GuildVoice ? 'Voice' : channel.type === ChannelType.GuildCategory ? 'Category' : 'Unknown'})`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    },
};
