const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'store.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Placed',
    shipping_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  );
`);

const seedProducts = [
  ['Wireless Headphones', 'Over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.', 'Electronics', 2499, 25, '🎧', '#e0e7ff'],
  ['Smart Watch', 'Fitness tracking, heart-rate monitor, sleep insights and 7-day battery.', 'Electronics', 3999, 18, '⌚', '#dbeafe'],
  ['Mechanical Keyboard', 'Compact 75% layout with hot-swappable switches and RGB backlight.', 'Electronics', 3299, 12, '⌨️', '#e2e8f0'],
  ['Running Shoes', 'Lightweight, breathable running shoes with responsive cushioning.', 'Fashion', 2799, 30, '👟', '#fee2e2'],
  ['Denim Jacket', 'Classic fit denim jacket made from 100% organic cotton.', 'Fashion', 1899, 20, '🧥', '#dbeafe'],
  ['Backpack', 'Water-resistant 25L backpack with padded laptop sleeve.', 'Fashion', 1299, 40, '🎒', '#fef3c7'],
  ['Coffee Maker', 'Drip coffee maker with programmable timer and 12-cup carafe.', 'Home', 2199, 15, '☕', '#fde68a'],
  ['Desk Lamp', 'LED desk lamp with adjustable brightness and colour temperature.', 'Home', 999, 35, '💡', '#fef9c3'],
  ['Indoor Plant', 'Low-maintenance snake plant in a ceramic pot. Great air purifier.', 'Home', 599, 50, '🪴', '#dcfce7'],
  ['Novel: The Long Road', 'A bestselling adventure novel about friendship and discovery.', 'Books', 399, 60, '📘', '#e0f2fe'],
  ['Cookbook', '100 quick and healthy recipes for busy weeknights.', 'Books', 549, 45, '📗', '#dcfce7'],
  ['Yoga Mat', 'Non-slip 6mm yoga mat with carrying strap.', 'Sports', 899, 28, '🧘', '#f3e8ff'],
];

if (db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, description, category, price, stock, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  db.transaction(() => seedProducts.forEach((p) => insert.run(...p)))();
}

module.exports = db;
