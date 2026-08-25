const Guild = require('../../models/Guild');
const Level = require('../../models/Level');
const { EmbedBuilder } = require('discord.js');

const getRequiredXp = (level) => Math.floor(100 * Math.pow(level, 1.5));

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            const guildData = await Guild.findOne({ guildId: message.guild.id });
            const levelingConfig = guildData?.config?.leveling;
            
            // Si el sistema está deshabilitado
            if (!levelingConfig || !levelingConfig.enabled) return;

            // Ignorar canales configurados
            if (levelingConfig.ignoredChannels && levelingConfig.ignoredChannels.includes(message.channel.id)) {
                return;
            }

            let userLevel = await Level.findOne({ guildId: message.guild.id, userId: message.author.id });
            if (!userLevel) {
                userLevel = new Level({
                    guildId: message.guild.id,
                    userId: message.author.id,
                    xp: 0,
                    level: 1,
                    totalMessages: 0,
                    lastXpGained: new Date(0)
                });
            }

            userLevel.totalMessages += 1;

            const now = new Date();
            const cooldownMs = 60 * 1000; // 1 minuto de cooldown entre ganancias de XP
            const timeSinceLastXp = now.getTime() - new Date(userLevel.lastXpGained).getTime();

            if (timeSinceLastXp >= cooldownMs) {
                // Ganar entre 15 y 25 XP aleatorio
                const xpGain = Math.floor(Math.random() * 11) + 15;
                userLevel.xp += xpGain;
                userLevel.lastXpGained = now;

                let nextLevelXp = getRequiredXp(userLevel.level);
                let leveledUp = false;

                while (userLevel.xp >= nextLevelXp) {
                    userLevel.level += 1;
                    leveledUp = true;
                    nextLevelXp = getRequiredXp(userLevel.level);
                }

                await userLevel.save();

                if (leveledUp) {
                    // 1. Asignar rol de recompensa si existe para este nivel
                    if (levelingConfig.levelRoles && levelingConfig.levelRoles.length > 0) {
                        const reward = levelingConfig.levelRoles.find(r => r.level === userLevel.level);
                        if (reward && message.member) {
                            const role = message.guild.roles.cache.get(reward.roleId);
                            if (role && !message.member.roles.cache.has(role.id)) {
                                try {
                                    await message.member.roles.add(role, `Recompensa por alcanzar el nivel ${userLevel.level}`);
                                } catch (err) {
                                    console.error(`[Leveling] Error assigning level role ${role.name}:`, err);
                                }
                            }
                        }
                    }

                    // 2. Enviar anuncio de subida de nivel
                    const targetChannel = levelingConfig.channelId 
                        ? message.guild.channels.cache.get(levelingConfig.channelId) 
                        : message.channel;

                    if (targetChannel && targetChannel.isTextBased && targetChannel.isTextBased()) {
                        const rawMsg = levelingConfig.message || "🎉 ¡Felicidades {user.mention}! Has subido al nivel **{level}**!";
                        const formattedMsg = rawMsg
                            .replace(/{user\.mention}/g, `<@${message.author.id}>`)
                            .replace(/{user\.username}/g, message.author.username)
                            .replace(/{level}/g, userLevel.level);

                        const embed = new EmbedBuilder()
                            .setColor('#00C851')
                            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                            .setDescription(formattedMsg)
                            .setTimestamp();

                        try {
                            await targetChannel.send({ embeds: [embed] });
                        } catch (sendErr) {
                            console.error('[Leveling] Error sending level up message:', sendErr);
                        }
                    }
                }
            } else {
                await userLevel.save();
            }

        } catch (error) {
            console.error('[Leveling] Error processing message XP:', error);
        }
    }
};
