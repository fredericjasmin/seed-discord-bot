const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pat',
    description: 'Acaricia a un usuario.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario al que quieres acariciar.',
            required: true,
        },
    ],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');

        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Gold color for pats
            .setDescription(`**${interaction.user.tag}** ha acariciado a **${targetUser.tag}**! 👋`)
            .setImage('https://media.giphy.com/media/L2IE050J5s0QJ00000/giphy.gif') // Example GIF
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
