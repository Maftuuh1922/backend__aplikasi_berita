const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Middleware & route khusus check-email
app.use(express.json());

app.post('/', async (req, res) => {
  // ...kode cek email...
  res.json({ exists: false });
});

module.exports = serverless(app);