const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: '[🖼️ UTILITY] Show the avatar of a user or server',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'User to get the avatar of',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

        const avatarEmbed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle(`${user.tag}'s Avatar`)
            .setImage(avatarURL);

        await interaction.reply({ embeds: [avatarEmbed] });
    },
};
