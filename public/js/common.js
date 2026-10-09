// Shared helpers used by every page: API calls, auth state, cart storage, header, toasts.

const Auth = {
  get token() { return localStorage.getItem('token'); },
  get user() { return JSON.parse(localStorage.getItem('user') || 'null'); },
  save({ token, user }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.href = '/';
  },
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.token) headers.Authorization = `Bearer ${Auth.token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && Auth.token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Cart lives in localStorage as [{ productId, name, price, icon, color, quantity, stock }]
const Cart = {
  items() { return JSON.parse(localStorage.getItem('cart') || '[]'); },
  save(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    updateCartBadge();
  },
  add(product, quantity = 1) {
    const items = Cart.items();
    const existing = items.find((i) => i.productId === product.id);
    const current = existing ? existing.quantity : 0;
    const next = Math.min(current + quantity, product.stock);
    if (next === current) return false;
    if (existing) existing.quantity = next;
    else items.push({
      productId: product.id, name: product.name, price: product.price,
      icon: product.icon, color: product.color, stock: product.stock, quantity: next,
    });
    Cart.save(items);
    return true;
  },
  setQuantity(productId, quantity) {
    const items = Cart.items()
      .map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i))
      .filter((i) => i.quantity > 0);
    Cart.save(items);
  },
  remove(productId) { Cart.save(Cart.items().filter((i) => i.productId !== productId)); },
  clear() { Cart.save([]); },
  count() { return Cart.items().reduce((n, i) => n + i.quantity, 0); },
  total() { return Cart.items().reduce((s, i) => s + i.price * i.quantity, 0); },
};

const money = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) {
    const n = Cart.count();
    badge.textContent = n;
    badge.hidden = n === 0;
  }
}

function renderHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const user = Auth.user;
  header.innerHTML = `
    <div class="container nav">
      <a href="/" class="logo">🛍️ ShopEase</a>
      <nav class="nav-links">
        <a href="/">Shop</a>
        ${user
          ? `<a href="/orders.html">My Orders</a>
             <span class="nav-user">Hi, ${escapeHtml(user.name.split(' ')[0])}</span>
             <button class="link-btn" id="logout-btn">Logout</button>`
          : `<a href="/login.html">Login</a><a href="/register.html" class="btn btn-sm">Sign up</a>`}
        <a href="/cart.html" class="cart-link" aria-label="Cart">🛒<span id="cart-count" class="badge" hidden>0</span></a>
      </nav>
    </div>`;
  const logout = document.getElementById('logout-btn');
  if (logout) logout.addEventListener('click', Auth.logout);
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', renderHeader);
