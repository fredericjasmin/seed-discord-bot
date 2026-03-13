const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'slap',
    description: 'Abofetea a un usuario.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario al que quieres abofetear.',
            required: true,
        },
    ],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');

        const embed = new EmbedBuilder()
            .setColor('#FF0000') // Red color for slaps
            .setDescription(`**${interaction.user.tag}** ha abofeteado a **${targetUser.tag}**! 💥`)
            .setImage('https://media.giphy.com/media/gSIz6gGLhGUzS/giphy.gif') // Example GIF
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
