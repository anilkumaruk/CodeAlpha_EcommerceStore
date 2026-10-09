const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

class OrderError extends Error {}

// Place an order: prices and stock are always taken from the database, never the client.
const placeOrder = db.transaction((userId, items, shipping) => {
  const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
  const lines = items.map(({ productId, quantity }) => {
    const product = getProduct.get(productId);
    if (!product) throw new OrderError(`Product #${productId} no longer exists`);
    if (product.stock < quantity) throw new OrderError(`Only ${product.stock} left of "${product.name}"`);
    return { product, quantity };
  });

  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const { lastInsertRowid: orderId } = db
    .prepare('INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_phone) VALUES (?, ?, ?, ?, ?)')
    .run(userId, total, shipping.name, shipping.address, shipping.phone);

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)'
  );
  const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const { product, quantity } of lines) {
    insertItem.run(orderId, product.id, product.name, product.price, quantity);
    decrementStock.run(quantity, product.id);
  }
  return orderId;
});

function getOrder(orderId, userId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
  if (order) order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  return order;
}

router.post('/', (req, res) => {
  const { items, shipping = {} } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Your cart is empty' });

  const parsed = items.map((i) => ({ productId: Number(i.productId), quantity: Number(i.quantity) }));
  if (parsed.some((i) => !Number.isInteger(i.productId) || !Number.isInteger(i.quantity) || i.quantity < 1)) {
    return res.status(400).json({ error: 'Invalid cart items' });
  }
  // Merge duplicate lines so the stock check sees the full quantity per product
  const merged = new Map();
  parsed.forEach((i) => merged.set(i.productId, (merged.get(i.productId) || 0) + i.quantity));
  const cleaned = [...merged].map(([productId, quantity]) => ({ productId, quantity }));
  const ship = {
    name: String(shipping.name || '').trim(),
    address: String(shipping.address || '').trim(),
    phone: String(shipping.phone || '').trim(),
  };
  if (!ship.name || !ship.address || !ship.phone) {
    return res.status(400).json({ error: 'Please fill in all shipping details' });
  }

  try {
    const orderId = placeOrder(req.user.id, cleaned, ship);
    res.status(201).json(getOrder(orderId, req.user.id));
  } catch (err) {
    if (err instanceof OrderError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

router.get('/', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  const itemsFor = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  orders.forEach((o) => (o.items = itemsFor.all(o.id)));
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = getOrder(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/:id/cancel', (req, res) => {
  const order = getOrder(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'Placed') return res.status(400).json({ error: 'This order can no longer be cancelled' });

  db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(order.id);
    const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    order.items.forEach((i) => restock.run(i.quantity, i.product_id));
  })();
  res.json(getOrder(order.id, req.user.id));
});

module.exports = router;
