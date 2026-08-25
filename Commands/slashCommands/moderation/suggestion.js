const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Suggestion = require('../../../models/Suggestion');

module.exports = {
    name: 'suggestion',
    description: '[🛡️ MODERATION] Responde, aprueba o rechaza una sugerencia del servidor.',
    userPerms: 'ManageGuild',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'id',
            description: 'ID del mensaje de la sugerencia',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'estado',
            description: 'Nuevo estado para la sugerencia',
            required: true,
            choices: [
                { name: 'Aprobar', value: 'approved' },
                { name: 'Rechazar', value: 'rejected' },
                { name: 'Implementada', value: 'implemented' },
            ]
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'comentario',
            description: 'Razón o comentario del equipo de administración',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: '❌ Necesitas permisos de Gestionar Servidor para usar este comando.', ephemeral: true });
        }

        const messageId = interaction.options.getString('id').trim();
        const status = interaction.options.getString('estado');
        const comment = interaction.options.getString('comentario') || 'Sin comentario adicional.';

        const suggestion = await Suggestion.findOne({ guildId: interaction.guild.id, messageId: messageId });
        if (!suggestion) {
            return interaction.reply({ content: '❌ No se encontró ninguna sugerencia con ese ID de mensaje.', ephemeral: true });
        }

        suggestion.status = status;
        suggestion.staffComment = comment;
        suggestion.staffUserId = interaction.user.id;
        await suggestion.save();

        const channel = interaction.guild.channels.cache.get(suggestion.channelId);
        if (channel) {
            try {
                const targetMsg = await channel.messages.fetch(messageId);
                if (targetMsg) {
                    const originalEmbed = targetMsg.embeds[0];
                    if (originalEmbed) {
                        const updatedEmbed = EmbedBuilder.from(originalEmbed);

                        let color = '#33b5e5';
                        let statusText = '⏳ Pendiente';

                        if (status === 'approved') {
                            color = '#00C851';
                            statusText = '✅ **Aprobada**';
                        } else if (status === 'rejected') {
                            color = '#ff4444';
                            statusText = '❌ **Rechazada**';
                        } else if (status === 'implemented') {
                            color = '#aa66cc';
                            statusText = '🎉 **Implementada**';
                        }

                        updatedEmbed.setColor(color);

                        // Actualizar campos
                        const fields = (originalEmbed.fields || []).filter(f => f.name !== '📌 Estado' && f.name !== '💬 Respuesta del Staff');
                        fields.unshift({ name: '📌 Estado', value: statusText, inline: true });
                        fields.push({ name: '💬 Respuesta del Staff', value: `**Por:** ${interaction.user}\n**Nota:** ${comment}`, inline: false });

                        updatedEmbed.setFields(fields);

                        // Dejar botones deshabilitados
                        const disabledRow = targetMsg.components[0] ? targetMsg.components[0] : null;

                        await targetMsg.edit({ embeds: [updatedEmbed], components: disabledRow ? [disabledRow] : [] });
                    }
                }
            } catch (err) {
                console.error('[Suggestion] Error updating suggestion message:', err);
            }
        }

        // Notificar al autor si es posible
        try {
            const author = await client.users.fetch(suggestion.userId);
            if (author) {
                const dmEmbed = new EmbedBuilder()
                    .setColor(status === 'approved' ? '#00C851' : status === 'rejected' ? '#ff4444' : '#aa66cc')
                    .setTitle(`Actualización de tu sugerencia en ${interaction.guild.name}`)
                    .setDescription(`Tu sugerencia: *"${suggestion.suggestion}"*\n\nHa sido marcada como: **${status.toUpperCase()}**\n**Comentario:** ${comment}`)
                    .setTimestamp();

                await author.send({ embeds: [dmEmbed] }).catch(() => {});
            }
        } catch {}

        await interaction.reply({ content: `✅ La sugerencia \`${messageId}\` ha sido actualizada a **${status}**.` });
    },
};
