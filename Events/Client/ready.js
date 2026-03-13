const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        try {
            client.user.setPresence({
                activities: [{ name: '/help', type: 0 }],
                status: 'online'
            });
        } catch (error) {
            console.log("Error setting presence:", error);
        }

        // Start the giveaway manager
        try {
            require('./giveawayManager')(client);
        } catch (err) {
            console.error('Error starting giveaway manager:', err);
        }
    },
};