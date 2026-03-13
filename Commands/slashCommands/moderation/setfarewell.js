const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const Guild = require('../../../models/Guild');

module.exports = {
    name: 'setfarewell',
    description: 'Configura el sistema de despedida.',
    userPerms: ['ManageGuild'],
    options: [
        {
            name: 'status',
            description: 'Muestra la configuración de despedida actual.',
            type: 1, // SUB_COMMAND
        },
        {
            name: 'toggle',
            description: 'Activa o desactiva los mensajes de despedida.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'estado', description: 'Elige si activar o desactivar.', required: true, type: 3, choices: [{ name: 'On', value: 'on' }, { name: 'Off', value: 'off' }] },
            ],
        },
        {
            name: 'channel',
            description: 'Establece el canal de despedida.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'canal', description: 'El canal a establecer.', required: true, type: 7, channel_types: [ChannelType.GuildText] },
            ],
        },
        {
            name: 'message',
            description: 'Establece el mensaje de despedida (texto plano).',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'mensaje', description: 'El mensaje. Placeholders: {user.tag}, {guild.name}, {guild.memberCount}', required: true, type: 3 },
            ],
        },
        {
            name: 'embed',
            description: 'Configura el mensaje de despedida incrustado (embed).',
            type: 2, // SUB_COMMAND_GROUP
            options: [
                {
                    name: 'toggle',
                    description: 'Activa o desactiva el mensaje incrustado.',
                    type: 1,
                    options: [
                        { name: 'estado', description: 'Elige si activar o desactivar.', required: true, type: 3, choices: [{ name: 'On', value: 'on' }, { name: 'Off', value: 'off' }] },
                    ],
                },
                {
                    name: 'color',
                    description: 'Establece el color del embed (ej. #FF0000).',
                    type: 1,
                    options: [
                        { name: 'hex_color', description: 'El código de color hexadecimal.', required: true, type: 3 },
                    ],
                },
                {
                    name: 'title',
                    description: 'Establece el título del embed.',
                    type: 1,
                    options: [
                        { name: 'texto', description: 'El texto del título.', required: true, type: 3 },
                    ],
                },
                {
                    name: 'description',
                    description: 'Establece la descripción del embed.',
                    type: 1,
                    options: [
                        { name: 'texto', description: 'La descripción. Placeholders: {user.tag}, {guild.name}, {guild.memberCount}', required: true, type: 3 },
                    ],
                },
                {
                    name: 'footer',
                    description: 'Establece el pie de página del embed.',
                    type: 1,
                    options: [
                        { name: 'texto', description: 'El texto del pie de página.', required: true, type: 3 },
                    ],
                },
                {
                    name: 'thumbnail',
                    description: 'Usa el avatar del usuario como miniatura.',
                    type: 1,
                    options: [
                        { name: 'estado', description: 'Elige si activar o desactivar.', required: true, type: 3, choices: [{ name: 'On', value: 'on' }, { name: 'Off', value: 'off' }] },
                    ],
                },
                {
                    name: 'image',
                    description: 'Establece una imagen para el embed.',
                    type: 1,
                    options: [
                        { name: 'url', description: 'La URL de la imagen.', required: true, type: 3 },
                    ],
                },
            ],
        },
    ],

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: 'No tienes permiso para configurar los mensajes de despedida.', ephemeral: true });
        }

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: interaction.guild.id });
        }

        if (!guildData.config.farewell) {
            guildData.config.farewell = {};
        }

        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();

        let replyContent = '';

        if (subcommandGroup === 'embed') {
            const farewellConfig = guildData.config.farewell;
            switch (subcommand) {
                case 'toggle':
                    const useEmbed = interaction.options.getString('estado') === 'on';
                    farewellConfig.useEmbed = useEmbed;
                    replyContent = `Mensajes de despedida incrustados ${useEmbed ? 'habilitados' : 'deshabilitados'}.`;
                    break;
                case 'color':
                    const color = interaction.options.getString('hex_color');
                    if (!/^#[0-9A-F]{6}$/i.test(color)) {
                        return interaction.reply({ content: 'Formato de color inválido. Usa un color hexadecimal (ej. #FF0000).', ephemeral: true });
                    }
                    farewellConfig.embedColor = color;
                    replyContent = `Color del embed de despedida establecido en ${color}.`;
                    break;
                case 'title':
                    const title = interaction.options.getString('texto');
                    farewellConfig.embedTitle = title;
                    replyContent = 'Título del embed de despedida establecido.';
                    break;
                case 'description':
                    const description = interaction.options.getString('texto');
                    farewellConfig.embedDescription = description;
                    replyContent = 'Descripción del embed de despedida establecida.';
                    break;
                case 'footer':
                    const footer = interaction.options.getString('texto');
                    farewellConfig.embedFooter = footer;
                    replyContent = 'Pie de página del embed de despedida establecido.';
                    break;
                case 'thumbnail':
                    const useThumbnail = interaction.options.getString('estado') === 'on';
                    farewellConfig.embedThumbnail = useThumbnail;
                    replyContent = `Miniatura del avatar del usuario ${useThumbnail ? 'habilitada' : 'deshabilitada'}.`;
                    break;
                case 'image':
                    const imageUrl = interaction.options.getString('url');
                    farewellConfig.embedImage = imageUrl;
                    replyContent = 'Imagen del embed de despedida establecida.';
                    break;
            }
        } else {
            const farewellConfig = guildData.config.farewell;
            switch (subcommand) {
                case 'status':
                    const statusEmbed = new EmbedBuilder()
                        .setTitle('Configuración de Despedida')
                        .setColor(farewellConfig.embedColor || '#0099ff')
                        .addFields(
                            { name: 'Estado', value: farewellConfig.enabled ? 'Habilitado' : 'Deshabilitado', inline: true },
                            { name: 'Canal', value: farewellConfig.channelId ? `<#${farewellConfig.channelId}>` : 'No establecido', inline: true },
                            { name: 'Usar Embed', value: farewellConfig.useEmbed ? 'Sí' : 'No', inline: true },
                            { name: 'Mensaje (Texto Plano)', value: farewellConfig.message || 'No establecido' },
                            { name: 'Título del Embed', value: farewellConfig.embedTitle || 'No establecido' },
                            { name: 'Descripción del Embed', value: farewellConfig.embedDescription || 'No establecido' },
                        );
                    return interaction.reply({ embeds: [statusEmbed], ephemeral: true });
                case 'toggle':
                    const isEnabled = interaction.options.getString('estado') === 'on';
                    farewellConfig.enabled = isEnabled;
                    replyContent = `Mensajes de despedida ${isEnabled ? 'habilitados' : 'deshabilitados'}.`;
                    break;
                case 'channel':
                    const channel = interaction.options.getChannel('canal');
                    farewellConfig.channelId = channel.id;
                    replyContent = `Canal de despedida establecido en ${channel}.`;
                    break;
                case 'message':
                    const message = interaction.options.getString('mensaje');
                    farewellConfig.message = message;
                    replyContent = 'Mensaje de despedida (texto plano) establecido.';
                    break;
            }
        }

        await guildData.save();
        if (replyContent) {
            await interaction.reply({ content: replyContent, ephemeral: true });
        }
    }
};