const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Guild = require('../../../models/Guild');
const Suggestion = require('../../../models/Suggestion');

module.exports = {
    name: 'suggest',
    description: '[💡 UTILITY] Envía una sugerencia para mejorar el servidor con votación comunitaria.',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'idea',
            description: 'Escribe tu sugerencia de manera clara y detallada',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const idea = interaction.options.getString('idea');

        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        const suggestionsConfig = guildData?.config?.suggestions;

        if (!suggestionsConfig || !suggestionsConfig.enabled || !suggestionsConfig.channelId) {
            return interaction.reply({
                content: '❌ El sistema de sugerencias no está configurado o habilitado en este servidor. Pide a un administrador que lo active en el Dashboard.',
                ephemeral: true
            });
        }

        const channel = interaction.guild.channels.cache.get(suggestionsConfig.channelId);
        if (!channel || !channel.isTextBased || !channel.isTextBased()) {
            return interaction.reply({
                content: '❌ El canal de sugerencias configurado no es válido o no tengo permisos para acceder.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#33b5e5')
            .setAuthor({ name: `Sugerencia de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(idea)
            .addFields(
                { name: '📌 Estado', value: '⏳ **Pendiente de revisión**', inline: true },
                { name: '📊 Votos', value: '👍 **0** a favor | 👎 **0** en contra', inline: false }
            )
            .setFooter({ text: `Autor ID: ${interaction.user.id}` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('suggest-upvote')
                .setLabel('👍 (0)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('suggest-downvote')
                .setLabel('👎 (0)')
                .setStyle(ButtonStyle.Danger)
        );

        try {
            const sentMsg = await channel.send({ embeds: [embed], components: [row] });

            // Guardar en la base de datos
            const newSuggestion = new Suggestion({
                guildId: interaction.guild.id,
                channelId: channel.id,
                messageId: sentMsg.id,
                userId: interaction.user.id,
                suggestion: idea,
                status: 'pending',
                upvotes: [],
                downvotes: []
            });

            await newSuggestion.save();

            await interaction.editReply({ content: `✅ ¡Tu sugerencia ha sido publicada exitosamente en ${channel}! ID: \`${sentMsg.id}\`` });

        } catch (error) {
            console.error('[Suggest] Error sending suggestion:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al enviar tu sugerencia.' });
        }
    },
};
