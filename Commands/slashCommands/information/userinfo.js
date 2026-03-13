const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: '[👤 UTILITY] Get information about a user',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'User to get information about',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const userEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle(`${user.tag}'s Information`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Joined Server', value: member ? new Date(member.joinedTimestamp).toDateString() : 'N/A', inline: true },
                { name: 'Account Created', value: new Date(user.createdTimestamp).toDateString(), inline: true }
            );

        await interaction.reply({ embeds: [userEmbed] });
    },
};
