const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'serverinfo',
    description: '[ℹ️ UTILITY] Get information about the server',
    run: async (client, interaction) => {
        const guild = interaction.guild;
        const serverEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle(`${guild.name} Server Information`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Created On', value: new Date(guild.createdTimestamp).toDateString(), inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true }
            );

        await interaction.reply({ embeds: [serverEmbed] });
    },
};
