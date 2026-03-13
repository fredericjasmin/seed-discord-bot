const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const math = require('mathjs'); // Need to install mathjs

module.exports = {
    name: 'calculator',
    description: 'Perform mathematical operations.',
    options: [
        {
              name: 'expression',
            type: 3, // STRING
              description: 'The mathematical expression to calculate (e.g. 2+2*3).',
            required: true,
        },
    ],

    async execute(interaction) {
    const expression = interaction.options.getString('expression');

        try {
            const result = math.evaluate(expression);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🧮 Calculator')
                .addFields(
                    { name: 'Expression', value: `
${expression}
` },
                    { name: 'Result', value: `
${result}
` }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error calculating the expression:', error);
            await interaction.reply({ content: 'There was an error calculating the expression. Make sure it is a valid mathematical expression.', ephemeral: true });
        }
    }
};