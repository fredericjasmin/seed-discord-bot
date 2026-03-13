const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'slowmode',
    description: 'Establece o desactiva el modo lento en un canal.',
    options: [
        {
            name: 'tiempo',
            type: 3, // STRING
            description: 'Duración del modo lento (ej. 10s, 1m, 1h, 0 para desactivar).',
            required: true,
        },
        {
            name: 'canal',
            type: 7, // CHANNEL
            description: 'El canal para aplicar el modo lento (por defecto, el canal actual).',
            required: false,
            channel_types: [ChannelType.GuildText],
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón para establecer el modo lento.',
            required: false,
        },
    ],
    userPerms: ['ManageChannels'],

    async execute(interaction) {
        const time = interaction.options.getString('tiempo');
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'No tienes permiso para gestionar el modo lento.', ephemeral: true });
        }

        if (targetChannel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Solo puedes aplicar el modo lento a canales de texto.', ephemeral: true });
        }

        const slowmodeSeconds = ms(time) / 1000;

        if (isNaN(slowmodeSeconds) || slowmodeSeconds < 0 || slowmodeSeconds > 21600) { // Max 6 hours (21600 seconds)
            return interaction.reply({ content: 'Por favor, proporciona una duración válida para el modo lento (mínimo 0 segundos, máximo 6 horas). Ejemplo: 10s, 1m, 1h.', ephemeral: true });
        }

        try {
            await targetChannel.setRateLimitPerUser(slowmodeSeconds, reason);

            const embed = new EmbedBuilder()
                .setColor('#FFA500') // Orange color for slowmode
                .setTitle('Modo Lento Actualizado')
                .setDescription(slowmodeSeconds === 0
                    ? `El modo lento ha sido desactivado en ${targetChannel}.`
                    : `El modo lento ha sido establecido en ${targetChannel} por **${time}**.`
                )
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al establecer el modo lento:', error);
            await interaction.reply({ content: 'Hubo un error al intentar establecer el modo lento.', ephemeral: true });
        }
    }
};
