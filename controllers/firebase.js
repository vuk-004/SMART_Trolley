const Kart = require('../models/shoppingKart');
const Auth = require('../models/authenticate'); 
const Chout = require('../models/checkout');


exports.addNewItem = async (req, res) => {
  const { number, itemName, quantity, password } = req.body;
  if (await Auth(number, password) === 1) {
    const kart = new Kart(number);
    await kart.addItem(itemName, quantity);
    res.status(200).send("Item added successfully");
  } else {
    res.status(401).send("Invalid Authorization");
  }
};

exports.authenticate = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const authResult = await Auth(phoneNumber, password);
  if (authResult === 1) {
    res.status(200).json({ success: true, message: "Authentication successful", phoneNumber });
  } else if (authResult === 2) {
    res.status(402).send("Authentication failed (Unregistered user)");
  } else {
    res.status(401).send("Authentication failed");
  }
};

exports.getItems = async (req, res) => {
  const { number } = req.body; 
  try {
    const kart = new Kart(number);
    const data = await kart.getItems();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Error fetching items');
  }
};

exports.checkout = async (req, res) => {
  const { number, password } = req.body;
  if (await Auth(number, password) === 1) {
    const kart = new Kart(number);
    const data = await kart.getItems();
    const checkoutStatus = await Chout(number, data);
    if (checkoutStatus) {
      res.status(200).send("Checkout Successful");
    } else {
      res.status(402).send("Low balance");
    }
  } else {
    res.status(401).send("Invalid Authorization");
  }
};

exports.getBalance = async (req, res) => {
  const { number, password } = req.body;
  if (await Auth(number, password) === 1) {
    const kart = new Kart(number);
    const balance = await kart.getBalance();
    res.status(200).send(String(balance));
  } else {
    res.status(401).send("Invalid Authorization");
  }
};

exports.deleteItem = async (req, res) => {
  const { number, itemName, password } = req.body;
  if (await Auth(number, password) === 1) {
    const kart = new Kart(number);
    await kart.deleteItem(itemName);
    res.status(200).send("Item deleted successfully");
  } else {
    res.status(401).send("Invalid Authorization");
  }
};

exports.addBalance = async (req, res) => {
  const { number, amount, adminPassword } = req.body;

  try {
    const adminNumber = ""; // replace with admin number
    const isAdmin = await Auth(adminNumber, adminPassword);

    if (isAdmin !== 1) {
      return res.status(401).send("Unauthorized: Admin credentials invalid");
    }

    // ✅ Proceed to update balance
    const kart = new Kart(number);
    const currentBalance = await kart.getBalance();
    const newBalance = currentBalance + Number(amount);

    await kart.updateBalance(newBalance); // assuming Kart has updateBalance()
    res.status(200).send(`Balance updated successfully. New balance: ${newBalance}`);
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).send("Error updating balance");
  }
};


