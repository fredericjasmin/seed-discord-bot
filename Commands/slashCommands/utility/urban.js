const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'urban',
    description: 'Get the definition of a word from Urban Dictionary.',
    options: [
        {
            name: 'word',
            type: 3, // STRING
            description: 'The word to search in Urban Dictionary.',
            required: true,
        },
    ],

    async execute(interaction) {
        await interaction.deferReply();

    const word = interaction.options.getString('word');
        const url = `https://api.urbandictionary.com/v0/define?term=${word}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.list || data.list.length === 0) {
                return interaction.editReply(`No definition found for "${word}" in Urban Dictionary.`);
            }

            const definition = data.list[0].definition;
            const example = data.list[0].example;

            const embed = new EmbedBuilder()
                .setColor('#1D2A35') // Urban Dictionary color
                .setTitle(`Definition of ${word} (Urban Dictionary)`)
                .setDescription(definition.length > 1024 ? definition.substring(0, 1021) + '...' : definition)
                .addFields(
                    { name: 'Example', value: example ? (example.length > 1024 ? example.substring(0, 1021) + '...' : example) : 'No example.' }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error getting Urban Dictionary definition:', error);
            await interaction.editReply('There was an error trying to get the Urban Dictionary definition.');
        }
    }
};
