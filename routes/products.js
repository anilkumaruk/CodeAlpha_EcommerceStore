const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { q, category } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY id';
  res.json(db.prepare(sql).all(...params));
});

router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all().map((r) => r.category));
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = router;
