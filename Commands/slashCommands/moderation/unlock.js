const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Desbloquea un canal, permitiendo que @everyone envíe mensajes.',
    options: [
        {
            name: 'canal',
            type: 7, // CHANNEL
            description: 'El canal a desbloquear (por defecto, el canal actual).',
            required: false,
            channel_types: [ChannelType.GuildText],
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón del desbloqueo.',
            required: false,
        },
    ],
    userPerms: ['ManageChannels'],

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'No tienes permiso para desbloquear canales.', ephemeral: true });
        }

        if (targetChannel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Solo puedes desbloquear canales de texto.', ephemeral: true });
        }

        try {
            await targetChannel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: null, // Set to null to remove the explicit overwrite
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for unlock
                .setTitle('Canal Desbloqueado')
                .setDescription(`El canal ${targetChannel} ha sido desbloqueado. Los miembros pueden enviar mensajes.`) // Changed to reflect @everyone
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al desbloquear el canal:', error);
            await interaction.reply({ content: 'Hubo un error al intentar desbloquear el canal.', ephemeral: true });
        }
    }
};
