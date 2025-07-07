const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());

app.post('/', (req, res) => {
  res.json({ exists: false });
});

module.exports = serverless(app);