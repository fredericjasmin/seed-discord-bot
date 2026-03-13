const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'softban',
    description: 'Expulsa a un usuario y elimina sus mensajes recientes.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a expulsar.',
            required: true,
        },
        {
            name: 'dias',
            type: 4, // INTEGER
            description: 'Número de días de mensajes a eliminar (0-7).',
            required: false,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón de la expulsión.',
            required: false,
        },
    ],
    userPerms: ['KickMembers'], // Requires KickMembers permission

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const deleteDays = interaction.options.getInteger('dias') || 0;
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'No tienes permiso para expulsar usuarios.', ephemeral: true });
        }

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: 'No puedes expulsarte a ti mismo.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'No se encontró al usuario en este servidor.', ephemeral: true });
        }

        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes expulsar a un usuario con un rol igual o superior al tuyo.', ephemeral: true });
        }
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({ content: 'No puedes expulsar al bot.', ephemeral: true });
        }

        if (deleteDays < 0 || deleteDays > 7) {
            return interaction.reply({ content: 'El número de días a eliminar debe estar entre 0 y 7.', ephemeral: true });
        }

        try {
            await targetMember.ban({ days: deleteDays, reason: reason });
            await interaction.guild.members.unban(targetUser.id, 'Softban: Unbanned after kick');

            const embed = new EmbedBuilder()
                .setColor('#FFA500') // Orange color for softban
                .setTitle('Usuario Expulsado (Softban)')
                .setDescription(`**${targetUser.tag}** ha sido expulsado y sus mensajes de los últimos ${deleteDays} días han sido eliminados.`)
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al realizar softban:', error);
            await interaction.reply({ content: 'Hubo un error al intentar realizar el softban.', ephemeral: true });
        }
    }
};
