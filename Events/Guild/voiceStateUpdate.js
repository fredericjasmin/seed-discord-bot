const { ChannelType, PermissionsBitField, Collection } = require('discord.js');
const Guild = require('../../models/Guild');

const activeTempVoiceChannels = new Collection(); // channelId -> { ownerId, guildId }

module.exports = {
    name: 'voiceStateUpdate',
    activeTempVoiceChannels,
    async execute(oldState, newState, client) {
        const guild = newState.guild || oldState.guild;
        if (!guild) return;

        try {
            const guildData = await Guild.findOne({ guildId: guild.id });
            const config = guildData?.config?.tempVoice;

            // 1. Manejar salida de un canal temporal (si queda vacío, borrarlo)
            if (oldState.channelId && oldState.channelId !== newState.channelId) {
                const oldChannel = oldState.channel;
                if (oldChannel && activeTempVoiceChannels.has(oldChannel.id)) {
                    if (oldChannel.members.size === 0) {
                        activeTempVoiceChannels.delete(oldChannel.id);
                        try {
                            await oldChannel.delete('Canal de voz temporal vacío');
                        } catch (err) {
                            console.error('[TempVoice] Error deleting empty voice channel:', err);
                        }
                    }
                }
            }

            // 2. Manejar entrada al canal disparador de Join-to-Create
            if (config && config.enabled && config.channelId && newState.channelId === config.channelId) {
                const member = newState.member;
                if (!member) return;

                const rawName = config.defaultName || "🔊 Sala de {user.username}";
                const channelName = rawName
                    .replace(/{user\.username}/g, member.displayName || member.user.username)
                    .replace(/{user\.tag}/g, member.user.tag);

                const parentCategory = config.categoryId || (newState.channel ? newState.channel.parentId : null);

                // Crear canal de voz
                const newVoiceChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: parentCategory || undefined,
                    userLimit: config.userLimit || 0,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: member.id,
                            allow: [
                                PermissionsBitField.Flags.Connect,
                                PermissionsBitField.Flags.Speak,
                                PermissionsBitField.Flags.ManageChannels,
                                PermissionsBitField.Flags.MoveMembers,
                                PermissionsBitField.Flags.MuteMembers,
                                PermissionsBitField.Flags.DeafenMembers
                            ]
                        }
                    ]
                });

                // Registrar como canal activo
                activeTempVoiceChannels.set(newVoiceChannel.id, {
                    ownerId: member.id,
                    guildId: guild.id
                });

                // Mover al usuario a su nueva sala
                try {
                    await member.voice.setChannel(newVoiceChannel);
                } catch (moveErr) {
                    console.error('[TempVoice] Error moving user to new voice channel:', moveErr);
                }
            }

        } catch (error) {
            console.error('[TempVoice] Error processing voiceStateUpdate:', error);
        }
    }
};
