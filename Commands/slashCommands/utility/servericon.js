const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'servericon',
    description: 'Muestra el icono del servidor.',
    
    async execute(interaction) {
        const server = interaction.guild;
        const iconURL = server.iconURL({ dynamic: true, size: 512 });

        if (!iconURL) {
            return interaction.reply({ content: 'Este servidor no tiene un icono.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Icono de ${server.name}`)
            .setImage(iconURL)
            .setColor('#00FF00');

        await interaction.reply({ embeds: [embed] });
    }
};