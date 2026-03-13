const Guild = require('../../models/Guild');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;
        const guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData || !guildData.config.automod || !guildData.config.automod.enabled) return;
        const config = guildData.config.automod;
        const member = message.member;
        let reason = null;

        // 1. Palabras prohibidas
        if (config.filterWords && config.filterWords.length > 0) {
            const content = message.content.toLowerCase();
            for (const word of config.filterWords) {
                if (word && content.includes(word.toLowerCase())) {
                    reason = `Palabra prohibida: ${word}`;
                    break;
                }
            }
        }
        // 2. Invitaciones de Discord
        if (!reason && config.filterInvites && /discord\.(gg|com)\//i.test(message.content)) {
            reason = 'Invitación de Discord detectada';
        }
        // 3. Links
        if (!reason && config.filterLinks && /https?:\/\//i.test(message.content)) {
            reason = 'Link detectado';
        }
        // 4. Abuso de mayúsculas
        if (!reason && config.filterCaps) {
            const caps = message.content.replace(/[^A-Z]/g, '');
            const percent = message.content.length > 0 ? (caps.length / message.content.length) * 100 : 0;
            if (percent >= config.capsThreshold) {
                reason = `Abuso de mayúsculas (${Math.round(percent)}%)`;
            }
        }
        if (!reason) return;

        // Acción
        if (config.action === 'delete' || config.action === 'warn' || config.action === 'mute') {
            try { await message.delete(); } catch {}
        }
        if (config.action === 'warn' || config.action === 'mute') {
            try {
                await message.reply({ content: `⚠️ ${message.author}, tu mensaje fue bloqueado. Motivo: ${reason}` });
            } catch {}
        }
        if (config.action === 'mute') {
            const muteRole = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('mute'));
            if (muteRole && member && !member.roles.cache.has(muteRole.id)) {
                await member.roles.add(muteRole, 'AutoMod');
                setTimeout(() => {
                    member.roles.remove(muteRole, 'AutoMod unmute');
                }, (config.muteMinutes || 10) * 60 * 1000);
            }
        }
        // Log
        if (config.logChannelId) {
            const logChannel = message.guild.channels.cache.get(config.logChannelId);
            if (logChannel && logChannel.isTextBased && logChannel.isTextBased()) {
                logChannel.send({ content: `AutoMod: Mensaje de ${message.author} bloqueado en <#${message.channel.id}>. Motivo: ${reason}` });
            }
        }
    }
};
