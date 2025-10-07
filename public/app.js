const API_URL = 'http://localhost:5000/frontend';
let token = localStorage.getItem('token') || null;

// --- Navigation ---
const loginView = document.getElementById('login-view');
const cartView = document.getElementById('cart-view');
const transactionsView = document.getElementById('transactions-view');

function showView(view) {
  loginView.style.display = 'none';
  cartView.style.display = 'none';
  transactionsView.style.display = 'none';
  view.style.display = 'block';
}

// Nav buttons
document.getElementById('nav-login').onclick = () => showView(loginView);
document.getElementById('nav-cart').onclick = () => { showView(cartView); loadCart(); };
document.getElementById('nav-transactions').onclick = () => { showView(transactionsView); loadTransactions(); };
document.getElementById('nav-logout').onclick = () => { localStorage.removeItem('token'); token=null; alert('Logged out'); showView(loginView); };

// --- Login/Register View ---
loginView.innerHTML = `
  <h2>Login</h2>
  <input id="login-number" placeholder="Phone Number" /><br/>
  <input id="login-password" type="password" placeholder="Password" /><br/>
  <button id="login-btn" class="primary">Login</button>
  <h2>Register</h2>
  <input id="reg-email" placeholder="Email" /><br/>
  <input id="reg-username" placeholder="Username" /><br/>
  <input id="reg-number" placeholder="Phone Number" /><br/>
  <input id="reg-password" type="password" placeholder="Password" /><br/>
  <button id="register-btn" class="primary">Register</button>
`;

document.getElementById('login-btn').onclick = async () => {
  const number = document.getElementById('login-number').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, password })
    });
    const data = await res.json();
    if (data.success) {
      token = data.token;
      localStorage.setItem('token', token);
      alert('Login successful');
      showView(cartView);
      loadCart();
    } else alert(data.message);
  } catch (err) { console.error(err); alert('Login failed'); }
};

document.getElementById('register-btn').onclick = async () => {
  const email = document.getElementById('reg-email').value;
  const username = document.getElementById('reg-username').value;
  const number = document.getElementById('reg-number').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, number, password })
    });
    const data = await res.json();
    if (data.success) {
      token = data.token;
      localStorage.setItem('token', token);
      alert('Registered successfully');
      showView(cartView);
      loadCart();
    } else alert(data.message);
  } catch (err) { console.error(err); alert('Registration failed'); }
};

// --- Cart View ---
async function loadCart() {
  if (!token) return alert('Not logged in');
  cartView.innerHTML = '<h2>Cart</h2>';

  try {
    const res = await fetch(`${API_URL}/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return alert(data.message);

    const table = document.createElement('table');
    table.innerHTML = `<tr><th>Item</th><th>Quantity</th></tr>`;
    Object.entries(data.cart).forEach(([item, qty]) => {
      if (item !== 'Total') table.innerHTML += `<tr><td>${item}</td><td>${qty}</td></tr>`;
    });
    table.innerHTML += `<tr><td>Total</td><td>${data.cart.Total || 0}</td></tr>`;
    cartView.appendChild(table);
  } catch (err) { console.error(err); alert('Failed to load cart'); }
}

// --- Transactions View ---
async function loadTransactions() {
  if (!token) return alert('Not logged in');
  transactionsView.innerHTML = '<h2>Transactions</h2>';

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return alert(data.message);

    Object.entries(data.transactions).forEach(([date, items]) => {
      const div = document.createElement('div');
      div.innerHTML = `<h3>${date}</h3>`;
      const table = document.createElement('table');
      table.innerHTML = `<tr><th>Item</th><th>Quantity</th></tr>`;
      items.forEach(item => table.innerHTML += `<tr><td>${item.itemName}</td><td>${item.quantity}</td></tr>`);
      div.appendChild(table);
      transactionsView.appendChild(div);
    });
  } catch (err) { console.error(err); alert('Failed to load transactions'); }
}

showView(loginView);
