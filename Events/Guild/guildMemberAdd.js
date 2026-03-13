const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const { guild } = member;

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: guild.id });
            await guildData.save();
        }

        // Welcome message
        const welcomeConfig = guildData.config.welcome;
        if (welcomeConfig && welcomeConfig.enabled && welcomeConfig.channelId) {
            const channel = guild.channels.cache.get(welcomeConfig.channelId);
            if (channel) {
                const placeholders = {
                    '_user.mention_': member.toString(),
                    '_user.tag_': member.user.tag,
                    '_guild.name_': guild.name,
                    '_guild.memberCount_': guild.memberCount.toString(),
                };

                const replacePlaceholders = (text) => {
                    if (!text) return '';
                    return text.replace(/{user.mention}|{user.tag}|{guild.name}|{guild.memberCount}/g, (matched) => placeholders[`_${matched.slice(1, -1)}_`]);
                };

                if (welcomeConfig.useEmbed) {
                    const embed = new EmbedBuilder()
                        .setColor(welcomeConfig.embedColor || '#0099ff')
                        .setTitle(replacePlaceholders(welcomeConfig.embedTitle))
                        .setDescription(replacePlaceholders(welcomeConfig.embedDescription))
                        .setTimestamp();

                    if (welcomeConfig.embedFooter) {
                        embed.setFooter({ text: replacePlaceholders(welcomeConfig.embedFooter) });
                    }

                    if (welcomeConfig.embedThumbnail) {
                        embed.setThumbnail(member.user.displayAvatarURL());
                    }

                    if (welcomeConfig.embedImage) {
                        embed.setImage(welcomeConfig.embedImage);
                    }

                    channel.send({ embeds: [embed] });
                } else {
                    const message = replacePlaceholders(welcomeConfig.message);
                    channel.send(message);
                }
            }
        }

        // Auto-role
        const autoRoleConfig = guildData.config.autoRole;
        if (autoRoleConfig && autoRoleConfig.enabled && autoRoleConfig.roleId) {
            const role = guild.roles.cache.get(autoRoleConfig.roleId);
            if (role) {
                member.roles.add(role).catch(console.error);
            }
        }
    },
};