const express = require('express');
const router = express.Router();
const oldController = require('../controllers/firebase'); 
const bffController = require('../controllers/backendForFrontend'); 

router.post('/additem', oldController.addNewItem);
router.post('/authorize', oldController.authenticate);
router.post('/getItems', oldController.getItems);
router.post('/checkout', oldController.checkout);
router.post('/getBalance', oldController.getBalance);
router.post('/deleteItem', oldController.deleteItem);


router.post('/frontend/register', bffController.register);
router.post('/frontend/login', bffController.login);
router.post('/frontend/logout', bffController.logout);
router.post('/frontend/change-username', bffController.changeUsername);
router.post('/frontend/change-password', bffController.changePassword);


router.get('/frontend/cart', bffController.requireAuth, bffController.getCart);
router.get('/frontend/transactions', bffController.requireAuth, bffController.getTransactions);
router.get('/frontend/user', bffController.requireAuth, bffController.getUserData);

module.exports = router;
