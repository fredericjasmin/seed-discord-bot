const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'dashboard',
    description: 'Obtén el enlace directo al Dashboard web y al panel de este servidor.',
    run: async (client, interaction) => {
        const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
        const guildSettingsUrl = interaction.guild ? `${baseUrl}/servers/${interaction.guild.id}/settings` : `${baseUrl}/servers`;

        const embed = new EmbedBuilder()
            .setColor('#00C851')
            .setTitle('🌐 Panel de Control Web • Seed Dashboard')
            .setDescription('Administra la configuración del bot, ajusta los módulos en tiempo real, consulta las tablas de clasificación y explora la tienda web desde el panel de control.')
            .addFields(
                { name: '🔗 Enlace Principal', value: `[Abrir Dashboard](${baseUrl})`, inline: true },
                { name: '⚙️ Ajustes del Servidor', value: interaction.guild ? `[Panel de ${interaction.guild.name}](${guildSettingsUrl})` : '[Mis Servidores](' + baseUrl + '/servers)', inline: true }
            )
            .setFooter({ text: `${client.user.username} • Panel de Administración` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('⚙️ Panel del Servidor')
                .setStyle(ButtonStyle.Link)
                .setURL(guildSettingsUrl)
                .setEmoji('⚙️'),
            new ButtonBuilder()
                .setLabel('🌐 Dashboard Web')
                .setStyle(ButtonStyle.Link)
                .setURL(baseUrl),
            new ButtonBuilder()
                .setLabel('🏆 Leaderboard')
                .setStyle(ButtonStyle.Link)
                .setURL(`${baseUrl}/leaderboard`)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },
};
