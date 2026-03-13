const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'remove',
    description: 'Remueve un usuario del ticket actual.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a remover del ticket.',
            required: true,
        },
    ],
    userPerms: ['ManageChannels'],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData || !guildData.config.tickets) {
            return interaction.reply({ content: "La configuración de tickets no se ha encontrado para este servidor.", ephemeral: true });
        }
        const ticketConfig = guildData.config.tickets;

        // Check if the channel is a ticket channel
        if (interaction.channel.parentId !== ticketConfig.categoryId) {
            return interaction.reply({ content: 'Este comando solo puede usarse en un canal de ticket.', ephemeral: true });
        }

        // Check permissions
        const supportRole = interaction.guild.roles.cache.get(ticketConfig.supportRoleId);
        const hasPermission = interaction.member.roles.cache.has(supportRole.id) || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasPermission) {
            return interaction.reply({ content: "No tienes permisos para remover usuarios de este ticket.", ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.delete(targetUser.id);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`**${targetUser.tag}** ha sido removido del ticket por **${interaction.user.tag}**.`);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al remover usuario del ticket:', error);
            await interaction.reply({ content: 'Hubo un error al intentar remover al usuario del ticket.', ephemeral: true });
        }
    }
};
