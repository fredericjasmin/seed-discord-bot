const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Import passport config
const setupPassport = require('./config/passport');

// Import route modules
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');
const serversRoutes = require('./routes/servers');

module.exports = (client) => {
    const express = require('express');
    const app = express();

    // --- AUTHENTICATION SETUP ---
    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }));

    // Setup passport
    setupPassport(client);
    app.use(passport.initialize());
    app.use(passport.session());

    // Middleware to pass user data to all views
    app.use((req, res, next) => {
        res.locals.user = req.user;
        res.locals.BOT_OWNER_ID = process.env.BOT_OWNER_ID; // Pass owner ID to views
        next();
    });

    // Middleware to parse form data
    app.use(express.urlencoded({ extended: true }));

    // Serve static files from the 'public' directory
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // Use route modules
    app.use('/auth', authRoutes.router);
    app.use('/api', apiRoutes(client)); // API routes might need the client object
    app.use('/', siteRoutes(client)); // Site routes might need the client object
    app.use('/admin', adminRoutes);
    app.use('/servers', serversRoutes(client)); // Servers routes might need the client object

    return app;
};