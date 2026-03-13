const { EmbedBuilder, Collection, PermissionsBitField } = require('discord.js');
const ms = require('ms');

const cooldown = new Collection(); // Define cooldown outside the execute function

module.exports = {
    name: 'interactionCreate',
    execute: async (interaction, client) => {
        if (!interaction) return;
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const slashCommand = client.slashCommands.get(interaction.commandName);

        if (!slashCommand) {
            client.slashCommands.delete(interaction.commandName);
            return interaction.reply({ content: 'This command is outdated.', ephemeral: true });
        }

        try {
            // Permission and Cooldown Checks
            if (slashCommand.cooldown) {
                const cooldownKey = `slash-${slashCommand.name}${interaction.user.id}`;
                if (cooldown.has(cooldownKey)) {
                    const timeLeft = cooldown.get(cooldownKey) - Date.now();
                    return interaction.reply({
                        content: `You are on a 
${ms(timeLeft, { long: true })}
 cooldown!`, ephemeral: true
                    });
                }
            }

            if (slashCommand.userPerms) {
                if (!interaction.memberPermissions.has(PermissionsBitField.resolve(slashCommand.userPerms))) {
                    const userPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${interaction.user}, You don't have the 
${slashCommand.userPerms}
 permission to use this command!`) 
                        .setColor('Red');
                    return interaction.reply({ embeds: [userPerms], ephemeral: true });
                }
            }

            if (slashCommand.botPerms) {
                if (!interaction.guild.members.me.permissions.has(PermissionsBitField.resolve(slashCommand.botPerms))) {
                    const botPerms = new EmbedBuilder()
                        .setDescription(`🚫 ${interaction.user}, I don't have the 
${slashCommand.botPerms}
 permission to use this command!`) 
                        .setColor('Red');
                    return interaction.reply({ embeds: [botPerms], ephemeral: true });
                }
            }

            // Standardized Command Execution
            if (slashCommand.run) {
                await slashCommand.run(client, interaction);
            } else if (slashCommand.execute) {
                await slashCommand.execute(interaction);
            } else {
                console.error(`Command ${interaction.commandName} is missing a "run" or "execute" function.`);
                return interaction.reply({ content: 'There was an error trying to execute that command!', ephemeral: true });
            }

            // Cooldown setter
            if (slashCommand.cooldown) {
                const cooldownKey = `slash-${slashCommand.name}${interaction.user.id}`;
                cooldown.set(cooldownKey, Date.now() + slashCommand.cooldown);
                setTimeout(() => {
                    cooldown.delete(cooldownKey);
                }, slashCommand.cooldown);
            }

        } catch (error) {
            console.error('Error executing command:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    },
};
