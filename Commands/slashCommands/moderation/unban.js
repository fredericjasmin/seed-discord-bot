const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Desbanea a un usuario del servidor.',
    options: [
        {
            name: 'userid',
            type: 3, // STRING
            description: 'El ID del usuario a desbanear.',
            required: true,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón del desbaneo.',
            required: false,
        },
    ],
    userPerms: ['BanMembers'],

    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'No tienes permiso para desbanear usuarios.', ephemeral: true });
        }

        try {
            const bannedUsers = await interaction.guild.bans.fetch();
            const bannedUser = bannedUsers.find(user => user.user.id === userId);

            if (!bannedUser) {
                return interaction.reply({ content: 'Este usuario no está baneado.', ephemeral: true });
            }

            await interaction.guild.members.unban(userId, reason);

            const embed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for unban
                .setTitle('Usuario Desbaneado')
                .setDescription(`El usuario con ID **${userId}** ha sido desbaneado.`)
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al desbanear al usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar desbanear al usuario. Asegúrate de que el ID es correcto.', ephemeral: true });
        }
    }
};
