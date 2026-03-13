const { PermissionsBitField } = require('discord.js');
const Guild = require('../../../models/Guild');
const { closeTicket } = require('../../../bot/utils/ticketUtils');

module.exports = {
    name: 'close',
    description: 'Cierra el ticket actual o un ticket específico.',
    options: [
        {
            name: 'canal',
            type: 7, // CHANNEL
            description: 'El canal del ticket a cerrar (por defecto, el canal actual).',
            required: false,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón para cerrar el ticket.',
            required: false,
        },
    ],
    userPerms: ['ManageChannels'],

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData || !guildData.config.tickets) {
            return interaction.reply({ content: "La configuración de tickets no se ha encontrado para este servidor.", ephemeral: true });
        }
        const ticketConfig = guildData.config.tickets;

        // Check if the channel is a ticket channel
        if (targetChannel.parentId !== ticketConfig.categoryId) {
            return interaction.reply({ content: 'Este comando solo puede usarse en un canal de ticket.', ephemeral: true });
        }

        // Check permissions
        const supportRole = interaction.guild.roles.cache.get(ticketConfig.supportRoleId);
        const hasPermission = interaction.member.roles.cache.has(supportRole.id) || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasPermission) {
            return interaction.reply({ content: "No tienes permisos para cerrar este ticket.", ephemeral: true });
        }

        await interaction.deferReply();

        await closeTicket(interaction, targetChannel, reason);
    }
};