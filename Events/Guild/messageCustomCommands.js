const { EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            const guildData = await Guild.findOne({ guildId: message.guild.id });
            if (!guildData || !guildData.config.customCommands || guildData.config.customCommands.length === 0) return;

            const content = message.content.trim().toLowerCase();

            for (const cmd of guildData.config.customCommands) {
                const triggerLower = cmd.trigger.trim().toLowerCase();
                let isMatch = false;

                if (cmd.matchType === 'exact') {
                    isMatch = content === triggerLower;
                } else if (cmd.matchType === 'contains') {
                    isMatch = content.includes(triggerLower);
                }

                if (isMatch) {
                    const formattedResponse = cmd.response
                        .replace(/{user\.mention}/g, `<@${message.author.id}>`)
                        .replace(/{user\.username}/g, message.author.username)
                        .replace(/{guild\.name}/g, message.guild.name)
                        .replace(/{guild\.memberCount}/g, message.guild.memberCount);

                    if (cmd.useEmbed) {
                        const embed = new EmbedBuilder()
                            .setColor(cmd.embedColor || '#5865F2')
                            .setDescription(formattedResponse);
                        await message.channel.send({ embeds: [embed] });
                    } else {
                        await message.channel.send({ content: formattedResponse });
                    }
                    break;
                }
            }

        } catch (error) {
            console.error('[CustomCommands] Error processing message:', error);
        }
    }
};
