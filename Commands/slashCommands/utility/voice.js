const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { activeTempVoiceChannels } = require('../../../Events/Guild/voiceStateUpdate');

module.exports = {
    name: 'voice',
    description: 'Gestiona tu canal de voz temporal personal.',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'lock',
            description: 'Bloquea tu canal de voz para que nadie más pueda entrar.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'unlock',
            description: 'Desbloquea tu canal de voz para todos.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'name',
            description: 'Cambia el nombre de tu canal de voz.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'nombre',
                    description: 'Nuevo nombre para tu canal',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'limit',
            description: 'Establece el límite de personas en tu canal.',
            options: [
                {
                    type: ApplicationCommandOptionType.Integer,
                    name: 'cantidad',
                    description: 'Límite de usuarios (0 para ilimitado, máx 99)',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'permit',
            description: 'Permite el acceso a un usuario específico a tu canal.',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'usuario',
                    description: 'Usuario al que deseas dar acceso',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'reject',
            description: 'Expulsa y bloquea a un usuario de tu canal de voz.',
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: 'usuario',
                    description: 'Usuario al que deseas expulsar y bloquear',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: 'claim',
            description: 'Reclama la propiedad de la sala si el dueño original ya se fue.',
        },
    ],
    run: async (client, interaction) => {
        const memberVoiceChannel = interaction.member.voice.channel;
        if (!memberVoiceChannel) {
            return interaction.reply({ content: '❌ Debes estar conectado en tu canal de voz temporal para usar este comando.', ephemeral: true });
        }

        const roomInfo = activeTempVoiceChannels?.get(memberVoiceChannel.id);
        if (!roomInfo) {
            return interaction.reply({ content: '❌ Este no es un canal de voz temporal gestionable por el bot.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const isOwner = roomInfo.ownerId === interaction.user.id;
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (subcommand === 'claim') {
            const ownerMember = memberVoiceChannel.members.get(roomInfo.ownerId);
            if (ownerMember) {
                return interaction.reply({ content: `❌ El dueño original (<@${roomInfo.ownerId}>) todavía se encuentra en la sala.`, ephemeral: true });
            }

            roomInfo.ownerId = interaction.user.id;
            activeTempVoiceChannels.set(memberVoiceChannel.id, roomInfo);
            return interaction.reply({ content: `👑 ¡Ahora eres el nuevo propietario de **${memberVoiceChannel.name}**!` });
        }

        if (!isOwner && !isAdmin) {
            return interaction.reply({ content: `❌ Solo el dueño de la sala (<@${roomInfo.ownerId}>) puede gestionar este canal.`, ephemeral: true });
        }

        switch (subcommand) {
            case 'lock': {
                await memberVoiceChannel.permissionOverwrites.edit(interaction.guild.id, {
                    Connect: false
                });
                return interaction.reply({ content: `🔒 El canal **${memberVoiceChannel.name}** ahora está bloqueado.` });
            }

            case 'unlock': {
                await memberVoiceChannel.permissionOverwrites.edit(interaction.guild.id, {
                    Connect: true
                });
                return interaction.reply({ content: `🔓 El canal **${memberVoiceChannel.name}** ahora está abierto a todos.` });
            }

            case 'name': {
                const newName = interaction.options.getString('nombre');
                await memberVoiceChannel.setName(newName);
                return interaction.reply({ content: `✏️ El nombre del canal ha sido cambiado a: **${newName}**` });
            }

            case 'limit': {
                const limit = Math.min(Math.max(interaction.options.getInteger('cantidad'), 0), 99);
                await memberVoiceChannel.setUserLimit(limit);
                return interaction.reply({ content: `👥 Límite de miembros ajustado a **${limit === 0 ? 'Ilimitado' : limit}**.` });
            }

            case 'permit': {
                const targetUser = interaction.options.getUser('usuario');
                await memberVoiceChannel.permissionOverwrites.edit(targetUser.id, {
                    Connect: true,
                    ViewChannel: true
                });
                return interaction.reply({ content: `✅ Se le ha concedido acceso a ${targetUser} a este canal.` });
            }

            case 'reject': {
                const targetUser = interaction.options.getUser('usuario');
                if (targetUser.id === interaction.user.id) {
                    return interaction.reply({ content: '❌ No puedes expulsarte a ti mismo.', ephemeral: true });
                }

                await memberVoiceChannel.permissionOverwrites.edit(targetUser.id, {
                    Connect: false
                });

                const targetMember = memberVoiceChannel.members.get(targetUser.id);
                if (targetMember) {
                    try {
                        await targetMember.voice.disconnect('Expulsado por el dueño de la sala');
                    } catch {}
                }

                return interaction.reply({ content: `🚫 ${targetUser} ha sido expulsado y bloqueado del canal.` });
            }
        }
    },
};
