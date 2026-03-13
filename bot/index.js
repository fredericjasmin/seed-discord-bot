const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

client.aliases = new Collection();
client.events = new Collection();
client.slashCommands = new Collection();

['events', 'slashCommand'].forEach((handler) => {
    require(`../Handlers/${handler}`)(client);
});

function startBot() {
    client.login(process.env.TOKEN);
}

module.exports = { client, startBot };
