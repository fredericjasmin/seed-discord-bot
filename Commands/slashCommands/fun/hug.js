const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'hug',
    description: 'Hug a user.',
    options: [
        {
            name: 'user',
            type: 6, // USER
            description: 'The user you want to hug.',
            required: true,
        },
    ],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        const embed = new EmbedBuilder()
            .setColor('#FF69B4') // Pink color for hugs
            .setDescription(`**${interaction.user.tag}** hugged **${targetUser.tag}**! 🤗`)
            .setImage('https://media.giphy.com/media/3bqtLdeihtzGg/giphy.gif') // Example GIF
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
