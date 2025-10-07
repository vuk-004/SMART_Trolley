const bcrypt = require('bcryptjs');
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
    const adminNumber = ""; 
    const isAdmin = await Auth(adminNumber, adminPassword);

    if (isAdmin !== 1) {
      return res.status(401).send("Unauthorized: Admin credentials invalid");
    }
    const kart = new Kart(number);
    const currentBalance = await kart.getBalance();
    const newBalance = currentBalance + Number(amount);

    await kart.updateBalance(newBalance); 
    res.status(200).send(`Balance updated successfully. New balance: ${newBalance}`);
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).send("Error updating balance");
  }
};


exports.registerUser = async (req, res) => {
  const { email, username, number, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // hash password
    const kart = new Kart(number);
    const initialBalance = 1000; // default starting balance
    await kart.registerUser(email, username, hashedPassword, initialBalance);
    res.status(200).send("User registered successfully");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user");
  }
};

exports.changeUsername = async (req, res) => {
  const { number, password, newUsername } = req.body;

  try {
    const isAuthenticated = await Auth(number, password);
    if (isAuthenticated !== 1) {
      return res.status(401).send("Invalid credentials");
    }

    const kart = new Kart(number);
    await kart.updateUsername(newUsername);
    res.status(200).send("Username updated successfully");
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).send("Error updating username");
  }
};

exports.changePassword = async (req, res) => {
  const { number, oldPassword, newPassword } = req.body;

  try {
    const isAuthenticated = await Auth(number, oldPassword);
    if (isAuthenticated !== 1) {
      return res.status(401).send("Invalid current password");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10); // hash new password
    const kart = new Kart(number);
    await kart.updatePassword(hashedNewPassword);

    res.status(200).send("Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send("Error updating password");
  }
};



