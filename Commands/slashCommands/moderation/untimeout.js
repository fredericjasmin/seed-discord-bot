const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'untimeout',
    description: 'Remueve el aislamiento temporal (Timeout) de un miembro.',
    userPerms: 'ModerateMembers',
    botPerms: 'ModerateMembers',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'usuario',
            description: 'Usuario al que deseas remover el aislamiento',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'razon',
            description: 'Razón para remover el aislamiento',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: '❌ No tienes permisos para gestionar aislamientos (ModerateMembers).', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'Remoción de aislamiento por moderador.';

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ No se pudo encontrar a este usuario en el servidor.', ephemeral: true });
        }

        if (!targetMember.communicationDisabledUntilTimestamp || targetMember.communicationDisabledUntilTimestamp < Date.now()) {
            return interaction.reply({ content: '❌ Este usuario no tiene ningún aislamiento temporal activo.', ephemeral: true });
        }

        try {
            await targetMember.timeout(null, `${reason} - Moderador: ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor('#00C851')
                .setTitle('🔓 Aislamiento Removido')
                .setDescription(`Se ha levantado el aislamiento temporal a **${targetUser.tag}**.`)
                .addFields(
                    { name: '👤 Usuario', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
                    { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
                    { name: '📝 Razón', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[Untimeout] Error removing timeout:', error);
            await interaction.reply({ content: '❌ Ocurrió un error al intentar remover el aislamiento.', ephemeral: true });
        }
    },
};
