const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Economy = require('../../../models/Economy');

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = [
    { name: 'A', value: 11 },
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 10 },
];

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const val of VALUES) {
            deck.push({ display: `${val.name}${suit}`, name: val.name, value: val.value });
        }
    }
    // Barajar
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function calculateHand(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        total += card.value;
        if (card.name === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function renderHand(hand, hideSecond = false) {
    if (hideSecond) {
        return `${hand[0].display} ❓`;
    }
    return hand.map(c => c.display).join(' ');
}

module.exports = {
    name: 'blackjack',
    description: 'Juega una partida interactiva de Blackjack contra la banca apostando monedas.',
    options: [
        {
            type: ApplicationCommandOptionType.Integer,
            name: 'apuesta',
            description: 'Cantidad de monedas que deseas apostar',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const bet = interaction.options.getInteger('apuesta');
        if (bet <= 0) {
            return interaction.reply({ content: '❌ La cantidad de apuesta debe ser mayor a 0.', ephemeral: true });
        }

        let userData = await Economy.findById(interaction.user.id);
        if (!userData || userData.coins < bet) {
            return interaction.reply({
                content: `❌ No tienes suficientes monedas. Tu saldo actual es de **${userData ? userData.coins.toLocaleString() : 0}** monedas.`,
                ephemeral: true
            });
        }

        // Deducir apuesta temporalmente
        userData.coins -= bet;
        await userData.save();

        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const playerScore = calculateHand(playerHand);
        const dealerScore = calculateHand(dealerHand);

        // Comprobar Blackjack instantáneo
        if (playerScore === 21) {
            if (dealerScore === 21) {
                // Empate
                userData.coins += bet;
                await userData.save();
                const tieEmbed = new EmbedBuilder()
                    .setColor('#ffbb33')
                    .setTitle('🃏 Blackjack - ¡Empate!')
                    .setDescription(`Ambos obtuvieron Blackjack (21).\n\n**Tus cartas:** ${renderHand(playerHand)} (21)\n**Banca:** ${renderHand(dealerHand)} (21)\n\nSe te ha devuelto tu apuesta de **${bet.toLocaleString()}** monedas.`)
                    .setFooter({ text: `Saldo final: ${userData.coins.toLocaleString()} monedas` });
                return interaction.reply({ embeds: [tieEmbed] });
            } else {
                // Victoria con Blackjack (1.5x ganancia)
                const winAmount = Math.floor(bet * 2.5);
                userData.coins += winAmount;
                await userData.save();
                const bjEmbed = new EmbedBuilder()
                    .setColor('#00C851')
                    .setTitle('🃏 ¡BLACKJACK! 🎉')
                    .setDescription(`¡Obtuviste 21 en el reparto inicial!\n\n**Tus cartas:** ${renderHand(playerHand)} (21)\n**Banca:** ${renderHand(dealerHand)} (${dealerScore})\n\n¡Has ganado **${(winAmount - bet).toLocaleString()}** monedas de beneficio!`)
                    .setFooter({ text: `Saldo final: ${userData.coins.toLocaleString()} monedas` });
                return interaction.reply({ embeds: [bjEmbed] });
            }
        }

        const buildGameEmbed = (inProgress = true, statusMessage = '') => {
            const pScore = calculateHand(playerHand);
            const dScore = inProgress ? '?' : calculateHand(dealerHand);
            const dHand = renderHand(dealerHand, inProgress);
            const pHand = renderHand(playerHand);

            const embed = new EmbedBuilder()
                .setTitle('🃏 Mesa de Blackjack')
                .setColor(inProgress ? '#33b5e5' : statusMessage.includes('ganado') ? '#00C851' : statusMessage.includes('Empate') ? '#ffbb33' : '#ff4444')
                .addFields(
                    { name: `🏛️ Banca (${dScore})`, value: dHand, inline: false },
                    { name: `👤 ${interaction.user.username} (${pScore})`, value: pHand, inline: false },
                    { name: '💰 Apuesta', value: `${bet.toLocaleString()} monedas`, inline: true }
                );

            if (statusMessage) {
                embed.setDescription(`### ${statusMessage}`);
            }

            return embed;
        };

        const buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('bj-hit')
                .setLabel('Pedir Carta (Hit)')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('bj-stand')
                .setLabel('Plantarse (Stand)')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🛑')
        );

        const replyMessage = await interaction.reply({
            embeds: [buildGameEmbed(true, '¿Deseas pedir carta o plantarte?')],
            components: [buttonsRow],
            fetchReply: true
        });

        const collector = replyMessage.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'bj-hit') {
                playerHand.push(deck.pop());
                const currentScore = calculateHand(playerHand);

                if (currentScore > 21) {
                    // Se pasó (Bust)
                    collector.stop('bust');
                    await i.update({
                        embeds: [buildGameEmbed(false, '💥 ¡Te has pasado de 21! Has perdido la partida.')],
                        components: []
                    });
                } else if (currentScore === 21) {
                    // Automáticamente pasar a resolver dealer
                    collector.stop('stand');
                    await finishDealerTurn(i);
                } else {
                    await i.update({
                        embeds: [buildGameEmbed(true, 'Has pedido una carta.')],
                        components: [buttonsRow]
                    });
                }
            } else if (i.customId === 'bj-stand') {
                collector.stop('stand');
                await finishDealerTurn(i);
            }
        });

        async function finishDealerTurn(i) {
            let dScore = calculateHand(dealerHand);
            while (dScore < 17) {
                dealerHand.push(deck.pop());
                dScore = calculateHand(dealerHand);
            }

            const pScore = calculateHand(playerHand);
            let finalStatus = '';
            let newBalance = userData.coins;

            if (dScore > 21) {
                // Banca se pasa -> Gana jugador (2x apuesta total)
                const winAmount = bet * 2;
                newBalance += winAmount;
                finalStatus = `🎉 ¡La banca se ha pasado con ${dScore}! Has ganado **${bet.toLocaleString()}** monedas.`;
            } else if (pScore > dScore) {
                // Jugador mayor que banca -> Gana jugador
                const winAmount = bet * 2;
                newBalance += winAmount;
                finalStatus = `🎉 ¡Has ganado! Tu puntuación (${pScore}) supera a la de la banca (${dScore}). (+${bet.toLocaleString()} monedas)`;
            } else if (pScore === dScore) {
                // Empate -> Recupera apuesta
                newBalance += bet;
                finalStatus = `🤝 ¡Empate a ${pScore}! Se te ha devuelto tu apuesta de ${bet.toLocaleString()} monedas.`;
            } else {
                // Pierde
                finalStatus = `❌ Has perdido. La banca (${dScore}) supera tu puntuación (${pScore}).`;
            }

            await Economy.findByIdAndUpdate(interaction.user.id, { coins: newBalance });

            const finalEmbed = buildGameEmbed(false, finalStatus);
            finalEmbed.setFooter({ text: `Nuevo saldo: ${newBalance.toLocaleString()} monedas` });

            await i.update({
                embeds: [finalEmbed],
                components: []
            });
        }

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await replyMessage.edit({
                    components: [],
                    content: '⏰ La partida de Blackjack ha expirado por inactividad.'
                }).catch(() => {});
            }
        });
    },
};
