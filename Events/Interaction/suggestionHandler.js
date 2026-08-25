const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Suggestion = require('../../models/Suggestion');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!interaction.guild || !interaction.member) return;

        const { customId, message, user } = interaction;
        if (!['suggest-upvote', 'suggest-downvote'].includes(customId)) return;

        try {
            const suggestion = await Suggestion.findOne({ messageId: message.id });
            if (!suggestion) {
                return interaction.reply({ content: 'No se encontró el registro de esta sugerencia en la base de datos.', ephemeral: true });
            }

            if (suggestion.status !== 'pending') {
                return interaction.reply({ content: `Esta sugerencia ya fue marcada como **${suggestion.status}** y las votaciones están cerradas.`, ephemeral: true });
            }

            let upvotes = suggestion.upvotes || [];
            let downvotes = suggestion.downvotes || [];
            let messageReply = '';

            if (customId === 'suggest-upvote') {
                if (upvotes.includes(user.id)) {
                    // Quitar voto a favor
                    upvotes = upvotes.filter(id => id !== user.id);
                    messageReply = 'Has retirado tu voto a favor (👍).';
                } else {
                    // Agregar voto a favor y quitar en contra si existía
                    upvotes.push(user.id);
                    downvotes = downvotes.filter(id => id !== user.id);
                    messageReply = '¡Has votado a favor (👍) de esta sugerencia!';
                }
            } else if (customId === 'suggest-downvote') {
                if (downvotes.includes(user.id)) {
                    // Quitar voto en contra
                    downvotes = downvotes.filter(id => id !== user.id);
                    messageReply = 'Has retirado tu voto en contra (👎).';
                } else {
                    // Agregar voto en contra y quitar a favor si existía
                    downvotes.push(user.id);
                    upvotes = upvotes.filter(id => id !== user.id);
                    messageReply = '¡Has votado en contra (👎) de esta sugerencia!';
                }
            }

            suggestion.upvotes = upvotes;
            suggestion.downvotes = downvotes;
            await suggestion.save();

            // Reconstruir embed existente con nuevos contadores
            const originalEmbed = message.embeds[0];
            if (originalEmbed) {
                const updatedEmbed = EmbedBuilder.from(originalEmbed);
                
                // Actualizar campo de votos o descripción
                const totalUp = upvotes.length;
                const totalDown = downvotes.length;
                
                // Buscar si hay campo de votos o añadirlo
                const fields = (originalEmbed.fields || []).filter(f => f.name !== '📊 Resultados');
                fields.push({
                    name: '📊 Votos',
                    value: `👍 **${totalUp}** a favor | 👎 **${totalDown}** en contra`,
                    inline: false
                });

                updatedEmbed.setFields(fields);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('suggest-upvote')
                        .setLabel(`👍 (${totalUp})`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('suggest-downvote')
                        .setLabel(`👎 (${totalDown})`)
                        .setStyle(ButtonStyle.Danger)
                );

                await message.edit({ embeds: [updatedEmbed], components: [row] });
            }

            await interaction.reply({ content: messageReply, ephemeral: true });

        } catch (error) {
            console.error('[Suggestion] Error processing vote interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Ocurrió un error al procesar tu voto.', ephemeral: true });
            }
        }
    }
};
