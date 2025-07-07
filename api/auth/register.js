const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Middleware & route khusus register
app.use(express.json());

app.post('/', async (req, res) => {
  // ...kode registrasi...
  res.json({ message: 'Register success' });
});

module.exports = serverless(app);