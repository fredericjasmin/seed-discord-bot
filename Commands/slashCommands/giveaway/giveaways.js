const Giveaway = require('../../../models/Giveaway');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'giveaways',
    description: 'Muestra los sorteos activos en el servidor',
    type: 1,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const giveaways = await Giveaway.find({ guildId, ended: false, messageId: { $exists: true } });
        if (!giveaways.length) {
            return interaction.reply({ content: 'No hay sorteos activos en este servidor.', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setTitle('🎉 Sorteos Activos')
            .setColor('#FFD700');
        giveaways.forEach(gw => {
            embed.addFields({
                name: gw.prize,
                value: `Canal: <#${gw.channelId}>\nFinaliza: <t:${Math.floor(gw.endAt.getTime()/1000)}:R>\nGanadores: **${gw.winners}**\nMensaje: [Ir al sorteo](https://discord.com/channels/${guildId}/${gw.channelId}/${gw.messageId})`,
                inline: false
            });
        });
        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
};
