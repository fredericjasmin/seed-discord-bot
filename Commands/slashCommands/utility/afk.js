const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Afk = require('../../../models/Afk');

module.exports = {
    name: 'afk',
    description: '[💤 UTILITY] Establece tu estado como ausente (AFK) con un motivo personalizado.',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'motivo',
            description: 'Motivo por el que estarás ausente (opcional)',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        const reason = interaction.options.getString('motivo') || 'AFK (Ausente)';

        await Afk.findOneAndUpdate(
            { guildId: interaction.guild.id, userId: interaction.user.id },
            {
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                reason: reason,
                timestamp: new Date()
            },
            { upsert: true, new: true }
        );

        const embed = new EmbedBuilder()
            .setColor('#ffbb33')
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`💤 ¡Ahora estás **AFK**!\n**Motivo:** *${reason}*\n\n*Avisaré a quien te mencione y removeré tu estado cuando vuelvas a escribir.*`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
