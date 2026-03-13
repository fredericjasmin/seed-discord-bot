const Economy = require('../../models/Economy');

const getBotStats = (client) => (req, res) => {
    res.json({
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        channels: client.channels.cache.size,
        uptime: client.uptime
    });
};

const getBotCommands = (client) => (req, res) => {
    const commands = client.slashCommands.map(command => ({
        name: command.name,
        category: command.category || 'No Category'
    }));
    res.json(commands);
};

const getBotLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Economy.find().sort({ balance: -1 }).limit(10);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard from DB:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

module.exports = {
    getBotStats,
    getBotCommands,
    getBotLeaderboard
};