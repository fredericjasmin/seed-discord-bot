const Giveaway = require('../../models/Giveaway');
const { ChannelType, EmbedBuilder } = require('discord.js');

// This interval will check for new giveaways to announce and for giveaways to end
module.exports = (client) => {
    setInterval(async () => {
        // 1. Announce new giveaways (not ended, no messageId)
        const newGiveaways = await Giveaway.find({ ended: false, messageId: { $exists: false } });
        for (const giveaway of newGiveaways) {
            const guild = client.guilds.cache.get(giveaway.guildId);
            if (!guild) continue;
            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel || channel.type !== ChannelType.GuildText) continue;

            const embed = new EmbedBuilder()
                .setTitle('🎉 Sorteo 🎉')
                .setDescription(`Premio: **${giveaway.prize}**\nReacciona con 🎉 para participar!\nTermina: <t:${Math.floor(giveaway.endAt.getTime()/1000)}:R>\nGanadores: **${giveaway.winners}**`)
                .setColor('#FFD700');

            const message = await channel.send({ embeds: [embed] });
            await message.react('🎉');
            giveaway.messageId = message.id;
            await giveaway.save();
        }

        // 2. End giveaways that have expired and not ended
        const now = new Date();
        const toEnd = await Giveaway.find({ ended: false, endAt: { $lte: now }, messageId: { $exists: true } });
        for (const giveaway of toEnd) {
            const guild = client.guilds.cache.get(giveaway.guildId);
            if (!guild) continue;
            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel || channel.type !== ChannelType.GuildText) continue;
            try {
                const message = await channel.messages.fetch(giveaway.messageId);
                const reaction = message.reactions.cache.get('🎉');
                if (!reaction) continue;
                const users = await reaction.users.fetch();
                const participants = users.filter(u => !u.bot).map(u => u.id);
                if (participants.length === 0) {
                    await channel.send('Nadie participó en el sorteo. 😢');
                    giveaway.ended = true;
                    await giveaway.save();
                    continue;
                }
                // Pick winners
                const shuffled = participants.sort(() => 0.5 - Math.random());
                const winners = shuffled.slice(0, giveaway.winners);
                giveaway.ended = true;
                giveaway.winnerIds = winners;
                await giveaway.save();
                await channel.send(`🎉 ¡Felicidades <@${winners.join('>, <@')}>! Ganaste **${giveaway.prize}**!`);
            } catch (err) {
                console.error('Error al finalizar sorteo:', err);
            }
        }
    }, 15000); // Check every 15 seconds
};
