const express = require('express');
const router = express.Router({ mergeParams: true });
const { getNewReactionRolePage, postNewReactionRole, getReactionRolePage, postAddReactionRole, postRemoveReactionRole } = require('../controllers/reactionRolesController');
const { checkAuth } = require('../controllers/authController');

router.get('/new', checkAuth, (req, res) => getNewReactionRolePage(req, res));
router.post('/new', checkAuth, (req, res) => postNewReactionRole(req, res));
router.get('/:messageId', checkAuth, (req, res) => getReactionRolePage(req, res));
router.post('/:messageId/add', checkAuth, (req, res) => postAddReactionRole(req, res));
router.post('/:messageId/remove', checkAuth, (req, res) => postRemoveReactionRole(req, res));

module.exports = router;