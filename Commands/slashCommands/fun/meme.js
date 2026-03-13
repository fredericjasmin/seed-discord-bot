const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'meme',
    description: 'Obtén un meme aleatorio.',

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://meme-api.com/gimme');
            const data = await response.json();

            if (!data || !data.url) {
                return interaction.editReply('No se pudo obtener un meme. Inténtalo de nuevo más tarde.');
            }

            const embed = new EmbedBuilder()
                .setColor('#FF5733') // Reddit orange
                .setTitle(data.title)
                .setURL(data.postLink)
                .setImage(data.url)
                .setFooter({ text: `Subreddit: r/${data.subreddit} | Autor: u/${data.author}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener el meme:', error);
            await interaction.editReply('Hubo un error al intentar obtener un meme.');
        }
    }
};
