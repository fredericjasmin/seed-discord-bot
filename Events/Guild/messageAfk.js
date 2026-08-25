const Afk = require('../../models/Afk');
const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            // 1. Verificar si el autor estaba AFK
            const authorAfk = await Afk.findOne({ guildId: message.guild.id, userId: message.author.id });
            if (authorAfk) {
                await Afk.deleteOne({ _id: authorAfk._id });
                const timeAway = ms(Date.now() - new Date(authorAfk.timestamp).getTime(), { long: true });
                const welcomeBackEmbed = new EmbedBuilder()
                    .setColor('#00C851')
                    .setDescription(`👋 ¡Bienvenido de vuelta, ${message.author}! He eliminado tu estado AFK (estuviste ausente por ${timeAway}).`);
                
                try {
                    const replyMsg = await message.reply({ embeds: [welcomeBackEmbed] });
                    setTimeout(() => replyMsg.delete().catch(() => {}), 6000);
                } catch {}
            }

            // 2. Verificar si se menciona a algún usuario que esté AFK
            if (message.mentions.users.size > 0) {
                const mentionedUsers = message.mentions.users.filter(u => !u.bot && u.id !== message.author.id);
                for (const [userId, user] of mentionedUsers) {
                    const targetAfk = await Afk.findOne({ guildId: message.guild.id, userId: userId });
                    if (targetAfk) {
                        const timeAway = ms(Date.now() - new Date(targetAfk.timestamp).getTime(), { long: true });
                        const afkEmbed = new EmbedBuilder()
                            .setColor('#ffbb33')
                            .setDescription(`💤 **${user.username}** está actualmente AFK: *${targetAfk.reason}* (hace ${timeAway})`);

                        try {
                            const afkMsg = await message.reply({ embeds: [afkEmbed] });
                            setTimeout(() => afkMsg.delete().catch(() => {}), 8000);
                        } catch {}
                    }
                }
            }

        } catch (error) {
            console.error('[AFK] Error processing message:', error);
        }
    }
};
