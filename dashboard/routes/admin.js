const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.checkOwner, adminController.getAdminDashboard);
router.get('/shop', adminController.checkOwner, adminController.getShopManagement);
router.post('/shop/add', adminController.checkOwner, adminController.postShopAddItem);
router.get('/shop/edit/:id', adminController.checkOwner, adminController.getShopEditItem);
router.post('/shop/edit/:id', adminController.checkOwner, adminController.postShopEditItem);
router.post('/shop/delete/:id', adminController.checkOwner, adminController.postShopDeleteItem);

module.exports = router;