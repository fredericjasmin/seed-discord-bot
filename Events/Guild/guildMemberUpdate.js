const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const { guild } = newMember;
        if (!guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData || !guildData.config.logging || !guildData.config.logging.enabled || !guildData.config.logging.channelId || !guildData.config.logging.logMemberUpdates) {
            return; // Logging not enabled or configured
        }

        const logChannel = guild.channels.cache.get(guildData.config.logging.channelId);
        if (!logChannel) return; // Log channel not found

        // Nickname Change
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Apodo Actualizado')
                .setDescription(`**${newMember.user.tag}** ha cambiado su apodo.`)
                .addFields(
                    { name: 'Antiguo Apodo', value: oldMember.nickname || 'Ninguno' },
                    { name: 'Nuevo Apodo', value: newMember.nickname || 'Ninguno' }
                )
                .setTimestamp();
            logChannel.send({ embeds: [embed] }).catch(console.error);
        }

        // Role Changes (added/removed)
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size > 0) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Role Added')
                .setDescription(`**${newMember.user.tag}** ha recibido el rol ${addedRoles.map(r => r.name).join(', ')}.`)
                .setTimestamp();
            logChannel.send({ embeds: [embed] }).catch(console.error);
        }

        if (removedRoles.size > 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Rol Removido')
                .setDescription(`**${newMember.user.tag}** ha perdido el rol ${removedRoles.map(r => r.name).join(', ')}.`)
                .setTimestamp();
            logChannel.send({ embeds: [embed] }).catch(console.error);
        }
    },
};
