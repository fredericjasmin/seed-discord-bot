const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Economy = require('../../../models/Economy');

module.exports = {
    name: 'leaderboard',
    description: 'Shows the top 10 richest users on the server.',
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const leaderboard = await Economy.find({}).sort({ bank: -1 }).limit(10);

            if (leaderboard.length === 0) {
                return interaction.editReply('No data in the leaderboard yet.');
            }

                        const embed = new EmbedBuilder()
                .setTitle('🏆 Wealth Leaderboard')
                .setColor('#00FF00')
                .setTimestamp();

            let description = '';
            for (let i = 0; i < leaderboard.length; i++) {
                const user = await interaction.client.users.fetch(leaderboard[i]._id).catch(() => null);
                const username = user ? user.username : 'Unknown User';
                description += `${i + 1}. **${username}** - 🏦 ${leaderboard[i].bank.toLocaleString()} coins\n`;
            }
            
            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error generating leaderboard:', error);
            await interaction.editReply('There was an error trying to generate the leaderboard.');
        }
    }
};