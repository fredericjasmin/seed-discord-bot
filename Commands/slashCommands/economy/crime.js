const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');

module.exports = {
    name: 'crime',
    description: 'Attempt a crime to earn or lose money.',
    
    async execute(interaction) {
        await interaction.deferReply();

        const economyUser = await Economy.findById(interaction.user.id);

        if (!economyUser) {
            return interaction.editReply('You do not have an economy account. Use `/balance` to create one.');
        }

        const minGain = 100;
        const maxGain = 500;
        const minLoss = 50;
        const maxLoss = 200;

        const success = Math.random() > 0.4; // 60% chance of success

        const embed = new EmbedBuilder()
            .setTitle('🚨 Committing a Crime! 🚨')
            .setTimestamp();

        if (success) {
            const gain = Math.floor(Math.random() * (maxGain - minGain + 1)) + minGain;
            economyUser.coins += gain;
            await economyUser.save();
            embed.setColor('#00FF00')
                 .setDescription(`You succeeded! You escaped with **${gain.toLocaleString()}** coins.\nYour new balance is ${economyUser.coins.toLocaleString()} coins.`);
        } else {
            const loss = Math.floor(Math.random() * (maxLoss - minLoss + 1)) + minLoss;
            economyUser.coins -= loss;
            if (economyUser.coins < 0) economyUser.coins = 0; // Prevent negative balance
            await economyUser.save();
            embed.setColor('#FF0000')
                 .setDescription(`You were caught! You lost **${loss.toLocaleString()}** coins.\nYour new balance is ${economyUser.coins.toLocaleString()} coins.`);
        }

        await interaction.editReply({ embeds: [embed] });
    }
};