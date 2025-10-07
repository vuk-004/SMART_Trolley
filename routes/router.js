const express = require('express');
const router = express.Router();
const userController = require('../controllers/firebase');

router.post('/additem',userController.addNewItem);
router.post('/authorize',userController.authenticate);
router.post('/getItems',userController.getItems);
router.post('/checkout',userController.checkout);
router.post('/getBalance',userController.getBalance);
router.post('/deleteItem',userController.deleteItem);

module.exports = router