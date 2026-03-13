const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Reminder = require('../../../models/Reminder'); // Ajusta la ruta según tu estructura de archivos
const ms = require('ms');

module.exports = {
    name: 'remind',
    description: '[⏰ UTILITY] Set a reminder',
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: 'time',
            description: 'Duration for the reminder (e.g., 10m, 2h)',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'message',
            description: 'Reminder message',
            required: true,
        },
    ],
    run: async (client, interaction) => {
        const time = interaction.options.getString('time');
        const reminderMessage = interaction.options.getString('message');

        const reminderTime = ms(time);
        if (!reminderTime) {
            return interaction.reply({
                content: 'Invalid time format. Please use something like 10m or 2h.',
                ephemeral: true,
            });
        }

        const remindAt = new Date(Date.now() + reminderTime);

        // Save the reminder to the database
        const newReminder = new Reminder({
            userId: interaction.user.id,
            message: reminderMessage,
            remindAt: remindAt,
        });

        await newReminder.save();

        interaction.reply({
            content: `Reminder set for **${time}**! I will remind you in **${time}**.`,
        });

        // Schedule a task to send the reminder
        setTimeout(async () => {
            const reminder = await Reminder.findOneAndDelete({
                userId: interaction.user.id,
                message: reminderMessage,
                remindAt: remindAt,
            });

            if (reminder) {
                interaction.user.send(`Reminder: ${reminder.message}`);
            }
        }, reminderTime);
    },
};
