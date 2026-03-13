const fetch = require('node-fetch');
const ms = require('ms');
const ShopItem = require('../../models/ShopItem');
const Economy = require('../../models/Economy');

const getHomePage = (client) => async (req, res) => {
    const BASE_URL = process.env.BASE_URL;
    try {
        const statsResponse = await fetch(`${BASE_URL}/api/bot/stats`);
        const stats = await statsResponse.json();

        const commandsResponse = await fetch(`${BASE_URL}/api/bot/commands`);
        const rawCommands = await commandsResponse.json();

        // Filter out owner commands
        const filteredCommands = rawCommands.filter(command => command.category !== 'owner');

        const commands = filteredCommands.reduce((acc, command) => {
            const category = command.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(command);
            return acc;
        }, {});

        res.render('index', {
            path: '/',
            guilds: stats.guilds,
            users: stats.users,
            channels: stats.channels,
            commands
        });
    } catch (error) {
        console.error('Error fetching home page data:', error);
    res.status(500).send('Error loading home page');
    }
};

const getLeaderboardPage = (client) => async (req, res) => {
    const BASE_URL = process.env.BASE_URL;
    try {
        const leaderboardResponse = await fetch(`${BASE_URL}/api/bot/leaderboard`);
        const leaderboard = await leaderboardResponse.json();

        // Add rank to each entry as it's not returned by the API
        const rankedLeaderboard = await Promise.all(leaderboard.map(async (entry, index) => {
            if (!entry._id) {
                return {
                    ...entry,
                    rank: index + 1,
                    username: 'Unknown User', // Fallback username
                    avatar: null // No avatar if userId is missing
                };
            }
            try {
                const user = await client.users.fetch(entry._id);
                return {
                    ...entry,
                    rank: index + 1,
                    username: user.username,
                    avatar: user.displayAvatarURL({ dynamic: true })
                };
            } catch (userError) {
                console.error(`Error fetching user ${entry._id}:`, userError);
                return {
                    ...entry,
                    rank: index + 1,
                    username: 'Unknown User', // Fallback username
                    avatar: null // No avatar if user not found
                };
            }
        }));

        res.render('leaderboard', {
            path: '/leaderboard',
            leaderboard: rankedLeaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    res.status(500).send('Error loading leaderboard');
    }
};

const getInfoPage = async (req, res) => {
    const BASE_URL = process.env.BASE_URL;
    try {
        const statsResponse = await fetch(`${BASE_URL}/api/bot/stats`);
        const stats = await statsResponse.json();

        res.render('info', {
            path: '/info',
            nodeVersion: process.version,
            djsVersion: require('discord.js').version,
            uptime: ms(stats.uptime, { long: true })
        });
    } catch (error) {
        console.error('Error fetching info data:', error);
    res.status(500).send('Error loading info');
    }
};

const getShopPage = async (req, res) => {
    const products = await ShopItem.find(); // Fetch products from DB
    res.render('shop', {
        path: '/shop',
        products: products,
        message: req.query.message || null,
        messageType: req.query.messageType || null
    });
};

const postShopBuy = async (req, res) => {
    const userId = req.user.id;
    const productId = req.body.productId;

    const productToBuy = await ShopItem.findOne({ id: productId }); // Fetch product from DB

    if (!productToBuy) {
        return res.redirect('/shop?message=Product not found.&messageType=error');
    }

    try {
        let userData = await Economy.findById(userId);
        if (!userData) {
            userData = new Economy({ _id: userId });
        }

        if (userData.coins < productToBuy.price) {
            return res.redirect('/shop?message=Insufficient coins to purchase this item.&messageType=error');
        }

        userData.coins -= productToBuy.price;
        userData.inventory.push(productToBuy.name);
        await userData.save();

        res.redirect('/shop?message=Purchase successful!&messageType=success');

    } catch (error) {
        console.error('Error purchasing item from web shop:', error);
        res.redirect('/shop?message=An error occurred during purchase.&messageType=error');
    }
};

const getProfilePage = async (req, res) => {
    try {
        const userId = req.user.id;
        let userData = await Economy.findById(userId);

        if (!userData) {
            userData = new Economy({ _id: userId }); // Create a new economy profile if none exists
            await userData.save();
        }

        res.render('profile', {
            path: '/profile',
            userData: userData,
            message: req.query.message || null,
            messageType: req.query.messageType || null
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error al cargar el perfil del usuario');
    }
};

module.exports = {
    getHomePage,
    getLeaderboardPage,
    getInfoPage,
    getShopPage,
    postShopBuy,
    getProfilePage
};