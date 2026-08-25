const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Level = require('../../../models/Level');

const getRequiredXp = (level) => Math.floor(100 * Math.pow(level, 1.5));

function createProgressBar(current, total, barSize = 12) {
    const percentage = Math.min(Math.max(current / total, 0), 1);
    const progress = Math.round(barSize * percentage);
    const emptyProgress = barSize - progress;
    return '🟩'.repeat(progress) + '⬛'.repeat(emptyProgress);
}

module.exports = {
    name: 'rank',
    description: 'Muestra tu nivel, experiencia y progreso actual en el servidor.',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'usuario',
            description: 'Usuario del que deseas ver el rango',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;

        let userLevel = await Level.findOne({ guildId: interaction.guild.id, userId: targetUser.id });
        if (!userLevel) {
            userLevel = {
                level: 1,
                xp: 0,
                totalMessages: 0
            };
        }

        // Obtener posición en el ranking
        const allGuildUsers = await Level.find({ guildId: interaction.guild.id }).sort({ xp: -1 });
        const rankPosition = allGuildUsers.findIndex(u => u.userId === targetUser.id) + 1 || (allGuildUsers.length + 1);

        const currentLvlXp = userLevel.level > 1 ? getRequiredXp(userLevel.level - 1) : 0;
        const nextLvlXp = getRequiredXp(userLevel.level);
        const xpInCurrentLevel = Math.max(0, userLevel.xp - currentLvlXp);
        const xpNeededForLevel = Math.max(1, nextLvlXp - currentLvlXp);

        const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForLevel);
        const percentNum = Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);

        const embed = new EmbedBuilder()
            .setColor('#00C851')
            .setTitle(`📊 Perfil de Rango - ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🏆 Posición', value: `#${rankPosition}`, inline: true },
                { name: '⭐ Nivel', value: `${userLevel.level}`, inline: true },
                { name: '💬 Mensajes', value: `${userLevel.totalMessages}`, inline: true },
                { name: '✨ Progreso de XP', value: `${xpInCurrentLevel.toLocaleString()} / ${xpNeededForLevel.toLocaleString()} XP (${percentNum}%)\n${progressBar}`, inline: false },
                { name: '🔮 XP Total Acumulado', value: `${userLevel.xp.toLocaleString()} XP`, inline: false }
            )
            .setFooter({ text: `Servidor: ${interaction.guild.name}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
