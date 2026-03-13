const { Events } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        if (user.bot) return; // Ignore bots
        if (!reaction.message.guild) return; // Ignore DMs

        let guildData = await Guild.findOne({ guildId: reaction.message.guild.id });
        if (!guildData || !guildData.config.reactionRoles || guildData.config.reactionRoles.length === 0) {
            return; // No reaction roles configured for this guild
        }

        const reactionRoleConfig = guildData.config.reactionRoles.find(
            rr => rr.messageId === reaction.message.id && rr.channelId === reaction.message.channel.id
        );

        if (!reactionRoleConfig) {
            return; // Not a configured reaction role message
        }

        const member = reaction.message.guild.members.cache.get(user.id);
        if (!member) return; // Member not found

        const reactionEntry = reactionRoleConfig.reactions.find(
            r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id // Check for both unicode and custom emoji IDs
        );

        if (reactionEntry) {
            const role = reaction.message.guild.roles.cache.get(reactionEntry.roleId);
            if (role) {
                member.roles.remove(role).catch(console.error);
            }
        }
    },
};
