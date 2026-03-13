const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Quita el silencio a un usuario.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario al que se le quitará el silencio.',
            required: true,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón para quitar el silencio.',
            required: false,
        },
    ],
    userPerms: ['ModerateMembers'],

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: 'No tienes permiso para quitar silencios a usuarios.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'No se encontró al usuario en este servidor.', ephemeral: true });
        }

        if (!targetMember.isCommunicationDisabled()) {
            return interaction.reply({ content: 'Este usuario no está silenciado.', ephemeral: true });
        }

        try {
            await targetMember.timeout(null, reason);

            const embed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for unmute
                .setTitle('Silencio Removido')
                .setDescription(`A **${targetUser.tag}** se le ha quitado el silencio.`)
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al quitar el silencio al usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar quitar el silencio al usuario.', ephemeral: true });
        }
    }
};
