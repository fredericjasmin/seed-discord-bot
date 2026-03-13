const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Bloquea un canal, impidiendo que @everyone envíe mensajes.',
    options: [
        {
            name: 'canal',
            type: 7, // CHANNEL
            description: 'El canal a bloquear (por defecto, el canal actual).',
            required: false,
            channel_types: [ChannelType.GuildText],
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'La razón del bloqueo.',
            required: false,
        },
    ],
    userPerms: ['ManageChannels'],

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const reason = interaction.options.getString('razon') || 'No se especificó una razón.';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: 'No tienes permiso para bloquear canales.', ephemeral: true });
        }

        if (targetChannel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Solo puedes bloquear canales de texto.', ephemeral: true });
        }

        try {
            await targetChannel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false,
            });

            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for lock
                .setTitle('Canal Bloqueado')
                .setDescription(`El canal ${targetChannel} ha sido bloqueado. Los miembros no pueden enviar mensajes.`) // Changed to reflect @everyone
                .addFields(
                    { name: 'Moderador', value: interaction.user.tag },
                    { name: 'Razón', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al bloquear el canal:', error);
            await interaction.reply({ content: 'Hubo un error al intentar bloquear el canal.', ephemeral: true });
        }
    }
};
