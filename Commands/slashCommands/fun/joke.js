const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'joke',
    description: 'Get a random joke.',

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://v2.jokeapi.dev/joke/Any?lang=en&blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
            const data = await response.json();

            if (!data || data.error) {
                return interaction.editReply('Could not fetch a joke. Please try again later.');
            }

            let jokeText;
            if (data.type === 'single') {
                jokeText = data.joke;
            } else if (data.type === 'twopart') {
                jokeText = `${data.setup}\n\n${data.delivery}`;
            }

            const embed = new EmbedBuilder()
                .setColor('#FFD700') // Gold color for jokes
                .setTitle('Random Joke')
                .setDescription(jokeText)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching joke:', error);
            await interaction.editReply('There was an error trying to fetch a joke.');
        }
    }
};