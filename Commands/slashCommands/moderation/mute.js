const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Silencia a un usuario en los canales de texto.',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario a silenciar.',
            required: true,
        },
        {
            name: 'tiempo',
            type: 3, // STRING
            description: 'Duración del silencio (ej. 1h, 30m, 1d).',
            required: true,
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón del silencio.',
            required: false,
        },
    ],
    userPerms: ['ModerateMembers'], // Requires ModerateMembers permission to mute

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const duration = interaction.options.getString('tiempo');
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        // Ensure the command executor has permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: 'No tienes permiso para silenciar usuarios.', ephemeral: true });
        }

        // Prevent muting oneself
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: 'No puedes silenciarte a ti mismo.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'No se encontró al usuario en este servidor.', ephemeral: true });
        }

        // Prevent muting higher roles or bot itself
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'No puedes silenciar a un usuario con un rol igual o superior al tuyo.', ephemeral: true });
        }
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({ content: 'No puedes silenciar al bot.', ephemeral: true });
        }

        const muteDuration = ms(duration);

        if (!muteDuration || muteDuration < 10000 || muteDuration > 2419200000) { // Min 10s, Max 28 days
            return interaction.reply({ content: 'Por favor, proporciona una duración válida para el silencio (mínimo 10 segundos, máximo 28 días).', ephemeral: true });
        }

        try {
            await targetMember.timeout(muteDuration, reason);

            const embed = new EmbedBuilder()
                .setColor('#FFD700') // Gold color for mute
                .setTitle('Usuario Silenciado')
                .setDescription(`**${targetUser.tag}** ha sido silenciado por **${ms(muteDuration, { long: true })}**.`)
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al silenciar al usuario:', error);
            await interaction.reply({ content: 'Hubo un error al intentar silenciar al usuario.', ephemeral: true });
        }
    }
};