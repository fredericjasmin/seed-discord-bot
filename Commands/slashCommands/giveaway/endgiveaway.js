const Giveaway = require('../../../models/Giveaway');

module.exports = {
    name: 'endgiveaway',
    description: 'Finaliza un sorteo activo por ID de mensaje',
    type: 1,
    options: [
        {
            name: 'messageid',
            description: 'ID del mensaje del sorteo',
            type: 3,
            required: true
        }
    ],
    async execute(interaction) {
        const messageId = interaction.options.getString('messageid');
        const guildId = interaction.guild.id;
        const giveaway = await Giveaway.findOne({ guildId, messageId, ended: false });
        if (!giveaway) {
            return interaction.reply({ content: 'No se encontró un sorteo activo con ese ID de mensaje.', ephemeral: true });
        }
        giveaway.ended = true;
        await giveaway.save();
            await interaction.reply({ content: `El sorteo con mensaje ID \`${messageId}\` ha sido finalizado.`, ephemeral: false });
    }
};
