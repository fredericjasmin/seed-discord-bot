const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'botinfo',
    description: '[ℹ️ INFORMATION] Get information about the bot',
    run: async (client, interaction) => {
        const botInfoEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('Bot Information')
            .addFields(
                { name: 'Bot Name', value: client.user.username, inline: true },
                { name: 'Bot ID', value: client.user.id, inline: true },
                { name: 'Uptime', value: `${Math.floor(client.uptime / (1000 * 60 * 60))} hours`, inline: true },
                { name: 'Total Servers', value: client.guilds.cache.size.toString(), inline: true },
                { name: 'Total Users', value: client.users.cache.size.toString(), inline: true },
                { name: 'Creation Date', value: client.user.createdAt.toDateString(), inline: true }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [botInfoEmbed] });
    },
};
