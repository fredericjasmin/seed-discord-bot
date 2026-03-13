const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'define',
    description: 'Get the definition of a word.',
    options: [
        {
            name: 'word',
            type: 3, // STRING
            description: 'The word to define.',
            required: true,
        },
    ],

    async execute(interaction) {
        await interaction.deferReply();

    const word = interaction.options.getString('word');
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (response.status === 404 || data.title === "No Definitions Found") {
                 return interaction.editReply(`No definition found for "${word}".`);
            }

            const definition = data[0].meanings[0].definitions[0].definition;
            const partOfSpeech = data[0].meanings[0].partOfSpeech;

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`Definition of ${word}`)
                .setDescription(`**Part of speech:** ${partOfSpeech}\n**Definition:** ${definition}`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error getting the definition:', error);
            await interaction.editReply('There was an error trying to get the definition.');
        }
    }
};
