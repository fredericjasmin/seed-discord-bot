const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Birthday = require('../../../models/Birthday');

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

module.exports = {
    name: 'birthday',
    description: 'Registra o consulta las fechas de cumpleaños de los miembros.',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'set',
            description: 'Registra tu fecha de cumpleaños.',
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'dia',
                    description: 'Día de nacimiento (1 - 31)',
                    min_value: 1,
                    max_value: 31,
                    required: true,
                },
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'mes',
                    description: 'Mes de nacimiento (1 = Enero, 12 = Diciembre)',
                    min_value: 1,
                    max_value: 12,
                    required: true,
                },
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'remove',
            description: 'Elimina tu fecha de cumpleaños registrada.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'list',
            description: 'Lista los próximos cumpleaños en este servidor.',
        },
    ],
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            const day = interaction.options.getInteger('dia');
            const month = interaction.options.getInteger('mes');

            // Validar días según mes (básico)
            if ([4, 6, 9, 11].includes(month) && day > 30) {
                return interaction.reply({ content: `❌ ${MONTH_NAMES[month - 1]} solo tiene 30 días.`, ephemeral: true });
            }
            if (month === 2 && day > 29) {
                return interaction.reply({ content: '❌ Febrero solo tiene hasta 29 días.', ephemeral: true });
            }

            await Birthday.findOneAndUpdate(
                { guildId: interaction.guild.id, userId: interaction.user.id },
                {
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    day,
                    month
                },
                { upsert: true, new: true }
            );

            const embed = new EmbedBuilder()
                .setColor('#ff4081')
                .setTitle('🎂 Cumpleaños Guardado')
                .setDescription(`¡Tu fecha de cumpleaños ha sido establecida para el **${day} de ${MONTH_NAMES[month - 1]}**!\n\nEl bot te felicitará automáticamente en esa fecha. 🎉`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'remove') {
            const deleted = await Birthday.findOneAndDelete({ guildId: interaction.guild.id, userId: interaction.user.id });
            if (!deleted) {
                return interaction.reply({ content: '❌ No tenías ningún cumpleaños registrado en este servidor.', ephemeral: true });
            }

            await interaction.reply({ content: '🗑️ Tu fecha de cumpleaños ha sido eliminada del servidor.' });

        } else if (subcommand === 'list') {
            const allBirthdays = await Birthday.find({ guildId: interaction.guild.id }).sort({ month: 1, day: 1 }).limit(15);

            if (!allBirthdays.length) {
                return interaction.reply({ content: '📅 No hay cumpleaños registrados en este servidor todavía. ¡Usa `/birthday set`!', ephemeral: true });
            }

            const listFormatted = allBirthdays.map(b => {
                return `🎈 <@${b.userId}> • **${b.day} de ${MONTH_NAMES[b.month - 1]}**`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#ff4081')
                .setTitle(`🎂 Próximos Cumpleaños - ${interaction.guild.name}`)
                .setDescription(listFormatted)
                .setFooter({ text: 'Usa /birthday set para añadir el tuyo' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
