const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const { checkAuth } = require('../controllers/authController'); // Corrected import

module.exports = (client) => {
    router.get('/', siteController.getHomePage(client));
    router.get('/leaderboard', siteController.getLeaderboardPage(client));
    router.get('/info', siteController.getInfoPage);
    router.get('/shop', checkAuth, siteController.getShopPage);
    router.post('/shop/buy', checkAuth, siteController.postShopBuy);
    router.get('/profile', checkAuth, siteController.getProfilePage);

    return router;
};