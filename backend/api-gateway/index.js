require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Token missing, authorization denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ msg: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,               
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  message: 'Too many requests, please try again later.',
});

app.use(authenticate);
app.use(limiter);

// Proxy to User Service
app.use('/user', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: process.env.USER_SERVICE_URL + req.originalUrl.replace('/user', ''),
      data: req.body,
      headers: req.headers,
    });
    res.status(response.status).json(response.data);
  } catch {
    res.status(500).json({ error: 'User service is down' });
  }
});

// Proxy to Product Service
app.use('/product', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: process.env.PRODUCT_SERVICE_URL + req.originalUrl.replace('/product', ''),
      data: req.body,
      headers: req.headers,
    });
    res.status(response.status).json(response.data);
  } catch {
    res.status(500).json({ error: 'Product service is down' });
  }
});

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const userHealth = await axios.get(process.env.USER_SERVICE_URL + '/health');
    const productHealth = await axios.get(process.env.PRODUCT_SERVICE_URL + '/health');
    res.json({
      userService: userHealth.data,
      productService: productHealth.data,
    });
  } catch {
    res.status(503).json({ msg: 'One or more services are unavailable' });
  }
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(API,Gateway,running,on,port,$,{PORT});
});