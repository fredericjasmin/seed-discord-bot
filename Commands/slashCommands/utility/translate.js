const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'translate',
    description: 'Translate text to a specific language.',
    options: [
        {
            name: 'text',
            type: 3, // STRING
            description: 'The text to translate.',
            required: true,
        },
        {
            name: 'language',
            type: 3, // STRING
            description: 'The language to translate to (e.g. es, en, fr).',
            required: true,
        },
    ],

    async execute(interaction) {
        await interaction.deferReply();

    const text = interaction.options.getString('text');
    const targetLang = interaction.options.getString('language');

        // Unofficial Google Translate API
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data || !data[0] || !data[0][0] || !data[0][0][0]) {
                console.error('Error translating: Unexpected API response.', data);
                return interaction.editReply('There was an error translating: Unexpected API response.');
            }

            const translatedText = data[0][0][0];

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Translation')
                .addFields(
                    { name: 'Original', value: text },
                    { name: 'Translated', value: translatedText }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error translating text:', error);
            await interaction.editReply('There was an error trying to translate the text.');
        }
    }
};
