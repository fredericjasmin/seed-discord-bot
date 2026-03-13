const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

module.exports = (client) => {
    router.get('/bot/stats', apiController.getBotStats(client));
    router.get('/bot/commands', apiController.getBotCommands(client));
    router.get('/bot/leaderboard', apiController.getBotLeaderboard);

    return router;
};