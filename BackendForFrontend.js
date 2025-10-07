const jwt = require('jsonwebtoken');
const firebaseCtrl = require('./controllers/firebase.js'); 
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key';
const TOKEN_EXPIRY = '8h';

/* ---------- Helpers ---------- */
function generateToken(number, isAdmin = false) {
  return jwt.sign({ number, isAdmin }, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Invalid token' });
  req.user = decoded;
  next();
}

/* ---------- Controller Handlers ---------- */

exports.register = async (req, res) => {
  const { email, username, number, password } = req.body;
  if (!email || !username || !number || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    await firebaseCtrl.registerUser({ email, username, number, password }); // uses your firebase.js function
    const token = generateToken(number, false);
    res.status(200).json({ success: true, message: 'User registered', token });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { number, password } = req.body;
  if (!number || !password)
    return res.status(400).json({ success: false, message: 'Missing credentials' });

  try {
    const authResult = await firebaseCtrl.authenticate({ phoneNumber: number, password });
    if (authResult.success !== true) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(number, authResult.isAdmin || false);
    res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out (client should discard token)' });
};

exports.changeUsername = async (req, res) => {
  const { number, password, newUsername } = req.body;
  try {
    await firebaseCtrl.changeUsername({ number, password, newUsername });
    res.status(200).json({ success: true, message: 'Username updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update username' });
  }
};

exports.changePassword = async (req, res) => {
  const { number, oldPassword, newPassword } = req.body;
  try {
    await firebaseCtrl.changePassword({ number, oldPassword, newPassword });
    res.status(200).json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

exports.getCart = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Invalid token' });

  try {
    const cart = await firebaseCtrl.getItems({ number: decoded.number });
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

exports.getTransactions = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Invalid token' });

  try {
    const transactions = await firebaseCtrl.getTransactions({ number: decoded.number });
    res.status(200).json({ success: true, transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

exports.getUserData = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Invalid token' });

  try {
    const user = await firebaseCtrl.getUserData({ number: decoded.number });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};

exports.verifyToken = verifyToken;
exports.requireAuth = requireAuth;
