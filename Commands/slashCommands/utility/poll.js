const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'Create a poll with reaction options.',
    options: [
        {
            name: 'pregunta',
            type: 3, // STRING
            description: 'La pregunta de la encuesta.',
            required: true,
        },
        {
            name: 'opcion1',
            type: 3, // STRING
            description: 'First poll option.',
            required: true,
        },
        {
            name: 'opcion2',
            type: 3, // STRING
            description: 'Second poll option.',
            required: true,
        },
        {
            name: 'opcion3',
            type: 3, // STRING
            description: 'Third poll option (optional).',
            required: false,
        },
        {
            name: 'opcion4',
            type: 3, // STRING
            description: 'Fourth poll option (optional).',
            required: false,
        },
        {
            name: 'opcion5',
            type: 3, // STRING
            description: 'Fifth poll option (optional).',
            required: false,
        },
    ],
    userPerms: ['ManageChannels'], // Requires ManageChannels permission to create polls

    async execute(interaction) {
        const question = interaction.options.getString('pregunta');
        const options = [
            interaction.options.getString('opcion1'),
            interaction.options.getString('opcion2'),
            interaction.options.getString('opcion3'),
            interaction.options.getString('opcion4'),
            interaction.options.getString('opcion5'),
        ].filter(Boolean); // Filter out null/undefined options

        if (options.length < 2) {
            return interaction.reply({ content: 'Debes proporcionar al menos dos opciones para la encuesta.', ephemeral: true });
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

        if (options.length > emojis.length) {
            return interaction.reply({ content: `Solo se admiten hasta ${emojis.length} opciones para la encuesta.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(question)
            .setColor('#0099ff')
            .setDescription(options.map((option, index) => `${emojis[index]} ${option}`).join('\n'))
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
            await message.react(emojis[i]);
        }
    }
};