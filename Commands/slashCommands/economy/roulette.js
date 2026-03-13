const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');

module.exports = {
    name: 'roulette',
    description: 'Play roulette and risk your money.',
    options: [
        {
            name: 'color',
            type: 3, // STRING
            description: 'Choose a color (red, black)',
            required: true,
            choices: [
                { name: 'Red', value: 'red' },
                { name: 'Black', value: 'black' },
            ]
        },
        {
            name: 'amount',
            type: 4, // INTEGER
            description: 'The amount of coins you want to bet.',
            required: true,
            min_value: 10
        }
    ],

    async execute(interaction) {
        const color = interaction.options.getString('color');
        const amount = interaction.options.getInteger('amount');

        const economyUser = await Economy.findById(interaction.user.id);

        if (!economyUser || economyUser.coins < amount) {
            return interaction.reply({ content: 'You do not have enough coins to make that bet.', ephemeral: true });
        }

        // Simple roulette logic
        const winningColor = Math.random() < 0.48 ? 'red' : 'black'; // Slightly less than 50% to give house edge
        const hasWon = color === winningColor;

        const embed = new EmbedBuilder()
            .setTitle('🎰 Roulette 🎰');

        if (hasWon) {
            economyUser.coins += amount;
            await economyUser.save();
            embed.setColor('#00FF00')
                 .setDescription(`The ball landed on **${winningColor}**! You won **${amount.toLocaleString()}** coins.\nYour new balance is ${economyUser.coins.toLocaleString()} coins.`);
        } else {
            economyUser.coins -= amount;
            await economyUser.save();
            embed.setColor('#FF0000')
                 .setDescription(`The ball landed on **${winningColor}**. You lost **${amount.toLocaleString()}** coins.\nYour new balance is ${economyUser.coins.toLocaleString()} coins.`);
        }

        await interaction.reply({ embeds: [embed] });
    }
};

