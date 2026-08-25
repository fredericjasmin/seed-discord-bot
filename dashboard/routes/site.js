const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const { checkAuth } = require('../controllers/authController');

module.exports = (client) => {
    router.get('/', siteController.getHomePage(client));
    router.get('/commands', siteController.getCommandsPage(client));
    router.get('/leaderboard', siteController.getLeaderboardPage(client));
    router.get('/info', siteController.getInfoPage(client));
    router.get('/shop', checkAuth, siteController.getShopPage);
    router.post('/shop/buy', checkAuth, siteController.postShopBuy);
    router.get('/profile', checkAuth, siteController.getProfilePage);

    return router;
};