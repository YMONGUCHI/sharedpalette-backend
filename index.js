require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Imports the cors library

const app = express();
app.use(cors()); // Registers CORS middleware so the frontend = can read responses
app.use(express.json()); // Enable parsing of JSON request bodies for POST and PUT requests
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }
    : false,
});

// Authentication and Authorization
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Auth middleware - verifies JWT and attaches user info to request
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info (userId, email) to the request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/', (req, res) => {
  res.send('Hi from SharedPalette backend!');
});

// ============ LISTINGS ============

app.get('/listings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM listings ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/listings', async (req, res) => {
  try {
    const { artistName, specialty, medium, price, image, rating, turnaround } = req.body;

    const result = await pool.query(
      `INSERT INTO listings ("artistName", specialty, medium, price, image, rating, turnaround)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [artistName, specialty, medium, price, image, rating, turnaround]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

app.put('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { artistName, specialty, medium, price, image, rating, turnaround } = req.body;

    const result = await pool.query(
      `UPDATE listings
       SET "artistName" = $1, specialty = $2, medium = $3, price = $4, image = $5, rating = $6, turnaround = $7
       WHERE id = $8
       RETURNING *`,
      [artistName, specialty, medium, price, image, rating, turnaround, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

app.delete('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM listings WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ message: 'Listing deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// ============ USERS ============

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email, password, is_buyer, is_seller, rating } = req.body;
    const result = await pool.query(
      `INSERT INTO users (name, email, password, is_buyer, is_seller, rating)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, password, is_buyer, is_seller, rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, is_buyer, is_seller, rating } = req.body;
    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, password = $3, is_buyer = $4, is_seller = $5, rating = $6
       WHERE id = $7
       RETURNING *`,
      [name, email, password, is_buyer, is_seller, rating, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============ ORDERS ============

app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { buyer_id, listing_id, status, brief, deadline, price } = req.body;
    const result = await pool.query(
      `INSERT INTO orders (buyer_id, listing_id, status, brief, deadline, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [buyer_id, listing_id, status, brief, deadline, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer_id, listing_id, status, brief, deadline, price } = req.body;
    const result = await pool.query(
      `UPDATE orders
       SET buyer_id = $1, listing_id = $2, status = $3, brief = $4, deadline = $5, price = $6
       WHERE id = $7
       RETURNING *`,
      [buyer_id, listing_id, status, brief, deadline, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ============ MESSAGES ============

app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/messages', async (req, res) => {
  try {
    const { sender_id, receiver_id, order_id, content } = req.body;
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, order_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sender_id, receiver_id, order_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

app.put('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sender_id, receiver_id, order_id, content } = req.body;
    const result = await pool.query(
      `UPDATE messages
       SET sender_id = $1, receiver_id = $2, order_id = $3, content = $4
       WHERE id = $5
       RETURNING *`,
      [sender_id, receiver_id, order_id, content, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

app.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM messages WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ============ SIGNUP ============

// POST /signup - create a new user with hashed password
app.post('/signup', async (req, res) => {
  const { name, email, password, is_buyer, is_seller } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password, is_buyer, is_seller)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, is_buyer, is_seller`,
      [name, email, hashedPassword, is_buyer ?? true, is_seller ?? false]
    );

    const user = result.rows[0];

    // Create a JWT token for the new user
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      // Postgres unique violation (email already exists)
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /login - verify credentials and return a JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up the user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare the submitted password against the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token + safe user info (no password)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_buyer: user.is_buyer,
        is_seller: user.is_seller
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /me - return the logged-in user's info (protected route example)
app.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, is_buyer, is_seller FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});