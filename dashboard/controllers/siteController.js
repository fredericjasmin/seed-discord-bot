const ms = require('ms');
const ShopItem = require('../../models/ShopItem');
const Economy = require('../../models/Economy');

const getHomePage = (client) => async (req, res) => {
    try {
        const guilds = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const channels = client.channels.cache.size;
        const commandsCount = client.slashCommands.size;

        res.render('index', {
            path: '/',
            guilds,
            users,
            channels,
            commandsCount,
            botUser: client.user
        });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Error loading home page');
    }
};

const getCommandsPage = (client) => async (req, res) => {
    try {
        const rawCommands = Array.from(client.slashCommands.values());
        // Filtrar comandos de owner
        const filteredCommands = rawCommands.filter(cmd => cmd.category !== 'owner');

        const commands = filteredCommands.reduce((acc, command) => {
            const category = command.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(command);
            return acc;
        }, {});

        res.render('commands', {
            path: '/commands',
            commands,
            totalCommands: filteredCommands.length
        });
    } catch (error) {
        console.error('Error loading commands page:', error);
        res.status(500).send('Error loading commands');
    }
};

const getLeaderboardPage = (client) => async (req, res) => {
    try {
        const rawLeaderboard = await Economy.find().sort({ coins: -1, bank: -1 }).limit(15);

        const rankedLeaderboard = await Promise.all(rawLeaderboard.map(async (entry, index) => {
            if (!entry._id) {
                return {
                    ...entry.toObject(),
                    rank: index + 1,
                    username: 'Usuario Desconocido',
                    avatar: null
                };
            }
            try {
                const user = await client.users.fetch(entry._id).catch(() => null);
                return {
                    ...entry.toObject(),
                    rank: index + 1,
                    username: user ? user.username : `ID: ${entry._id}`,
                    avatar: user ? user.displayAvatarURL({ dynamic: true }) : null
                };
            } catch (userError) {
                return {
                    ...entry.toObject(),
                    rank: index + 1,
                    username: `ID: ${entry._id}`,
                    avatar: null
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

const getInfoPage = (client) => async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState === 1 ? 'Operativa' : 'Conectando';
        const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);

        res.render('info', {
            path: '/info',
            uptime: ms(client.uptime, { long: true }),
            guilds: client.guilds.cache.size,
            users: totalUsers,
            ping: Math.round(client.ws.ping),
            dbStatus,
            botClientId: process.env.DISCORD_CLIENT_ID
        });
    } catch (error) {
        console.error('Error fetching info data:', error);
        res.status(500).send('Error loading info');
    }
};

const getShopPage = async (req, res) => {
    const products = await ShopItem.find();
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

    const productToBuy = await ShopItem.findOne({ id: productId });
    if (!productToBuy) {
        return res.redirect('/shop?message=Producto no encontrado.&messageType=error');
    }

    try {
        let userData = await Economy.findById(userId);
        if (!userData) {
            userData = new Economy({ _id: userId });
        }

        if (userData.coins < productToBuy.price) {
            return res.redirect('/shop?message=No tienes suficientes monedas para comprar este artículo.&messageType=error');
        }

        userData.coins -= productToBuy.price;
        if (!userData.inventory) userData.inventory = [];
        userData.inventory.push(productToBuy.name);
        await userData.save();

        res.redirect('/shop?message=¡Compra realizada exitosamente!&messageType=success');

    } catch (error) {
        console.error('Error purchasing item from web shop:', error);
        res.redirect('/shop?message=Ocurrió un error durante la compra.&messageType=error');
    }
};

const getProfilePage = async (req, res) => {
    try {
        const userId = req.user.id;
        let userData = await Economy.findById(userId);

        if (!userData) {
            userData = new Economy({ _id: userId });
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
    getCommandsPage,
    getLeaderboardPage,
    getInfoPage,
    getShopPage,
    postShopBuy,
    getProfilePage
};