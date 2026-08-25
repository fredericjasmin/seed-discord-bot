const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Economy = require('../../../models/Economy');

module.exports = {
    name: 'trade',
    description: 'Transfiere monedas de forma interactiva y segura a otro usuario.',
    options: [
        {
            type: ApplicationCommandOptionType.User,
            name: 'usuario',
            description: 'Usuario con el que deseas comerciar',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'monedas',
            description: 'Cantidad de monedas a transferir',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario');
        const amount = interaction.options.getInteger('monedas');

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes comerciar contigo mismo.', ephemeral: true });
        }

        if (targetUser.bot) {
            return interaction.reply({ content: '❌ No puedes comerciar con un bot.', ephemeral: true });
        }

        if (amount <= 0) {
            return interaction.reply({ content: '❌ La cantidad de monedas debe ser mayor a 0.', ephemeral: true });
        }

        let senderData = await Economy.findById(interaction.user.id);
        if (!senderData || senderData.coins < amount) {
            return interaction.reply({
                content: `❌ No tienes suficientes monedas para realizar esta transferencia. Tienes **${senderData ? senderData.coins.toLocaleString() : 0}** monedas.`,
                ephemeral: true
            });
        }

        const tradeEmbed = new EmbedBuilder()
            .setColor('#33b5e5')
            .setTitle('🤝 Propuesta de Comercio')
            .setDescription(`**${interaction.user.username}** desea transferir **${amount.toLocaleString()}** monedas a **${targetUser.username}**.\n\n${targetUser}, ¿aceptas recibir esta transferencia?`)
            .setFooter({ text: 'Esta solicitud expirará en 60 segundos.' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('trade-accept')
                .setLabel('Aceptar Transferencia')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
            new ButtonBuilder()
                .setCustomId('trade-decline')
                .setLabel('Rechazar')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

        const replyMsg = await interaction.reply({
            content: `${targetUser}`,
            embeds: [tradeEmbed],
            components: [row],
            fetchReply: true
        });

        const collector = replyMsg.createMessageComponentCollector({
            filter: i => [interaction.user.id, targetUser.id].includes(i.user.id),
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.user.id !== targetUser.id) {
                return i.reply({ content: '❌ Solo el destinatario puede aceptar o rechazar esta solicitud.', ephemeral: true });
            }

            if (i.customId === 'trade-accept') {
                collector.stop('accepted');

                // Re-verificar saldo del emisor por seguridad
                let currentSender = await Economy.findById(interaction.user.id);
                if (!currentSender || currentSender.coins < amount) {
                    return i.update({
                        content: null,
                        embeds: [new EmbedBuilder().setColor('#ff4444').setDescription('❌ El emisor ya no cuenta con el saldo suficiente para completar la transacción.')],
                        components: []
                    });
                }

                let currentReceiver = await Economy.findById(targetUser.id);
                if (!currentReceiver) {
                    currentReceiver = new Economy({ _id: targetUser.id });
                }

                currentSender.coins -= amount;
                currentReceiver.coins += amount;

                await currentSender.save();
                await currentReceiver.save();

                const successEmbed = new EmbedBuilder()
                    .setColor('#00C851')
                    .setTitle('✅ Comercio Completado')
                    .setDescription(`¡La transferencia de **${amount.toLocaleString()}** monedas de ${interaction.user} a ${targetUser} ha sido exitosa!`)
                    .setTimestamp();

                await i.update({
                    content: null,
                    embeds: [successEmbed],
                    components: []
                });

            } else if (i.customId === 'trade-decline') {
                collector.stop('declined');
                await i.update({
                    content: null,
                    embeds: [new EmbedBuilder().setColor('#ff4444').setDescription(`❌ ${targetUser} ha rechazado la propuesta de comercio.`)],
                    components: []
                });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await replyMsg.edit({
                    components: [],
                    embeds: [new EmbedBuilder().setColor('#757575').setDescription('⏰ La propuesta de comercio ha expirado.')]
                }).catch(() => {});
            }
        });
    },
};
