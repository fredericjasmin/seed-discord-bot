require('dotenv').config();
const mongoose = require('mongoose');
const { client, startBot } = require('./bot/index');
const dashboard = require('./dashboard/index');

mongoose.connect(process.env.MONGO_DB)
    .then(() => console.log('[DB] MongoDB connected'))
    .catch(err => console.error('[DB] MongoDB connection error:', err));

client.on('clientReady', () => {
    console.log(`[Bot] Online as ${client.user.tag}`);
    try {
        const app = dashboard(client);
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`[Dashboard] Running on port ${port}`);
        });
    } catch (dashboardErr) {
        console.error('[Dashboard] Initialization error:', dashboardErr);
    }
});

startBot();