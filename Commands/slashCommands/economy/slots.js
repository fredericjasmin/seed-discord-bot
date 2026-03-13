const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');

module.exports = {
    name: 'slots',
    description: 'Play the slot machine and bet your coins.',
    options: [
        {
            name: 'bet',
            type: 4, // INTEGER
            description: 'The amount of coins you want to bet.',
            required: true,
            min_value: 10
        }
    ],

    async execute(interaction) {
        const bet = interaction.options.getInteger('bet');

        const economyUser = await Economy.findById(interaction.user.id);

        if (!economyUser || economyUser.coins < bet) {
            return interaction.reply({ content: 'You do not have enough coins to make that bet.', ephemeral: true });
        }

        const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎'];
        const result = [];
        for (let i = 0; i < 3; i++) {
            result.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }

        const embed = new EmbedBuilder()
            .setTitle('🎰 Slot Machine 🎰')
            .setDescription(`[ ${result.join(' | ')} ]`)
            .setTimestamp();

        let winnings = 0;
        if (result[0] === result[1] && result[1] === result[2]) {
            // Triple match
            winnings = bet * 5;
            economyUser.coins += winnings;
            embed.setColor('#00FF00').setFooter({ text: `JACKPOT! You won ${winnings.toLocaleString()} coins.` });
        } else if (result[0] === result[1] || result[1] === result[2]) {
            // Double match
            winnings = bet * 2;
            economyUser.coins += winnings;
            embed.setColor('#FFFF00').setFooter({ text: `Double! You won ${winnings.toLocaleString()} coins.` });
        } else {
            // No match
            economyUser.coins -= bet;
            embed.setColor('#FF0000').setFooter({ text: `You lost ${bet.toLocaleString()} coins.` });
        }

        await economyUser.save();
        embed.setDescription(`[ ${result.join(' | ')} ]\nYour new balance is ${economyUser.coins.toLocaleString()} coins.`);

        await interaction.reply({ embeds: [embed] });
    }
};