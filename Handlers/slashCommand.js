const fs = require('fs');

const { PermissionsBitField } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const { REST } = require('@discordjs/rest');

const TOKEN = process.env.TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);

module.exports = (client) => {
    const slashCommands = [];
    let count = 0;

    fs.readdirSync('./Commands/slashCommands/').forEach(dir => {
        const files = fs.readdirSync(`./Commands/slashCommands/${dir}/`).filter(file => file.endsWith('.js'));

        for (const file of files) {
            try {
                const slashCommand = require(`../Commands/slashCommands/${dir}/${file}`);
                if (slashCommand.name) {
                    slashCommand.category = dir;
                    slashCommands.push({
                        name: slashCommand.name,
                        description: slashCommand.description,
                        type: slashCommand.type,
                        options: slashCommand.options ? slashCommand.options : null,
                        default_permission: slashCommand.default_permission ? slashCommand.default_permission : null,
                        default_member_permissions: slashCommand.default_member_permissions ? PermissionsBitField.resolve(slashCommand.default_member_permissions).toString() : null
                    });
                    client.slashCommands.set(slashCommand.name, slashCommand);
                    count++;
                } else {
                    console.warn(`[SlashCommand] Could not load: ${file}`);
                }
            } catch (error) {
                console.error(`Error loading slash command from ${file}:`, error);
            }
        }
    });

    console.log(`[SlashCommand] Loaded ${count} slash commands.`);

    (async () => {
        try {
            console.log('[SlashCommand] Registering application (/) commands...');
            await rest.put(
                process.env.GUILD_ID ?
                Routes.applicationGuildCommands(DISCORD_CLIENT_ID, process.env.GUILD_ID) :
                Routes.applicationCommands(DISCORD_CLIENT_ID), 
                { body: slashCommands }
            );
            console.log('[SlashCommand] Application (/) commands registered.');
        } catch (error) {
            console.error('Error reloading application (/) commands:', error);
        }
    })();
};