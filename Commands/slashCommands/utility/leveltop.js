const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Level = require('../../../models/Level');

module.exports = {
    name: 'leveltop',
    description: 'Muestra el top de usuarios con mayor nivel del servidor.',
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'pagina',
            description: 'Página de la tabla de clasificación (1 por defecto)',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const page = interaction.options.getInteger('pagina') || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalEntries = await Level.countDocuments({ guildId: interaction.guild.id });
        const maxPages = Math.ceil(totalEntries / limit) || 1;

        if (page < 1 || page > maxPages) {
            return interaction.reply({ content: `Página inválida. Elige un número entre 1 y ${maxPages}.`, ephemeral: true });
        }

        const topLevels = await Level.find({ guildId: interaction.guild.id })
            .sort({ xp: -1 })
            .skip(skip)
            .limit(limit);

        if (!topLevels.length) {
            return interaction.reply({ content: 'Aún no hay datos de niveles registrados en este servidor.', ephemeral: true });
        }

        const medals = ['🥇', '🥈', '🥉'];
        const descriptionList = topLevels.map((entry, index) => {
            const rank = skip + index + 1;
            const medal = medals[rank - 1] || `**#${rank}**`;
            return `${medal} <@${entry.userId}> • **Nivel ${entry.level}** (${entry.xp.toLocaleString()} XP) • 💬 ${entry.totalMessages} msgs`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor('#00C851')
            .setTitle(`🏆 Top Niveles - ${interaction.guild.name}`)
            .setDescription(descriptionList)
            .setFooter({ text: `Página ${page} de ${maxPages} • Total participantes: ${totalEntries}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
