const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'coinflip',
    description: 'Flip a coin.',

    async execute(interaction) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🪙 Coin Flip')
            .setDescription(`The coin landed on: **${result}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
