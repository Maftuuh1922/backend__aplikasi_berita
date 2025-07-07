const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());

app.post('/', (req, res) => {
  res.json({ message: 'Register success' });
});

module.exports = serverless(app);