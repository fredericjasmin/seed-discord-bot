const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/discord', authController.discordAuth);
router.get('/discord/callback', authController.discordAuthCallback, authController.discordAuthCallbackRedirect);
router.get('/logout', authController.logout);

module.exports = { router, checkAuth: authController.checkAuth };