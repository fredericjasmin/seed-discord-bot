const { SlashCommandBuilder } = require('discord.js');
const Giveaway = require('../../../models/Giveaway');

module.exports = {
    name: 'giveaway',
    description: 'Crea un sorteo en el canal actual',
    type: 1,
    options: [
        {
            name: 'prize',
            description: 'Premio del sorteo',
            type: 3,
            required: true
        },
        {
            name: 'winners',
            description: 'Cantidad de ganadores',
            type: 4,
            required: true
        },
        {
            name: 'duration',
            description: 'Duración (ej: 10m, 2h, 1d)',
            type: 3,
            required: true
        }
    ],
    async execute(interaction) {
        const prize = interaction.options.getString('prize');
        const winners = interaction.options.getInteger('winners');
        const durationInput = interaction.options.getString('duration');
        const channelId = interaction.channel.id;
        const guildId = interaction.guild.id;
        const createdBy = interaction.user.id;

        // Parse duration (e.g., 10m, 2h, 1d)
        const regex = /^(\d+)([mhd])$/i;
        const match = durationInput.match(regex);
        if (!match) {
            return interaction.reply({ content: 'Formato de duración inválido. Usa 10m, 2h o 1d.', ephemeral: true });
        }
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let durationMs = 0;
        if (unit === 'm') durationMs = value * 60 * 1000;
        else if (unit === 'h') durationMs = value * 60 * 60 * 1000;
        else if (unit === 'd') durationMs = value * 24 * 60 * 60 * 1000;
        else durationMs = value * 60 * 1000;
        const endAt = new Date(Date.now() + durationMs);

        const giveaway = new Giveaway({
            guildId,
            channelId,
            prize,
            winners,
            endAt,
            createdBy
        });
        await giveaway.save();
        await interaction.reply({ content: `🎉 Sorteo creado para **${prize}**. Será anunciado en este canal.`, ephemeral: false });
    }
};
