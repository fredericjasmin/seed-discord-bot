const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const Guild = require('../../../models/Guild');
const emoji = require('node-emoji');

module.exports = {
    name: 'reactionrole',
    description: 'Configura roles por reacción.',
    userPerms: ['ManageRoles'],
    options: [
        {
            name: 'create',
            description: 'Crea un nuevo mensaje de roles por reacción.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'channel', description: 'Canal donde se enviará el mensaje.', required: true, type: 7, channel_types: [ChannelType.GuildText] },
                { name: 'title', description: 'Título del embed.', required: true, type: 3 },
                { name: 'description', description: 'Descripción del embed.', required: true, type: 3 },
            ],
        },
        {
            name: 'add',
            description: 'Añade un rol por reacción a un mensaje existente.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'message_id', description: 'ID del mensaje.', required: true, type: 3 },
                { name: 'emoji', description: 'El emoji para reaccionar.', required: true, type: 3 },
                { name: 'role', description: 'El rol a asignar.', required: true, type: 8 },
            ],
        },
        {
            name: 'remove',
            description: 'Elimina un rol por reacción de un mensaje.',
            type: 1, // SUB_COMMAND
            options: [
                { name: 'message_id', description: 'ID del mensaje.', required: true, type: 3 },
                { name: 'emoji', description: 'El emoji del rol a eliminar.', required: true, type: 3 },
            ],
        },
        {
            name: 'list',
            description: 'Lista todos los mensajes de roles por reacción.',
            type: 1, // SUB_COMMAND
        },
    ],

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: 'No tienes permiso para configurar roles por reacción.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await createReactionRoleMessage(interaction);
                break;
            case 'add':
                await addReactionRole(interaction);
                break;
            case 'remove':
                await removeReactionRole(interaction);
                break;
            case 'list':
                await listReactionRoles(interaction);
                break;
        }
    }
};

async function createReactionRoleMessage(interaction) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor('#0099ff');

    const message = await channel.send({ embeds: [embed] });

    await interaction.reply({ content: `Mensaje de roles por reacción creado en ${channel} con el ID: ${message.id}`, ephemeral: true });
}

async function addReactionRole(interaction) {
    const messageId = interaction.options.getString('message_id');
    const emojiInput = interaction.options.getString('emoji');
    const role = interaction.options.getRole('role');

    let guildData = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildData) {
        guildData = new Guild({ guildId: interaction.guild.id });
    }

    let reactionRole = guildData.config.reactionRoles.find(rr => rr.messageId === messageId);

    const parsedEmoji = emoji.get(emojiInput) || emojiInput;
    const customEmojiRegex = /<a?:(.+):(\d+)>/;
    const customEmojiMatch = parsedEmoji.match(customEmojiRegex);
    const emojiToReact = customEmojiMatch ? customEmojiMatch[2] : parsedEmoji;

    if (!emojiToReact) {
        return interaction.reply({ content: 'Emoji inválido.', ephemeral: true });
    }

    if (reactionRole) {
        // Check if the emoji is already used
        if (reactionRole.reactions.some(r => r.emoji === emojiToReact)) {
            return interaction.reply({ content: 'Ese emoji ya está en uso en este mensaje.', ephemeral: true });
        }
        reactionRole.reactions.push({ emoji: emojiToReact, roleId: role.id });
    } else {
        guildData.config.reactionRoles.push({
            messageId,
            channelId: interaction.channel.id,
            reactions: [{ emoji: emojiToReact, roleId: role.id }],
        });
    }

    await guildData.save();

    try {
        const channel = await interaction.guild.channels.fetch(interaction.channel.id);
        const message = await channel.messages.fetch(messageId);
        await message.react(emojiToReact);
    } catch (error) {
        console.error('Error al añadir la reacción:', error);
        return interaction.reply({ content: 'No se pudo encontrar el mensaje o añadir la reacción. Asegúrate de que el ID del mensaje es correcto y que estoy en el canal.', ephemeral: true });
    }

    await interaction.reply({ content: `Rol ${role.name} añadido con el emoji ${emojiToReact} al mensaje.`, ephemeral: true });
}

async function removeReactionRole(interaction) {
    const messageId = interaction.options.getString('message_id');
    const emojiInput = interaction.options.getString('emoji');

    let guildData = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildData) {
        return interaction.reply({ content: 'No hay roles por reacción configurados en este servidor.', ephemeral: true });
    }

    let reactionRole = guildData.config.reactionRoles.find(rr => rr.messageId === messageId);
    if (!reactionRole) {
        return interaction.reply({ content: 'No se encontró un mensaje de rol por reacción con ese ID.', ephemeral: true });
    }

    const parsedEmoji = emoji.get(emojiInput) || emojiInput;
    const customEmojiRegex = /<a?:(.+):(\d+)>/;
    const customEmojiMatch = parsedEmoji.match(customEmojiRegex);
    const emojiToRemove = customEmojiMatch ? customEmojiMatch[2] : parsedEmoji;

    const reactionIndex = reactionRole.reactions.findIndex(r => r.emoji === emojiToRemove);
    if (reactionIndex === -1) {
        return interaction.reply({ content: 'No se encontró un rol por reacción con ese emoji en este mensaje.', ephemeral: true });
    }

    reactionRole.reactions.splice(reactionIndex, 1);

    await guildData.save();

    try {
        const channel = await interaction.guild.channels.fetch(reactionRole.channelId);
        const message = await channel.messages.fetch(messageId);
        const messageReaction = message.reactions.cache.find(r => r.emoji.name === emojiToRemove || r.emoji.id === emojiToRemove);
        if (messageReaction) {
            await messageReaction.remove();
        }
    } catch (error) {
        console.error('Error al eliminar la reacción:', error);
    }

    await interaction.reply({ content: `Rol por reacción con el emoji ${emojiToRemove} eliminado.`, ephemeral: true });
}

async function listReactionRoles(interaction) {
    let guildData = await Guild.findOne({ guildId: interaction.guild.id });
    if (!guildData || !guildData.config.reactionRoles || guildData.config.reactionRoles.length === 0) {
        return interaction.reply({ content: 'No hay roles por reacción configurados en este servidor.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('Mensajes de Roles por Reacción')
        .setColor('#0099ff');

    for (const rr of guildData.config.reactionRoles) {
        const channel = interaction.guild.channels.cache.get(rr.channelId);
        let messageUrl = `https://discord.com/channels/${interaction.guild.id}/${rr.channelId}/${rr.messageId}`;
        let reactions = rr.reactions.map(r => `${r.emoji} -> <@&${r.roleId}>`).join('\n') || 'No hay reacciones configuradas.';
        embed.addFields({ name: `Mensaje en #${channel ? channel.name : 'canal no encontrado'}`, value: `[Ir al mensaje](${messageUrl})\n${reactions}` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}