const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'fact',
    description: 'Get a random fun fact.',

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('http://numbersapi.com/random/trivia');
            const fact = await response.text();

            if (!fact) {
                return interaction.editReply('Could not fetch a fun fact. Please try again later.');
            }

            const embed = new EmbedBuilder()
                .setColor('#8A2BE2') // Blue Violet
                .setTitle('Random Fun Fact')
                .setDescription(fact)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching fun fact:', error);
            await interaction.editReply('There was an error trying to fetch a fun fact.');
        }
    }
};
