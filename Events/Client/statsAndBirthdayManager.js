const Guild = require('../../models/Guild');
const Birthday = require('../../models/Birthday');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    // 1. Tarea periódica de actualización de contadores de servidor (cada 10 minutos)
    setInterval(async () => {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const guildData = await Guild.findOne({ guildId });
                const statsConfig = guildData?.config?.serverStats;

                if (statsConfig && statsConfig.enabled) {
                    await guild.members.fetch().catch(() => {});

                    const totalMembers = guild.memberCount;
                    const botCount = guild.members.cache.filter(m => m.user.bot).size;
                    const humanCount = totalMembers - botCount;
                    const roleCount = guild.roles.cache.size;

                    if (statsConfig.memberChannelId) {
                        const ch = guild.channels.cache.get(statsConfig.memberChannelId);
                        if (ch) await ch.setName(`👥 Miembros: ${humanCount.toLocaleString()}`).catch(() => {});
                    }

                    if (statsConfig.botChannelId) {
                        const ch = guild.channels.cache.get(statsConfig.botChannelId);
                        if (ch) await ch.setName(`🤖 Bots: ${botCount.toLocaleString()}`).catch(() => {});
                    }

                    if (statsConfig.roleChannelId) {
                        const ch = guild.channels.cache.get(statsConfig.roleChannelId);
                        if (ch) await ch.setName(`🎭 Roles: ${roleCount.toLocaleString()}`).catch(() => {});
                    }
                }
            } catch (err) {
                // Silencioso para no saturar consola con rate limits de canales
            }
        }
    }, 10 * 60 * 1000);

    // 2. Tarea periódica de verificación de cumpleaños (cada 1 hora)
    setInterval(async () => {
        const now = new Date();
        const currentDay = now.getUTCDate();
        const currentMonth = now.getUTCMonth() + 1; // 1-12
        const currentYear = now.getUTCFullYear();

        try {
            const todayBirthdays = await Birthday.find({
                day: currentDay,
                month: currentMonth,
                lastCelebratedYear: { $ne: currentYear }
            });

            for (const bday of todayBirthdays) {
                const guild = client.guilds.cache.get(bday.guildId);
                if (!guild) continue;

                const guildData = await Guild.findOne({ guildId: bday.guildId });
                const bdayConfig = guildData?.config?.birthdays;

                if (bdayConfig && bdayConfig.enabled && bdayConfig.channelId) {
                    const channel = guild.channels.cache.get(bdayConfig.channelId);
                    if (channel && channel.isTextBased && channel.isTextBased()) {
                        const rawMsg = bdayConfig.message || '🎂 ¡Hoy es el cumpleaños de {user.mention}! ¡Felicidades y que cumplas muchos más! 🎉';
                        const formattedMsg = rawMsg.replace(/{user\.mention}/g, `<@${bday.userId}>`);

                        const embed = new EmbedBuilder()
                            .setColor('#ff4081')
                            .setTitle('🎉 ¡Feliz Cumpleaños!')
                            .setDescription(formattedMsg)
                            .setThumbnail('https://cdn-icons-png.flaticon.com/512/3132/3132693.png')
                            .setTimestamp();

                        await channel.send({ content: `<@${bday.userId}>`, embeds: [embed] }).catch(() => {});
                    }

                    // Asignar rol de cumpleañero si está configurado
                    if (bdayConfig.roleId) {
                        const member = await guild.members.fetch(bday.userId).catch(() => null);
                        const role = guild.roles.cache.get(bdayConfig.roleId);
                        if (member && role) {
                            await member.roles.add(role, 'Cumpleañero del día').catch(() => {});
                        }
                    }

                    bday.lastCelebratedYear = currentYear;
                    await bday.save();
                }
            }
        } catch (error) {
            console.error('[BirthdayManager] Error checking birthdays:', error);
        }
    }, 60 * 60 * 1000);
};
