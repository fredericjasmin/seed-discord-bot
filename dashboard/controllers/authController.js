const passport = require('passport');

const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
};

const discordAuth = passport.authenticate('discord');

const discordAuthCallback = passport.authenticate('discord', {
    failureRedirect: '/'
});

const discordAuthCallbackRedirect = (req, res) => {
    res.redirect('/servers');
};

const logout = (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
};

module.exports = {
    checkAuth,
    discordAuth,
    discordAuthCallback,
    discordAuthCallbackRedirect,
    logout
};