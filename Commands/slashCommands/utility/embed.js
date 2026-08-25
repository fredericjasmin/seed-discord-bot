const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: 'embed',
    description: 'Diseña y envía un mensaje embed personalizado en un canal.',
    userPerms: 'ManageMessages',
    options: [
        {
            type: ApplicationCommandOptionType.Channel,
            name: 'canal',
            description: 'Canal donde se enviará el embed',
            channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'titulo',
            description: 'Título del embed',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'descripcion',
            description: 'Texto o contenido principal (soporta \\n para saltos de línea)',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'color',
            description: 'Color hexadecimal (ej: #5865F2, #00C851, #FF4444)',
            required: false,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'imagen',
            description: 'URL de una imagen para adjuntar',
            required: false,
        },
        {
            type: ApplicationCommandOptionType.String,
            name: 'footer',
            description: 'Texto de pie de página',
            required: false,
        },
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: '❌ Necesitas permisos de Gestionar Mensajes para usar este comando.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('canal');
        const title = interaction.options.getString('titulo');
        const description = interaction.options.getString('descripcion').replace(/\\n/g, '\n');
        const color = interaction.options.getString('color') || '#5865F2';
        const image = interaction.options.getString('imagen');
        const footer = interaction.options.getString('footer');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color.startsWith('#') ? color : `#${color}`);

        if (image) {
            try {
                embed.setImage(image);
            } catch {}
        }

        if (footer) {
            embed.setFooter({ text: footer });
        }

        embed.setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Embed enviado exitosamente a ${channel}!`, ephemeral: true });
        } catch (error) {
            console.error('[EmbedBuilder] Error sending embed:', error);
            await interaction.reply({ content: '❌ Error al enviar el embed. Verifica que el bot tenga permisos en ese canal o que el color/imagen sean válidos.', ephemeral: true });
        }
    },
};
