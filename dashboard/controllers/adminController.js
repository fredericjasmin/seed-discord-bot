const ShopItem = require('../../models/ShopItem');

const BOT_OWNER_ID = process.env.BOT_OWNER_ID; // Get owner ID from .env

const checkOwner = (req, res, next) => {
    if (req.isAuthenticated() && req.user.id === BOT_OWNER_ID) {
        return next();
    }
    res.status(403).send('Access denied. Only the bot owner can access this page.');
};

const getAdminDashboard = (req, res) => {
    res.render('admin/index', {
        path: '/admin',
        message: req.query.message || null,
        messageType: req.query.messageType || null
    });
};

const getShopManagement = async (req, res) => {
    try {
        const shopItems = await ShopItem.find();
        res.render('admin/shop_management', {
            path: '/admin/shop',
            shopItems: shopItems,
            message: req.query.message || null,
            messageType: req.query.messageType || null,
            // For edit form
            itemToEdit: null
        });
    } catch (error) {
        console.error('Error fetching shop items for admin:', error);
    res.status(500).send('Error loading shop management.');
    }
};

const postShopAddItem = async (req, res) => {
    try {
        const { id, name, price, description } = req.body;
        const newShopItem = new ShopItem({ id, name, price, description });
        await newShopItem.save();
        res.redirect('/admin/shop?message=Item added successfully!&messageType=success');
    } catch (error) {
        console.error('Error adding shop item:', error);
        res.redirect('/admin/shop?message=Error adding item.&messageType=error');
    }
};

const getShopEditItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const itemToEdit = await ShopItem.findOne({ id: itemId });
        if (!itemToEdit) {
            return res.redirect('/admin/shop?message=Item not found for editing.&messageType=error');
        }
        const shopItems = await ShopItem.find(); // To display all items alongside the edit form
        res.render('admin/shop_management', {
            path: '/admin/shop/edit',
            shopItems: shopItems,
            itemToEdit: itemToEdit,
            message: req.query.message || null,
            messageType: req.query.messageType || null
        });
    } catch (error) {
        console.error('Error fetching item for edit:', error);
        res.redirect('/admin/shop?message=Error loading item for edit.&messageType=error');
    }
};

const postShopEditItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, price, description } = req.body;
        await ShopItem.findOneAndUpdate({ id: itemId }, { name, price, description });
        res.redirect('/admin/shop?message=Item updated successfully!&messageType=success');
    } catch (error) {
        console.error('Error updating shop item:', error);
        res.redirect('/admin/shop?message=Error updating item.&messageType=error');
    }
};

const postShopDeleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        await ShopItem.deleteOne({ id: itemId });
        res.redirect('/admin/shop?message=Item deleted successfully!&messageType=success');
    } catch (error) {
        console.error('Error deleting shop item:', error);
        res.redirect('/admin/shop?message=Error deleting item.&messageType=error');
    }
};

module.exports = {
    checkOwner,
    getAdminDashboard,
    getShopManagement,
    postShopAddItem,
    getShopEditItem,
    postShopEditItem,
    postShopDeleteItem
};