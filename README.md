# ShopEase — Simple E-commerce Store

CodeAlpha Full Stack Development Internship, **Task 1**.

A basic e-commerce site with product listings, a shopping cart, product details pages, order processing, and user registration/login.

## Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express.js (REST API)
- **Database:** SQLite (via `better-sqlite3`), which stores products, users and orders
- **Auth:** bcrypt password hashing + JWT tokens

## Features

- Product listing with search and category filter
- Product details page with stock info and quantity selector
- Shopping cart (add, update quantity, remove), saved in the browser
- User registration and login
- Checkout with shipping details. The server checks stock and calculates prices itself, then saves the order and reduces stock in one transaction.
- Order history, plus cancelling an order (cancelled items go back into stock)

## Getting started

```bash
npm install
npm start
```

Open http://localhost:3000. The database file (`store.db`) is created and filled with sample products on first run.

Use `npm run dev` to restart the server automatically when files change. Set `JWT_SECRET` and `PORT` as environment variables in production.

## Project structure

```
server.js          Express app setup
db.js              SQLite schema + seed products
auth.js            JWT helpers and auth middleware
routes/
  auth.js          /api/auth      register, login, me
  products.js      /api/products  list, categories, details
  orders.js        /api/orders    place, list, view, cancel
public/
  index.html       Product listing
  product.html     Product details
  cart.html        Cart + checkout
  orders.html      Order history
  login.html, register.html
  css/style.css
  js/common.js     API client, auth, cart, header
```

## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | | Create an account |
| POST | `/api/auth/login` | | Log in, returns a JWT |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/products?q=&category=` | | List or search products |
| GET | `/api/products/categories` | | List categories |
| GET | `/api/products/:id` | | Product details |
| POST | `/api/orders` | ✔ | Place an order `{ items: [{productId, quantity}], shipping: {name, address, phone} }` |
| GET | `/api/orders` | ✔ | My orders |
| GET | `/api/orders/:id` | ✔ | Order details |
| POST | `/api/orders/:id/cancel` | ✔ | Cancel an order |
