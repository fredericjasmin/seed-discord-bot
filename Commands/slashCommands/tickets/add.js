const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'add',
    description: 'Añade un usuario al ticket actual.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a añadir al ticket.',
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
            return interaction.reply({ content: "No tienes permisos para añadir usuarios a este ticket.", ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(targetUser.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`**${targetUser.tag}** ha sido añadido al ticket por **${interaction.user.tag}**.`);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al añadir usuario al ticket:', error);
            await interaction.reply({ content: 'Hubo un error al intentar añadir al usuario al ticket.', ephemeral: true });
        }
    }
};
