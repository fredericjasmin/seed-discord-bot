const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const { guild } = member;

        let guildData = await Guild.findOne({ guildId: guild.id });
        if (!guildData) {
            guildData = new Guild({ guildId: guild.id });
            await guildData.save();
        }

        const farewellConfig = guildData.config.farewell;

        if (farewellConfig && farewellConfig.enabled && farewellConfig.channelId) {
            const channel = guild.channels.cache.get(farewellConfig.channelId);
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

                if (farewellConfig.useEmbed) {
                    const embed = new EmbedBuilder()
                        .setColor(farewellConfig.embedColor || '#0099ff')
                        .setTitle(replacePlaceholders(farewellConfig.embedTitle))
                        .setDescription(replacePlaceholders(farewellConfig.embedDescription))
                        .setTimestamp();

                    if (farewellConfig.embedFooter) {
                        embed.setFooter({ text: replacePlaceholders(farewellConfig.embedFooter) });
                    }

                    if (farewellConfig.embedThumbnail) {
                        embed.setThumbnail(member.user.displayAvatarURL());
                    }

                    if (farewellConfig.embedImage) {
                        embed.setImage(farewellConfig.embedImage);
                    }

                    channel.send({ embeds: [embed] });
                } else {
                    const message = replacePlaceholders(farewellConfig.message);
                    channel.send(message);
                }
            }
        }
    },
};