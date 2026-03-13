const express = require('express');
const router = express.Router();
const serversController = require('../controllers/serversController');
const { checkAuth } = require('../controllers/authController'); // Corrected import

module.exports = (client) => {
    router.get('/', checkAuth, serversController.getServersPage(client));
    router.get('/:guildId/settings', checkAuth, serversController.getGuildSettingsPage(client));
    router.post('/:guildId/settings', checkAuth, serversController.postGuildSettings(client));
    // Giveaways (dashboard)
    router.post('/:guildId/giveaways', checkAuth, serversController.postCreateGiveaway);
    router.post('/:guildId/giveaways/:giveawayId/end', checkAuth, serversController.postEndGiveaway);

    return router;
};