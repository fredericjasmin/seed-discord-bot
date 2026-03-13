const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: '8ball',
    description: 'Ask the magic 8-ball a question.',
    options: [
        {
            name: 'question',
            type: 3, // STRING
            description: 'The question you want to ask.',
            required: true,
        },
    ],

    async execute(interaction) {
        const question = interaction.options.getString('question');

        const responses = [
            'It is certain.',
            'It is decidedly so.',
            'Without a doubt.',
            'Yes, definitely.',
            'You may rely on it.',
            'As I see it, yes.',
            'Most likely.',
            'Outlook good.',
            'Yes.',
            'Signs point to yes.',
            'Reply hazy, try again.',
            'Ask again later.',
            'Better not tell you now.',
            'Cannot predict now.',
            'Concentrate and ask again.',
            'Don\'t count on it.',
            'My reply is no.',
            'My sources say no.',
            'Outlook not so good.',
            'Very doubtful.'
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        const embed = new EmbedBuilder()
            .setTitle('🎱 Magic 8-Ball 🎱')
            .addFields(
                { name: 'Your Question', value: question },
                { name: 'My Answer', value: response }
            )
            .setColor('#00FF00');

        await interaction.reply({ embeds: [embed] });
    }
};