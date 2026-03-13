const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'dice',
    description: 'Roll a die (defaults to a d6).',
    options: [
        {
            name: 'faces',
            type: 4, // INTEGER
            description: 'Number of faces on the die (defaults to 6).',
            required: false,
        },
    ],

    async execute(interaction) {
        const faces = interaction.options.getInteger('faces') || 6;

        if (faces < 2) {
            return interaction.reply({ content: 'The die must have at least 2 faces.', ephemeral: true });
        }

        const result = Math.floor(Math.random() * faces) + 1;

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🎲 Dice Roll')
            .setDescription(`You rolled a d${faces} and got: **${result}**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
